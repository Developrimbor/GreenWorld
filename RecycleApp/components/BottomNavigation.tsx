import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { getUnreadCount } from '../utils/notificationHelpers';
import { auth } from '../app/config/firebase';

export default function BottomNavigation() {
  const currentPath = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  const isHomePage = currentPath === '/(tabs)/HomePage';
  const isProfilePage = currentPath === '/(tabs)/ProfilePage';
  const isMapScreen = currentPath === '/(tabs)/MapScreen';
  const isNotificationsPage = currentPath === '/(tabs)/NotificationsPage';

  useEffect(() => {
    const fetchUnreadCount = async () => {
      const user = auth.currentUser;
      if (user) {
        const count = await getUnreadCount(user.uid);
        setUnreadCount(count);
      }
    };

    fetchUnreadCount();
    
    // Her 30 saniyede bir güncelle
    const intervalId = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(intervalId);
  }, []);

  // NotificationsPage'e gittiğimizde unreadCount'u sıfırla
  useEffect(() => {
    if (isNotificationsPage) {
      setUnreadCount(0);
    }
  }, [isNotificationsPage]);

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={styles.navItem}>
        <Ionicons name="menu-outline" size={24} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/MapScreen')}
      >
        <Ionicons 
          name={isMapScreen ? "map" : "map-outline"} 
          size={24} 
          color={isMapScreen ? "#4B9363" : "#fff"} 
        />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/HomePage')}
      >
        <Ionicons 
          name={isHomePage ? "home" : "home-outline"} 
          size={24} 
          color={isHomePage ? "#4B9363" : "#fff"} 
        />
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/NotificationsPage')}
      >
        <View>
          <Ionicons 
            name={isNotificationsPage ? "notifications" : "notifications-outline"} 
            size={24} 
            color={isNotificationsPage ? "#4B9363" : "#fff"} 
          />
          {unreadCount > 0 && !isNotificationsPage && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </View>
      </TouchableOpacity>
      <TouchableOpacity 
        style={styles.navItem}
        onPress={() => router.push('/(tabs)/ProfilePage')}
      >
        <Ionicons 
          name={isProfilePage ? "person" : "person-outline"} 
          size={24} 
          color={isProfilePage ? "#4B9363" : "#fff"} 
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 16,
    paddingBottom: 16,
    // paddingHorizontal: 24,
  },
  navItem: {
    padding: 8,
    backgroundColor: '#4B9363',
    borderRadius: 8,
    marginHorizontal: 14,

  },
  badge: {
    position: 'absolute',
    right: -6,
    top: -6,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
}); 