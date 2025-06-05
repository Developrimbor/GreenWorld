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
  FlatList,
  Modal,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
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
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Error Modal State
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorTitle, setErrorTitle] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Önerilen etiketler
  const suggestedTags = ['plastic', 'waste', 'recycle', 'reuse', 'paper', 'glass', 'metal', 'organic', 'nature', 'plant', 'environment'];

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

  const addTag = (tag: string) => {
    if (!tag || tag.trim() === '') return;
    
    // Etiket zaten varsa ekleme
    if (tags.includes(tag.trim())) return;
    
    // Maksimum 4 etiket sınırı
    if (tags.length >= 4) {
      showError('Warning', 'You can add a maximum of 4 tags.');
      return;
    }
    
    setTags([...tags, tag.trim()]);
    setTagInput('');
  };

  const removeTag = (index: number) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
  };
  
  // Özelleştirilmiş hata gösterme fonksiyonu
  const showError = (title: string, message: string) => {
    setErrorTitle(title);
    setErrorMessage(message);
    setErrorModalVisible(true);
  };

  const handleSubmit = async () => {
    try {
      console.log('handleSubmit başladı');
      const currentUser = auth.currentUser;
      console.log('Current user UID:', currentUser ? currentUser.uid : 'Not logged in');

      if (!currentUser) {
        showError('Oturum Hatası', 'Lütfen önce giriş yapın.');
        console.log('User is not logged in.');
        return;
      }

      // Tüm gerekli alanları kontrol et, etiketleri de içerecek şekilde
      if (!title) {
        showError('Missing Info', 'Please enter a title.');
        return;
      }
      
      if (!location) {
        showError('Missing Info', 'Please enter a location.');
        return;
      }
      
      if (!content) {
        showError('Missing Info', 'Please enter a content.');
        return;
      }
      
      if (!image) {
        showError('Missing Info', 'Please enter a image.');
        return;
      }
      
      if (tags.length === 0) {
        showError('Missing Info', 'Please add at least one tag.');
        return;
      }

      console.log('Selected image URI:', image);

      // 1. Dosya bilgilerini al
      const fileInfo = await FileSystem.getInfoAsync(image);
      console.log('1. File information retrieved:', fileInfo);
      if (!fileInfo.exists) {
        showError('Dosya Hatası', 'Seçilen resim dosyası bulunamadı.');
        console.log('File not found:', image);
        return;
      }

      // 2. Dosyayı fetch ile al
      const response = await fetch(fileInfo.uri);
      console.log('2. Fetch response status:', response.status);
      if (!response.ok) {
        const responseText = await response.text();
        showError('Yükleme Hatası', `Resim dosyası sunucuya yüklenemedi (HTTP ${response.status}).`);
        console.log('Error: Fetch failed:', response.status, response.statusText, responseText);
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
          showError('Kimlik Doğrulama Hatası', `Kimlik doğrulama tokenı yenilenemedi: ${tokenError.message}`);
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
        tags: tags.length > 0 ? tags : [],  // Etiketleri ekle
      });

      Alert.alert('Başarılı', 'Postunuz başarıyla paylaşıldı.');
      // router.back() yerine doğrudan HomePage'e yönlendir
      router.replace('/(tabs)/HomePage');
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

      let errorTitle = 'Post Paylaşım Hatası';
      let userMessage = 'Post paylaşılırken bir hata oluştu.';
      
      if (error.code === 'storage/unknown') {
          userMessage = 'Dosya yüklenirken bilinmeyen bir hata oluştu. Lütfen tekrar deneyin veya internet bağlantınızı kontrol edin.';
      } else if (error.code) {
          userMessage += ` (Kod: ${error.code})`;
      }

      showError(errorTitle, userMessage);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
        <MaterialIcons name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NEW POST</Text>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
        <Ionicons name="share-outline" size={24} color="#4B9363" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.imagePickerButton} onPress={pickImage}>
          {image ? (
            <Image source={{ uri: image }} style={styles.previewImage} resizeMode="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="camera-outline" size={48} color="#4B9363" />
              <Text style={styles.imagePlaceholderText}>Add Photo</Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.formSection}>
          <TextInput
            style={styles.titleInput}
            placeholder="Add Title"
            value={title}
            onChangeText={setTitle}
            placeholderTextColor="#95A5A6"
          />

          <View style={styles.locationInput}>
            <Ionicons name="location-outline" size={24} color="#4B9363" />
            <TextInput
              style={styles.locationTextInput}
              placeholder="Add Location"
              value={location}
              onChangeText={setLocation}
              placeholderTextColor="#95A5A6"
            />
          </View>

          {/* Etiket ekleme alanı */}
          <View style={styles.tagsSection}>
            <Text style={styles.tagsSectionTitle}>Tags (Maks. 4) *</Text>
            
            {/* Eklenen etiketler */}
            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag, index) => (
                  <View key={index} style={styles.tagChip}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <TouchableOpacity 
                      onPress={() => removeTag(index)}
                      style={styles.removeTagButton}
                    >
                      <Ionicons name="close-circle" size={18} color="#4B9363" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
            
            {/* Etiket ekleme input */}
            {tags.length < 4 && (
              <View style={styles.tagInputContainer}>
                <TextInput
                  style={styles.tagInput}
                  placeholder="Add Tag..."
                  value={tagInput}
                  onChangeText={setTagInput}
                  onSubmitEditing={() => addTag(tagInput)}
                  returnKeyType="done"
                  placeholderTextColor="#95A5A6"
                />
                <TouchableOpacity 
                  style={styles.addTagButton}
                  onPress={() => addTag(tagInput)}
                >
                  <Ionicons name="add-circle" size={24} color="#4B9363" />
                </TouchableOpacity>
              </View>
            )}
            
            {/* Önerilen etiketler */}
            <Text style={styles.suggestedTagsTitle}>Suggested Tags</Text>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.suggestedTagsContainer}
            >
              {suggestedTags.map((tag, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestedTagChip}
                  onPress={() => addTag(tag)}
                  disabled={tags.includes(tag) || tags.length >= 4}
                >
                  <Text 
                    style={[
                      styles.suggestedTagText,
                      (tags.includes(tag) || tags.length >= 4) && styles.disabledTagText
                    ]}
                  >
                    {tag}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <TextInput
            style={styles.contentInput}
            placeholder="Write About Your Post"
            value={content}
            onChangeText={setContent}
            multiline
            placeholderTextColor="#95A5A6"
          />
        </View>
      </ScrollView>
      
      {/* Özelleştirilmiş hata modalı */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={errorModalVisible}
        onRequestClose={() => setErrorModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.errorModalContainer}>
            <View style={styles.errorIconContainer}>
              <Ionicons name="alert-circle" size={40} color="#fff" />
            </View>
            
            <Text style={styles.errorTitle}>{errorTitle}</Text>
            <Text style={styles.errorMessage}>{errorMessage}</Text>
            
            <TouchableOpacity 
              style={styles.errorButton}
              onPress={() => setErrorModalVisible(false)}
            >
              <Text style={styles.errorButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  backButton: {
    padding: 8,
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
    paddingTop: 8,
    paddingHorizontal: 24,
  },
  titleInput: {
    fontSize: 20,
    fontWeight: '500',
    marginBottom: 4,
    padding: 8,
  },
  locationInput: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  locationTextInput: {
    flex: 1,
    marginLeft: 4,
    fontSize: 16,
  },
  contentInput: {
    fontSize: 16,
    paddingTop: 12,
    lineHeight: 24,
  },
  // Etiket stili
  tagsSection: {
    marginVertical: 16,
  },
  tagsSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    color: '#333',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 12,
  },
  tagChip: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagText: {
    color: '#4B9363',
    fontSize: 14,
    marginRight: 4,
  },
  removeTagButton: {
    marginLeft: 2,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginBottom: 16,
  },
  tagInput: {
    flex: 1,
    fontSize: 14,
    paddingVertical: 8,
  },
  addTagButton: {
    marginLeft: 8,
  },
  suggestedTagsTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  suggestedTagsContainer: {
    marginBottom: 16,
  },
  suggestedTagChip: {
    backgroundColor: '#E8F5E9',
    borderRadius: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginRight: 8,
  },
  suggestedTagText: {
    color: '#4B9363',
    fontSize: 14,
  },
  disabledTagText: {
    color: '#A5D6A7',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  errorModalContainer: {
    backgroundColor: '#fff',
    padding: 24,
    borderRadius: 16,
    width: '80%',
    maxHeight: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorIconContainer: {
    backgroundColor: '#4B9363',
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#333',
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
    textAlign: 'center',
    lineHeight: 20,
  },
  errorButton: {
    backgroundColor: '#4B9363',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
  },
  errorButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
});