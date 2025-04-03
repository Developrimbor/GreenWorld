import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import BottomNavigation from '../../components/BottomNavigation';
import { LinearGradient } from 'expo-linear-gradient';

type PostType = {
  id: string;
  image: any;
  title: string;
  author: string;
  location: string;
  date: string;
};

const DUMMY_POSTS: PostType[] = [
  {
    id: '1',
    image: require('../../assets/images/plastic-waste.jpg'),
    title: 'Plastik Atıkların Geri Dönüşümü',
    author: 'Fahri Coşkun',
    location: 'Sakarya, Türkiye',
    date: '10/03/2024',
  },
  {
    id: '2',
    image: require('../../assets/images/plastic-waste.jpg'),
    title: 'Plastik Atıkların Geri Dönüşümü',
    author: 'Fahri Coşkun',
    location: 'Sakarya, Türkiye',
    date: '10/03/2024',
  },
  {
    id: '3',
    image: require('../../assets/images/plastic-waste.jpg'),
    title: 'Plastik Atıkların Geri Dönüşümü',
    author: 'Fahri Coşkun',
    location: 'Sakarya, Türkiye',
    date: '10/03/2024',
  },
];

export default function HomePage() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>USER'S POST</Text>
      </View>

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search"
            placeholderTextColor="#666"
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="filter" size={20} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {DUMMY_POSTS.map((post) => (
          <TouchableOpacity 
            key={post.id} 
            style={styles.postCard}
            onPress={() => router.push('/(tabs)/PostDetail')}
          >
            <View style={styles.imageContainer}>
              <Image source={post.image} style={styles.postImage} />
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
        ))}
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
    padding: 16,
    alignItems: 'center',
    gap: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 8,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  filterButton: {
    padding: 8,
  },
  content: {
    flex: 1,
    padding: 16,
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
    height: 200,
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
    fontSize: 16,
    fontWeight: '600',
    padding: 12,
    paddingBottom: 8,
  },
  authorName: {
    fontSize: 14,
    color: '#666',
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
}); 