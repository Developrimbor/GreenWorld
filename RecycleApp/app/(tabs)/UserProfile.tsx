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
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import BottomNavigation from '../../components/BottomNavigation';
import { auth, db } from '../config/firebase';
import { collection, query, where, orderBy, doc, getDoc, getDocs } from 'firebase/firestore';

export default function UserProfile() {
  // Tab tipleri için type tanımı
  type TabType = 'reported' | 'cleaned' | 'post';

  const { userId } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('reported');
  const [userData, setUserData] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [reportedItems, setReportedItems] = useState<any[]>([]);
  const [cleanedItems, setCleanedItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Animasyon değeri
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Slider animasyonu için fonksiyon
  const animateSlider = (position: number) => {
    Animated.spring(slideAnim, {
      toValue: position,
      useNativeDriver: true,
    }).start();
  };

  // Tab seçme işlevi
  const handleTabPress = (tab: TabType) => {
    setActiveTab(tab);
    animateSlider(tab === 'reported' ? 0 : tab === 'cleaned' ? 120 : 240);
  };

  // Kullanıcı verilerini fetch etme
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        if (!userId) {
          console.error('No userId provided');
          router.back();
          return;
        }
        
        // Kullanıcı bilgilerini getir
        const userDoc = await getDoc(doc(db, 'users', userId as string));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          console.log('User data retrieved:', userData);
          setUserData(userData);
        } else {
          console.error('User not found');
          router.back();
          return;
        }
        
        // Kullanıcının postlarını getir
        await fetchUserPosts();
        
        // Reported items'ları getir
        await fetchReportedItems();
        
        // Cleaned items'ları getir
        await fetchCleanedItems();
        
        setIsLoading(false);
      } catch (error) {
        console.error('Error fetching user data:', error);
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId]);

  // Kullanıcının postlarını getir
  const fetchUserPosts = async () => {
    try {
      if (!userId) return;
      
      const postsRef = collection(db, 'posts');
      const q = query(
        postsRef,
        where('authorId', '==', userId)
      );
      const querySnapshot = await getDocs(q);
      const posts = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Fetched posts:', posts.length);
      setUserPosts(posts);
    } catch (error) {
      console.error('Error fetching user posts:', error);
    }
  };

  // Reported items'ları getir
  const fetchReportedItems = async () => {
    try {
      if (!userId) return;
      
      const reportsRef = collection(db, 'trashReports');
      const q = query(
        reportsRef,
        where('authorId', '==', userId),
        where('status', '==', 'reported')
      );
      const querySnapshot = await getDocs(q);
      const reports = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Fetched reported items:', reports.length);
      setReportedItems(reports);
    } catch (error) {
      console.error('Error fetching reported items:', error);
    }
  };

  // Cleaned items'ları getir
  const fetchCleanedItems = async () => {
    try {
      if (!userId) return;
      
      // trashReports koleksiyonundan kullanıcının temizlediği atıkları getir
      const cleanedTrashReportsRef = collection(db, 'trashReports');
      const cleanedTrashQuery = query(
        cleanedTrashReportsRef,
        where('cleanedBy', '==', userId),
        where('status', '==', 'cleaned')
      );
      const cleanedTrashSnapshot = await getDocs(cleanedTrashQuery);
      const cleanedTrashReports = cleanedTrashSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'trashReports'
      }));
      
      // cleanedReports koleksiyonundan kullanıcının temizlediği atıkları getir
      const cleanedReportsRef = collection(db, 'cleanedReports');
      const cleanedReportsQuery = query(
        cleanedReportsRef,
        where('cleanedBy', '==', userId)
      );
      const cleanedReportsSnapshot = await getDocs(cleanedReportsQuery);
      const cleanedReports = cleanedReportsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        source: 'cleanedReports'
      }));
      
      // İki koleksiyondan gelen verileri birleştir - ID'ler çakışabileceği için dikkatli ol
      const allCleanedItems = [...cleanedTrashReports];
      
      // cleanedReports'tan gelen öğeleri ekle, ancak aynı ID'ye sahip olanları dahil etme
      cleanedReports.forEach(report => {
        if (!allCleanedItems.some(item => item.id === report.id)) {
          allCleanedItems.push(report);
        }
      });
      
      console.log('Fetched all cleaned items:', allCleanedItems.length);
      setCleanedItems(allCleanedItems);
    } catch (error) {
      console.error('Error fetching cleaned items:', error);
    }
  };

  // Yükleme durumunda gösterilecek ekran
  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="chevron-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>USER PROFILE</Text>
          <View style={{width: 40}} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B9363" />
          <Text style={styles.loadingText}>Yükleniyor...</Text>
        </View>
        <BottomNavigation />
      </SafeAreaView>
    );
  }

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
        <Text style={styles.headerTitle}>USER PROFILE</Text>
        <View style={{width: 40}} />
      </View>

      {/* Main Content Container */}
      <ScrollView style={styles.mainContainer}>
        {/* Profile Content */}
        <View style={styles.profileContent}>
          {/* Profile Image ve Puan */}
          <View style={styles.profileImageContainer}>
            {userData?.photoURL ? (
              <Image
                source={{ uri: userData.photoURL }}
                style={styles.profileImage}
              />
            ) : userData?.profilePicture ? (
              <Image
                source={{ uri: userData.profilePicture }}
                style={styles.profileImage}
              />
            ) : (
              <View style={[styles.profileImage, styles.defaultProfileImage]}>
                <Ionicons name="person" size={50} color="#4B9363" />
              </View>
            )}
          </View>
          
          <Text style={styles.userName}>{userData?.name || 'User'}</Text>
          <Text style={styles.userNickname}>@{userData?.username || 'username'}</Text>
          
          {/* Puan Göstergesi - Kullanıcı adından sonra yerleştirildi */}
          <View style={styles.pointsBadgeStandalone}>
            <Text style={styles.pointsBadgeText} numberOfLines={1} ellipsizeMode="tail">
              {userData?.points || 0} P
            </Text>
            <Ionicons name="leaf" size={12} color="#fff" style={{marginLeft: 4}} />
          </View>

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
              <Text style={styles.statNumber}>{cleanedItems?.length || 0}</Text>
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
                    {item.imageUrls && item.imageUrls.length > 0 ? (
                      <Image
                        source={{ uri: item.imageUrls[0] }}
                        style={styles.postImage}
                      />
                    ) : (
                      <View style={[styles.postImage, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
                        <Ionicons name="image-outline" size={30} color="#ccc" />
                      </View>
                    )}
                    <View style={styles.postInfo}>
                      <Text style={styles.reportedTitle}>REPORTED</Text>
                      <View style={styles.locationContainer}>
                        <Ionicons name="location-outline" size={16} color="#666" />
                        <Text style={styles.postLocation}>
                          {item.location ? `${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}` : 'No Location'}
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
                      pathname: '/(tabs)/TrashDetailPage',
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
                      <View style={[styles.postImage, { backgroundColor: '#f0f0f0', justifyContent: 'center', alignItems: 'center' }]}>
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

      <BottomNavigation />
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 16,
    alignItems: 'center',
  },
  profileImage: {
    width: 100,
    height: 100,
    borderColor: '#D9D9D9',
    borderWidth: 2,
    borderRadius: 60,
  },
  defaultProfileImage: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
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
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userNickname: {
    fontSize: 16,
    color: '#666',
    marginBottom: 16,
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
    marginBottom: 4,
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
    marginHorizontal: 16,
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
    flex: 1,
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
    minHeight: 100,
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
  reportedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FF0000',
    marginBottom: 4,
  },
  cleanedTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B9363',
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
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
}); 