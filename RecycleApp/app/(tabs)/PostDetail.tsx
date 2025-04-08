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
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import BottomNavigation from '../../components/BottomNavigation';
import { LinearGradient } from 'expo-linear-gradient';

type PostType = {
  id: string;
  title: string;
  content: string;
  location: string;
  imageUrl: string;
  author: string;
  date: string;
};

export default function PostDetail() {
  const { id } = useLocalSearchParams();
  const [post, setPost] = useState<PostType | null>(null);
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        console.log('Fetching post with ID:', id); // Debug için
        const postDoc = await getDoc(doc(db, 'posts', id as string));
        if (postDoc.exists()) {
          const postData = postDoc.data();
          console.log('Post data:', postData); // Debug için
          setPost({
            id: postDoc.id,
            title: postData.title || '',
            content: postData.content || '',
            location: postData.location || '',
            imageUrl: postData.imageUrl || '',
            author: postData.author || 'Anonim',
            date: postData.createdAt ? new Date(postData.createdAt.toDate()).toLocaleDateString() : new Date().toLocaleDateString(),
          });
        } else {
          console.log('Post not found'); // Debug için
          router.back(); // Post bulunamazsa geri dön
        }
      } catch (error) {
        console.error('Error fetching post:', error);
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
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>USER'S POST</Text>
        <TouchableOpacity style={styles.alertButton}>
          <Ionicons name="alert-circle-outline" size={24} color="#000" />
        </TouchableOpacity>
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
          onPress={() => router.push('/(tabs)/UserProfile')}
        >
          <Image
            source={require('../../assets/images/profile.jpg')}
            style={styles.authorImage}
          />
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

      <BottomNavigation />
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
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
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    zIndex: 1,
    marginTop: 16,
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins-Medium',
  },
  contentScrollView: {
    flex: 1,
  },
  contentSection: {
    padding: 24,
    paddingTop: 8,
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
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    paddingTop: 16,
    paddingBottom: 16,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
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
});