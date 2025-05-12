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
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import BottomNavigation from '../../components/BottomNavigation';
import { getCurrentUser } from '../(auth)/services/authService';
import { auth, db } from '../config/firebase';
import { collection, query, where, orderBy, doc, getDoc, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export default function ProfilePage() {
  // Önce tab tipleri için bir type tanımlayalım
  type TabType = 'reported' | 'cleaned' | 'post';

  const [activeTab, setActiveTab] = useState<TabType>('reported');
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [reportedItems, setReportedItems] = useState<any[]>([]); // State'i buraya taşıyalım
  const slideAnim = useRef(new Animated.Value(0)).current;

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

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    const fetchUserPosts = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const postsRef = collection(db, 'posts');
          const q = query(
            postsRef,
            where('authorId', '==', currentUser.uid)
          );
          const querySnapshot = await getDocs(q);
          const posts = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          console.log('Fetched posts:', posts); // Log ekleyelim
          setUserPosts(posts);
        }
      } catch (error) {
        console.error('Error fetching user posts:', error);
      }
    };
    fetchUserPosts();
    fetchUserData();
  }, []);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/(auth)/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  // Reported items için useEffect ekleyelim
  useEffect(() => {
    const fetchReportedItems = async () => {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const reportsRef = collection(db, 'trashReports');
          const q = query(
            reportsRef,
            where('authorId', '==', currentUser.uid),
            where('status', '==', 'reported')
          );
          const querySnapshot = await getDocs(q);
          const reports = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          }));
          setReportedItems(reports);
        }
      } catch (error) {
        console.error('Error fetching reported items:', error);
      }
    };

    if (activeTab === 'reported') {
      fetchReportedItems();
    }
  }, [activeTab]);

  // Menü işlemleri
  const toggleMenu = () => {
    setMenuVisible(!menuVisible);
  };
  
  const handleMenuOption = (option: string) => {
    setMenuVisible(false);
    
    switch (option) {
      case 'logout':
        handleLogout();
        break;
      case 'liked':
        // Burada Liked Posts sayfasına yönlendirme yapılabilir
        console.log('Liked Posts tıklandı');
        break;
      case 'saved':
        // Burada Saved Posts sayfasına yönlendirme yapılabilir
        console.log('Saved Posts tıklandı');
        break;
      case 'settings':
        // Burada Settings sayfasına yönlendirme yapılabilir
        console.log('Settings tıklandı');
        break;
      default:
        break;
    }
  };

  // Puan bilgisi modalını aç/kapat
  const togglePointsInfo = () => {
    setPointsInfoVisible(!pointsInfoVisible);
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
                    onPress={() => handleMenuOption('saved')}
                  >
                    <Text style={styles.menuItemText}>Saved Posts</Text>
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
            <Image
              source={require('../../assets/images/profile-2.jpg')}
              style={styles.profileImage}
            />
            
            {/* Puan Göstergesi */}
            <TouchableOpacity 
              style={styles.pointsBadge}
              onPress={togglePointsInfo}
            >
              <Text style={styles.pointsBadgeText} numberOfLines={1} ellipsizeMode="tail">
                {userData?.points} P
              </Text>
            </TouchableOpacity>
            
            {/* Bilgi Butonu */}
            {/* <TouchableOpacity 
              style={styles.infoButton}
              onPress={togglePointsInfo}
            >
              <Ionicons name="information-circle" size={20} color="#fff" />
            </TouchableOpacity> */}
          </View>
          
          <Text style={styles.userName}>{userData?.name || 'Loading...'}</Text>
          <Text style={styles.userNickname}>@{userData?.username || 'Loading...'}</Text>
          
          <Text style={styles.memberSince}>
            Member since {userData?.createdAt?.toDate().toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            }) || 'Loading...'}
          </Text>

          <View style={styles.statsContainer}>
            <TouchableOpacity 
              style={styles.statItem} 
              onPress={() => handleTabPress('reported')}
            >
              <Text style={styles.statNumber}>{reportedItems?.length || 0}</Text>
              <Text style={styles.statLabel}>Reported</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity 
              style={styles.statItem} 
              onPress={() => handleTabPress('cleaned')}
            >
              <Text style={styles.statNumber}>{userData?.cleaned || 0}</Text>
              <Text style={styles.statLabel}>Cleaned</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity 
              style={styles.statItem} 
              onPress={() => handleTabPress('post')}
            >
              <Text style={styles.statNumber}>{userPosts?.length || 0}</Text>
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
                      pathname: '/(tabs)/TrashDetailPage',
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
                      <Text style={styles.postTitle}>REPORTED</Text>
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
        </View>
      </ScrollView>

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
                  <Text style={styles.pointsInfoTitle}>Puan Sistemi</Text>
                  <TouchableOpacity onPress={() => setPointsInfoVisible(false)}>
                    <Ionicons name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.pointsInfoContent}>
                  <Text style={styles.pointsInfoText}>
                    GreenWorld puanları, çevre bilinci ve katkılarınızı gösteren bir değerdir. 
                    Puanlarınızı şu şekilde artırabilirsiniz:
                  </Text>
                  
                  <View style={styles.pointsInfoItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#4B9363" />
                    <Text style={styles.pointsInfoItemText}>Atık bildirimleri yapmak: +10 puan</Text>
                  </View>
                  
                  <View style={styles.pointsInfoItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#4B9363" />
                    <Text style={styles.pointsInfoItemText}>Atık temizlemek: +20 puan</Text>
                  </View>
                  
                  <View style={styles.pointsInfoItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#4B9363" />
                    <Text style={styles.pointsInfoItemText}>Post paylaşmak: +5 puan</Text>
                  </View>
                  
                  <View style={styles.pointsInfoItem}>
                    <Ionicons name="checkmark-circle" size={20} color="#4B9363" />
                    <Text style={styles.pointsInfoItemText}>Aktif olarak uygulamayı kullanmak: +1 puan/gün</Text>
                  </View>
                  
                  <Text style={styles.pointsInfoText}>
                    Daha yüksek puanlar elde ederek çeşitli ödüller kazanabilir ve topluluk içinde daha fazla tanınırlık elde edebilirsiniz.
                  </Text>
                </View>
                
                <TouchableOpacity 
                  style={styles.pointsInfoButton}
                  onPress={() => setPointsInfoVisible(false)}
                >
                  <Text style={styles.pointsInfoButtonText}>Anladım</Text>
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
    paddingTop: 24,
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
    marginBottom: 16,
    alignItems: 'center', // Profil fotoğrafını ortala
  },
  profileImage: {
    width: 100,
    height: 100,
    borderColor: '#D9D9D9',
    borderWidth: 2,
    borderRadius: 60,
  },
  pointsBadge: {
    position: 'absolute',
    bottom: 0, // Profil fotoğrafının altında
    right: -18, // Sağa taşı, profil fotoğrafından taşmayacak şekilde
    backgroundColor: '#4B9363',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 50, // Minimum genişlik ayarla
    maxWidth: 100, // Maximum genişlik sınırla
    // elevation: 3,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 2 },
    // shadowOpacity: 0.2,
    // shadowRadius: 3,
  },
  pointsBadgeText: {
    color: 'white',
    fontSize: 14, // Biraz küçült
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
    marginBottom: 16, // Nickname ile member since arası
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
    marginTop: 8,
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
    marginTop: 8,
  },
  pointsInfoButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
