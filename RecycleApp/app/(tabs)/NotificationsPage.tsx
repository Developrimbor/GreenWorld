import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
  FlatList,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, addDoc } from 'firebase/firestore';
import { db, auth } from '../config/firebase';

const { width } = Dimensions.get('window');

type NotificationType = 'trash_reported' | 'trash_cleaned' | 'announcement' | 'achievement' | 'system';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  createdAt: any;
  read: boolean;
  relatedId?: string; // Bildirim bir atık veya temizlik işlemiyle ilgiliyse
  iconName?: string;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showDemoData, setShowDemoData] = useState(true); // Örnek verileri göster

  useEffect(() => {
    if (showDemoData) {
      createDemoNotifications();
    } else {
      fetchNotifications();
    }
  }, [showDemoData]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        return;
      }

      const notificationsRef = collection(db, 'notifications');
      const q = query(
        notificationsRef, 
        where('userId', '==', user.uid),
        orderBy('createdAt', 'desc')
      );

      const querySnapshot = await getDocs(q);
      const notificationsData: Notification[] = [];

      querySnapshot.forEach((doc) => {
        const data = doc.data();
        notificationsData.push({
          id: doc.id,
          type: data.type,
          title: data.title,
          message: data.message,
          createdAt: data.createdAt,
          read: data.read || false,
          relatedId: data.relatedId,
          iconName: data.iconName,
        });
      });

      setNotifications(notificationsData);
    } catch (error) {
      console.error('Bildirimler alınırken hata:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Demo bildirimleri oluştur - sadece UI görüntüsü için, veritabanına kaydetmeden
  const createDemoNotifications = () => {
    try {
      setLoading(true);
      
      // Örnek bildirimler
      const now = new Date();
      const demoNotifications: Notification[] = [
        {
          id: '1',
          type: 'trash_reported',
          title: 'Yeni Atık Bildirimi',
          message: 'Adapazarı, Sakarya konumunda bir atık bildirimi yaptınız.',
          createdAt: now,
          read: false,
          relatedId: 'demo-trash-id-1',
        },
        {
          id: '2',
          type: 'trash_cleaned',
          title: 'Atık Temizlendi',
          message: 'Arifiye, Sakarya konumunda bildirdiğiniz atık temizlendi. Teşekkürler!',
          createdAt: new Date(now.getTime() - 24 * 60 * 60 * 1000), // 1 gün önce
          read: true,
          relatedId: 'demo-trash-id-2',
        },
        {
          id: '3',
          type: 'achievement',
          title: 'Yeni Başarı Kazandınız',
          message: 'İlk Temizlik: İlk atık temizleme işleminizi başarıyla tamamladınız!',
          createdAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000), // 3 gün önce
          read: false,
        },
        {
          id: '4',
          type: 'announcement',
          title: 'Uygulama Güncellemesi',
          message: 'RecycleApp\'in yeni özellikleri hakkında bilgi almak için tıklayın.',
          createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), // 7 gün önce
          read: false,
        },
        {
          id: '5',
          type: 'system',
          title: 'Hoş Geldiniz',
          message: 'RecycleApp\'e hoş geldiniz! Çevreyi korumak için atılan bu adım için teşekkür ederiz.',
          createdAt: new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000), // 14 gün önce
          read: true,
        },
      ];

      setNotifications(demoNotifications);
    } catch (error) {
      console.error('Demo bildirimleri oluşturulurken hata:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  // Test verileri oluşturma fonksiyonu - veritabanına kaydeder
  const createTestNotifications = async () => {
    try {
      setLoading(true);
      const user = auth.currentUser;
      if (!user) {
        setLoading(false);
        Alert.alert('Hata', 'Kullanıcı girişi yapılmamış. Lütfen giriş yapın.');
        return;
      }

      const notificationsRef = collection(db, 'notifications');
      
      // Örnek bildirimler
      const testNotifications = [
        {
          userId: user.uid,
          type: 'trash_reported',
          title: 'Yeni Atık Bildirimi',
          message: 'Adapazarı, Sakarya konumunda bir atık bildirimi yaptınız.',
          createdAt: new Date(),
          read: false,
          relatedId: 'test-trash-id-1',
        },
        {
          userId: user.uid,
          type: 'trash_cleaned',
          title: 'Atık Temizlendi',
          message: 'Arifiye, Sakarya konumunda bildirdiğiniz atık temizlendi. Teşekkürler!',
          createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 gün önce
          read: true,
          relatedId: 'test-trash-id-2',
        },
        {
          userId: user.uid,
          type: 'achievement',
          title: 'Yeni Başarı Kazandınız',
          message: 'İlk Temizlik: İlk atık temizleme işleminizi başarıyla tamamladınız!',
          createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 gün önce
          read: false,
        },
        {
          userId: user.uid,
          type: 'announcement',
          title: 'Uygulama Güncellemesi',
          message: 'RecycleApp\'in yeni özellikleri hakkında bilgi almak için tıklayın.',
          createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 gün önce
          read: false,
        },
        {
          userId: user.uid,
          type: 'system',
          title: 'Hoş Geldiniz',
          message: 'RecycleApp\'e hoş geldiniz! Çevreyi korumak için atılan bu adım için teşekkür ederiz.',
          createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 14 gün önce
          read: true,
        },
      ];

      // Test bildirimlerini ekleme
      for (const notification of testNotifications) {
        await addDoc(notificationsRef, notification);
      }

      // Demo modunu kapat ve gerçek bildirimleri getir
      setShowDemoData(false);
      Alert.alert('Başarılı', 'Test bildirimleri başarıyla oluşturuldu.');
    } catch (error) {
      console.error('Test bildirimleri oluşturulurken hata:', error);
      Alert.alert('Hata', 'Test bildirimleri oluşturulurken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (showDemoData) {
      createDemoNotifications();
    } else {
      fetchNotifications();
    }
  };

  const markAsRead = async (notificationId: string) => {
    if (showDemoData) {
      // Demo modunda sadece UI'ı güncelle
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
      return;
    }
    
    try {
      const notificationRef = doc(db, 'notifications', notificationId);
      await updateDoc(notificationRef, { read: true });
      
      // Yerel state'i güncelle
      setNotifications(notifications.map(n => 
        n.id === notificationId ? { ...n, read: true } : n
      ));
    } catch (error) {
      console.error('Bildirim okundu olarak işaretlenirken hata:', error);
    }
  };

  const handleNotificationPress = (notification: Notification) => {
    // Eğer bildirim okunmamışsa, okundu olarak işaretle
    if (!notification.read) {
      markAsRead(notification.id);
    }

    // Bildirim tipine göre yönlendirme yap
    if (notification.type === 'trash_reported' || notification.type === 'trash_cleaned') {
      if (notification.relatedId) {
        router.push({ 
          pathname: '/(tabs)/TrashDetailPage', 
          params: { id: notification.relatedId } 
        });
      }
    } else if (notification.type === 'achievement') {
      router.push('/(tabs)/ProfilePage');
    }
    // Diğer bildirim tipleri için gerekli yönlendirmeleri ekle
  };

  // Bildirim ikonu ve rengini belirle
  const getNotificationIcon = (type: NotificationType) => {
    switch(type) {
      case 'trash_reported':
        return { name: 'delete-alert', color: '#E74C3C' };
      case 'trash_cleaned':
        return { name: 'recycle', color: '#4B9363' };
      case 'announcement':
        return { name: 'bell-ring', color: '#3498DB' };
      case 'achievement':
        return { name: 'trophy', color: '#F39C12' };
      case 'system':
        return { name: 'information', color: '#9B59B6' };
      default:
        return { name: 'bell', color: '#7F8C8D' };
    }
  };

  // Bildirim zamanını formatla
  const formatDate = (dateObj: any) => {
    if (!dateObj || !dateObj.toDate) {
      // Demo modunda Date objesi kullanıyoruz
      const date = dateObj instanceof Date ? dateObj : new Date();
      
      const now = new Date();
      const diffMs = now.getTime() - date.getTime();
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMins / 60);
      const diffDays = Math.floor(diffHours / 24);

      if (diffMins < 60) {
        return `${diffMins} dakika önce`;
      } else if (diffHours < 24) {
        return `${diffHours} saat önce`;
      } else if (diffDays < 7) {
        return `${diffDays} gün önce`;
      } else {
        return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
      }
    }
    
    const date = dateObj.toDate();
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 60) {
      return `${diffMins} dakika önce`;
    } else if (diffHours < 24) {
      return `${diffHours} saat önce`;
    } else if (diffDays < 7) {
      return `${diffDays} gün önce`;
    } else {
      return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
    }
  };

  const renderNotification = ({ item }: { item: Notification }) => {
    const { name, color } = getNotificationIcon(item.type);
    
    return (
      <TouchableOpacity 
        style={[styles.notificationItem, !item.read && styles.unreadNotification]}
        onPress={() => handleNotificationPress(item)}
      >
        <View style={[styles.iconContainer, { backgroundColor: color }]}>
          <MaterialCommunityIcons name={name as any} size={24} color="#FFF" />
        </View>
        
        <View style={styles.notificationContent}>
          <Text style={styles.notificationTitle}>{item.title}</Text>
          <Text style={styles.notificationMessage}>{item.message}</Text>
          <Text style={styles.notificationTime}>{formatDate(item.createdAt)}</Text>
        </View>
        
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons name="bell-off-outline" size={80} color="#BDBDBD" />
      <Text style={styles.emptyText}>Henüz bildiriminiz yok</Text>
      <Text style={styles.emptySubText}>
        Atık bildirimleri yaptığınızda ve temizlik işlemleri gerçekleştiğinde bildirimler burada görünecek
      </Text>
      
      <TouchableOpacity 
        style={styles.createTestButton} 
        onPress={createTestNotifications}
      >
        <Text style={styles.createTestButtonText}>Örnek Bildirimler Oluştur</Text>
      </TouchableOpacity>
    </View>
  );

  const toggleDataMode = () => {
    setShowDemoData(!showDemoData);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.refreshButton} onPress={onRefresh}>
            <MaterialIcons name="refresh" size={24} color="#4B9363" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Data Mode Toggle - Geliştirme için
      {__DEV__ && (
        <TouchableOpacity 
          style={styles.toggleModeButton}
          onPress={toggleDataMode}
        >
          <Text style={styles.toggleModeText}>
            {showDemoData ? "Gerçek Verileri Göster" : "Demo Verileri Göster"}
          </Text>
        </TouchableOpacity>
      )} */}

      {/* Notifications List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B9363" />
        </View>
      ) : (
        <FlatList
          data={notifications}
          renderItem={renderNotification}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.notificationsList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyComponent}
          refreshing={refreshing}
          onRefresh={onRefresh}
        />
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
  },
  backButton: {
    padding: 8,
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Medium',
    flex: 1,
    textAlign: 'center',
  },
  headerRight: {
    width: 40,
    alignItems: 'flex-end',
  },
  refreshButton: {
    padding: 8,
  },
  toggleModeButton: {
    backgroundColor: '#f0f0f0',
    padding: 8,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  toggleModeText: {
    color: '#4B9363',
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationsList: {
    flexGrow: 1,
    paddingHorizontal: 16,
    paddingBottom: 80, // BottomNavigation için boşluk
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginVertical: 8,
    padding: 16,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderTopWidth: 1,
    borderBottomWidth: 2,
    borderColor: '#E8E8E8',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#F8FBF9',
    borderLeftWidth: 3,
    borderLeftColor: '#4B9363',
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#4B9363',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  notificationContent: {
    flex: 1,
    paddingRight: 16,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Poppins-Medium',
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    fontFamily: 'Poppins-Regular',
  },
  notificationTime: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'Poppins-Regular',
  },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4B9363',
    position: 'absolute',
    top: 12,
    right: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    marginTop: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    fontFamily: 'Poppins-Medium',
  },
  emptySubText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Poppins-Regular',
  },
  createTestButton: {
    marginTop: 24,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#4B9363',
    borderRadius: 8,
  },
  createTestButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Poppins-Medium',
  },
});

