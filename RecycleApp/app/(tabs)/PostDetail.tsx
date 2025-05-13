import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
// Import kısmına eklenecek
import { deleteDoc } from 'firebase/firestore';
import { auth } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import BottomNavigation from '../../components/BottomNavigation';
import { LinearGradient } from 'expo-linear-gradient';

// PostType içine authorId ekleyelim
type PostType = {
  id: string;
  title: string;
  content: string;
  location: string;
  imageUrl: string;
  author: string;
  date: string;
  authorId: string; // Eklendi
  authorImage?: string; // Profil resmi için eklendi
};

export default function PostDetail() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState<PostType | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);

  // handleDeletePost fonksiyonunu değiştirelim
  const handleDeletePost = () => {
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
    try {
      await deleteDoc(doc(db, 'posts', post?.id || ''));
      setDeleteModalVisible(false);
      // Başarılı silme bildirimi için özel modal yapısı kullanabiliriz
      Alert.alert('Başarılı', 'Gönderi başarıyla silindi');
      router.push("/(tabs)/ProfilePage");
    } catch (error) {
      Alert.alert('Hata', 'Gönderi silinirken bir hata oluştu');
      setDeleteModalVisible(false);
    }
  };

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const postDoc = await getDoc(doc(db, 'posts', id as string));
        if (postDoc.exists()) {
          const postData = postDoc.data();
          
          // Post sahibinin bilgilerini getir
          let authorPhotoURL = '';
          if (postData.authorId) {
            try {
              const userDoc = await getDoc(doc(db, 'users', postData.authorId));
              if (userDoc.exists()) {
                const userData = userDoc.data();
                // Profil fotoğrafı için photoURL veya profilePicture alanını kontrol et
                authorPhotoURL = userData.photoURL || userData.profilePicture || '';
              }
            } catch (error) {
              // Hata durumunu sessizce ele al
            }
          }
          
          setPost({
            id: postDoc.id,
            title: postData.title || '',
            content: postData.content || '',
            location: postData.location || '',
            imageUrl: postData.imageUrl || '',
            author: postData.author || 'Anonim',
            date: postData.createdAt ? new Date(postData.createdAt.toDate()).toLocaleDateString() : new Date().toLocaleDateString(),
            authorId: postData.authorId || '',
            authorImage: authorPhotoURL || '', // Yazarın profil fotoğrafı URL'si
          });
        } else {
          router.back(); // Post bulunamazsa geri dön
        }
      } catch (error) {
        Alert.alert('Hata', 'Post yüklenirken bir hata oluştu.');
        router.back();
      }
    };

    if (id) {
      fetchPost();
    } else {
      router.back();
    }
  }, [id]);

  // Kullanıcı profil sayfası yönlendirmesi için fonksiyon
  const handleProfileNavigation = () => {
    if (!post?.authorId) return null;
    
    // Eğer post sahibi giriş yapmış olan kullanıcı ise ProfilePage'e yönlendir
    if (post.authorId === auth.currentUser?.uid) {
      router.push('/(tabs)/ProfilePage');
    } else {
      // Değilse UserProfile sayfasına yönlendir
      router.push({
        pathname: '/(tabs)/UserProfile',
        params: { userId: post.authorId }
      });
    }
  };

  if (!post) {
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
          onPress={() => router.push('/(tabs)/HomePage')}
        >
          <MaterialIcons name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>USER'S POST</Text>
        {post?.authorId === auth.currentUser?.uid ? (
          <View style={styles.headerActions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={() => {
                router.push(`/(tabs)/EditPost?id=${post.id}`);
              }}
            >
              <Ionicons name="create-outline" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleDeletePost}
            >
              <Ionicons name="trash-outline" size={24} color="#FF0000" />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity style={styles.alertButton}>
            <Ionicons name="alert-circle-outline" size={24} color="#000" />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.imageSection}>
        <Image
          source={{ uri: post.imageUrl }}
          style={styles.postImage}
        />
        <LinearGradient
          colors={['rgba(0,0,0,1)', 'transparent']}
          style={styles.gradient}
          start={{ x: 0, y: 1 }}
          end={{ x: 0, y: 0.5 }}
        >
          <View style={styles.imageInfo}>
            <View style={styles.dateContainer}>
              <Ionicons name="calendar-outline" size={16} color="#EDEDED" />
              <Text style={styles.date}>{post.date}</Text>
            </View>
            <View style={styles.location}>
              <Ionicons name="location" size={16} color="#EDEDED" />
              <Text style={styles.locationText}>{post.location}</Text>
            </View>
          </View>
        </LinearGradient>
      </View>

      <View style={styles.titleSection}>
        <Text style={styles.title}>{post.title}</Text>
      </View>

      <ScrollView style={styles.contentScrollView}>
        <View style={styles.contentSection}>
          <Text style={styles.content}>{post.content}</Text>
        </View>
      </ScrollView>

      <View style={styles.authorSection}>
        <TouchableOpacity 
          style={styles.authorInfo}
          onPress={handleProfileNavigation}
        >
          {post.authorImage ? (
            <Image
              source={{ uri: post.authorImage }}
              style={styles.authorImage}
            />
          ) : (
            <View style={[styles.authorImage, styles.defaultAuthorImage]}>
              <Ionicons name="person" size={26} color="#4B9363" />
            </View>
          )}
          <Text style={styles.authorName}>{post.author}</Text>
        </TouchableOpacity>
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            onPress={() => setIsLiked(!isLiked)}
            style={styles.actionButton}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={24} 
              color={isLiked ? "#FF0000" : "#000"} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            onPress={() => setIsSaved(!isSaved)}
            style={styles.actionButton}
          >
            <Ionicons 
              name={isSaved ? "bookmark" : "bookmark-outline"} 
              size={24} 
              color={isSaved ? "#4B9363" : "#000"} 
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Silme Modalı */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={deleteModalVisible}
        onRequestClose={() => setDeleteModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => setDeleteModalVisible(false)}
            >
              <Ionicons name="close" size={24} color="#000" />
            </TouchableOpacity>
            
            <Text style={styles.modalTitle}>Delete Post</Text>
            
            <Text style={styles.modalDescription}>
              Are you sure you want to delete this post? This action cannot be undone.
            </Text>
            
            <View style={styles.modalButtonsContainer}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]} 
                onPress={() => setDeleteModalVisible(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.deleteButton]} 
                onPress={confirmDelete}
              >
                <Text style={styles.deleteButtonText}>Yes, delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <BottomNavigation />
    </SafeAreaView>
  );
}

// Header stillerini güncelleyelim
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
    // height: 56,
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
  alertButton: {
    padding: 4,
  },
  imageSection: {
    width: '100%',
    height: 200,
    backgroundColor: '#fff',
    zIndex: 1,
  },
  postImage: {
    width: '100%',
    height: 200,
    position: 'absolute',
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
  titleSection: {
    width: '100%',
    backgroundColor: '#fff',
    zIndex: 1,
    marginTop: 16,
    marginBottom: 16,
    paddingHorizontal: 24,
    // paddingBottom: 8,
  },
  title: {
    fontSize: 16,
    fontFamily: 'Poppins-Medium',
  },
  contentScrollView: {
    flex: 1,
  },
  contentSection: {
    padding: 24,
    paddingTop: 4,
  },
  content: {
    fontSize: 12,
    fontFamily: 'Poppins-Regular',
    textAlign: 'justify',
    lineHeight: 20,
    color: '#333',
  },
  authorSection: {
    width: '100%',
    backgroundColor: '#fff',
    // borderTopWidth: 1,
    // borderTopColor: '#E8E8E8',
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorImage: {
    borderWidth: 1.5,
    borderColor: '#E8E8E8',
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  defaultAuthorImage: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  authorName: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  actionButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  // Modal stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
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
    top: 16,
    right: 16,
    zIndex: 1,
  },
  modalTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 20,
    color: '#4B9363',
    marginBottom: 16,
    marginTop: 16,
  },
  modalDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#555',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 22,
  },
  modalButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 8,
  },
  modalButton: {
    paddingVertical: 12,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#EFEFEF',
    borderRadius: 8,
  },
  cancelButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#444',
  },
  deleteButton: {
    backgroundColor: '#4B9363',
    borderRadius: 8,
  },
  deleteButtonText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: 'white',
  },
});