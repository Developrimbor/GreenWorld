import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Image,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import BottomNavigation from '../../components/BottomNavigation';

export default function PostDetail() {
  const [isLiked, setIsLiked] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Fixed */}
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

      {/* Image Section - Fixed */}
      <View style={styles.imageSection}>
        <Image
          source={require('../../assets/images/plastic-waste.jpg')}
          style={styles.postImage}
        />
        <View style={styles.imageOverlay}>
          <Text style={styles.date}>25/01/2025</Text>
          <View style={styles.location}>
            <Ionicons name="location" size={16} color="#fff" />
            <Text style={styles.locationText}>Serdivan Sakarya</Text>
          </View>
        </View>
      </View>

      {/* Title Section - Fixed */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>Plastik Atıkların Geri Dönüşümü</Text>
      </View>

      {/* Content Section - Scrollable */}
      <ScrollView style={styles.contentScrollView}>
        <View style={styles.contentSection}>
          <Text style={styles.content}>
            Lorem ipsum dolor sit amet, consectetur. Massa mauris eros enim id aliquet. Elementum sed dignissim platea fermentum commodo mauris mattis proin. Egestas morbi tempor eget blandit. Viverra fringilla at duis purus ullamcorper malesuada arcu. Aliquam netus in viverra tincidunt. Integer vulputate odio sapien dolor nulla.
            {'\n\n'}
            Sit ultricies varius at integer urna quam mauris vel. Ipsum mauris sapien lorem vel dictumst ac sed posuere. Lorem tristique volupat cras sed. Magna penatibus pulvinar sit pulvinar odio at. Sed dui tellus risus lorem a diam nulla. Lorem ipsum dolor sit amet consectetur.
            {'\n\n'}
            Massa mauris eros enim id aliquet. Elementum sed dignissim platea fermentum commodo mauris mattis proin. Egestas morbi lorem eget blandit. Viverra fringilla at duis purus ullamcorper malesuada arcu. Aliquam netus in viverra tincidunt. Integer vulputate odio sapien dolor nulla.
            {'\n\n'}
            Massa mauris eros enim id aliquet. Elementum sed dignissim platea fermentum commodo mauris mattis proin. Egestas morbi lorem eget blandit. Viverra fringilla at duis purus ullamcorper malesuada arcu. Aliquam netus in viverra tincidunt. Integer vulputate odio sapien dolor nulla.          
            {'\n\n'}
            Massa mauris eros enim id aliquet. Elementum sed dignissim platea fermentum commodo mauris mattis proin. Egestas morbi lorem eget blandit. Viverra fringilla at duis purus ullamcorper malesuada arcu. Aliquam netus in viverra tincidunt. Integer vulputate odio sapien dolor nulla.          
          </Text>
        </View>
      </ScrollView>

      {/* Author Section - Fixed */}
      <View style={styles.authorSection}>
        <TouchableOpacity 
          style={styles.authorInfo}
          onPress={() => router.push('/(tabs)/UserProfile')}
        >
          <Image
            source={require('../../assets/images/profile.jpg')}
            style={styles.authorImage}
          />
          <Text style={styles.authorName}>Fahri Coşkun</Text>
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
    backgroundColor: '#fff',
    zIndex: 1,
  },
  postImage: {
    width: '100%',
    height: 200,
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  date: {
    color: '#fff',
    fontSize: 14,
  },
  location: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    color: '#fff',
    fontSize: 14,
    marginLeft: 4,
  },
  titleSection: {
    width: '100%',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    zIndex: 1,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 22,
    fontFamily: 'Poppins-Medium',
  },
  contentScrollView: {
    flex: 1,
  },
  contentSection: {
    padding: 16,
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
    padding: 16,
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
    gap: 16,
  },
  actionButton: {
    padding: 4,
  },
}); 