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
      if (!auth.currentUser) {
        Alert.alert('Hata', 'Lütfen önce giriş yapın.');
        return;
      }

      if (!title || !location || !content || !image) {
        Alert.alert('Hata', 'Lütfen tüm alanları doldurun ve bir fotoğraf seçin.');
        return;
      }

      // Resim dosyasını binary olarak oku
      const fileInfo = await FileSystem.getInfoAsync(image);
      const response = await fetch(fileInfo.uri);
      const blob = await response.blob();

      // Storage referansını oluştur ve yükle
      const fileName = `posts/${Date.now()}_${auth.currentUser.uid}.jpg`;
      const storageRef = ref(storage, fileName);
      await uploadBytes(storageRef, blob);
      const imageUrl = await getDownloadURL(storageRef);

      // Post'u Firestore'a kaydet
      const postsRef = collection(db, 'posts');
      await addDoc(postsRef, {
        title,
        location,
        content,
        imageUrl,
        author: auth.currentUser.displayName || 'Anonim',
        authorId: auth.currentUser.uid,
        createdAt: serverTimestamp(),
      });

      Alert.alert('Başarılı', 'Postunuz başarıyla paylaşıldı.');
      router.back();
    } catch (error) {
      console.error('Post oluşturma hatası:', error);
      if (error instanceof Error) {
        console.error('Hata detayı:', error.message);
        Alert.alert('Hata', `Post paylaşılırken bir hata oluştu: ${error.message}`);
      } else {
        Alert.alert('Hata', 'Post paylaşılırken bilinmeyen bir hata oluştu.');
      }
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