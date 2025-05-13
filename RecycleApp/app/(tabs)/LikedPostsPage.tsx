import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import BottomNavigation from '../../components/BottomNavigation';
import { auth, db } from '../config/firebase';
import { collection, query, where, getDocs, getDoc, doc } from 'firebase/firestore';

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
};

export default function LikedPostsPage() {
  const [likedPosts, setLikedPosts] = useState<PostType[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch liked posts from Firebase
  useEffect(() => {
    const fetchLikedPosts = async () => {
      try {
        setIsLoading(true);
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          router.push('/(auth)/login');
          return;
        }

        // Kullanıcı bilgilerini getir
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (!userDoc.exists()) {
          setIsLoading(false);
          return;
        }

        const userData = userDoc.data();
        const likedPostIds = userData.likedPosts || [];

        if (likedPostIds.length === 0) {
          setLikedPosts([]);
          setIsLoading(false);
          return;
        }

        // Beğenilen postları getir
        const likedPostsData: PostType[] = [];
        
        // Her beğenilen post için bilgileri getir
        for (const postId of likedPostIds) {
          const postDoc = await getDoc(doc(db, 'posts', postId));
          
          if (postDoc.exists()) {
            const postData = postDoc.data();
            
            likedPostsData.push({
              id: postDoc.id,
              imageUrl: postData.imageUrl || '',
              title: postData.title || '',
              author: postData.author || '',
              location: postData.location || '',
              date: postData.createdAt ? new Date(postData.createdAt.toDate()).toLocaleDateString() : '',
              createdAt: postData.createdAt?.toDate() || new Date(),
              content: postData.content || '',
              tags: postData.tags || []
            });
          }
        }
        
        setLikedPosts(likedPostsData);
      } catch (error) {
        console.error('Beğenilen postları getirirken hata:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLikedPosts();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>LIKED POSTS</Text>
        <View style={{width: 40}} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B9363" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : (
        <ScrollView style={styles.content}>
          {likedPosts.length > 0 ? (
            likedPosts.map((post) => (
              <TouchableOpacity 
                key={post.id} 
                style={styles.postCard}
                onPress={() => router.push({
                  pathname: '/(tabs)/PostDetail',
                  params: { id: post.id }
                })}
              >
                <View style={styles.horizontalCard}>
                  <Image 
                    source={{ uri: post.imageUrl }}
                    style={styles.cardImage} 
                  />
                  <View style={styles.cardContent}>
                    <Text style={styles.cardTitle} numberOfLines={2} ellipsizeMode="tail">{post.title}</Text>
                    {post.content && (
                      <Text style={styles.cardDescription} numberOfLines={2}>
                        {post.content}
                      </Text>
                    )}
                    <View style={styles.cardMetaContainer}>
                      <View style={styles.cardMeta}>
                        <Ionicons name="calendar-outline" size={14} color="#4B9363" />
                        <Text style={styles.cardMetaText}>{post.date}</Text>
                      </View>
                      <View style={styles.cardMeta}>
                        <Ionicons name="location" size={14} color="#4B9363" />
                        <Text style={styles.cardMetaText}>{post.location}</Text>
                      </View>
                    </View>
                    {post.tags && post.tags.length > 0 && (
                      <View style={styles.tagsContainer}>
                        {post.tags.map((tag, index) => (
                          <View key={index} style={styles.tagChip}>
                            <Text style={styles.tagText}>{tag}</Text>
                          </View>
                        ))}
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            ))
          ) : (
            <View style={styles.noResultsContainer}>
              <Ionicons name="heart-outline" size={48} color="#ccc" />
              <Text style={styles.noResultsText}>No liked posts</Text>
              <Text style={styles.noResultsSubtext}>Posts you like will appear here</Text>
            </View>
          )}
        </ScrollView>
      )}

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
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    flex: 1,
    paddingVertical: 4,
    paddingHorizontal: 24,
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
  postCard: {
    marginVertical: 8,
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
    paddingHorizontal: 12,
    height: 120,
  },
  horizontalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    height: '100%',
  },
  cardImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
    justifyContent: 'space-between',
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#000',
  },
  cardDescription: {
    fontSize: 12,
    color: '#696969',
    marginTop: 6,
  },
  cardMetaContainer: {
    flexDirection: 'row',
    marginTop: 8,
    justifyContent: 'flex-start',
    flexWrap: 'wrap',
  },
  cardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
    marginTop: 2,
  },
  cardMetaText: {
    fontSize: 11,
    color: '#696969',
    marginLeft: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  tagChip: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 6,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 8,
    color: '#4B9363',
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
});
