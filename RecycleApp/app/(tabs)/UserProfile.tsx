import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import BottomNavigation from '../../components/BottomNavigation';

export default function UserProfile() {
  const [activeTab, setActiveTab] = useState('reported'); // 'reported', 'cleaned', veya 'post'

  const renderReportedContent = () => {
    if (activeTab !== 'reported') return null;

    const reportedItems = Array(10).fill(null);

    return (
      <ScrollView 
        style={styles.cleanedContainer}
        showsVerticalScrollIndicator={false}
      >
        {reportedItems.map((_, index) => (
          <TouchableOpacity key={index} style={styles.cleanedCard}>
            <Image
              source={require('../../assets/images/plastic-waste.jpg')}
              style={styles.cleanedImage}
            />
            <View style={styles.cleanedContent}>
              <Text style={styles.reportedTitle}>REPORTED</Text>
              <View style={styles.wasteTypesContainer}>
                <View style={styles.wasteTypes}>
                  <MaterialCommunityIcons name="bottle-wine" size={20} color="#4B9363" />
                  <MaterialCommunityIcons name="newspaper" size={20} color="#4B9363" />
                  <MaterialCommunityIcons name="glass-wine" size={20} color="#4B9363" />
                  <MaterialCommunityIcons name="smoking" size={20} color="#4B9363" />
                </View>
                <View style={styles.trashIcons}>
                  <MaterialCommunityIcons name="delete" size={20} color="#4B9363" style={{ marginRight: 4 }} />
                  <MaterialCommunityIcons name="delete-outline" size={20} color="#4B9363" />
                </View>
              </View>
              <View style={styles.locationDateContainer}>
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.locationText}>Sakarya, TR</Text>
                </View>
                <View style={styles.dateContainer}>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                  <Text style={styles.dateText}>10/03/2024</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    );
  };

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

  const renderCleanedContent = () => {
    if (activeTab !== 'cleaned') return null;

    const cleanedItems = Array(7).fill(null);

    return (
      <ScrollView style={styles.cleanedContainer}>
        {cleanedItems.map((_, index) => (
          <TouchableOpacity key={index} style={styles.cleanedCard}>
            <Image
              source={require('../../assets/images/plastic-waste.jpg')}
              style={styles.cleanedImage}
            />
            <View style={styles.cleanedContent}>
              <Text style={styles.cleanedTitle}>CLEANED</Text>
              <View style={styles.wasteTypesContainer}>
                <View style={styles.wasteTypes}>
                  <MaterialCommunityIcons name="bottle-wine" size={20} color="#4B9363" />
                  <MaterialCommunityIcons name="newspaper" size={20} color="#4B9363" />
                  <MaterialCommunityIcons name="glass-wine" size={20} color="#4B9363" />
                  <MaterialCommunityIcons name="smoking" size={20} color="#4B9363" />
                </View>
                <View style={styles.trashIcons}>
                  <MaterialCommunityIcons name="delete" size={20} color="#4B9363" style={{ marginRight: 4 }} />
                  <MaterialCommunityIcons name="delete-outline" size={20} color="#4B9363" />
                </View>
              </View>
              <View style={styles.locationDateContainer}>
                <View style={styles.locationContainer}>
                  <Ionicons name="location-outline" size={16} color="#666" />
                  <Text style={styles.locationText}>Sakarya, TR</Text>
                </View>
                <View style={styles.dateContainer}>
                  <Ionicons name="calendar-outline" size={16} color="#666" />
                  <Text style={styles.dateText}>10/03/2024</Text>
                </View>
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
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
          
        {/* <Text style={styles.memberSince}>Member since January 2025</Text>

<View style={styles.pointsContainer}>
  <Text style={styles.pointsNumber}>200</Text>
  <Text style={styles.pointsText}>Point</Text>
</View> */}


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
          {renderReportedContent()}
          {renderCleanedContent()}
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
    flex: 1,
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
    paddingTop: 24,
    flex: 1,
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
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#696969',
    marginBottom: 8,
    fontStyle: 'italic',
  },
  pointsContainer: {
    alignItems: 'center',
    marginBottom: 6, // Points ile stats arası
  },
  pointsNumber: {
    fontFamily: 'Poppins-Medium',
    fontSize: 22,
    color: '#4B9363',
  },
  pointsText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666',
  },
  statsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
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
    bottom: 0,
    left: 0,
    width: 120,
    height: 2,
    backgroundColor: '#4B9363',
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
  cleanedContainer: {
    flex: 1,
    width: '100%',
    marginTop: 32,
  },
  cleanedCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    width: 360,
    height: 100,
    marginBottom: 8,
    alignSelf: 'center',
  },
  cleanedImage: {
    width: 100,
    height: 100,
  },
  cleanedContent: {
    flex: 1,
    padding: 12,
  },
  cleanedTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#4B9363',
    marginBottom: 8,
  },
  wasteTypesContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  wasteTypes: {
    flexDirection: 'row',
    gap: 4,
  },
  trashIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  locationText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  dateText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  reportedTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#FF0000',
    marginBottom: 8,
  },

}); 