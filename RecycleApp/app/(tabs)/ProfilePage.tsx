import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import BottomNavigation from '../../components/BottomNavigation';
import { getCurrentUser } from '../(auth)/services/authService';
import { auth, db } from '../config/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export default function ProfilePage() {
  // Önce tab tipleri için bir type tanımlayalım
  type TabType = 'reported' | 'cleaned' | 'post';

  const [activeTab, setActiveTab] = useState<TabType>('reported');
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.push('/(tabs)/HomePage')}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>PROFILE</Text>
        <TouchableOpacity 
          style={styles.alertButton}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Main Content Container */}
      <View style={styles.mainContainer}>
        {/* Profile Content */}
        <View style={styles.profileContent}>
          <Image
            source={require('../../assets/images/profile-2.jpg')}
            style={styles.profileImage}
          />
          
          <Text style={styles.userName}>{userData?.name || 'Loading...'}</Text>
          <Text style={styles.userNickname}>@{userData?.username || 'Loading...'}</Text>
          
          <Text style={styles.memberSince}>
            Member since {userData?.createdAt?.toDate().toLocaleDateString('en-US', {
              month: 'long',
              year: 'numeric'
            }) || 'Loading...'}
          </Text>
          
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsNumber}>{userData?.points || 0}</Text>
            <Text style={styles.pointsText}>Point</Text>
          </View>

          <View style={styles.statsContainer}>
            <TouchableOpacity 
              style={styles.statItem} 
              onPress={() => handleTabPress('reported')}
            >
              <Text style={styles.statNumber}>{userData?.reported || 0}</Text>
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
              <Text style={styles.statNumber}>{userData?.posts || 0}</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  mainContainer: {
    flex: 1, // Ana içerik container'ı esnek olacak
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
  profileContent: {
    alignItems: 'center',
    paddingTop: 24, // Üst boşluk
  },
  profileImage: {
    width: 100,
    height: 100,
    borderColor: '#696969',
    borderWidth: 2,
    borderRadius: 60,
    marginBottom: 16, // Profil fotoğrafı ile isim arası
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
    marginBottom: 16, // Member since ile points arası
  },
  pointsContainer: {
    alignItems: 'center',
    marginBottom: 6, // Points ile stats arası
  },
  pointsNumber: {
    fontFamily: 'Poppins-Medium',
    fontSize: 28,
    color: '#4B9363',
    marginBottom: 4, // Sayı ile Point yazısı arası
  },
  pointsText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
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
});