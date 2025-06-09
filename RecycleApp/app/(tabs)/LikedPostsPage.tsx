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
import { collection, query, where, getDocs, getDoc, doc, updateDoc, arrayRemove } from 'firebase/firestore';
import { LinearGradient } from 'expo-linear-gradient';

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
            let authorImage = '';
            let authorId = postData.authorId || '';
            if (authorId) {
              try {
                const userDoc = await getDoc(doc(db, 'users', authorId));
                if (userDoc.exists()) {
                  const userData = userDoc.data();
                  authorImage = userData.photoURL || userData.profilePicture || '';
                }
              } catch (e) {
                // Hata durumunda boş bırak
              }
            }
            likedPostsData.push({
              id: postDoc.id,
              imageUrl: postData.imageUrl || '',
              title: postData.title || '',
              author: postData.author || '',
              location: postData.location || '',
              date: postData.createdAt ? new Date(postData.createdAt.toDate()).toLocaleDateString() : '',
              createdAt: postData.createdAt?.toDate() || new Date(),
              content: postData.content || '',
              tags: postData.tags || [],
              authorId: authorId,
              authorImage: authorImage,
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

  // Postu beğenilerden kaldırma fonksiyonu
  const handleUnlike = async (postId: string) => {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      // Firestore'dan likedPosts listesinden çıkar
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        likedPosts: arrayRemove(postId)
      });
      // Ekrandan da kaldır
      setLikedPosts((prev) => prev.filter((p) => p.id !== postId));
    } catch (e) {
      // Hata yönetimi
      console.error('Unlike error:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/ProfilePage')}
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
                        <Image source={{ uri: post.authorImage }} style={styles.authorImage} />
                      ) : (
                        <View style={[styles.authorImage, styles.defaultAuthorImage]}>
                          <Ionicons name="person" size={16} color="#4B9363" />
                        </View>
                      )}
                      <Text style={styles.authorName}>{post.author}</Text>
                    </View>
                  </View>
                  {/* Heart icon sağ üstte */}
                  <TouchableOpacity
                    style={styles.heartIcon}
                    onPress={(e) => {
                      e.stopPropagation && e.stopPropagation();
                      handleUnlike(post.id);
                    }}
                  >
                    <Ionicons name="heart" size={24} color="#E53935" />
                  </TouchableOpacity>
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
    paddingVertical: 12,
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
    fontFamily: 'Poppins-Medium',
    color: '#000',
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
  heartIcon: {
    position: 'absolute',
    bottom: 12,
    right: 0,
    zIndex: 10,
    // backgroundColor: '#fff',
    // borderRadius: 20,
    // padding: 2,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.08,
    // shadowRadius: 2,
    // elevation: 2,
  },
});
