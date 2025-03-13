import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import BottomNavigation from '../../components/BottomNavigation';

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState('reported'); // 'reported', 'cleaned', veya 'post'

  const renderPosts = () => {
    if (activeTab !== 'post') return null;

    return (
      <View style={styles.postsContainer}>
        {/* İlk Post */}
        <TouchableOpacity style={styles.postCard}>
          <Image
            source={require('../../assets/images/plastic-waste.jpg')}
            style={styles.postImage}
          />
          <View style={styles.postContent}>
            <Text style={styles.postTitle} numberOfLines={1} ellipsizeMode="tail">
              PLASTİK ATIKLARIN GERİ DÖNÜŞÜMÜ
            </Text>
            <Text style={styles.postDescription} numberOfLines={1} ellipsizeMode="tail">
              Lorem ipsum dolor sit amet consectetur
            </Text>
            <View style={styles.postTags}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>plastic</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>waste</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>recycle</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* İkinci Post */}
        <TouchableOpacity style={styles.postCard}>
          <Image
            source={require('../../assets/images/plastic-waste.jpg')}
            style={styles.postImage}
          />
          <View style={styles.postContent}>
            <Text style={styles.postTitle} numberOfLines={1} ellipsizeMode="tail">
              PLASTİK ATIKLARIN GERİ DÖNÜŞÜMÜ
            </Text>
            <Text style={styles.postDescription} numberOfLines={1} ellipsizeMode="tail">
              Lorem ipsum dolor sit amet consectetur
            </Text>
            <View style={styles.postTags}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>plastic</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>waste</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>recycle</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Üçüncü Post */}
        <TouchableOpacity style={styles.postCard}>
          <Image
            source={require('../../assets/images/plastic-waste.jpg')}
            style={styles.postImage}
          />
          <View style={styles.postContent}>
            <Text style={styles.postTitle} numberOfLines={1} ellipsizeMode="tail">
              PLASTİK ATIKLARIN GERİ DÖNÜŞÜMÜ
            </Text>
            <Text style={styles.postDescription} numberOfLines={1} ellipsizeMode="tail">
              Lorem ipsum dolor sit amet consectetur
            </Text>
            <View style={styles.postTags}>
              <View style={styles.tag}>
                <Text style={styles.tagText}>plastic</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>waste</Text>
              </View>
              <View style={styles.tag}>
                <Text style={styles.tagText}>recycle</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>USER PROFILE</Text>
        <TouchableOpacity style={styles.alertButton}>
          <Ionicons name="alert-circle-outline" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {/* Main Container */}
      <View style={styles.mainContainer}>
        {/* Profile Content */}
        <View style={styles.profileContent}>
          <Image
            source={require('../../assets/images/profile.jpg')}
            style={styles.profileImage}
          />
          
          <Text style={styles.userName}>Fahri Coşkun</Text>
          <Text style={styles.userNickname}>@wiodex</Text>
          
          <Text style={styles.memberSince}>Member since January 2025</Text>
          
          <View style={styles.pointsContainer}>
            <Text style={styles.pointsNumber}>200</Text>
            <Text style={styles.pointsText}>Point</Text>
          </View>

          <View style={styles.statsContainer}>
            <TouchableOpacity 
              style={styles.statItem} 
              onPress={() => setActiveTab('reported')}
            >
              <Text style={styles.statNumber}>10</Text>
              <Text style={styles.statLabel}>Reported</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity 
              style={styles.statItem} 
              onPress={() => setActiveTab('cleaned')}
            >
              <Text style={styles.statNumber}>7</Text>
              <Text style={styles.statLabel}>Cleaned</Text>
            </TouchableOpacity>
            
            <View style={styles.divider} />
            
            <TouchableOpacity 
              style={styles.statItem} 
              onPress={() => setActiveTab('post')}
            >
              <Text style={styles.statNumber}>3</Text>
              <Text style={styles.statLabel}>Post</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.progressContainer}>
            <View style={styles.baseProgress} />
            <View style={[
              styles.activeProgress,
              { left: activeTab === 'reported' ? 0 : activeTab === 'cleaned' ? 120 : 240 }
            ]} />
          </View>
          {renderPosts()}
        </View>
      </View>

      {/* Bottom Navigation */}
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
    flex: 1, // Ana container'a flex: 1 veriyoruz
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
    marginBottom: 16,
  },
  pointsContainer: {
    alignItems: 'center',
    marginBottom: 6, // Points ile stats arası
  },
  pointsNumber: {
    fontFamily: 'Poppins-Medium',
    fontSize: 28,
    color: '#4B9363',
    marginBottom: 4,
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
    transition: 'left 0.3s ease',
  },
  postsContainer: {
    paddingHorizontal: 8,
    paddingVertical: 8,
    marginTop: 24,
    width: '100%',
    gap: 8,
    alignItems: 'center',
  },
  postCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    width: 360,
  },
  postImage: {
    width: 100,
    height: 100,
  },
  postContent: {
    flex: 1,
    padding: 12,
  },
  postTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    marginBottom: 4,
    width: 240,
  },
  postDescription: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
    width: 240,
  },
  postTags: {
    flexDirection: 'row',
    gap: 4,
  },
  tag: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  tagText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 10,
    color: '#4B9363',
  },
}); 