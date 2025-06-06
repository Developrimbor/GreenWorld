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
import * as Location from 'expo-location';

export default function UserProfile() {
  // Tab tipleri için type tanımı
  type TabType = 'reported' | 'cleaned' | 'post';

  const { userId } = useLocalSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('reported');
  const [userData, setUserData] = useState<any>(null);
  const [userPosts, setUserPosts] = useState<any[]>([]);
  const [reportedItems, setReportedItems] = useState<any[]>([]);
  const [cleanedItems, setCleanedItems] = useState<any[]>([]);
  const [reportedCount, setReportedCount] = useState(0);
  const [cleanedCount, setCleanedCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  
  // Animasyon değeri
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Adresleri saklamak için state
  const [reportedAddresses, setReportedAddresses] = useState<{[id: string]: string}>({});
  const [cleanedAddresses, setCleanedAddresses] = useState<{[id: string]: string}>({});

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

  // Adresleri çekmek için yardımcı fonksiyon
  const fetchAddress = async (latitude: number, longitude: number) => {
    try {
      const res = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (res && res.length > 0) {
        const loc = res[0];
        let address = '';
        if (loc.city) address += loc.city + ', ';
        if (loc.region) address += loc.region + ', ';
        if (loc.country) address += loc.country;
        return address.trim().replace(/, $/, '');
      }
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    } catch {
      return `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
    }
  };

  // Kullanıcı verilerini fetch etme
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setIsLoading(true);
        if (!userId) {
          router.back();
          return;
        }
        
        // Kullanıcı bilgilerini getir
        const userDoc = await getDoc(doc(db, 'users', userId as string));
        if (userDoc.exists()) {
          setUserData(userDoc.data());
        } else {
          router.back();
          return;
        }
        
        // Tüm verileri paralel olarak getir
        const [reportsSnapshot, cleanedTrashSnapshot, cleanedReportsSnapshot, postsSnapshot] = await Promise.all([
          // Reported items (bildirilen atıklar)
          getDocs(query(
            collection(db, 'trashReports'),
            where('authorId', '==', userId)
          )),
          
          // Cleaned items - trashReports koleksiyonundan
          getDocs(query(
            collection(db, 'trashReports'),
            where('cleanedBy', '==', userId),
            where('status', '==', 'cleaned')
          )),
          
          // Cleaned items - cleanedReports koleksiyonundan
          getDocs(query(
            collection(db, 'cleanedReports'),
            where('cleanedBy', '==', userId)
          )),
          
          // Posts
          getDocs(query(
            collection(db, 'posts'),
            where('authorId', '==', userId)
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
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, [userId, router]);

  // Reported ve Cleaned için adresleri yükle
  useEffect(() => {
    const loadAddresses = async () => {
      const reported: {[id: string]: string} = {};
      for (const item of reportedItems) {
        if (item.location && item.location.latitude && item.location.longitude) {
          reported[item.id] = await fetchAddress(item.location.latitude, item.location.longitude);
        }
      }
      setReportedAddresses(reported);
      const cleaned: {[id: string]: string} = {};
      for (const item of cleanedItems) {
        if (item.location && item.location.latitude && item.location.longitude) {
          cleaned[item.id] = await fetchAddress(item.location.latitude, item.location.longitude);
        }
      }
      setCleanedAddresses(cleaned);
    };
    loadAddresses();
  }, [reportedItems, cleanedItems]);

   // Kategori label ve ikonları (TrashDetailPage'den kopya)
   const wasteTypeLabels: { [key: number]: string } = {
    1: 'Plastic', 2: 'Paper', 3: 'Glass', 4: 'Organic', 5: 'Cigarette', 6: 'Mask', 7: 'Cardboard', 8: 'E-Waste', 9: 'Textile', 10: 'Fishing Nets', 11: 'Construction', 12: 'Battery', 13: 'Biomedical', 14: 'Dead Animals', 15: 'Furniture', 16: 'Garden', 17: 'Home Appliances', 18: 'Metal', 19: 'Tire', 20: 'Toxic',
  };
  const wasteTypeIcons: { [key: number]: any } = {
    1: require('../../components/ui/IconifyPlastic').default,
    2: require('../../components/ui/IconifyPaper').default,
    3: require('../../components/ui/IconifyGlass').default,
    4: require('../../components/ui/IconifyFood').default,
    5: require('../../components/ui/IconifyCigarette').default,
    6: require('../../components/ui/IconifyMask').default,
    7: require('../../components/ui/IconifyPackage').default,
    8: require('../../components/ui/IconifyEWaste').default,
    9: require('../../components/ui/IconifyClothes').default,
    10: require('../../components/ui/IconifyFishingNets').default,
    11: require('../../components/ui/IconifyConstruction').default,
    12: require('../../components/ui/IconifyBattery').default,
    13: require('../../components/ui/IconifyBiomedical').default,
    14: require('../../components/ui/IconifyDeadAnimals').default,
    15: require('../../components/ui/IconifyFurniture').default,
    16: require('../../components/ui/IconifyGarden').default,
    17: require('../../components/ui/IconifyHomeAppliances').default,
    18: require('../../components/ui/IconifyMetal').default,
    19: require('../../components/ui/IconifyTire').default,
    20: require('../../components/ui/IconifyToxic').default,
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
                      <Text style={styles.postTitle} numberOfLines={2} ellipsizeMode="tail">{post.title || 'No Title'}</Text>
                      
                      {/* Etiketler */}
                      {post.tags && post.tags.length > 0 && (
                        <View style={styles.tagsContainer}>
                          <ScrollView 
                            horizontal 
                            showsHorizontalScrollIndicator={false}
                            style={styles.tagScrollView}
                          >
                            {post.tags.map((tag: string, index: number) => (
                              <View key={index} style={styles.tagItem}>
                                <Text style={styles.tagText}>{tag}</Text>
                              </View>
                            ))}
                          </ScrollView>
                        </View>
                      )}

                      {/* Konum ve Tarih Bilgileri */}
                      <View style={styles.locationDateContainer}>
                        <View style={styles.dateContainer}>
                          <Ionicons name="calendar-outline" size={14} color="#4B9363" />
                          <Text style={styles.dateText}>
                            {post.createdAt ? new Date(post.createdAt.seconds * 1000).toLocaleDateString() : 'No Date'}
                          </Text>
                        </View>
                        <View style={styles.locationContainer}>
                          <Ionicons name="location-outline" size={14} color="#4B9363" />
                          <Text style={styles.locationText} numberOfLines={1}>
                            {post.location || 'No Location'}
                          </Text>
                        </View>
                      </View>
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
                reportedItems.map((item) => {
                  // Çoklu kategori desteği
                  let typeKeys: number[] = [];
                  if (typeof item.type === 'object' && item.type !== null && !Array.isArray(item.type)) {
                    typeKeys = Object.keys(item.type).map(Number);
                  } else if (Array.isArray(item.type)) {
                    typeKeys = item.type.map(Number);
                  } else {
                    typeKeys = [Number(item.type)];
                  }
                  return (
                    <TouchableOpacity
                      key={item.id}
                      style={styles.postCard}
                      onPress={() => router.push({
                        pathname: item.status === 'cleaned' ? '/(tabs)/CleanedTrashPage' : '/(tabs)/TrashDetailPage',
                        params: { id: item.id }
                      })}
                    >
                      {item.imageUrls && item.imageUrls.length > 0 ? (
                        <Image
                          source={{ uri: item.imageUrls[0] }}
                          style={styles.postImage}
                        />
                      ) : (
                        <View style={[styles.postImage, styles.defaultPostImage]}>
                          <Ionicons name="image-outline" size={30} color="#ccc" />
                        </View>
                      )}
                      <View style={styles.postInfo}>
                        {/* 1. REPORTED başlığı */}
                        <Text style={styles.reportedTitle}>REPORTED</Text>
                        {/* 2. Kategori ikonları ve isimleri */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
                          {typeKeys.map((typeKey) => {
                            const Icon = wasteTypeIcons[typeKey];
                            return Icon ? (
                              <View key={typeKey} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 8 }}>
                                <Icon width={22} height={22} color="#4B9363" style={{ marginRight: 4 }} />
                                <Text style={{ fontSize: 14, color: '#4B9363', fontWeight: 'bold', marginRight: 8 }}>{wasteTypeLabels[typeKey] || 'Unknown'}</Text>
                              </View>
                            ) : null;
                          })}
                        </View>
                        {/* 3. Tarih ve konum bilgisi (ikonlu) */}
                        <View style={styles.locationDateContainer}>
                          <View style={styles.dateContainer}>
                            <Ionicons name="calendar-outline" size={14} color="#4B9363" />
                            <Text style={styles.dateText}>
                              {item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'No Date'}
                            </Text>
                          </View>
                          <View style={styles.locationContainer}>
                            <Ionicons name="location-outline" size={14} color="#4B9363" />
                            <Text style={styles.locationText} numberOfLines={1}>
                              {reportedAddresses[item.id] || (item.location ? `${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}` : 'No Location')}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <Text style={styles.noPostsText}>No reported items found</Text>
              )}
            </View>
          )}
          {activeTab === 'cleaned' && (
            <View style={styles.postsContainer}>
              {cleanedItems && cleanedItems.length > 0 ? (
                cleanedItems.map((item) => {
                  // Çoklu kategori desteği
                  let typeKeys: number[] = [];
                  if (typeof item.type === 'object' && item.type !== null && !Array.isArray(item.type)) {
                    typeKeys = Object.keys(item.type).map(Number);
                  } else if (Array.isArray(item.type)) {
                    typeKeys = item.type.map(Number);
                  } else {
                    typeKeys = [Number(item.type)];
                  }
                  return (
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
                        {/* 1. CLEANED başlığı */}
                        <Text style={styles.cleanedTitle}>CLEANED</Text>
                        {/* 2. Kategori ikonları */}
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
                          {typeKeys.map((typeKey) => {
                            const Icon = wasteTypeIcons[typeKey];
                            return Icon ? (
                              <View key={typeKey} style={{ flexDirection: 'row', alignItems: 'center' }}>
                                <Icon width={22} height={22} color="#4B9363" style={{}} />
                              </View>
                            ) : null;
                          })}
                        </View>
                        {/* 3. Tarih ve konum bilgisi (ikonlu) */}
                        <View style={styles.locationDateContainer}>
                          <View style={styles.dateContainer}>
                            <Ionicons name="calendar-outline" size={14} color="#4B9363" />
                            <Text style={styles.dateText}>
                              {item.cleanedAt ? new Date(item.cleanedAt.seconds * 1000).toLocaleDateString() :
                               item.createdAt ? new Date(item.createdAt.seconds * 1000).toLocaleDateString() : 'No Date'}
                            </Text>
                          </View>
                          <View style={styles.locationContainer}>
                            <Ionicons name="location-outline" size={14} color="#4B9363" />
                            <Text style={styles.locationText} numberOfLines={1}>
                              {cleanedAddresses[item.id] || (item.location ? `${item.location.latitude.toFixed(4)}, ${item.location.longitude.toFixed(4)}` : 'No Location')}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </TouchableOpacity>
                  );
                })
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
    width: 84,
    height: 84,
    borderRadius: 8,
    alignSelf: 'center',
  },
  postInfo: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  postTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
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
  defaultPostImage: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
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
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cleanedTag: {
    backgroundColor: '#4B9363',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 4,
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  tagsContainer: {
    marginVertical: 2,
  },
  tagScrollView: {
    flexGrow: 0,
  },
  tagItem: {
    backgroundColor: '#E8F3EB',
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 1,
    marginRight: 6,
  },
  tagText: {
    fontSize: 11,
    color: '#4B9363',
    fontFamily: 'Poppins-Regular',
  },
  locationDateContainer: {
    gap: 12,
    marginTop: 4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#696969',
    marginLeft: 4,
    flex: 1,
  },
  dateText: {
    fontSize: 11,
    fontFamily: 'Poppins-Regular',
    color: '#696969',
    marginLeft: 4,
  },
}); 