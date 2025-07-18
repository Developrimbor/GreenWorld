import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
  Image,
  Modal,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as ImagePicker from 'expo-image-picker';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { LinearGradient } from 'expo-linear-gradient';

export default function EditPost() {
  const params = useLocalSearchParams();
  console.log('EditPost - Received params:', params);
  const { id } = params;
  
  // State tanımlamaları
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [author, setAuthor] = useState('');
  const [date, setDate] = useState('');
  const [loading, setLoading] = useState(true);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  
  // Düzenleme modu state'leri
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingContent, setIsEditingContent] = useState(false);
  const [isEditingLocation, setIsEditingLocation] = useState(false);
  const [isEditingTags, setIsEditingTags] = useState(false);
  
  // Başarı modalı state'i
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  // Önerilen etiketler
  const suggestedTags = ['plastic', 'waste', 'recycle', 'reuse', 'paper', 'glass', 'metal', 'organic', 'nature', 'plant', 'environment'];

  useEffect(() => {
    if (!id) {
      console.error('No post ID received');
      Alert.alert('Error', 'No post ID found');
      router.back();
      return;
    }
    console.log('EditPost - Using ID:', id);
    const fetchPost = async () => {
      try {
        const postDoc = await getDoc(doc(db, 'posts', id as string));
        if (postDoc.exists()) {
          const postData = postDoc.data();
          setTitle(postData.title || '');
          setContent(postData.content || '');
          setLocation(postData.location || '');
          setImageUrl(postData.imageUrl || '');
          setAuthor(postData.author || 'Anonim');
          setTags(postData.tags || []);
          setDate(postData.createdAt ? new Date(postData.createdAt.toDate()).toLocaleDateString() : new Date().toLocaleDateString());
          setLoading(false);
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        Alert.alert('Error', 'Failed to load post');
      }
    };

    if (id) fetchPost();
  }, [id]);

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, 'posts', id as string), {
        title,
        content,
        location,
        imageUrl,
        tags,
        updatedAt: new Date(),
      });
      // Alert.alert yerine success modal gösteriyoruz
      setShowSuccessModal(true);
      // 1.5 saniye sonra modal kapanıp detay sayfasına yönlendirilecek
      setTimeout(() => {
        setShowSuccessModal(false);
        router.push({pathname: "/(tabs)/PostDetail", params: {id: id}});
      }, 1500);
    } catch (error) {
      console.error('Error updating post:', error);
      Alert.alert('Error', 'Failed to update post');
    }
  };

  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        setLoading(true);
        const storage = getStorage();
        const imageRef = ref(storage, `posts/${id}/${Date.now()}`);
        
        const response = await fetch(result.assets[0].uri);
        const blob = await response.blob();
        
        await uploadBytes(imageRef, blob);
        const downloadUrl = await getDownloadURL(imageRef);
        
        setImageUrl(downloadUrl);
        await updateDoc(doc(db, 'posts', id as string), {
          imageUrl: downloadUrl,
        });
        setLoading(false);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to update image');
      setLoading(false);
    }
  };

  // Etiket ekleme fonksiyonu
  const addTag = (tag: string) => {
    if (!tag || tag.trim() === '') return;
    
    // Etiket zaten varsa ekleme
    if (tags.includes(tag.trim())) return;
    
    // Maksimum 4 etiket sınırı
    if (tags.length >= 4) {
      Alert.alert('Etiket Sınırı', 'En fazla 4 etiket ekleyebilirsiniz.');
      return;
    }
    
    setTags([...tags, tag.trim()]);
    setTagInput('');
  };

  // Etiket silme fonksiyonu
  const removeTag = (index: number) => {
    const newTags = [...tags];
    newTags.splice(index, 1);
    setTags(newTags);
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EDIT POST</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleUpdate}
        >
          <Ionicons name="checkmark" size={24} color="#4B9363" />
        </TouchableOpacity>
      </View>

      {/* Görsel Bölümü */}
      <View style={styles.imageSection}>
        <Image
          source={{ uri: imageUrl }}
          style={styles.postImage}
        />
        <TouchableOpacity 
          style={styles.editImageButton}
          onPress={pickImage}
        >
          <Ionicons name="camera" size={24} color="#fff" />
        </TouchableOpacity>
        <LinearGradient
          colors={['rgba(0,0,0,1)', 'transparent']}
          style={styles.gradient}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0.5 }}
        >
          <View style={styles.imageInfo}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={16} color="#EDEDED" />
              <Text style={styles.date}>{date}</Text>
            </View>
            {isEditingLocation ? (
              <View style={styles.editLocationContainer}>
                <TextInput
                  style={styles.editLocationInput}
                  value={location}
                  onChangeText={setLocation}
                  onBlur={() => setIsEditingLocation(false)}
                  autoFocus={true}
                />
                <TouchableOpacity onPress={() => setIsEditingLocation(false)}>
                  <Ionicons name="checkmark" size={18} color="#EDEDED" />
                </TouchableOpacity>
              </View>
            ) : (
              <TouchableOpacity 
                style={styles.locationContainer}
                onPress={() => setIsEditingLocation(true)}
              >
                <View style={styles.location}>
                  <Ionicons name="location" size={16} color="#EDEDED" />
                  <Text style={styles.locationText}>{location}</Text>
                </View>
                <Ionicons name="create-outline" size={16} color="#EDEDED" style={styles.editIcon} />
              </TouchableOpacity>
            )}
          </View>
        </LinearGradient>
      </View>

      {/* Başlık Bölümü */}
      <View style={styles.titleSection}>
        {isEditingTitle ? (
          <View style={styles.editTitleContainer}>
            <TextInput
              style={styles.editTitleInput}
              value={title}
              onChangeText={setTitle}
              onBlur={() => setIsEditingTitle(false)}
              autoFocus={true}
            />
            <TouchableOpacity onPress={() => setIsEditingTitle(false)}>
              <Ionicons name="checkmark" size={20} color="#4B9363" />
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{title}</Text>
            <TouchableOpacity onPress={() => setIsEditingTitle(true)}>
              <Ionicons name="create-outline" size={20} color="#4B9363" style={styles.editIcon} />
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Etiketler Bölümü */}
      <View style={styles.tagsSection}>
        <View style={styles.tagsSectionHeader}>
          <Text style={styles.tagsSectionTitle}>Etiketler</Text>
          <TouchableOpacity 
            onPress={() => setIsEditingTags(!isEditingTags)}
            style={styles.editTagsButton}
          >
            <Ionicons 
              name={isEditingTags ? "checkmark" : "create-outline"} 
              size={20} 
              color="#4B9363" 
            />
          </TouchableOpacity>
        </View>

        {/* Etiketler */}
        {tags.length > 0 ? (
          <View style={styles.tagsContainer}>
            {tags.map((tag, index) => (
              <View key={index} style={styles.tagChip}>
                <Text style={styles.tagText}>{tag}</Text>
                {isEditingTags && (
                  <TouchableOpacity 
                    onPress={() => removeTag(index)}
                    style={styles.removeTagButton}
                  >
                    <Ionicons name="close-circle" size={18} color="#4B9363" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.noTagsText}>Henüz etiket eklenmemiş</Text>
        )}

        {/* Etiket düzenleme modu */}
        {isEditingTags && tags.length < 4 && (
          <>
            <View style={styles.tagInputContainer}>
              <TextInput
                style={styles.tagInput}
                placeholder="Etiket ekle..."
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

            {/* Önerilen etiketler */}
            <Text style={styles.suggestedTagsTitle}>Önerilen Etiketler</Text>
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
          </>
        )}
      </View>

      {/* İçerik Bölümü */}
      <ScrollView style={styles.contentScrollView}>
        <View style={styles.contentContainer}>
          {isEditingContent ? (
            <View style={styles.editContentContainer}>
              <TextInput
                style={styles.editContentInput}
                value={content}
                onChangeText={setContent}
                multiline
                textAlignVertical="top"
                autoFocus={true}
              />
              <TouchableOpacity 
                style={styles.saveContentButton}
                onPress={() => setIsEditingContent(false)}
              >
                <Ionicons name="checkmark" size={20} color="#4B9363" />
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <Text style={styles.content}>{content}</Text>
              <TouchableOpacity 
                style={styles.editContentButton}
                onPress={() => setIsEditingContent(true)}
              >
                <Ionicons name="create-outline" size={20} color="#4B9363" />
              </TouchableOpacity>
            </>
          )}
        </View>
      </ScrollView>

      {/* Success Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={() => setShowSuccessModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setShowSuccessModal(false)}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity> */}
            
            <Text style={styles.modalTitle}>
              Gönderi Güncellendi
            </Text>
            
            <Text style={styles.modalMessage}>
              Gönderiniz başarıyla güncellendi!
            </Text>
            
            {/* <View style={styles.modalButtonContainer}>
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={() => setShowSuccessModal(false)}
              >
                <Text style={styles.cancelButtonText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.confirmButton}
                onPress={() => {
                  setShowSuccessModal(false);
                  router.push({pathname: "/(tabs)/PostDetail", params: {id: id}});
                }}
              >
                <Text style={styles.confirmButtonText}>Tamam</Text>
              </TouchableOpacity>
            </View> */}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  saveButton: {
    padding: 4,
  },
  // Görsel bölümü stilleri
  imageSection: {
    width: '100%',
    height: 200,
    backgroundColor: '#fff',
    zIndex: 1,
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: 200,
    position: 'absolute',
  },
  editImageButton: {
    position: 'absolute',
    right: 16,
    top: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
    zIndex: 2,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '100%',
    justifyContent: 'flex-end',
    padding: 24,
    paddingBottom: 16,
  },
  imageInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  date: {
    color: '#EDEDED',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#EDEDED',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    marginLeft: 4,
  },
  editLocationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  editLocationInput: {
    color: '#EDEDED',
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    padding: 4,
    minWidth: 100,
  },
  // Başlık bölümü stilleri
  titleSection: {
    width: '100%',
    backgroundColor: '#fff',
    zIndex: 1,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 8,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  editTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    flex: 1,
  },
  editTitleInput: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
    flex: 1,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    padding: 8,
  },
  // Etiket bölümü stilleri
  tagsSection: {
    width: '100%',
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  tagsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  tagsSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  editTagsButton: {
    padding: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
  },
  removeTagButton: {
    marginLeft: 4,
  },
  noTagsText: {
    fontSize: 14,
    color: '#95A5A6',
    fontStyle: 'italic',
    marginVertical: 8,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginVertical: 12,
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
    marginBottom: 8,
  },
  suggestedTagChip: {
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  suggestedTagText: {
    color: '#4B9363',
    fontSize: 14,
  },
  disabledTagText: {
    color: '#A5D6A7',
  },
  // İçerik bölümü stilleri
  contentScrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 8,
    position: 'relative',
  },
  content: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    textAlign: 'justify',
    lineHeight: 20,
    color: '#333',
  },
  editContentContainer: {
    position: 'relative',
  },
  editContentInput: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    lineHeight: 20,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    padding: 12,
    minHeight: 200,
  },
  editContentButton: {
    position: 'absolute',
    top: 8,
    right: 24,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 4,
  },
  saveContentButton: {
    position: 'absolute',
    top: 8,
    right: 24,
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 4,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  editIcon: {
    marginLeft: 8,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '75%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    padding: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B9363',
    marginTop: 10,
    marginBottom: 20,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center',
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 10,
  },
  cancelButton: {
    backgroundColor: '#F1F1F1',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '47%',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 16,
    fontWeight: 'bold',
  },
  confirmButton: {
    backgroundColor: '#4B9363',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    width: '47%',
  },
  confirmButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});