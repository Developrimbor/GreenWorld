import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, SafeAreaView, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

interface User {
  id: string;
  name: string;
  username: string;
  points: number;
  photoURL?: string;
  profilePicture?: string;
}

export default function RankingPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [showInfo, setShowInfo] = useState(false);

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const q = query(collection(db, 'users'), orderBy('points', 'desc'));
        const snapshot = await getDocs(q);
        const userList: User[] = snapshot.docs.map(doc => {
          const d = doc.data();
          return {
            id: doc.id,
            name: d.name || 'Kullanıcı',
            username: d.username || '',
            points: d.points || 0,
            photoURL: d.photoURL,
            profilePicture: d.profilePicture,
          };
        });
        setUsers(userList);
        setLoading(false);
      } catch (e) {
        setLoading(false);
      }
    };
    fetchLeaderboard();
    setCurrentUserId(auth.currentUser?.uid || null);
  }, []);

  const getUserRank = (userId: string) => {
    return users.findIndex(u => u.id === userId) + 1;
  };

  const currentUser = users.find(u => u.id === currentUserId);
  const currentUserRank = currentUserId ? getUserRank(currentUserId) : null;

  const handleUserPress = (userId: string) => {
    if (userId === currentUserId) {
      router.push('/(tabs)/ProfilePage');
    } else {
      router.push({ pathname: '/(tabs)/UserProfile', params: { userId } });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <MaterialIcons name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>RANKING</Text>
        <TouchableOpacity style={styles.infoButton} onPress={() => setShowInfo(true)}>
          <MaterialIcons name="info-outline" size={24} color="#4B9363" />
        </TouchableOpacity>
      </View>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B9363" />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {/* <Text style={styles.leaderboardTitle}>Genel Sıralama</Text> */}
          {users.map((user, idx) => (
            <TouchableOpacity
              key={user.id}
              style={[styles.userRow, user.id === currentUserId && styles.currentUserRow]}
              onPress={() => handleUserPress(user.id)}
              activeOpacity={0.7}
            >
              <View style={styles.rankBadgeSmall}>
                <Text style={styles.rankBadgeTextSmall}>{idx + 1}</Text>
              </View>
              {user.photoURL || user.profilePicture ? (
                <Image
                  source={{ uri: user.photoURL || user.profilePicture }}
                  style={styles.profileImageSmall}
                />
              ) : (
                <View style={[styles.profileImageSmall, styles.defaultProfileImage]}>
                  <Ionicons name="person" size={20} color="#4B9363" />
                </View>
              )}
              <View style={styles.userInfoSmall}>
                <Text style={styles.userNameSmall} numberOfLines={1}>{user.name}</Text>
                <Text style={styles.userUsernameSmall} numberOfLines={1}>@{user.username}</Text>
              </View>
              <View style={styles.pointsBadgeSmall}>
                <Ionicons name="leaf" size={12} color="#fff" style={{ marginRight: 2 }} />
                <Text style={styles.pointsBadgeTextSmall}>{user.points} P</Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      {/* Info Modal */}
      {showInfo && (
        <View style={styles.infoModalOverlay}>
          <View style={styles.infoModalContainer}>
            <View style={styles.infoModalHeader}>
              <Text style={styles.infoModalTitle}>Sıralama Hakkında</Text>
              <TouchableOpacity onPress={() => setShowInfo(false)}>
                <Ionicons name="close" size={24} color="#4B9363" />
              </TouchableOpacity>
            </View>
            <Text style={styles.infoModalText}>
              Bu sayfada tüm kullanıcılar, yaptıkları atık bildirimi ve temizliklerden kazandıkları puanlara göre sıralanır. Puanlarınız arttıkça sıralamada yükselirsiniz. Kendi profilinize veya diğer kullanıcıların profiline tıklayarak detayları görebilirsiniz.
            </Text>
            <TouchableOpacity style={styles.infoModalButton} onPress={() => setShowInfo(false)}>
              <Text style={styles.infoModalButtonText}>Tamam</Text>
            </TouchableOpacity>
          </View>
        </View>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    flex: 1,
    color: '#000',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 40,
  },
  currentUserCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#4B9363',
    elevation: 2,
  },
  rankBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#4B9363',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  rankBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
  },
  profileImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#4B9363',
    marginRight: 14,
    backgroundColor: '#F5F5F5',
  },
  defaultProfileImage: {
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  userInfo: {
    flex: 1,
  },
  // userName: {
  //   fontSize: 16,
  //   fontWeight: 'bold',
  //   color: '#333',
  // },
  // userUsername: {
  //   fontSize: 13,
  //   color: '#666',
  // },
  pointsBadge: {
    backgroundColor: '#4B9363',
    borderRadius: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginLeft: 10,
  },
  pointsBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  leaderboardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#4B9363',
    marginBottom: 10,
    marginLeft: 2,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 24,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  currentUserRow: {
    borderColor: '#4B9363',
    backgroundColor: '#E8F5E9',
  },
  rankBadgeSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4B9363',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  rankBadgeTextSmall: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  profileImageSmall: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4B9363',
    marginRight: 10,
    backgroundColor: '#F5F5F5',
  },
  userInfoSmall: {
    flex: 1,
  },
  userNameSmall: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  userUsernameSmall: {
    fontSize: 12,
    color: '#666',
  },
  pointsBadgeSmall: {
    backgroundColor: '#4B9363',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
  },
  pointsBadgeTextSmall: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    marginLeft: 2,
  },
  infoModalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 100,
  },
  infoModalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
  },
  infoModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 12,
  },
  infoModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B9363',
  },
  infoModalText: {
    fontSize: 14,
    color: '#333',
    marginBottom: 18,
    textAlign: 'center',
  },
  infoModalButton: {
    backgroundColor: '#4B9363',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  infoModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
