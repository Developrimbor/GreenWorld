import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
  Modal,
  TouchableWithoutFeedback,
  FlatList,
  ActivityIndicator,
  Keyboard,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, getDocs, query, orderBy, getDoc, doc } from 'firebase/firestore';
import { db } from '../config/firebase';

type PostType = {
  id: string;
  imageUrl: string;
  title: string;
  author: string;
  location: string;
  date: string;
  createdAt: any;
  content?: string;
  tags?: string[];
  authorId?: string;
  authorImage?: string;
};

type FilterType = {
  location: string;
  dateRange: 'all' | 'today' | 'week' | 'month';
};

export default function HomePage() {
  const [posts, setPosts] = useState<PostType[]>([]);
  const [filteredPosts, setFilteredPosts] = useState<PostType[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setIsFilterModalVisible] = useState(false);
  const [filters, setFilters] = useState<FilterType>({
    location: '',
    dateRange: 'all',
  });
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);

  // Fetch posts from Firebase
  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const postsRef = collection(db, 'posts');
      const q = query(postsRef, orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      
      const fetchedPosts = await Promise.all(querySnapshot.docs.map(async (docSnap) => {
        const data = docSnap.data();
        
        // Yazarın profil fotoğrafını al - PostDetail sayfasındaki yaklaşımı uygulayalım
        let authorImage = '';
        if (data.authorId) {
          try {
            const userDoc = await getDoc(doc(db, 'users', data.authorId));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              // Profil fotoğrafı için photoURL veya profilePicture alanını kontrol et
              authorImage = userData.photoURL || userData.profilePicture || '';
            }
          } catch (error) {
            // Hata durumunu sessizce ele al
          }
        }
        
        return {
          id: docSnap.id,
          ...data,
          date: new Date(data.createdAt?.toDate()).toLocaleDateString(),
          createdAt: data.createdAt?.toDate() || new Date(),
          authorImage: authorImage,
        };
      })) as PostType[];

      // Mevcut tüm konumları topla
      const locations = [...new Set(fetchedPosts.map(post => post.location))];
      setAvailableLocations(locations);
      
      setPosts(fetchedPosts);
      setFilteredPosts(fetchedPosts);
    } catch (error) {
      // Hata durumunu sessizce ele al
    } finally {
      setIsLoading(false);
    }
  };

  // Handle search
  useEffect(() => {
    if (searchQuery.trim() === '') {
      applyFilters(posts); // Sadece filtreleri uygula
      return;
    }

    const lowerCaseQuery = searchQuery.toLowerCase();
    const searchResults = posts.filter(post => 
      post.title.toLowerCase().includes(lowerCaseQuery) || 
      post.author.toLowerCase().includes(lowerCaseQuery)
    );
    
    applyFilters(searchResults); // Arama sonuçlarına filtreleri uygula
  }, [searchQuery, posts, filters]);

  // Apply filters to posts
  const applyFilters = (postsToFilter: PostType[]) => {
    let result = [...postsToFilter];
    
    // Konum filtresi
    if (filters.location) {
      result = result.filter(post => post.location === filters.location);
    }
    
    // Tarih filtresi
    if (filters.dateRange !== 'all') {
      const now = new Date();
      let compareDate = new Date();
      
      switch (filters.dateRange) {
        case 'today':
          compareDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          compareDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          compareDate.setMonth(now.getMonth() - 1);
          break;
      }
      
      result = result.filter(post => {
        const postDate = post.createdAt;
        return postDate >= compareDate;
      });
    }
    
    setFilteredPosts(result);
  };

  // Apply filter and close modal
  const applyAndCloseFilter = () => {
    applyFilters(posts.filter(post => 
      post.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
      post.author.toLowerCase().includes(searchQuery.toLowerCase())
    ));
    setIsFilterModalVisible(false);
  };

  // Reset filters
  const resetFilters = () => {
    setFilters({
      location: '',
      dateRange: 'all',
    });
    setIsFilterModalVisible(false);
  };

  // Klavye olaylarını dinle
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GREEN WORLD</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#4B9363" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity 
          style={styles.optionsButton}
          onPress={() => setIsFilterModalVisible(true)}
        >
          <Ionicons name="filter" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      {/* Collapse Info Box */}
      <View style={styles.collapseContainer}>
        <TouchableOpacity style={styles.collapseHeader} onPress={() => setRulesOpen(!rulesOpen)} activeOpacity={0.8}>
          <Text style={styles.collapseTitle}>Please read before sharing!</Text>
          <Ionicons name={rulesOpen ? 'chevron-up' : 'chevron-down'} size={22} color="#4B9363" />
        </TouchableOpacity>
        {rulesOpen && (
          <View style={styles.collapseContent}>
            <Text style={styles.collapseText}>
              Please share content that is real, current and contributes to the environment. Photos should be clear and descriptions should be informative.
            </Text>
          </View>
        )}
      </View>

      {/* Filtreleme Modal */}
      <Modal
        transparent={true}
        visible={isFilterModalVisible}
        animationType="fade"
        onRequestClose={() => setIsFilterModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setIsFilterModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.filterModal}>
                <View style={styles.filterHeader}>
                  <Text style={styles.filterTitle}>Filtrele</Text>
                  <TouchableOpacity onPress={() => setIsFilterModalVisible(false)}>
                    <Ionicons name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>

                {/* Konum Filtresi */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Konum</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.locationChipsContainer}
                  >
                    <TouchableOpacity 
                      style={[
                        styles.locationChip, 
                        filters.location === '' && styles.activeLocationChip
                      ]}
                      onPress={() => setFilters({...filters, location: ''})}
                    >
                      <Text style={[
                        styles.locationChipText,
                        filters.location === '' && styles.activeLocationChipText
                      ]}>Tümü</Text>
                    </TouchableOpacity>
                    
                    {availableLocations.map((location, index) => (
                      <TouchableOpacity 
                        key={index}
                        style={[
                          styles.locationChip, 
                          filters.location === location && styles.activeLocationChip
                        ]}
                        onPress={() => setFilters({...filters, location})}
                      >
                        <Text style={[
                          styles.locationChipText,
                          filters.location === location && styles.activeLocationChipText
                        ]}>{location}</Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>

                {/* Tarih Filtresi */}
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>Tarih</Text>
                  <View style={styles.dateFilterOptions}>
                    <TouchableOpacity 
                      style={[
                        styles.dateFilterOption, 
                        filters.dateRange === 'all' && styles.activeDateFilterOption
                      ]}
                      onPress={() => setFilters({...filters, dateRange: 'all'})}
                    >
                      <Text style={[
                        styles.dateFilterText,
                        filters.dateRange === 'all' && styles.activeDateFilterText
                      ]}>Tümü</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.dateFilterOption, 
                        filters.dateRange === 'today' && styles.activeDateFilterOption
                      ]}
                      onPress={() => setFilters({...filters, dateRange: 'today'})}
                    >
                      <Text style={[
                        styles.dateFilterText,
                        filters.dateRange === 'today' && styles.activeDateFilterText
                      ]}>Bugün</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.dateFilterOption, 
                        filters.dateRange === 'week' && styles.activeDateFilterOption
                      ]}
                      onPress={() => setFilters({...filters, dateRange: 'week'})}
                    >
                      <Text style={[
                        styles.dateFilterText,
                        filters.dateRange === 'week' && styles.activeDateFilterText
                      ]}>Bu Hafta</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={[
                        styles.dateFilterOption, 
                        filters.dateRange === 'month' && styles.activeDateFilterOption
                      ]}
                      onPress={() => setFilters({...filters, dateRange: 'month'})}
                    >
                      <Text style={[
                        styles.dateFilterText,
                        filters.dateRange === 'month' && styles.activeDateFilterText
                      ]}>Bu Ay</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Butonlar */}
                <View style={styles.filterActions}>
                  <TouchableOpacity 
                    style={styles.resetButton}
                    onPress={resetFilters}
                  >
                    <Text style={styles.resetButtonText}>Sıfırla</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.applyButton}
                    onPress={applyAndCloseFilter}
                  >
                    <Text style={styles.applyButtonText}>Uygula</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B9363" />
          {/* <Text style={styles.loadingText}>İçerikler yükleniyor...</Text> */}
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <TouchableOpacity 
                key={post.id} 
                style={styles.postCard}
                onPress={() => router.push({
                  pathname: '/(tabs)/PostDetail',
                  params: { id: post.id }
                })}
              >
                <View style={styles.horizontalCard}>
                  <View style={styles.imageContainer}>
                    <Image 
                      source={{ uri: post.imageUrl }}
                      style={styles.cardImage} 
                    />
                    <LinearGradient
                      colors={['rgba(0,0,0,1)', 'transparent']}
                      style={styles.imageGradient}
                      start={{ x: 0, y: 1 }}
                      end={{ x: 0, y: 0.1 }}
                    >
                      <View style={styles.imageDateContainer}>
                        <Ionicons name="calendar-outline" size={14} color="#EDEDED" />
                        <Text style={styles.imageDateText}>{post.date}</Text>
                      </View>
                    </LinearGradient>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={2} ellipsizeMode="tail">{post.title}</Text>
                    {post.content && (
                      <Text style={styles.cardDescription} numberOfLines={2}>
                        {post.content}
                      </Text>
                    )}
                    <View style={styles.authorContainer}>
                      {post.authorImage ? (
                        <Image 
                          source={{ uri: post.authorImage }} 
                          style={styles.authorImage} 
                        />
                      ) : (
                        <View style={[styles.authorImage, styles.defaultAuthorImage]}>
                          <Ionicons name="person" size={16} color="#4B9363" />
                        </View>
                      )}
                      <Text style={styles.authorName}>{post.author}</Text>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noResultsContainer}>
              <Ionicons name="search-outline" size={48} color="#ccc" />
              <Text style={styles.noResultsText}>Sonuç bulunamadı</Text>
              <Text style={styles.noResultsSubtext}>Farklı arama terimi veya filtre deneyin</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* FAB Button - Klavye açıkken gizle */}
      {!isKeyboardVisible && (
        <TouchableOpacity 
          style={styles.fabButton}
          onPress={() => router.push({
            pathname: '/CreatePost',
            params: { modal: 'true' }
          })}
        >
          <Ionicons name="add" size={30} color="#fff" />
        </TouchableOpacity>
      )}
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
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    color: '#333',
  },
  optionsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4B9363',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  content: {
    flex: 1,
    // paddingVertical: 4,
    paddingHorizontal: 24,
  },
  postCard: {
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    paddingHorizontal: 10,
    height: 120,
  },
  horizontalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 6,
    // marginVertical: 12,
    position: 'relative',
    overflow: 'hidden',
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 6,
  },
  imageGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    justifyContent: 'flex-end',
    padding: 6,
  },
  imageDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageDateText: {
    color: '#EDEDED',
    fontSize: 10,
    marginLeft: 6,
    fontFamily: 'Poppins-Regular',
  },
  cardContent: {
    flex: 1,
    marginLeft: 10,
    justifyContent: 'space-between',
    height: '100%',
    paddingVertical: 10,
  },
  cardTitle: {
    fontSize: 14,
    // fontWeight: 'bold',
    fontFamily: 'Poppins-Medium',
    color: '#000',
    // marginBottom: 2,
    includeFontPadding: false,
    lineHeight: 16,
  },
  cardDescription: {
    fontSize: 11,
    color: '#696969',
    marginBottom: 4,
    fontFamily: 'Poppins-Regular',
    lineHeight: 14,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    // marginBottom: 2,
  },
  authorImage: {
    width: 28,
    height: 28,
    borderRadius: 14,
    marginRight: 8,
  },
  defaultAuthorImage: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  authorName: {
    fontSize: 12,
    color: '#333',
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'nowrap',
    overflow: 'hidden',
    maxWidth: '100%',
  },
  tagChip: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 4,
    marginRight: 4,
    maxHeight: 20,
    maxWidth: 100,
  },
  tagText: {
    fontSize: 12,
    color: '#4B9363',
    fontFamily: 'Poppins-Regular',
  },
  cardMetaContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  cardMetaText: {
    fontSize: 11,
    color: '#696969',
    marginLeft: 4,
    fontFamily: 'Poppins-Regular',
  },
  fabButton: {
    position: 'absolute',
    right: 24,
    bottom: 96, // Positioned above BottomNavigation
    width: 52,
    height: 52,
    borderRadius: 8,
    backgroundColor: '#4B9363',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 10,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 1,
  },
  // Modal Stilleri
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModal: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  filterSection: {
    marginBottom: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  locationChipsContainer: {
    paddingBottom: 8,
    paddingRight: 20,
  },
  locationChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
  },
  activeLocationChip: {
    backgroundColor: '#4B9363',
  },
  locationChipText: {
    color: '#333',
  },
  activeLocationChipText: {
    color: 'white',
  },
  dateFilterOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dateFilterOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    marginRight: 8,
    marginBottom: 8,
  },
  activeDateFilterOption: {
    backgroundColor: '#4B9363',
  },
  dateFilterText: {
    color: '#333',
  },
  activeDateFilterText: {
    color: 'white',
  },
  filterActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: 10,
  },
  resetButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    marginRight: 10,
  },
  resetButtonText: {
    color: '#666',
    fontWeight: '500',
  },
  applyButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#4B9363',
    borderRadius: 8,
  },
  applyButtonText: {
    color: 'white',
    fontWeight: '500',
  },
  noResultsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  noResultsText: {
    fontSize: 18,
    color: '#666',
    marginTop: 16,
    fontWeight: '500',
    fontFamily: 'Poppins-Medium',
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    fontFamily: 'Poppins-Regular',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
    fontFamily: 'Poppins-Regular',
  },
  collapseContainer: {
    backgroundColor: '#E8F5E9',
    borderRadius: 12,
    marginHorizontal: 24,
    marginBottom: 10,
    marginTop: 0,
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
    marginTop: 8,
    paddingBottom: 4,
  },
  collapseText: {
    fontSize: 12,
    color: '#333',
    lineHeight: 18,
  },
});