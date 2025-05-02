import { addDoc, collection, serverTimestamp, getDocs, query, where, orderBy, limit } from 'firebase/firestore';
import { db } from '../app/config/firebase';

export type NotificationType = 'trash_reported' | 'trash_cleaned' | 'announcement' | 'achievement' | 'system';

/**
 * Veritabanına yeni bir bildirim ekler
 */
export const addNotification = async (
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  relatedId?: string,
  iconName?: string
) => {
  try {
    const notificationData = {
      userId,
      type,
      title,
      message,
      relatedId,
      iconName,
      read: false,
      createdAt: serverTimestamp(),
    };

    await addDoc(collection(db, 'notifications'), notificationData);
    return true;
  } catch (error) {
    console.error('Bildirim eklenirken hata:', error);
    return false;
  }
};

/**
 * Kullanıcının okunmamış bildirim sayısını getirir
 */
export const getUnreadCount = async (userId: string): Promise<number> => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      where('read', '==', false)
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.size;
  } catch (error) {
    console.error('Okunmamış bildirim sayısı alınırken hata:', error);
    return 0;
  }
};

/**
 * Atık raporu oluşturulduğunda bildirim gönderir
 */
export const sendTrashReportedNotification = async (
  reporterId: string,
  trashId: string,
  location: string
) => {
  await addNotification(
    reporterId,
    'trash_reported',
    'Yeni Atık Bildirimi',
    `${location} konumunda bir atık bildirimi yaptınız. Temizlik durumunu takip edebilirsiniz.`,
    trashId,
    'delete-alert'
  );
};

/**
 * Atık temizlendiğinde bildirim gönderir
 */
export const sendTrashCleanedNotification = async (
  reporterId: string,
  cleanerId: string,
  trashId: string,
  location: string
) => {
  // Atık bildirimi yapan kişiye bildirim
  if (reporterId !== cleanerId) {
    await addNotification(
      reporterId,
      'trash_cleaned',
      'Atık Temizlendi',
      `${location} konumunda bildirdiğiniz atık temizlendi.`,
      trashId,
      'recycle'
    );
  }
  
  // Temizleyen kişiye bildirim
  await addNotification(
    cleanerId,
    'trash_cleaned',
    'Atık Temizleme Başarılı',
    `${location} konumundaki atığı başarıyla temizlediniz. Teşekkür ederiz!`,
    trashId,
    'recycle'
  );
};

/**
 * Başarı bildirimi gönderir
 */
export const sendAchievementNotification = async (
  userId: string,
  achievementName: string,
  description: string
) => {
  await addNotification(
    userId,
    'achievement',
    'Yeni Başarı Kazandınız',
    `${achievementName}: ${description}`,
    undefined,
    'trophy'
  );
};

/**
 * Sistem bildirimi gönderir
 */
export const sendSystemNotification = async (
  userId: string,
  title: string,
  message: string
) => {
  await addNotification(
    userId,
    'system',
    title,
    message,
    undefined,
    'information'
  );
}; 