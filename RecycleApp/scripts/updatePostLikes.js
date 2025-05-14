// Post beğeni sayılarını güncellemek için one-time script
// Bu script, her postun beğeni sayısını hesaplar ve Firebase'e kaydeder
// Beğeni sayıları, tüm kullanıcıların likedPosts dizilerinden hesaplanır

// Firebase yapılandırmasını içe aktaralım
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, doc, updateDoc, getDoc } = require('firebase/firestore');

// Firebase yapılandırma bilgileri (normalde .env dosyasında tutulur)
// NOT: Bu bilgileri doğrudan app/config/firebase.js dosyasından içe aktarmak daha güvenli olabilir
const firebaseConfig = {
  // Firebase yapılandırma bilgilerinizi güncel şekilde ekleyin
  // Bu bilgileri app/config/firebase.js dosyasından alabilirsiniz
};

// Firebase'i başlat ve Firestore referansını al
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

/**
 * Tüm postların beğeni sayılarını günceller.
 * 
 * Bu işlev:
 * 1. Tüm postları alır
 * 2. Her post için tüm kullanıcıların likedPosts dizilerini kontrol eder
 * 3. Beğeni sayısını hesaplar
 * 4. Post belgesi içinde likeCount alanını günceller
 */
async function updatePostLikes() {
  try {
    console.log('Postların beğeni sayılarını güncelleme işlemi başlatılıyor...');
    
    // 1. Tüm postları alalım
    const postsRef = collection(db, 'posts');
    const postSnap = await getDocs(postsRef);
    
    // Toplam post sayısını göster
    console.log(`Toplam ${postSnap.docs.length} post işlenecek`);
    
    // 2. Tüm kullanıcıları alalım (beğeni bilgileri için)
    const usersRef = collection(db, 'users');
    const userSnap = await getDocs(usersRef);
    
    // Toplam kullanıcı sayısını göster
    console.log(`Toplam ${userSnap.docs.length} kullanıcının beğeni verileri kontrol edilecek`);
    
    // 3. Her kullanıcının likedPosts dizisinden post beğeni verilerini çıkaralım
    const userLikes = {};
    
    userSnap.docs.forEach(userDoc => {
      const userData = userDoc.data();
      const likedPosts = userData.likedPosts || [];
      
      // Her beğenilen post için sayaç artır
      likedPosts.forEach(postId => {
        if (!userLikes[postId]) {
          userLikes[postId] = 0;
        }
        userLikes[postId]++;
      });
    });
    
    // 4. Her post için beğeni sayısını hesapla ve güncelle
    for (const postDoc of postSnap.docs) {
      const postId = postDoc.id;
      const postData = postDoc.data();
      
      // Hesaplanan beğeni sayısı
      const calculatedLikeCount = userLikes[postId] || 0;
      
      // Mevcut beğeni sayısı 
      const currentLikeCount = postData.likeCount !== undefined ? postData.likeCount : 0;
      
      // Eğer hesaplanan ve mevcut beğeni sayıları farklıysa güncelle
      if (calculatedLikeCount !== currentLikeCount) {
        await updateDoc(doc(db, 'posts', postId), {
          likeCount: calculatedLikeCount
        });
        
        console.log(`✅ ${postId} ID'li post güncellendi: likeCount ${currentLikeCount} -> ${calculatedLikeCount}`);
      } else {
        console.log(`ℹ️ ${postId} ID'li post güncel: likeCount = ${currentLikeCount}`);
      }
    }
    
    console.log('✅ Tüm postların beğeni sayıları başarıyla güncellendi!');
  } catch (error) {
    console.error('❌ Beğeni sayılarını güncellerken hata oluştu:', error);
  }
}

// Script'i çalıştır
try {
  console.log('==== Post Beğeni Sayacı Güncelleme Aracı ====');
  updatePostLikes()
    .then(() => console.log('İşlem tamamlandı'))
    .catch(err => console.error('İşlem başarısız:', err));
} catch (error) {
  console.error('Beklenmeyen hata:', error);
} 