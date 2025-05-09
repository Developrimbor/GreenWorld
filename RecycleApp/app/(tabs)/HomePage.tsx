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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import BottomNavigation from '../../components/BottomNavigation';
import { LinearGradient } from 'expo-linear-gradient';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../config/firebase';

type PostType = {
  id: string;
  imageUrl: string;
  title: string;
  author: string;
  location: string;
  date: string;
  createdAt: any;
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
      
      const fetchedPosts = querySnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          date: new Date(data.createdAt?.toDate()).toLocaleDateString(),
          createdAt: data.createdAt?.toDate() || new Date(),
        };
      }) as PostType[];

      // Mevcut tüm konumları topla
      const locations = [...new Set(fetchedPosts.map(post => post.location))];
      setAvailableLocations(locations);
      
      setPosts(fetchedPosts);
      setFilteredPosts(fetchedPosts);
    } catch (error) {
      console.error('Error fetching posts:', error);
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>GREEN WORLD</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
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
          <Ionicons name="filter" size={24} color="#000" />
        </TouchableOpacity>
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
          <Text style={styles.loadingText}>İçerikler yükleniyor...</Text>
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
                <View style={styles.imageContainer}>
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
                        <Text style={styles.dateText}>{post.date}</Text>
                      </View>
                      <View style={styles.locationContainer}>
                        <Ionicons name="location" size={16} color="#EDEDED" />
                        <Text style={styles.locationText}>{post.location}</Text>
                      </View>
                    </View>
                  </LinearGradient>
                  <TouchableOpacity style={styles.bookmarkButton}>
                    <Ionicons name="bookmark-outline" size={24} color="#fff" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.postTitle}>{post.title}</Text>
                <Text style={styles.authorName}>{post.author}</Text>
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

      <TouchableOpacity 
        style={styles.fabButton}
        onPress={() => router.push({
          pathname: '/CreatePost',
          params: { modal: 'true' }
        })}
      >
        <Ionicons name="add" size={30} color="#fff" />
      </TouchableOpacity>

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
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 8,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
    borderRadius: 24,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 12,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  optionsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  postCard: {
    marginBottom: 16,
    borderRadius: 12,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  imageContainer: {
    position: 'relative',
  },
  postImage: {
    width: '100%',
    height: 160,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '50%',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
  },
  imageInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    color: '#EDEDED',
    fontSize: 12,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    color: '#EDEDED',
    fontSize: 12,
  },
  bookmarkButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 20,
    padding: 8,
  },
  postTitle: {
    fontSize: 15,
    fontWeight: '600',
    padding: 10,
    paddingBottom: 6,
  },
  authorName: {
    fontSize: 13,
    color: '#666',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  fabButton: {
    position: 'absolute',
    right: 20,
    bottom: 80, // Positioned above BottomNavigation
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4B9363',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
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
  },
  noResultsSubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
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
  },
});