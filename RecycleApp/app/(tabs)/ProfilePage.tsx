import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Animated,
  ScrollView,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import BottomNavigation from '../../components/BottomNavigation';
import { getCurrentUser } from '../(auth)/services/authService';
import { auth, db, storage } from '../config/firebase';
import { collection, query, where, orderBy, doc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import * as ImagePicker from 'expo-image-picker';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export default function ProfilePage() {
  // Önce tab tipleri için bir type tanımlayalım
  type TabType = 'reported' | 'cleaned' | 'post';

  const [activeTab, setActiveTab] = useState<TabType>('reported');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [reportedItems, setReportedItems] = useState<any[]>([]);
  const [cleanedItems, setCleanedItems] = useState<any[]>([]);
  const [reportedCount, setReportedCount] = useState(0);
  const [cleanedCount, setCleanedCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Profil fotoğrafı yükleme için state'ler
  const [photoUploadModal, setPhotoUploadModal] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const animateSlider = (position: number) => {
    Animated.spring(slideAnim, {
      toValue: position,
      useNativeDriver: true,
    }).start();
  };

  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
    animateSlider(tab === 'reported' ? 0 : tab === 'cleaned' ? 120 : 240);
  };

  const [userData, setUserData] = useState<any>(null);

  // Menü için state ekliyoruz
  const [menuVisible, setMenuVisible] = useState(false);
  
  // Puan bilgisi modalı için state
  const [pointsInfoVisible, setPointsInfoVisible] = useState(false);

  // Sayfa yüklendiğinde sayıları ve verileri hızlıca getir
  useEffect(() => {
    const fetchAllData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (!currentUser) return;

        // Kullanıcı bilgilerini getir
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        }

        // Tüm verileri paralel olarak getir
        const [reportsSnapshot, cleanedTrashSnapshot, cleanedReportsSnapshot, postsSnapshot] = await Promise.all([
          // Reported items (bildirilen atıklar)
          getDocs(query(
            collection(db, 'trashReports'),
            where('authorId', '==', currentUser.uid)
          )),
          
          // Cleaned items - trashReports koleksiyonundan
          getDocs(query(
            collection(db, 'trashReports'),
            where('cleanedBy', '==', currentUser.uid),
            where('status', '==', 'cleaned')
          )),
          
          // Cleaned items - cleanedReports koleksiyonundan
          getDocs(query(
            collection(db, 'cleanedReports'),
            where('cleanedBy', '==', currentUser.uid)
          )),
          
          // Posts
          getDocs(query(
            collection(db, 'posts'),
            where('authorId', '==', currentUser.uid)
          ))
        ]);

        // Reported items için
        const reports = reportsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setReportedItems(reports);
        setReportedCount(reports.length);
        
        // Cleaned items için
        const cleanedTrashReports = cleanedTrashSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          source: 'trashReports'
        }));
        
        const cleanedReports = cleanedReportsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          source: 'cleanedReports'
        }));
        
        // Mükerrer temizleme kayıtlarını önle
        const cleanedIds = new Set<string>();
        const allCleanedItems: any[] = [];
        
        cleanedTrashReports.forEach(item => {
          if (!cleanedIds.has(item.id)) {
            cleanedIds.add(item.id);
            allCleanedItems.push(item);
          }
        });
        
        cleanedReports.forEach(item => {
          if (!cleanedIds.has(item.id)) {
            cleanedIds.add(item.id);
            allCleanedItems.push(item);
          }
        });
        
        setCleanedItems(allCleanedItems);
        setCleanedCount(cleanedIds.size);
        
        // Posts için
        const posts = postsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setUserPosts(posts);
        setPostsCount(posts.length);
        
      } catch (error) {
        // Hata durumunu sessizce ele al
      }
    };

    fetchAllData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/(auth)/login');
    } catch (error) {
      // Hata durumunu sessizce ele al
    }
  };

  // Menü işlemleri
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };
  
  const handleMenuOption = (option: string) => {
    setMenuVisible(false);
    
    switch (option) {
      case 'liked':
        // Liked Posts sayfasına yönlendirme
        router.push('/(tabs)/LikedPostsPage');
        break;
      case 'settings':
        // Settings sayfasına yönlendir
        router.push('/(tabs)/SettingsPage');
        break;
      case 'logout':
        handleLogout();
        break;
      default:
        break;
    }
  };

  // Puan bilgisi modalını aç/kapat
  const togglePointsInfo = () => {
    setPointsInfoVisible(!pointsInfoVisible);
  };

  // Görsel seçme ve yükleme işlemleri için fonksiyonlar
  const pickImage = async () => {
    try {
      // İzinleri kontrol et
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin Gerekli', 'Galeriden fotoğraf seçebilmek için izin vermeniz gerekiyor.');
          return;
        }
      }
      
      // Galeriyi aç
      let result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Hata', 'Fotoğraf seçilirken bir hata oluştu.');
    }
  };
  
  const takePicture = async () => {
    try {
      // İzinleri kontrol et
      if (Platform.OS !== 'web') {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          Alert.alert('İzin Gerekli', 'Kamera kullanabilmek için izin vermeniz gerekiyor.');
          return;
        }
      }
      
      // Kamerayı aç
      let result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      
      if (!result.canceled && result.assets && result.assets.length > 0) {
        uploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Kamera kullanma hatası:', error);
      Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu.');
    }
  };
  
  const uploadImage = async (uri: string) => {
    try {
      setIsUploading(true);
      setUploadProgress(0);
      setPhotoUploadModal(false);
      
      // URI'den blob oluştur
      const response = await fetch(uri);
      const blob = await response.blob();
      
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Kullanıcı oturumu bulunamadı.');
      }
      
      // Firebase Storage'a yükle
      const storageRef = ref(storage, `profile_images/${currentUser.uid}_${new Date().getTime()}`);
      const uploadTask = uploadBytesResumable(storageRef, blob);
      
      // İlerleme takibi
      uploadTask.on('state_changed',
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
        },
        (error) => {
          console.error('Fotoğraf yükleme hatası:', error);
          Alert.alert('Hata', 'Profil fotoğrafı yüklenirken bir hata oluştu.');
          setIsUploading(false);
        },
        async () => {
          // Yükleme tamamlandı, URL'yi al
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          
          // Kullanıcı belgesini güncelle
          const userRef = doc(db, 'users', currentUser.uid);
          await updateDoc(userRef, {
            photoURL: downloadURL,
            profilePicture: downloadURL // Geriye dönük uyumluluk için iki alanı da güncelle
          });
          
          // Kullanıcı verilerini yeniden yükle
          const userDoc = await getDoc(userRef);
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
          
          setIsUploading(false);
          Alert.alert('Başarılı', 'Profil fotoğrafınız güncellendi.');
        }
      );
    } catch (error) {
      console.error('Fotoğraf yükleme işlemi hatası:', error);
      Alert.alert('Hata', 'Profil fotoğrafı yüklenirken bir hata oluştu.');
      setIsUploading(false);
    }
  };
  
  // Profil fotoğrafına tıklama
  const handleProfileImagePress = () => {
    setPhotoUploadModal(true);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PROFILE</Text>
        <TouchableOpacity 
          style={styles.menuButton}
          onPress={toggleMenu}
        >
          <MaterialIcons name="more-vert" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Dropdown Menu */}
      {menuVisible && (
        <Modal
          transparent={true}
          visible={menuVisible}
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableWithoutFeedback onPress={() => setMenuVisible(false)}>
            <View style={styles.modalOverlay}>
              <TouchableWithoutFeedback>
                <View style={styles.menuContainer}>
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => handleMenuOption('liked')}
                  >
                    <Text style={styles.menuItemText}>Liked Posts</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => handleMenuOption('settings')}
                  >
                    <Text style={styles.menuItemText}>Settings</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.menuItem}
                    onPress={() => handleMenuOption('logout')}
                  >
                    <Text style={styles.menuItemTextRed}>Log Out</Text>
                  </TouchableOpacity>
                </View>
              </TouchableWithoutFeedback>
            </View>
          </TouchableWithoutFeedback>
        </Modal>
      )}

      {/* Main Content Container */}
      <ScrollView style={styles.mainContainer}>
        {/* Profile Content */}
        <View style={styles.profileContent}>
          {/* Profile Image ve Puan */}
          <View style={styles.profileImageContainer}>
            <TouchableOpacity onPress={handleProfileImagePress}>
              {userData?.photoURL ? (
                <View>
                  <Image
                    source={{ uri: userData.photoURL }}
                    style={styles.profileImage}
                  />
                  <View style={styles.editIconContainer}>
                    <MaterialIcons name="photo-camera" size={20} color="#fff" />
                  </View>
                </View>
              ) : userData?.profilePicture ? (
                <View>
                  <Image
                    source={{ uri: userData.profilePicture }}
                    style={styles.profileImage}
                  />
                  <View style={styles.editIconContainer}>
                    <MaterialIcons name="photo-camera" size={20} color="#fff" />
                  </View>
                </View>
              ) : (
                <View style={[styles.profileImage, styles.defaultProfileImage]}>
                  <Ionicons name="person" size={50} color="#4B9363" />
                  <View style={styles.editIconContainer}>
                    <MaterialIcons name="photo-camera" size={20} color="#fff" />
                  </View>
                </View>
              )}
            </TouchableOpacity>
          </View>
          
          <Text style={styles.userName}>{userData?.name || 'Loading...'}</Text>
          <Text style={styles.userNickname}>@{userData?.username || 'Loading...'}</Text>
          
          {/* Puan Göstergesi - Kullanıcı adından sonra yerleştirildi */}
          <TouchableOpacity 
            style={styles.pointsBadgeStandalone}
            onPress={togglePointsInfo}
          >
            <Text style={styles.pointsBadgeText} numberOfLines={1} ellipsizeMode="tail">
              {userData?.points || 0} P
            </Text>
            <Ionicons name="leaf" size={12} color="#fff" style={{marginLeft: 8}} />
          </TouchableOpacity>

          <View style={styles.statsContainer}>
            <TouchableOpacity 
              style={styles.statItem} 
              onPress={() => handleTabPress('reported')}
            >
              <Text style={styles.statNumber}>{reportedCount}</Text>
              <Text style={styles.statLabel}>Reported</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity 
              style={styles.statItem} 
              onPress={() => handleTabPress('cleaned')}
            >
              <Text style={styles.statNumber}>{cleanedCount}</Text>
              <Text style={styles.statLabel}>Cleaned</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity 
              style={styles.statItem} 
              onPress={() => handleTabPress('post')}
            >
              <Text style={styles.statNumber}>{postsCount}</Text>
              <Text style={styles.statLabel}>Post</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.baseProgress} />
            <Animated.View
              style={[
                styles.activeProgress,
                {
                  transform: [{ translateX: slideAnim }],
                },
              ]}
            />
          </View>

          {activeTab === 'post' && (
            <View style={styles.postsContainer}>
              {userPosts && userPosts.length > 0 ? (
                userPosts.map((post) => (
                  <TouchableOpacity
                    key={post.id}
                    style={styles.postCard}
                    onPress={() => router.push({
                      pathname: '/(tabs)/PostDetail',
                      params: { id: post.id }
                    })}
                  >
                    <Image
                      source={{ uri: post.imageUrl }}
                      style={styles.postImage}
                    />
                    <View style={styles.postInfo}>
                      <Text style={styles.postTitle}>{post.title || 'No Title'}</Text>
                      <Text style={styles.postLocation}>{post.location || 'No Location'}</Text>
                      <Text style={styles.postDate}>
                        {post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'No Date'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noPostsText}>No posts found</Text>
              )}
            </View>
          )}
          {activeTab === 'reported' && (
            <View style={styles.postsContainer}>
              {reportedItems && reportedItems.length > 0 ? (
                reportedItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.postCard}
                    onPress={() => router.push({
                      pathname: item.status === 'cleaned' ? '/(tabs)/CleanedTrashPage' : '/(tabs)/TrashDetailPage',
                      params: { id: item.id }
                    })}
                  >
                    {item.imageUrls && (
                      <Image
                        source={{ uri: item.imageUrls[0] }}
                        style={styles.postImage}
                      />
                    )}
                    <View style={styles.postInfo}>
                      <View style={styles.titleContainer}>
                        <Text style={styles.postTitle}>REPORTED</Text>
                        {item.status === 'cleaned' && (
                          <Text style={styles.cleanedTag}>(CLEANED)</Text>
                        )}
                      </View>
                      <View style={styles.locationContainer}>
                        <Ionicons name="location-outline" size={16} color="#666" />
                        <Text style={styles.postLocation}>
                          {`${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}`}
                        </Text>
                      </View>
                      <Text style={styles.postDate}>
                        {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'No Date'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noPostsText}>No reported items found</Text>
              )}
            </View>
          )}
          {activeTab === 'cleaned' && (
            <View style={styles.postsContainer}>
              {cleanedItems && cleanedItems.length > 0 ? (
                cleanedItems.map((item) => (
                  <TouchableOpacity
                    key={item.id}
                    style={styles.postCard}
                    onPress={() => router.push({
                      pathname: '/(tabs)/CleanedTrashPage',
                      params: { id: item.id }
                    })}
                  >
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                      <Image
                        source={{ uri: item.imageUrls[0] }}
                        style={styles.postImage}
                      />
                    ) : item.afterCleaningImage ? (
                      <Image
                        source={{ uri: item.afterCleaningImage }}
                        style={styles.postImage}
                      />
                    ) : item.beforeCleaningImage ? (
                      <Image
                        source={{ uri: item.beforeCleaningImage }}
                        style={styles.postImage}
                      />
                    ) : (
                      <View style={[styles.postImage, styles.defaultPostImage]}>
                        <Ionicons name="image-outline" size={30} color="#ccc" />
                      </View>
                    )}
                    <View style={styles.postInfo}>
                      <Text style={styles.cleanedTitle}>CLEANED</Text>
                      <View style={styles.locationContainer}>
                        <Ionicons name="location-outline" size={16} color="#666" />
                        <Text style={styles.postLocation}>
                          {item.location ? `${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}` : 'No Location'}
                        </Text>
                      </View>
                      <Text style={styles.postDate}>
                        {item.cleanedAt ? new Date(item.cleanedAt.seconds * 1000).toLocaleDateString() : 
                         item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'No Date'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))
              ) : (
                <Text style={styles.noPostsText}>No cleaned items found</Text>
              )}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Photo Upload Modal */}
      <Modal
        transparent={true}
        visible={photoUploadModal}
        animationType="slide"
        onRequestClose={() => setPhotoUploadModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPhotoUploadModal(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.photoUploadModal}>
                <Text style={styles.photoUploadTitle}>Profil Fotoğrafı Ekle</Text>
                
                <TouchableOpacity 
                  style={styles.photoUploadOption}
                  onPress={takePicture}
                >
                  <Ionicons name="camera" size={24} color="#4B9363" />
                  <Text style={styles.photoUploadOptionText}>Kamera ile Çek</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.photoUploadOption}
                  onPress={pickImage}
                >
                  <Ionicons name="image" size={24} color="#4B9363" />
                  <Text style={styles.photoUploadOptionText}>Galeriden Seç</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.photoUploadCancel}
                  onPress={() => setPhotoUploadModal(false)}
                >
                  <Text style={styles.photoUploadCancelText}>İptal</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
      
      {/* Upload Progress Indicator */}
      {isUploading && (
        <View style={styles.uploadProgressContainer}>
          <View style={styles.uploadProgressBox}>
            <Text style={styles.uploadProgressTitle}>Fotoğraf Yükleniyor</Text>
            <ActivityIndicator size="large" color="#4B9363" />
            <View style={styles.progressBarContainer}>
              <View 
                style={[
                  styles.progressBar, 
                  { width: `${uploadProgress}%` }
                ]} 
              />
            </View>
            <Text style={styles.uploadProgressText}>{Math.round(uploadProgress)}%</Text>
          </View>
        </View>
      )}
      
      {/* Points Info Modal */}
      <Modal
        transparent={true}
        visible={pointsInfoVisible}
        animationType="fade"
        onRequestClose={() => setPointsInfoVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setPointsInfoVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.pointsInfoModal}>
                <View style={styles.pointsInfoHeader}>
                  <Text style={styles.pointsInfoTitle}>Point System</Text>
                  <TouchableOpacity onPress={() => setPointsInfoVisible(false)}>
                    <Ionicons name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.pointsInfoContent}>
                  <Text style={styles.pointsInfoText}>
                    GreenWorld points are a value that shows your environmental awareness and contributions. 
                    You can increase your points in the following ways:
                  </Text>
                  
                  <View style={styles.pointsInfoItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#4B9363" />
                    <Text style={styles.pointsInfoItemText}>Report trash: +10 points</Text>
                  </View>
                  
                  <View style={styles.pointsInfoItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#4B9363" />
                    <Text style={styles.pointsInfoItemText}>Clean trash: +20 points</Text>
                  </View>
                  
                  <View style={styles.pointsInfoItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#4B9363" />
                    <Text style={styles.pointsInfoItemText}>Share post: +5 points</Text>
                  </View>
                  
                  <View style={styles.pointsInfoItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#4B9363" />
                    <Text style={styles.pointsInfoItemText}>Use the app actively: +1 point/day</Text>
                  </View>
                  
                  <Text style={styles.pointsInfoText}>
                    By earning higher points, you can earn various rewards and gain more recognition in the community.
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.pointsInfoButton}
                  onPress={() => setPointsInfoVisible(false)}
                >
                  <Text style={styles.pointsInfoButtonText}>Ok</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      <BottomNavigation />
    </SafeAreaView>
  );
}

// Styles'a yeni stiller ekleyelim
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
  },
  mainContainer: {
    flex: 1,
  },
  profileContent: {
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 100, // Alt kısımda extra boşluk
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  menuButton: {
    padding: 8,
    width: 40,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 8,
    alignItems: 'center', // Profil fotoğrafını ortala
  },
  profileImage: {
    width: 100,
    height: 100,
    borderColor: '#D9D9D9',
    borderWidth: 2,
    borderRadius: 60,
  },
  pointsBadgeStandalone: {
    backgroundColor: '#4B9363',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    marginTop: 2,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pointsBadgeText: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoButton: {
    position: 'absolute',
    right: -35,
    bottom: 20,
    backgroundColor: '#4B9363',
    borderRadius: 12,
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4, // İsim ile nickname arası
  },
  userNickname: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8, // Nickname ile member since arası
  },
  memberSince: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#696969',
    marginBottom: 16, // Member since ile stats arası
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    // marginTop: 4,
  },
  statItem: {
    alignItems: 'center',
    width: 80,
  },
  statNumber: {
    fontFamily: 'Poppins-Medium',
    fontSize: 22,
    marginBottom: 4, // Sayı ile label arası
  },
  statLabel: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666',
  },
  divider: {
    width: 1,
    height: 26,
    backgroundColor: '#696969',
    marginHorizontal: 16, // Çizgiler arası boşluk
  },
  progressContainer: {
    width: 360,
    height: 2,
    marginTop: 16,

  },
  baseProgress: {
    position: 'absolute',
    width: '100%',
    height: 1,
    backgroundColor: '#D9D9D9',
  },
  activeProgress: {
    position: 'absolute',
    width: 120,
    height: 2,
    backgroundColor: '#4B9363',
  },
  postsContainer: {
    width: '100%',
    paddingHorizontal: 24,
    marginTop: 16,
    flex: 1, // maxHeight yerine flex kullan
  },
  postCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 100, // Minimum yükseklik ekle
  },
  postImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  postInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'center',
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  postLocation: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  postDate: {
    fontSize: 12,
    color: '#999',
  },
  noPostsText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 20,
    fontFamily: 'Poppins-Regular',
  },
  reportCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 12,
    padding: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  reportImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  reportContent: {
    flex: 1,
    marginLeft: 12,
  },
  reportedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B9363',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#666',
  },
  dateText: {
    fontSize: 12,
    color: '#999',
  },
  // Menu styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  menuContainer: {
    position: 'absolute',
    right: 24,
    top: 64, // Header'ın altından başlasın
    backgroundColor: 'white',
    borderRadius: 8,
    paddingVertical: 8,
    width: 180,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  menuItem: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: {
    fontSize: 16,
    color: '#000',
    fontWeight: '400',
  },
  menuItemTextRed: {
    fontSize: 16,
    color: 'red',
    fontWeight: '400',
  },
  // Puan bilgisi modal stilleri
  pointsInfoModal: {
    backgroundColor: 'white',
    borderRadius: 16,
    width: '85%',
    maxHeight: '80%',
    padding: 24,
    alignSelf: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  pointsInfoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  pointsInfoTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B9363',
  },
  pointsInfoContent: {
    marginBottom: 16,
  },
  pointsInfoText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
    marginBottom: 12,
  },
  pointsInfoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingLeft: 8,
  },
  pointsInfoItemText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  pointsInfoButton: {
    backgroundColor: '#4B9363',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
    // marginTop: 8,
  },
  pointsInfoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  defaultProfileImage: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#4B9363',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  photoUploadModal: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
  },
  photoUploadTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  photoUploadOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  photoUploadOptionText: {
    fontSize: 16,
    color: '#333',
    marginLeft: 15,
  },
  photoUploadCancel: {
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 10,
  },
  photoUploadCancelText: {
    fontSize: 16,
    color: '#FF3B30',
    fontWeight: '500',
  },
  uploadProgressContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  uploadProgressBox: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 20,
    alignItems: 'center',
  },
  uploadProgressTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#333',
  },
  progressBarContainer: {
    width: '100%',
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    marginVertical: 15,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4B9363',
  },
  uploadProgressText: {
    fontSize: 16,
    color: '#333',
  },
  cleanedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B9363',
    marginBottom: 4,
  },
  defaultPostImage: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cleanedTag: {
    // backgroundColor: '#4B9363',
    color: '#4B9363',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 8,
  },
});
