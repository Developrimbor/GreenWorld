import React, { useState, useEffect, useCallback } from 'react';
import { View, TouchableOpacity, StyleSheet, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, usePathname } from 'expo-router';
import { getUnreadCount } from '../utils/notificationHelpers';
import { auth } from '../app/config/firebase';

export default function BottomNavigation() {
  const currentPath = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);
  const [menuActive, setMenuActive] = useState(false);
  
  // Tüm sekmelerin yol kontrolünü yapıyoruz
  const isHomePage = currentPath === '/(tabs)/HomePage' || currentPath.includes('HomePage');
  const isProfilePage = currentPath === '/(tabs)/ProfilePage' || currentPath.includes('ProfilePage');
  const isMapScreen = currentPath === '/(tabs)/MapScreen' || currentPath.includes('MapScreen');
  const isNotificationsPage = currentPath === '/(tabs)/NotificationsPage' || currentPath.includes('NotificationsPage');

  // Bildirim sayısını almak için optimize edilmiş fonksiyon
  const fetchUnreadCount = useCallback(async () => {
    const user = auth.currentUser;
    if (user) {
      const count = await getUnreadCount(user.uid);
      setUnreadCount(count);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    
    // Her 30 saniyede bir güncelle
    const intervalId = setInterval(fetchUnreadCount, 30000);
    
    return () => clearInterval(intervalId);
  }, [fetchUnreadCount]);

  // NotificationsPage'e gittiğimizde unreadCount'u sıfırla
  useEffect(() => {
    if (isNotificationsPage) {
      setUnreadCount(0);
    }
  }, [isNotificationsPage]);

  const toggleMenu = () => {
    setMenuActive(!menuActive);
  };

  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity 
        style={[
          styles.navItem,
          menuActive && styles.activeNavItem
        ]}
        onPress={toggleMenu}
      >
        <Ionicons 
          name="menu-outline" 
          size={24} 
          color={menuActive ? "#fff" : "#000"} 
        />
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          styles.navItem, 
          isMapScreen && styles.activeNavItem
        ]}
        onPress={() => router.push('/(tabs)/MapScreen')}
      >
        <Ionicons 
          name={isMapScreen ? "map" : "map-outline"} 
          size={24} 
          color={isMapScreen ? "#fff" : "#000"} 
        />
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          styles.navItem,
          isHomePage && styles.activeNavItem
        ]}
        onPress={() => router.push('/(tabs)/HomePage')}
      >
        <Ionicons 
          name={isHomePage ? "home" : "home-outline"} 
          size={24} 
          color={isHomePage ? "#fff" : "#000"} 
        />
      </TouchableOpacity>
      <TouchableOpacity 
        style={[
          styles.navItem,
          isNotificationsPage && styles.activeNavItem
        ]}
        onPress={() => router.push('/(tabs)/NotificationsPage')}
      >
        <View>
          <Ionicons 
            name={isNotificationsPage ? "notifications" : "notifications-outline"} 
            size={24} 
            color={isNotificationsPage ? "#fff" : "#000"} 
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
        style={[
          styles.navItem,
          isProfilePage && styles.activeNavItem
        ]}
        onPress={() => router.push('/(tabs)/ProfilePage')}
      >
        <Ionicons 
          name={isProfilePage ? "person" : "person-outline"} 
          size={24} 
          color={isProfilePage ? "#fff" : "#000"} 
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
    borderRadius: 8,
    marginHorizontal: 14,
  },
  activeNavItem: {
    backgroundColor: '#4B9363',
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