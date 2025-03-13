import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';

export default function BottomNavigation() {
  const currentPath = usePathname();

  const isHomePage = currentPath === '/(tabs)/HomePage';
  const isProfilePage = currentPath === '/(tabs)/ProfilePage';

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={styles.navItem}>
        <Ionicons name="menu-outline" size={24} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem}>
        <Ionicons name="map-outline" size={24} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/HomePage')}
      >
        <Ionicons 
          name={isHomePage ? "home" : "home-outline"} 
          size={24} 
          color={isHomePage ? "#4B9363" : "#000"} 
        />
      </TouchableOpacity>
      <TouchableOpacity style={styles.navItem}>
        <Ionicons name="chatbubble-outline" size={24} color="#000" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/ProfilePage')}
      >
        <Ionicons 
          name={isProfilePage ? "person" : "person-outline"} 
          size={24} 
          color={isProfilePage ? "#4B9363" : "#000"} 
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomNav: {
    width: '100%',
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
    zIndex: 1,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    padding: 12,
  },
  navItem: {
    padding: 8,
  },
}); 