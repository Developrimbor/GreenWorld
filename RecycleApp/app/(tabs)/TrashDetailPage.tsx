import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Modal,
  Dimensions,
  ScrollView,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, collection, getDocs, arrayUnion, arrayRemove, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import * as Location from 'expo-location';
import { auth } from '../config/firebase';
import IconifyPlasticIcon from '../../components/ui/IconifyPlastic';
import IconifyPaperIcon from '../../components/ui/IconifyPaper';
import IconifyGlassIcon from '../../components/ui/IconifyGlass';
import IconifyFoodIcon from '../../components/ui/IconifyFood';
import IconifyCigaretteIcon from '../../components/ui/IconifyCigarette';
import IconifyMaskIcon from '../../components/ui/IconifyMask';
import IconifyPackageIcon from '../../components/ui/IconifyPackage';
import IconifyEWasteIcon from '../../components/ui/IconifyEWaste';
import IconifyClothesIcon from '../../components/ui/IconifyClothes';
import IconifyFishingNetsIcon from '../../components/ui/IconifyFishingNets';
import IconifyConstructionIcon from '../../components/ui/IconifyConstruction';
import IconifyBatteryIcon from '../../components/ui/IconifyBattery';
import IconifyBiomedicalIcon from '../../components/ui/IconifyBiomedical';
import IconifyDeadAnimalsIcon from '../../components/ui/IconifyDeadAnimals';
import IconifyFurnitureIcon from '../../components/ui/IconifyFurniture';
import IconifyGardenIcon from '../../components/ui/IconifyGarden';
import IconifyHomeAppliancesIcon from '../../components/ui/IconifyHomeAppliances';
import IconifyMetalIcon from '../../components/ui/IconifyMetal';
import IconifyTireIcon from '../../components/ui/IconifyTire';
import IconifyToxicIcon from '../../components/ui/IconifyToxic';
import IconifyGarbageIcon from '@/components/ui/IconifyGarbage';
import IconifyGarbageTruckIcon from '../../components/ui/IconifyGarbageTruck';

const { width, height } = Dimensions.get('window');

// Kategori id'sini label'a çeviren yardımcı fonksiyon
const wasteTypeLabels: { [key: number]: string } = {
  1: 'Plastic',
  2: 'Paper',
  3: 'Glass',
  4: 'Organic',
  5: 'Cigarette',
  6: 'Mask',
  7: 'Cardboard',
  8: 'E-Waste',
  9: 'Textile',
  10: 'Fishing Nets',
  11: 'Construction',
  12: 'Battery',
  13: 'Biomedical',
  14: 'Dead Animals',
  15: 'Furniture',
  16: 'Garden',
  17: 'Home Appliances',
  18: 'Metal',
  19: 'Tire',
  20: 'Toxic',
};

// Kategori id'sine göre ikon döndüren yardımcı fonksiyon
const wasteTypeIcons: { [key: number]: any } = {
  1: IconifyPlasticIcon,
  2: IconifyPaperIcon,
  3: IconifyGlassIcon,
  4: IconifyFoodIcon,
  5: IconifyCigaretteIcon,
  6: IconifyMaskIcon,
  7: IconifyPackageIcon,
  8: IconifyEWasteIcon,
  9: IconifyClothesIcon,
  10: IconifyFishingNetsIcon,
  11: IconifyConstructionIcon,
  12: IconifyBatteryIcon,
  13: IconifyBiomedicalIcon,
  14: IconifyDeadAnimalsIcon,
  15: IconifyFurnitureIcon,
  16: IconifyGardenIcon,
  17: IconifyHomeAppliancesIcon,
  18: IconifyMetalIcon,
  19: IconifyTireIcon,
  20: IconifyToxicIcon,
};

interface InfoItemData {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  description: string;
}

interface ModalContentData {
  title: string;
  subtitle: string;
  items: InfoItemData[];
}

const trashInfoDetailsData: ModalContentData = {
  title: 'Trash Info Details',
  subtitle: 'Details about trash types',
  items: [
    { icon: 'recycling', title: 'Recyclable', description: 'Materials that can be processed and reused.' },
    { icon: 'smoking-rooms', title: 'Cigarette Butts', description: 'Often contain plastic filters.' },
    { icon: 'waves', title: 'Plastic Waste', description: 'Various types of plastic items.' },
    { icon: 'description', title: 'Paper/Cardboard', description: 'Paper products and cardboard packaging.' },
    { icon: 'masks', title: 'Medical Masks', description: 'Disposable face masks.' },
    { icon: 'wine-bar', title: 'Glass Bottles', description: 'Glass containers, usually recyclable.' },
  ]
};

const trashVolumeDetailsData: ModalContentData = {
  title: 'Trash Volume Details',
  subtitle: 'Estimated amount of trash',
  items: [
    { icon: 'shopping-bag', title: 'Garbage Bag (S)', description: 'Small amount, like a single shopping bag.' },
    { icon: 'delete', title: 'Garbage Bin (M)', description: 'Fills a standard household garbage bin.' },
    { icon: 'local-shipping', title: 'Garbage Truck (L)', description: 'Large amount requiring a truck for removal.' },
    { icon: 'delete-sweep', title: 'Multiple Bags (XL)', description: 'Several bags or a large pile of waste.' },
  ]
};

export default function TrashDetailPage() {
  const { id } = useLocalSearchParams();
  const [trash, setTrash] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [showCleaningInfoModal, setShowCleaningInfoModal] = useState(false);
  const [modalContent, setModalContent] = useState<ModalContentData | null>(null);
  const [locationName, setLocationName] = useState<string>('');
  const [checkingLocation, setCheckingLocation] = useState(false);
  const [authorUsername, setAuthorUsername] = useState<string>('');
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [wasteGuideVisible, setWasteGuideVisible] = useState(false);
  const [showDistanceModal, setShowDistanceModal] = useState(false);
  const [distanceToWaste, setDistanceToWaste] = useState(0);
  const [sequentialId, setSequentialId] = useState<string>('-----');
  const [alreadyCleanedClicks, setAlreadyCleanedClicks] = useState<string[]>([]);
  const [alwaysHereClicks, setAlwaysHereClicks] = useState<string[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const wasteTypeIconsArr = [
    { key: 1, Icon: IconifyPlasticIcon, label: 'Plastic' },
    { key: 2, Icon: IconifyPaperIcon, label: 'Paper' },
    { key: 3, Icon: IconifyGlassIcon, label: 'Glass' },
    { key: 4, Icon: IconifyFoodIcon, label: 'Organic' },
    { key: 5, Icon: IconifyCigaretteIcon, label: 'Cigarette' },
    { key: 6, Icon: IconifyMaskIcon, label: 'Mask' },
    { key: 7, Icon: IconifyPackageIcon, label: 'Cardboard' },
    { key: 8, Icon: IconifyEWasteIcon, label: 'E-Waste' },
    { key: 9, Icon: IconifyClothesIcon, label: 'Textile' },
    { key: 10, Icon: IconifyFishingNetsIcon, label: 'Fishing Nets' },
    { key: 11, Icon: IconifyConstructionIcon, label: 'Construction' },
    { key: 12, Icon: IconifyBatteryIcon, label: 'Battery' },
    { key: 13, Icon: IconifyBiomedicalIcon, label: 'Biomedical' },
    { key: 14, Icon: IconifyDeadAnimalsIcon, label: 'Dead Animals' },
    { key: 15, Icon: IconifyFurnitureIcon, label: 'Furniture' },
    { key: 16, Icon: IconifyGardenIcon, label: 'Garden' },
    { key: 17, Icon: IconifyHomeAppliancesIcon, label: 'Home Appliances' },
    { key: 18, Icon: IconifyMetalIcon, label: 'Metal' },
    { key: 19, Icon: IconifyTireIcon, label: 'Tire' },
    { key: 20, Icon: IconifyToxicIcon, label: 'Toxic' },
  ];

  useEffect(() => {
    const fetchTrash = async () => {
      if (!id) return;
      setLoading(true);
      const docRef = doc(db, 'trashReports', id as string);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const trashData = docSnap.data();
        // imageUrls varsa ve images yoksa dönüştür
        if (!trashData.images && trashData.imageUrls && Array.isArray(trashData.imageUrls)) {
          trashData.images = trashData.imageUrls.map((url, idx) => ({
            uri: url,
            id: idx.toString(),
          }));
        }
        setTrash(trashData);
        
        // Kullanıcı bilgisini getir
        if (trashData.authorId) {
          setAuthorId(trashData.authorId);
          fetchUserDetails(trashData.authorId);
        } else if (trashData.user?.id) {
          setAuthorId(trashData.user.id);
          fetchUserDetails(trashData.user.id);
        }
        
        // Log data to see the structure
        // console.log("Trash report data:", JSON.stringify(trashData, null, 2));
        
        // Konum adını reverse geocode ile bul
        if (trashData.location && trashData.location.latitude && trashData.location.longitude) {
          try {
            // Konum izni iste
            const { status } = await Location.requestForegroundPermissionsAsync();
            if (status !== 'granted') {
              setLocationName('Konum izni verilmedi');
              setLoading(false);
              return;
            }
            const { latitude, longitude } = trashData.location;
            const locationInfo = await Location.reverseGeocodeAsync({ latitude, longitude });
            if (locationInfo && locationInfo.length > 0) {
              const { city, region, country } = locationInfo[0];
              let cityName = city || region || '';
              let countryName = country || '';
              if (cityName && countryName) {
                setLocationName(`${cityName}, ${countryName}`);
              } else if (cityName) {
                setLocationName(cityName);
              } else if (countryName) {
                setLocationName(countryName);
              } else {
                setLocationName('Konum bilgisi yok');
              }
            } else {
              setLocationName('Konum bilgisi yok');
            }
          } catch (error) {
            setLocationName('Konum bilgisi yok');
          }
        } else {
          setLocationName('Konum bilgisi yok');
        }

        // Sıralı ID hesapla
        try {
          const allDocsSnap = await getDocs(collection(db, 'trashReports'));
          const allDocs = allDocsSnap.docs
            .map(doc => ({ id: doc.id, createdAt: doc.data().createdAt }))
            .filter(doc => doc.createdAt)
            .sort((a, b) => {
              const aDate = a.createdAt.toDate ? a.createdAt.toDate() : new Date(a.createdAt);
              const bDate = b.createdAt.toDate ? b.createdAt.toDate() : new Date(b.createdAt);
              return aDate.getTime() - bDate.getTime();
            });
          const foundIndex = allDocs.findIndex(doc => doc.id === id);
          if (foundIndex !== -1) {
            const seq = (foundIndex + 1).toString().padStart(5, '0');
            setSequentialId(seq);
          } else {
            setSequentialId('-----');
          }
        } catch (e) {
          setSequentialId('-----');
        }

        // Buton sayaçları
        setAlreadyCleanedClicks(trashData.alreadyCleanedClicks || []);
        setAlwaysHereClicks(trashData.alwaysHereClicks || []);
      }
      
      setLoading(false);
    };
    
    fetchTrash();

    // Kullanıcıyı al
    if (auth.currentUser) {
      setUserId(auth.currentUser.uid);
    }
  }, [id]);

  // Kullanıcı detaylarını getir
  const fetchUserDetails = async (userId: string) => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        // Kullanıcının username'ini al, yoksa displayName veya email kontrolü yap
        const username = userData.username || userData.displayName || userData.email || 'Bilinmiyor';
        setAuthorUsername(username);
      } else {
        setAuthorUsername('Bilinmiyor');
      }
    } catch (error) {
      console.error('Kullanıcı bilgileri alınamadı:', error);
      setAuthorUsername('Bilinmiyor');
    }
  };

  const formatDate = (dateObj: any) => {
    if (!dateObj || !dateObj.toDate) return '';
    
    const date = dateObj.toDate();
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const nextImage = () => {
    if (trash?.images && currentImageIndex < trash.images.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const previousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const openInfoModal = (content: ModalContentData) => {
    setModalContent(content);
    setShowInfoModal(true);
  };

  const closeInfoModal = () => {
    setShowInfoModal(false);
    setModalContent(null);
  };

  // Mesafe hesaplama fonksiyonu (Haversine formülü ile)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
    const R = 6371; // Dünya'nın yarıçapı, km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
      Math.sin(dLon/2) * Math.sin(dLon/2); 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    const distance = R * c * 1000; // metre cinsinden mesafe
    return distance;
  };

  // Konum kontrolü ve temizleme sayfasına yönlendirme
  const handleCleanedButton = async () => {
    if (!trash || !trash.location) {
      Alert.alert('Hata', 'Atık konum bilgisi bulunamadı.');
      return;
    }

    setCheckingLocation(true);

    try {
      // Konum izni kontrolü
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Konum İzni Gerekli', 
          'Atık temizleme işlemi yapabilmek için konum izni vermeniz gerekmektedir.',
          [{ text: 'Tamam' }]
        );
        setCheckingLocation(false);
        return;
      }

      // Kullanıcının konumunu al
      const userLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High
      });

      // Atık konumu ile kullanıcı konumu arasındaki mesafeyi hesapla
      const { latitude, longitude } = trash.location;
      const distance = calculateDistance(
        userLocation.coords.latitude,
        userLocation.coords.longitude,
        latitude,
        longitude
      );

      // Maksimum mesafe sınırı (100 metre)
      const MAX_DISTANCE = 100;

      if (distance <= MAX_DISTANCE) {
        // Kullanıcı atığa yeterince yakın, temizleme sayfasına yönlendir
        router.push({
          pathname: '/(tabs)/TrashCleaned',
          params: { id: id }
        });
      } else {
        // Kullanıcı atığa yeterince yakın değil, özel modal göster
        setDistanceToWaste(Math.round(distance));
        setShowDistanceModal(true);
      }
    } catch (error) {
      console.error('Konum kontrolü hatası:', error);
      Alert.alert(
        'Location Error',
        'There was an error receiving your location. Please make sure your location services are turned on.',
        [{ text: 'OK' }]
      );
    } finally {
      setCheckingLocation(false);
    }
  };

  // Temizleme bilgi modalını göster
  const showCleaningInfo = () => {
    setShowCleaningInfoModal(true);
  };

  // --- Sayaç butonları için yardımcı fonksiyonlar ---
  const handleClickButton = async (type: 'alreadyCleaned' | 'alwaysHere') => {
    if (!id || !userId) return;
    const docRef = doc(db, 'trashReports', id as string);
    let currentClicks: string[] = type === 'alreadyCleaned' ? alreadyCleanedClicks : alwaysHereClicks;
    let field = type === 'alreadyCleaned' ? 'alreadyCleanedClicks' : 'alwaysHereClicks';
    let setClicks = type === 'alreadyCleaned' ? setAlreadyCleanedClicks : setAlwaysHereClicks;
    let isClicked = currentClicks.includes(userId);
    try {
      if (!isClicked) {
        await updateDoc(docRef, { [field]: arrayUnion(userId) });
        setClicks([...currentClicks, userId]);
      } else {
        await updateDoc(docRef, { [field]: arrayRemove(userId) });
        setClicks(currentClicks.filter(uid => uid !== userId));
      }
    } catch (e) {
      // Hata yönetimi
    }
  };

  if (loading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" color="#4B9363" /></View>
    );
  }

  if (!trash) {
    return (
      <View style={styles.centered}><Text>Waste not found.</Text></View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TRASH INFO</Text>
        <TouchableOpacity style={styles.infoButton} onPress={showCleaningInfo}>
          <MaterialIcons name="info-outline" size={24} color="#4B9363" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Image Section */}
        <View style={styles.imageSection}>
          {trash.images && trash.images.length > 0 ? (
            <>
          <TouchableOpacity onPress={() => setShowImageModal(true)}>
            <Image
                  source={{ uri: trash.images[currentImageIndex].uri }}
              style={styles.mainImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
          
            </>
          ) : (
            <View style={[styles.mainImage, styles.noImageContainer]}>
              <MaterialIcons name="image-not-supported" size={48} color="#ccc" />
              <Text style={styles.noImageText}>Görsel yok</Text>
              {process.env.NODE_ENV === 'development' && (
                <Text style={styles.devInfo}>
                  Debug: {JSON.stringify(trash.images || 'No images')}
                </Text>
              )}
            </View>
          )}
          
          {trash.images && trash.images.length > 1 && (
            <>
              <TouchableOpacity 
                style={styles.cleanedNavPreviousButton} 
                onPress={previousImage}
                disabled={currentImageIndex === 0}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="chevron-left" size={24} color={currentImageIndex === 0 ? "#bbb" : "#fff"} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.cleanedNavNextButton} 
                onPress={nextImage}
                disabled={currentImageIndex === trash.images.length - 1}
                hitSlop={{ top: 10, bottom: 0, left: 10, right: 10 }}
              >
                <MaterialIcons name="chevron-right" size={24} color={currentImageIndex === trash.images.length - 1 ? "#bbb" : "#fff"} />
              </TouchableOpacity>
              <View style={styles.paginationContainer}>
                <Text style={styles.paginationText}>
                  {currentImageIndex + 1}/{trash.images.length}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Need to Clean Section */}
        <View style={styles.needCleanSection}>
          <Text style={[styles.needCleanText, { textAlign: 'center' }]}>NEED TO CLEAN!</Text>
        </View>

        {/* Info Section - Yeniden Düzenleniyor */}
        <View style={styles.combinedSection}>
          <View style={styles.sectionColumn}>
              <View style={styles.infoItem}>
                <MaterialIcons name="tag" size={16} color="#4B9363" />
                <Text style={styles.infoText}>ID: {sequentialId}</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialIcons name="person" size={16} color="#4B9363" />
                <TouchableOpacity onPress={() => {
                  if (authorId) {
                    if (auth.currentUser && authorId === auth.currentUser.uid) {
                      router.push('/(tabs)/ProfilePage');
                    } else {
                      router.push({ pathname: '/(tabs)/UserProfile', params: { userId: authorId } });
                    }
                  }
                }}>
                  <Text style={[styles.infoText, { color: '#4B9363' }]}>: {authorUsername || (trash.user?.name || 'Bilinmiyor')}</Text>
                </TouchableOpacity>
              </View>
            </View>

          <View style={styles.divider} />

          <View style={styles.sectionColumn}>
              <View style={styles.infoItem}>
                <MaterialIcons name="calendar-today" size={16} color="#4B9363" />
              <Text style={styles.infoText}>: {formatDate(trash.createdAt)}</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialIcons name="location-on" size={16} color="#4B9363" />
              <Text style={styles.infoText}>: {locationName}</Text>
            </View>
          </View>
        </View>

        {/* Trash Info and Volume Section */}
        <View style={styles.combinedSection}>
          <View style={styles.sectionColumn}>
            <View style={styles.sectionHeader}>
              <TouchableOpacity onPress={() => setWasteGuideVisible(true)}>
                <Ionicons name="information-circle-outline" size={24} color="#4B9363"/>
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>Trash Info</Text>
            </View>
            <View style={styles.iconGrid}>
              {/* Dinamik kategori ikonları */}
              {trash.type && typeof trash.type === 'object' && !Array.isArray(trash.type)
                ? Object.keys(trash.type).map((key) => {
                    const Icon = wasteTypeIcons[Number(key)];
                    return Icon ? <Icon key={key} width={24} height={24} color="#4B9363" style={{ marginTop: 2 }} /> : null;
                  })
                : (() => {
                    const Icon = wasteTypeIcons[typeof trash.type === 'string' ? Number(trash.type) : trash.type];
                    return Icon ? <Icon width={24} height={24} color="#4B9363" style={{ margin: 4 }} /> : null;
                  })()
              }
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.sectionColumn}>
            <View style={styles.sectionHeader}>
              <TouchableOpacity onPress={() => setWasteGuideVisible(true)}>
                <Ionicons name="information-circle-outline" size={24} color="#4B9363"/>
              </TouchableOpacity>
              <Text style={styles.sectionTitle}>Trash Volume</Text>
            </View>
            {/* Sadece ikonlar, sola yaslanmış şekilde */}
            <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: 4 }}>
              {/* Truck icon */}
              {(trash.quantity && typeof trash.quantity === 'object' && trash.quantity.truck) || (typeof trash.quantity === 'string' && trash.quantity.toLowerCase().includes('truck')) ? (
                <View style={{ marginRight: 12 }}>
                  <IconifyGarbageTruckIcon width={24} height={24} color={'#4B9363'} />
                </View>
              ) : null}
              {/* Garbage icon */}
              {trash.quantity && ((typeof trash.quantity === 'object' && trash.quantity.bag) || (typeof trash.quantity === 'string' && trash.quantity.toLowerCase().includes('bag'))) ? (
                <View style={{ marginRight: 12 }}>
                  <IconifyGarbageIcon width={24} height={24} color={'#4B9363'} />
                </View>
              ) : null}
              {/* Eğer eski sistemde quantity sayı ise sadece garbage icon */}
              {trash.quantity && typeof trash.quantity === 'number' && (
                <View style={{ marginRight: 12 }}>
                  <IconifyGarbageIcon width={24} height={24} color={'#4B9363'} />
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Other Details Section */}
        <View style={styles.otherDetailsSection}>
          <Text style={styles.sectionTitle}>Other Details</Text>
          {/* Truck/Bag bilgileri burada gösterilecek */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
            {/* Truck need */}
            {((trash.quantity && typeof trash.quantity === 'object' && trash.quantity.truck) || (typeof trash.quantity === 'string' && trash.quantity.toLowerCase().includes('truck'))) && (
              <Text style={[styles.detailsText, { color: '#4B9363', fontWeight: 'bold', marginRight: 16 }]}>Truck need: Yes</Text>
            )}
            {/* Bag need */}
            {trash.quantity && ((typeof trash.quantity === 'object' && trash.quantity.bag) || (typeof trash.quantity === 'string' && trash.quantity.toLowerCase().includes('bag'))) && (
              <Text style={[styles.detailsText, { color: '#4B9363', fontWeight: 'bold', marginRight: 16 }]}>Bag need: {typeof trash.quantity === 'object' ? trash.quantity.bag : trash.quantity}</Text>
            )}
            {/* Eski sistemde sadece sayı ise */}
            {trash.quantity && typeof trash.quantity === 'number' && (
              <Text style={[styles.detailsText, { color: '#4B9363', fontWeight: 'bold', marginRight: 16 }]}>Bag need: {trash.quantity}</Text>
            )}
          </View>
          <Text style={styles.detailsText}>
          {trash.additionalInfo}
          </Text>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.outlineButton} onPress={() => handleClickButton('alreadyCleaned')}>
              <Text style={styles.outlineButtonText}>Already Cleaned</Text>
              {alreadyCleanedClicks.length > 0 && (
                <Text style={{ color: '#4B9363', fontSize: 12, marginTop: 2 }}>{alreadyCleanedClicks.length}</Text>
              )}
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineButton} onPress={() => handleClickButton('alwaysHere')}>
              <Text style={styles.outlineButtonText}>Always Here</Text>
              {alwaysHereClicks.length > 0 && (
                <Text style={{ color: '#4B9363', fontSize: 12, marginTop: 2 }}>{alwaysHereClicks.length}</Text>
              )}
            </TouchableOpacity>
          </View>
          <TouchableOpacity 
            style={styles.primaryButton}
            onPress={handleCleanedButton}
            disabled={checkingLocation}
          >
            {checkingLocation ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
            <Text style={styles.primaryButtonText}>I Cleaned</Text>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Image Modal */}
      <Modal visible={showImageModal} transparent={true}>
        <View style={styles.modalContainer}>
          <TouchableOpacity 
            style={styles.closeButton}
            onPress={() => setShowImageModal(false)}
          >
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableWithoutFeedback 
            onPress={() => setShowImageModal(false)}
          >
            <View style={styles.modalBackground}>
              {trash.images && trash.images.length > 0 && (
            <Image
                  source={{ uri: trash.images[currentImageIndex].uri }}
              style={styles.modalImage}
              resizeMode="contain"
            />
              )}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </Modal>

      {/* Info Detail Modal */}
      <Modal
        visible={showInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={closeInfoModal}
      >
        <TouchableWithoutFeedback onPress={closeInfoModal}> 
          <View style={styles.infoModalOverlay}>
            <TouchableWithoutFeedback> 
              <View style={styles.infoModalContainer}>
                {modalContent && (
                  <>
                    <Text style={styles.infoModalTitle}>{modalContent.title}</Text>
                    <Text style={styles.infoModalSubtitle}>{modalContent.subtitle}</Text>
                    <ScrollView style={styles.infoModalList}>
                      {modalContent.items.map((item, index) => (
                        <View key={index} style={styles.infoModalItem}>
                          <View style={styles.infoModalIconContainer}>
                            <MaterialIcons name={item.icon} size={28} color="#FFF" />
                          </View>
                          <View style={styles.infoModalTextContainer}>
                            <Text style={styles.infoModalItemTitle}>{item.title}</Text>
                            <Text style={styles.infoModalItemDescription}>{item.description}</Text>
                          </View>
                        </View>
                      ))}
                    </ScrollView>
                  </>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Temizleme Bilgi Modalı */}
      <Modal
        visible={showCleaningInfoModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCleaningInfoModal(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowCleaningInfoModal(false)}> 
          <View style={styles.infoModalOverlay}>
            <TouchableWithoutFeedback> 
              <View style={styles.infoModalContainer}>
                <Text style={styles.infoModalTitle}>Trash Cleaning Information</Text>
                <Text style={styles.infoModalSubtitle}>How does the cleaning process work?</Text>
                
                <ScrollView style={styles.infoModalList}>
                  <View style={styles.cleaningInfoItem}>
                    <View style={styles.cleaningInfoNumber}>
                      <Text style={styles.cleaningInfoNumberText}>1</Text>
                    </View>
                    <Text style={styles.cleaningInfoText}>
                      When you click the "I Cleaned" button, your location is checked.
                    </Text>
                  </View>
                  
                  <View style={styles.cleaningInfoItem}>
                    <View style={styles.cleaningInfoNumber}>
                      <Text style={styles.cleaningInfoNumberText}>2</Text>
                    </View>
                    <Text style={styles.cleaningInfoText}>
                      You need to be within 100 meters of the waste spot.
                    </Text>
                  </View>
                  
                  <View style={styles.cleaningInfoItem}>
                    <View style={styles.cleaningInfoNumber}>
                      <Text style={styles.cleaningInfoNumberText}>3</Text>
                    </View>
                    <Text style={styles.cleaningInfoText}>
                      You need to take photos before and after cleaning.
                    </Text>
                  </View>
                  
                  <View style={styles.cleaningInfoItem}>
                    <View style={styles.cleaningInfoNumber}>
                      <Text style={styles.cleaningInfoNumberText}>4</Text>
                    </View>
                    <Text style={styles.cleaningInfoText}>
                      After the cleaning process, your location is checked again.
                    </Text>
                  </View>
                  
                  <View style={styles.cleaningInfoItem}>
                    <View style={styles.cleaningInfoNumber}>
                      <Text style={styles.cleaningInfoNumberText}>5</Text>
                    </View>
                    <Text style={styles.cleaningInfoText}>
                      When your location is verified, the cleaning report is saved.
                    </Text>
                  </View>
                  
                  <Text style={styles.cleaningInfoNote}>
                    Note: This process verifies your location to prevent fake cleaning reports. Please clean the waste spot in real.
                  </Text>
                </ScrollView>
                
                <TouchableOpacity 
                  style={styles.cleaningInfoCloseButton}
                  onPress={() => setShowCleaningInfoModal(false)}
                >
                  <Text style={styles.cleaningInfoCloseButtonText}>I understand</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Waste Guide Modal */}
      <Modal
        visible={wasteGuideVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setWasteGuideVisible(false)}
      >
        <View style={styles.wasteGuideOverlay}>
          <View style={styles.wasteGuideContainer}>
            <Text style={styles.wasteGuideTitle}>Waste Guide</Text>
            <Text style={styles.wasteGuideSubtitle}>Learn about waste types, examples and safety tips.</Text>
            <ScrollView
              contentContainerStyle={{ paddingBottom: 12 }}
              showsVerticalScrollIndicator={false}
            >
              {wasteTypeIconsArr.map(({ key, Icon, label }) => {
                let example = '';
                let tip = '';
                switch (label) {
                  case 'Plastic':
                    example = 'Bottles, bags, packaging, containers, etc.';
                    tip = 'Always separate clean plastics for recycling.';
                    break;
                  case 'Paper':
                    example = 'Newspapers, magazines, cardboard, office paper.';
                    tip = 'Keep paper dry for better recycling.';
                    break;
                  case 'Glass':
                    example = 'Glass bottles, jars, broken glass.';
                    tip = 'Wear gloves when handling broken glass.';
                    break;
                  case 'Organic':
                    example = 'Food scraps, fruit peels, garden waste.';
                    tip = 'Compost organic waste if possible.';
                    break;
                  case 'Cigarette':
                    example = 'Cigarette butts, ash.';
                    tip = 'Never throw cigarette butts on the ground.';
                    break;
                  case 'Mask':
                    example = 'Disposable masks, gloves.';
                    tip = 'Dispose of used masks in closed bins.';
                    break;
                  case 'Cardboard':
                    example = 'Snack wrappers, plastic film, boxes.';
                    tip = 'Clean packaging before recycling.';
                    break;
                  case 'E-Waste':
                    example = 'Phones, laptops, tablets, chargers.';
                    tip = 'Take e-waste to special collection points.';
                    break;
                  case 'Textile':
                    example = 'Clothes, shoes, bags, fabric.';
                    tip = 'Donate usable clothes, recycle the rest.';
                    break;
                  case 'Fishing Nets':
                    example = 'Fishing nets, ropes.';
                    tip = 'Report abandoned nets to authorities.';
                    break;
                  case 'Construction':
                    example = 'Bricks, tiles, concrete, rubble.';
                    tip = 'Wear a mask to avoid dust inhalation.';
                    break;
                  case 'Battery':
                    example = 'Batteries, power banks.';
                    tip = 'Never throw batteries in regular trash.';
                    break;
                  case 'Biomedical':
                    example = 'Syringes, medicine, medical waste.';
                    tip = 'Do not touch biomedical waste without protection.';
                    break;
                  case 'Dead Animals':
                    example = 'Dead animals, animal waste.';
                    tip = 'Avoid direct contact, report to authorities.';
                    break;
                  case 'Furniture':
                    example = 'Chairs, sofas, tables, beds.';
                    tip = 'Arrange for bulky waste pickup if possible.';
                    break;
                  case 'Garden':
                    example = 'Leaves, branches, grass clippings.';
                    tip = 'Compost garden waste if possible.';
                    break;
                  case 'Home Appliances':
                    example = 'Fridges, washing machines, ovens.';
                    tip = 'Contact your municipality for appliance disposal.';
                    break;
                  case 'Metal':
                    example = 'Cans, pipes, metal scraps.';
                    tip = 'Rinse cans before recycling.';
                    break;
                  case 'Tire':
                    example = 'Car tires, bike tires.';
                    tip = 'Take tires to tire collection points.';
                    break;
                  case 'Toxic':
                    example = 'Paint, chemicals, pesticides.';
                    tip = 'Never pour chemicals down the drain.';
                    break;
                  default:
                    example = '';
                    tip = '';
                }
                return (
                  <View key={key} style={styles.wasteGuideItem}>
                    <View style={styles.wasteGuideIconBox}>
                      <Icon width={24} height={24} color="#fff" />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.wasteGuideItemTitle}>{label}</Text>
                      <Text style={styles.wasteGuideExample}><Text style={{ fontWeight: 'bold' }}>Examples:</Text> {example}</Text>
                      <Text style={styles.wasteGuideTip}><Text style={{ fontWeight: 'bold', color: '#4B9363' }}>Tip:</Text> {tip}</Text>
                    </View>
                  </View>
                );
              })}
            </ScrollView>
            <TouchableOpacity style={styles.wasteGuideCloseButton} onPress={() => setWasteGuideVisible(false)}>
              <Text style={styles.wasteGuideCloseButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* MODERN MESAFE MODALI */}
      <Modal
        visible={showDistanceModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDistanceModal(false)}
      >
        <View style={styles.distanceModalOverlay}>
          <View style={styles.distanceModalContainer}>
            <View style={styles.distanceModalIconBox}>
              <Ionicons name="location-outline" size={38} color="#E74C3C" />
            </View>
            <Text style={styles.distanceModalTitle}>You are far from the Waste Point!</Text>
            <Text style={styles.distanceModalText}>
            You are too far away from the waste point. You must be within 100 meters to perform the cleaning operation.
            </Text>
            <TouchableOpacity
              style={styles.distanceModalButton}
              onPress={() => setShowDistanceModal(false)}
            >
              <Text style={styles.distanceModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Poppins-Medium',
  },
  infoButton: {
    padding: 8,
  },
  content: {
    flex: 1,
  },
  imageSection: {
    width: '100%',
    position: 'relative',
    marginBottom: 0,
  },
  mainImage: {
    width: '100%',
    height: 254,
  },
  thumbnailsContainer: {
    width: '100%',
    height: 56,
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  thumbnailWrapper: {
    width: 40,
    height: 40,
    borderRadius: 4,
    marginRight: 8,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  activeThumbnail: {
    borderColor: '#4B9363',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    borderRadius: 2,
  },
  noImageContainer: {
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  noImageText: {
    marginTop: 8,
    color: '#999',
    fontSize: 16,
  },
  previousButton: {
    // eski stil kaldırıldı
    // CleanedTrashPage ile uyumlu yeni stil aşağıda
  },
  nextButton: {
    // eski stil kaldırıldı
    // CleanedTrashPage ile uyumlu yeni stil aşağıda
  },
  cleanedNavPreviousButton: {
    position: 'absolute',
    left: 24,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  cleanedNavNextButton: {
    position: 'absolute',
    right: 24,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
  },
  paginationContainer: {
    position: 'absolute',
    bottom: 16,
    right: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  paginationText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
  },
  needCleanSection: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  needCleanText: {
    fontFamily: 'Poppins-Medium',
    marginTop: 12,
    marginBottom: 8,
    fontSize: 16,
    color: '#A91101',
  },
  combinedSection: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginTop: 24,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
  },
  sectionColumn: {
    flex: 1,
  },
  divider: {
    width: 1,
    backgroundColor: '#D9D9D9',
    marginHorizontal: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  infoText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#696969',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modalImage: {
    width: width * 0.9,
    height: width * 0.9,
    resizeMode: 'contain',
  },
  closeButton: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 1,
    padding: 8,
  },
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoModalContainer: {
    width: width * 0.85,
    maxHeight: height * 0.6,
    backgroundColor: '#F8F8F8',
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4B9363',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Poppins-Medium',
  },
  infoModalSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Poppins-Regular',
  },
  infoModalList: {
    // Liste çok uzunsa kaydırmayı sağlar
  },
  infoModalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoModalIconContainer: {
    width: 50,
    height: 50,
    backgroundColor: '#4B9363',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  infoModalTextContainer: {
    flex: 1,
  },
  infoModalItemTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
    fontFamily: 'Poppins-Medium',
  },
  infoModalItemDescription: {
    fontSize: 13,
    color: '#666',
    lineHeight: 18,
    fontFamily: 'Poppins-Regular',
  },
  devInfo: {
    marginTop: 8,
    fontSize: 10,
    color: '#999',
    textAlign: 'center',
    padding: 8,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  otherDetailsSection: {
    padding: 24,
    minHeight: 196,
  },
  detailsText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#696969',
    marginTop: 6,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  outlineButton: {
    flex: 1,
    height: 48,
    borderWidth: 1,
    borderColor: '#4B9363',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  outlineButtonText: {
    color: '#4B9363',
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  primaryButton: {
    height: 48,
    backgroundColor: '#4B9363',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  primaryButtonText: {
    color: '#fff',
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  cleaningInfoItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  cleaningInfoNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4B9363',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cleaningInfoNumberText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  cleaningInfoText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  cleaningInfoNote: {
    fontSize: 14,
    color: '#A91101',
    fontStyle: 'italic',
    marginTop: 16,
    lineHeight: 20,
  },
  cleaningInfoCloseButton: {
    marginTop: 16,
    backgroundColor: '#4B9363',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  cleaningInfoCloseButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '500',
  },
  wasteGuideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  wasteGuideContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 22,
    width: '93%',
    maxHeight: 500,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  wasteGuideTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B9363',
    marginBottom: 6,
    textAlign: 'left',
  },
  wasteGuideSubtitle: {
    fontSize: 12,
    color: '#696969',
    marginBottom: 18,
  },
  wasteGuideItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
  },
  wasteGuideIconBox: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: '#4B9363',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  wasteGuideItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
  },
  wasteGuideExample: {
    fontSize: 12,
    color: '#666',
  },
  wasteGuideTip: {
    fontSize: 12,
    color: '#4B9363',
  },
  wasteGuideCloseButton: {
    backgroundColor: '#4B9363',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 36,
    alignItems: 'center',
    marginTop: 12,
  },
  wasteGuideCloseButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  distanceModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  distanceModalContainer: {
    width: '85%',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 8,
  },
  distanceModalIconBox: {
    backgroundColor: '#FDEDEC',
    borderRadius: 32,
    padding: 12,
    marginBottom: 8,
  },
  distanceModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 8,
    textAlign: 'center',
  },
  distanceModalText: {
    fontSize: 15,
    color: '#333',
    textAlign: 'center',
    marginBottom: 18,
    lineHeight: 22,
  },
  distanceModalHighlight: {
    color: '#E74C3C',
    fontWeight: 'bold',
  },
  distanceModalButton: {
    backgroundColor: '#4B9363',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 36,
    alignItems: 'center',
    marginTop: 4,
  },
  distanceModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  wasteQuantityItem: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#555',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
