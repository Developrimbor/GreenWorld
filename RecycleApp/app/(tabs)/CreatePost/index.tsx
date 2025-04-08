import { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db, auth, storage } from '../../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import * as FileSystem from 'expo-file-system';

export default function CreatePost() {
  const [title, setTitle] = useState('');
  const [location, setLocation] = useState('');
  const [content, setContent] = useState('');
  const [image, setImage] = useState<string | null>(null);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [16, 9],
      quality: 1,
    });

    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  const handleSubmit = async () => {
    try {
      console.log('handleSubmit başladı');
      const currentUser = auth.currentUser;
      console.log('Current user UID:', currentUser ? currentUser.uid : 'Giriş yapılmamış');

      if (!currentUser) {
        Alert.alert('Hata', 'Lütfen önce giriş yapın.');
        console.log('Kullanıcı giriş yapmamış.');
        return;
      }

      if (!title || !location || !content || !image) {
        Alert.alert('Hata', 'Lütfen tüm alanları doldurun ve bir fotoğraf seçin.');
        console.log('Eksik alanlar veya resim yok:', { title: !!title, location: !!location, content: !!content, image: !!image });
        return;
      }

      console.log('Seçilen resim URI:', image);

      // 1. Dosya bilgilerini al
      const fileInfo = await FileSystem.getInfoAsync(image);
      console.log('1. Dosya bilgisi alındı:', fileInfo);
      if (!fileInfo.exists) {
        Alert.alert('Hata', 'Seçilen resim dosyası bulunamadı.');
        console.log('HATA: Dosya bulunamadı:', image);
        return;
      }

      // 2. Dosyayı fetch ile al
      const response = await fetch(fileInfo.uri);
      console.log('2. Fetch yanıt durumu:', response.status);
      if (!response.ok) {
        const responseText = await response.text();
        Alert.alert('Hata', `Resim dosyası sunucuya yüklenemedi (HTTP ${response.status}).`);
        console.log('HATA: Fetch başarısız:', response.status, response.statusText, responseText);
        return;
      }

      // 3. Blob oluştur
      const blob = await response.blob();
      console.log('3. Blob oluşturuldu. Boyut:', blob.size, 'Tip:', blob.type);

      // 4. Storage referansı oluştur
      const fileName = `posts/${Date.now()}_${currentUser.uid}.jpg`;
      console.log('4. Storage dosya adı belirlendi:', fileName);
      const storageRef = ref(storage, fileName);
      console.log('   -> Storage referansı:', storageRef.toString());

      // Token yenilemeyi zorla (Adım 6.5)
      if (currentUser) {
        try {
          console.log('6.5 Token yenileme zorlanıyor...');
          const idTokenResult = await currentUser.getIdTokenResult(true); // true -> force refresh
          console.log('    -> Token başarıyla yenilendi. Auth time:', idTokenResult.authTime);
        } catch (tokenError: any) {
          console.error('HATA: Token yenilenemedi:', tokenError);
          Alert.alert('Hata', `Kimlik doğrulama tokenı yenilenemedi: ${tokenError.message}`);
          return; // Token yenilenemezse devam etme
        }
      }

      // 7. Storage'a yükle
      console.log('7. uploadBytes başlatılıyor...');
      const uploadTaskSnapshot = await uploadBytes(storageRef, blob);
      console.log('   uploadBytes tamamlandı:', uploadTaskSnapshot.metadata.fullPath);

      // 8. İndirme URL'sini al
      console.log('8. getDownloadURL başlatılıyor...');
      const imageUrl = await getDownloadURL(storageRef);
      console.log('   İndirme URL alındı:', imageUrl);

      // 9. Firestore'a kaydet
      const postsRef = collection(db, 'posts');
      await addDoc(postsRef, {
        title,
        location,
        content,
        imageUrl,
        author: currentUser.displayName || 'Anonim',
        authorId: currentUser.uid,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Başarılı', 'Postunuz başarıyla paylaşıldı.');
      router.back();
    } catch (error: any) {
      console.error('### Post Oluşturma HATASI ###');
      console.error('Hata Mesajı:', error.message);
      if (error.code) {
        console.error('Firebase Hata Kodu:', error.code);
      }
      if (error.stack) {
        console.error('Hata Stack Trace:', error.stack);
      }
      console.error('Tüm Hata Nesnesi:', JSON.stringify(error, null, 2));

      let userMessage = 'Post paylaşılırken bir hata oluştu.';
      if (error.code === 'storage/unknown') {
          userMessage = 'Dosya yüklenirken bilinmeyen bir hata oluştu. Lütfen tekrar deneyin veya internet bağlantınızı kontrol edin.';
      } else if (error.code) {
          userMessage += ` (Kod: ${error.code})`;
      }

      Alert.alert('Hata', userMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>YENİ POST</Text>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitText}>Paylaş</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera" size={40} color="#666" />
              <Text style={styles.imagePlaceholderText}>Fotoğraf Ekle</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.formSection}>
          <TextInput
            style={styles.titleInput}
            placeholder="Başlık"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#666"
          />

          <View style={styles.locationInput}>
            <Ionicons name="location-outline" size={20} color="#666" />
            <TextInput
              style={styles.locationTextInput}
              placeholder="Konum"
              value={location}
              onChangeText={setLocation}
              placeholderTextColor="#666"
            />
          </View>

          <TextInput
            style={styles.contentInput}
            placeholder="İçerik"
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            placeholderTextColor="#666"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  submitButton: {
    padding: 8,
  },
  submitText: {
    color: '#4B9363',
    fontWeight: 'bold',
    fontSize: 16,
  },
  content: {
    flex: 1,
  },
  imagePickerButton: {
    width: '100%',
    height: 200,
    backgroundColor: '#f5f5f5',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imagePlaceholderText: {
    marginTop: 8,
    color: '#666',
    fontSize: 16,
  },
  formSection: {
    padding: 16,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 16,
    padding: 8,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  locationTextInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  contentInput: {
    fontSize: 16,
    minHeight: 200,
    padding: 8,
    lineHeight: 24,
  },
});