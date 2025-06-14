import React, { useState, useEffect, useRef } from 'react';
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
  Animated,
} from 'react-native';
import { MaterialIcons, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc, increment, setDoc, collection } from 'firebase/firestore';
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
  const [rulesOpen, setRulesOpen] = useState(false);
  const collapseAnim = useRef(new Animated.Value(0)).current;
  const [infoChecked, setInfoChecked] = useState(false);
  const [errorModalVisible, setErrorModalVisible] = useState(false);

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

  useEffect(() => {
    Animated.timing(collapseAnim, {
      toValue: rulesOpen ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [rulesOpen]);

  const pickImage = async (type: 'before' | 'after') => {
    // İzinleri kontrol et
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Error', 'You must grant permission to access the gallery.');
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
      Alert.alert('Error', 'You must grant permission to access the camera.');
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
      Alert.alert('Error', 'Please upload at least one photo.');
      return;
    }

    if (!trash || !trash.location) {
      Alert.alert('Error', 'Trash location information could not be found.');
      return;
    }

    setSubmitting(true);

    try {
      // Konum izni kontrolü
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Location Permission Required',
          'You must grant location permission to confirm the cleaning.',
          [{ text: 'OK' }]
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
          'Too Far Away',
          `To complete the cleaning process, you must be within ${MAX_DISTANCE} meters of the trash point. Your current distance is approximately ${Math.round(distance)} meters.`,
          [{ text: 'OK' }]
        );
        setSubmitting(false);
        return;
      }

      // Kullanıcı yeterince yakın, temizlik işlemine devam et
      const storage = getStorage();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        Alert.alert('Error', 'User information could not be retrieved. Please log in again.');
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

      // Firestore'u güncelle - trashReports koleksiyonu
      const trashRef = doc(db, 'trashReports', id as string);
      await updateDoc(trashRef, updates);
      
      // cleanedReports koleksiyonuna da ekle
      const cleanedReportRef = doc(db, 'cleanedReports', id as string);
      const timestamp = new Date();
      
      // Temizlenen atık raporu için veri hazırla
      const cleanedReportData = {
        ...trash, // Orijinal atık bilgilerini ekle
        ...updates, // Temizlik bilgilerini ekle
        createdAt: timestamp, // Temizleme raporu oluşturma zamanı
        originalReportId: id, // Orijinal rapor ID'si
        authorId: trash.authorId, // Atığı bildiren kullanıcı
        cleanedBy: currentUser.uid, // Temizleyen kullanıcı
        pointsAwarded: 20, // Verilen puan
        cleaned: true,
        status: 'cleaned'
      };
      
      // cleanedReports koleksiyonuna ekle
      await setDoc(cleanedReportRef, cleanedReportData);
      
      // Kullanıcının temizleme sayısını artır ve puan ekle
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        cleaned: increment(1),
        points: increment(20)
      });

      Alert.alert(
        'Waste Cleaning Report Sent!',
        'The cleaning report has been successfully submitted. Thank you for contributing to a greener world!',
        [{ text: 'OK', onPress: () => router.push('/(tabs)/HomePage') }]
      );
    } catch (error) {
      console.error('Data upload error:', error);
      Alert.alert('Error', 'An error occurred while sending the cleaning report. Please try again.');
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
          <MaterialIcons name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TRASH CLEANING</Text>
        <TouchableOpacity style={styles.infoButton} onPress={showInfo}>
          <MaterialIcons name="info" size={24} color="#A91101" />
        </TouchableOpacity>
      </View>

      {/* Collapse Info Box */}
      {/* <View style={styles.collapseContainer}>
        <TouchableOpacity style={styles.collapseHeader} onPress={() => setRulesOpen(!rulesOpen)} activeOpacity={0.8}>
          <Text style={styles.collapseTitle}>Please read before sharing!</Text>
          <Ionicons name={rulesOpen ? 'chevron-up' : 'chevron-down'} size={22} color="#4B9363" />
        </TouchableOpacity>
        <Animated.View
          style={[
            styles.collapseContent,
            {
              height: collapseAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 120],
              }),
              opacity: collapseAnim,
              overflow: 'hidden',
            },
          ]}
        >
          <View style={styles.collapsePhotoRow}>
            <View style={styles.collapsePhotoBox}>
              <MaterialIcons name="photo-camera" size={36} color="#999" />
              <Text style={styles.collapsePhotoLabel}>Before Cleaning</Text>
            </View>
            <View style={styles.collapsePhotoBox}>
              <MaterialIcons name="photo-camera" size={36} color="#999" />
              <Text style={styles.collapsePhotoLabel}>After Cleaning</Text>
            </View>
          </View>
        </Animated.View>
      </View> */}

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
                <Text style={styles.modalTitle}>Location Verification</Text>
                <Text style={styles.modalSubtitle}>Why do you need to be close to the waste point when cleaning?</Text>
                
                <View style={styles.modalContent}>
                  <View style={styles.infoItem}>
                    <Ionicons name="location" size={24} color="#4B9363" style={styles.modalInfoIcon} />
                    <Text style={styles.modalInfoText}>
                      You must be within 100 meters of the waste point to complete the cleaning process.
                    </Text>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <Ionicons name="shield-checkmark" size={24} color="#4B9363" style={styles.modalInfoIcon} />
                    <Text style={styles.modalInfoText}>
                      This verification is necessary to prevent fake cleaning reports and ensure the reliability of the app.
                    </Text>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <Ionicons name="camera" size={24} color="#4B9363" style={styles.modalInfoIcon} />
                    <Text style={styles.modalInfoText}>
                      Before and after photos prove that you have actually cleaned the area.
                    </Text>
                  </View>
                  
                  <View style={styles.infoItem}>
                    <Ionicons name="trophy" size={24} color="#4B9363" style={styles.modalInfoIcon} />
                    <Text style={styles.modalInfoText}>
                      Verified cleanings count as real achievements on your profile and in the rankings.
                    </Text>
                  </View>
                </View>
                
                <TouchableOpacity 
                  style={styles.modalButton}
                  onPress={() => setShowInfoModal(false)}
                >
                  <Text style={styles.modalButtonText}>OK</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Hata Modalı: Checkbox işaretlenmeden görsel yüklenemez */}
      <Modal
        visible={errorModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setErrorModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContainer}>
                <Text style={styles.modalTitle}>Action Not Allowed</Text>
                <Text style={styles.modalSubtitle}>
                  You must read and confirm the information above before uploading before/after images.
                </Text>
                <TouchableOpacity
                  style={styles.modalButton}
                  onPress={() => setErrorModalVisible(false)}
                >
                  <Text style={styles.modalButtonText}>OK</Text>
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
              onPress={() => {
                if (!infoChecked) {
                  setErrorModalVisible(true);
                  return;
                }
                takePhoto('before');
              }}
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
              onPress={() => {
                if (!infoChecked) {
                  setErrorModalVisible(true);
                  return;
                }
                takePhoto('after');
              }}
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
            <View style={styles.infoContent}>
              <View style={styles.infoTitleRow}>
                {/* <MaterialIcons name="info-outline" size={24} color="#4B9363" style={styles.infoIconMoved} /> */}
                <Text style={styles.infoTitle}>You are very close to cleaning up this trash.</Text>
              </View>
              <Text style={styles.infoText}>
                Please take a photo of the trash <Text style={styles.highlightText}>while cleaning</Text> and upload it to the "Before Cleaning" section.
              </Text>
              <Text style={styles.infoText}>
                Then, after cleaning the trash, take a photo of the area and upload it to the "After Cleaning" section.
              </Text>

              {/* Örnek Before/After Görselleri */}
              <View style={styles.photoContainerInfo} pointerEvents="none">
                <View style={styles.photoBox}>
                  <Image source={require('../../assets/images/before.jpg')} style={styles.photoImage} />
                  <Text style={styles.photoLabel}>Before Cleaning</Text>
                </View>
                <View style={styles.photoBox}>
                  <Image source={require('../../assets/images/after.jpg')} style={styles.photoImage} />
                  <Text style={styles.photoLabel}>After Cleaning</Text>
                </View>
              </View>
              {/* Bilgilendirici Onay Checkbox'u */}
              <View style={styles.infoCheckboxRow}>
                <TouchableOpacity
                  style={styles.checkbox}
                  onPress={() => setInfoChecked(!infoChecked)}
                  activeOpacity={0.8}
                >
                  {infoChecked ? (
                    <Ionicons name="checkbox" size={22} color="#4B9363" />
                  ) : (
                    <Ionicons name="square-outline" size={22} color="#999" />
                  )}
                </TouchableOpacity>
                <Text style={styles.checkboxLabel}>
                  I have read and understood the information above.
                </Text>
              </View>
              <Text style={styles.infoThanks}>
                Thank you for your contribution to a greener world.
              </Text>
              <Text style={styles.signatureText}>Green World</Text>
            </View>
          </View>

          {/* Ek Bilgi Alanı */}
          <View style={styles.additionalInfoContainer}>
            <Text style={styles.additionalInfoTitle}>
              If you want to provide additional information about the trash:
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
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    gap: 12,
    borderBottomColor: '#E8E8E8',
  },
  photoContainerInfo: {
    flexDirection: 'row',
    paddingVertical: 8,
    // paddingHorizontal: 24,
    // borderBottomWidth: 1,
    gap: 12,
    // borderBottomColor: '#E8E8E8',
  },
  photoBox: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#E8E8E8',
    // marginHorizontal: 8,
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
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    paddingHorizontal: 24,
  },
  infoIcon: {
    marginRight: 12,
    paddingTop: 4,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    lineHeight: 20,
    // marginBottom: 8,
    color: '#000',
  },
  infoText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#666',
    marginBottom: 8,
    // lineHeight: 16,
  },
  highlightText: {
    color: '#A91101',
    fontFamily: 'Poppins-Medium',
    // fontWeight: 'bold',
  },
  infoThanks: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#666',
    marginTop: 8,
  },
  signatureText: {
    fontSize: 14,
    color: '#4B9363',
    fontFamily: 'Poppins',
    textAlign: 'right',
    fontWeight: 'bold',
    fontStyle: 'italic',
    marginTop: 6,
  },
  infoTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  infoIconMoved: {
    marginRight: 8,
  },
  additionalInfoContainer: {
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  additionalInfoTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 15,
    marginBottom: 12,
    color: '#000',
  },
  additionalInfoInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    minHeight: 64,
    textAlignVertical: 'top',
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 24,
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
  collapseContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    marginHorizontal: 24,
    // marginBottom: 12,
    marginTop: 12,
    paddingHorizontal: 16,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: '#4B9363',
    elevation: 2,
  },
  collapseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  collapseTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B9363',
    letterSpacing: 0.2,
  },
  collapseContent: {
    // marginTop: 8,
    // paddingBottom: 4,
  },
  collapseText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
  },
  collapsePhotoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  collapsePhotoBox: {
    flex: 1,
    aspectRatio: 1,
    backgroundColor: '#ECECEC',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    overflow: 'hidden',
  },
  collapsePhotoLabel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    textAlign: 'center',
    color: '#111',
    fontWeight: 'bold',
    fontSize: 14,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingVertical: 8,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  infoCheckboxRow: {
    flexDirection: 'row',
    // alignItems: 'center',
    justifyContent: 'center',
    marginTop: 10,
    marginBottom: 4,
    gap: 4,
  },
  checkbox: {
    width: 28,
    height: 28,
    // justifyContent: 'center',
    // alignItems: 'center',
    // backgroundColor: 'transparent',
    marginTop: 0,
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#4B9363',
    fontFamily: 'Poppins-Medium',
    flex: 1,
    flexWrap: 'wrap',
  },
});
