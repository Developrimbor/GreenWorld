import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  TextInput,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
  Alert,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import BottomNavigation from '../../components/BottomNavigation';
import { doc, getDoc, updateDoc, increment } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as Location from 'expo-location';

export default function TrashCleaned() {
  const { id } = useLocalSearchParams();
  const [trash, setTrash] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [beforeImage, setBeforeImage] = useState<string | null>(null);
  const [afterImage, setAfterImage] = useState<string | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [showInfoModal, setShowInfoModal] = useState(false);

  useEffect(() => {
    const fetchTrash = async () => {
      if (!id) return;
      setLoading(true);
      const docRef = doc(db, 'trashReports', id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setTrash(docSnap.data());
      setLoading(false);
    };
    fetchTrash();
  }, [id]);

  const pickImage = async (type: 'before' | 'after') => {
    // İzinleri kontrol et
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Galeri erişimi için izin vermeniz gerekiyor.');
      return;
    }

    // Görüntü seçme işlemi
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === 'before') {
        setBeforeImage(result.assets[0].uri);
      } else {
        setAfterImage(result.assets[0].uri);
      }
    }
  };

  const takePhoto = async (type: 'before' | 'after') => {
    // Kamera izinlerini kontrol et
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('İzin Gerekli', 'Kamera erişimi için izin vermeniz gerekiyor.');
      return;
    }

    // Fotoğraf çekme işlemi
    let result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.8,
    });

    if (!result.canceled) {
      if (type === 'before') {
        setBeforeImage(result.assets[0].uri);
      } else {
        setAfterImage(result.assets[0].uri);
      }
    }
  };

  // Mesafe hesaplama fonksiyonu (Haversine formülü ile)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Dünya'nın yarıçapı, km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c * 1000; // metre cinsinden mesafe
    return distance;
  };

  const handleConfirm = async () => {
    if (!id || (!beforeImage && !afterImage)) {
      Alert.alert('Hata', 'Lütfen en az bir fotoğraf yükleyin.');
      return;
    }

    if (!trash || !trash.location) {
      Alert.alert('Hata', 'Atık konum bilgisi bulunamadı.');
      return;
    }

    setSubmitting(true);

    try {
      // Konum izni kontrolü
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Konum İzni Gerekli', 
          'Temizlik onayı için konum izni vermeniz gerekmektedir.',
          [{ text: 'Tamam' }]
        );
        setSubmitting(false);
        return;
      }

      // Kullanıcının konumunu al
      const userLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      // Atık konumu ile kullanıcı konumu arasındaki mesafeyi hesapla
      const { latitude, longitude } = trash.location;
      const distance = calculateDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        latitude,
        longitude
      );

      // Maksimum mesafe sınırı (100 metre)
      const MAX_DISTANCE = 100;

      if (distance > MAX_DISTANCE) {
        // Kullanıcı atığa yeterince yakın değil, uyarı göster
        Alert.alert(
          'Çok Uzaktasınız',
          `Temizlik işlemini tamamlamak için atık noktasına en fazla ${MAX_DISTANCE} metre mesafede olmalısınız. Şu anda atık noktasına olan mesafeniz yaklaşık ${Math.round(distance)} metredir.`,
          [{ text: 'Tamam' }]
        );
        setSubmitting(false);
        return;
      }

      // Kullanıcı yeterince yakın, temizlik işlemine devam et
      const storage = getStorage();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        Alert.alert('Hata', 'Kullanıcı bilgileriniz alınamadı. Lütfen tekrar giriş yapın.');
        setSubmitting(false);
        return;
      }
      
      const updates: any = {
        cleaned: true,
        cleanedAt: new Date(),
        cleaningInfo: additionalInfo || '',
        status: 'cleaned',
        cleanedBy: currentUser.uid,
        userLocation: {
          latitude: userLocation.coords.latitude,
          longitude: userLocation.coords.longitude
        }
      };

      // Resimleri yükle
      if (beforeImage) {
        const beforeImageRef = ref(storage, `cleanedTrash/${id}/before_${new Date().getTime()}`);
        const beforeImageBlob = await (await fetch(beforeImage)).blob();
        await uploadBytes(beforeImageRef, beforeImageBlob);
        updates.beforeCleaningImage = await getDownloadURL(beforeImageRef);
      }

      if (afterImage) {
        const afterImageRef = ref(storage, `cleanedTrash/${id}/after_${new Date().getTime()}`);
        const afterImageBlob = await (await fetch(afterImage)).blob();
        await uploadBytes(afterImageRef, afterImageBlob);
        updates.afterCleaningImage = await getDownloadURL(afterImageRef);
      }

      // Firestore'u güncelle
      const trashRef = doc(db, 'trashReports', id as string);
      await updateDoc(trashRef, updates);
      
      // Kullanıcının temizleme sayısını artır ve puan ekle
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        cleaned: increment(1),
        points: increment(20)
      });

      Alert.alert(
        'Başarılı',
        'Temizlik raporu başarıyla gönderildi. Çevre için teşekkürler!',
        [{ text: 'Tamam', onPress: () => router.push('/(tabs)/HomePage') }]
      );
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
      Alert.alert('Hata', 'Temizlik raporu gönderilirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setSubmitting(false);
    }
  };

  const showInfo = () => {
    setShowInfoModal(true);
  };

  const handleCancel = () => {
    router.back();
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4B9363" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={24} color="#4B9363" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TRASH CLEANED</Text>
        <TouchableOpacity style={styles.infoButton} onPress={showInfo}>
          <MaterialIcons name="info" size={24} color="#A91101" />
        </TouchableOpacity>
      </View>

      {/* Bilgilendirme Modalı */}
      <Modal
        visible={showInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInfoModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowInfoModal(false)}> 
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback> 
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Konum Doğrulama</Text>
                <Text style={styles.modalSubtitle}>Temizlik işlemini neden atık noktasında yapmalısınız?</Text>
                
                <View style={styles.modalContent}>
                  <View style={styles.infoItem}>
                    <Ionicons name="location" size={24} color="#4B9363" style={styles.modalInfoIcon} />
                    <Text style={styles.modalInfoText}>
                      Temizlik işlemini tamamlamak için atık noktasına en fazla 100 metre mesafede olmalısınız.
                    </Text>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <Ionicons name="shield-checkmark" size={24} color="#4B9363" style={styles.modalInfoIcon} />
                    <Text style={styles.modalInfoText}>
                      Bu doğrulama, sahte temizlik raporlarını önlemek ve uygulama güvenilirliğini sağlamak için gereklidir.
                    </Text>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <Ionicons name="camera" size={24} color="#4B9363" style={styles.modalInfoIcon} />
                    <Text style={styles.modalInfoText}>
                      Temizlik öncesi ve sonrası fotoğraflar, gerçekten temizlik yaptığınızı kanıtlar.
                    </Text>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <Ionicons name="trophy" size={24} color="#4B9363" style={styles.modalInfoIcon} />
                    <Text style={styles.modalInfoText}>
                      Doğrulanmış temizlikler, profilinizde ve sıralamalarda gerçek başarı olarak sayılır.
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.modalButton}
                  onPress={() => setShowInfoModal(false)}
                >
                  <Text style={styles.modalButtonText}>Anladım</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView style={styles.content}>
          {/* Fotoğraf Alanları */}
          <View style={styles.photoContainer}>
            <TouchableOpacity 
              style={styles.photoBox}
              onPress={() => takePhoto('before')}
            >
              {beforeImage ? (
                <Image source={{ uri: beforeImage }} style={styles.photoImage} />
              ) : (
                <MaterialIcons name="photo-camera" size={36} color="#999" />
              )}
              <Text style={styles.photoLabel}>Before Cleaning</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.photoBox}
              onPress={() => takePhoto('after')}
            >
              {afterImage ? (
                <Image source={{ uri: afterImage }} style={styles.photoImage} />
              ) : (
                <MaterialIcons name="photo-camera" size={36} color="#999" />
              )}
              <Text style={styles.photoLabel}>After Cleaning</Text>
            </TouchableOpacity>
          </View>

          {/* Bilgi alanı */}
          <View style={styles.infoContainer}>
            <View style={styles.infoIcon}>
              <Ionicons name="information-circle" size={24} color="#4B9363" />
            </View>
            <View style={styles.infoContent}>
              <Text style={styles.infoTitle}>You're so close to cleaning up this trash.</Text>
              <Text style={styles.infoText}>
                Please take a photo of the trash <Text style={styles.highlightText}>while cleaning</Text> and upload it to the "Before Cleaning" section.
              </Text>
              <Text style={styles.infoText}>
                Then, after cleaning the trash, take a photo of the area and upload it to the "After Cleaning" section.
              </Text>
              <Text style={styles.infoThanks}>
                Thank you for what you have done for a green world.
              </Text>
              <Text style={styles.signatureText}>Green World</Text>
            </View>
          </View>

          {/* Ek Bilgi Alanı */}
          <View style={styles.additionalInfoContainer}>
            <Text style={styles.additionalInfoTitle}>
              If you want to give information about trash:
            </Text>
            <TextInput
              style={styles.additionalInfoInput}
              multiline
              placeholder="Add optional details about the cleaning process..."
              placeholderTextColor="#999"
              value={additionalInfo}
              onChangeText={setAdditionalInfo}
            />
          </View>

          {/* Butonlar */}
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancel}
              disabled={submitting}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.confirmButton, submitting && styles.disabledButton]}
              onPress={handleConfirm}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.confirmButtonText}>Confirm</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  infoButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  photoContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  photoBox: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#E8E8E8',
    marginHorizontal: 8,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  photoImage: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  photoLabel: {
    position: 'absolute',
    bottom: 8,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#000',
    fontWeight: '500',
    fontSize: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    paddingVertical: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  infoIcon: {
    marginRight: 12,
    paddingTop: 4,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  infoText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  highlightText: {
    color: '#A91101',
    fontWeight: 'bold',
  },
  infoThanks: {
    fontSize: 14,
    color: '#666',
    marginTop: 8,
  },
  signatureText: {
    fontSize: 14,
    color: '#4B9363',
    textAlign: 'right',
    fontStyle: 'italic',
    marginTop: 4,
  },
  additionalInfoContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  additionalInfoTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    color: '#333',
  },
  additionalInfoInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    minHeight: 100,
    textAlignVertical: 'top',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    marginRight: 8,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#4B9363',
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#4B9363',
    fontSize: 16,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 12,
    backgroundColor: '#4B9363',
    borderRadius: 8,
    alignItems: 'center',
  },
  confirmButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  disabledButton: {
    backgroundColor: '#A5C2B2',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B9363',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
  },
  modalContent: {
    marginBottom: 24,
  },
  infoItem: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-start',
  },
  modalInfoIcon: {
    marginTop: 2,
    marginRight: 12,
  },
  modalInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  modalButton: {
    backgroundColor: '#4B9363',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
