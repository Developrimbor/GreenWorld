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
import BottomNavigation from '../../components/BottomNavigation';
import { doc, getDoc } from 'firebase/firestore';
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
      }
      
      setLoading(false);
    };
    
    fetchTrash();
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

  // ID'nin kısaltılmış versiyonunu oluştur (ilk 3 karakter + **)
  const formatId = (fullId: string | string[] | undefined) => {
    if (!fullId || typeof fullId !== 'string') return '---**';
    return fullId.substring(0, 3) + '**';
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
        // Kullanıcı atığa yeterince yakın değil, uyarı göster
        Alert.alert(
          'You are far from the waste spot!',
          `You need to be at the waste spot within ${MAX_DISTANCE} meters. The distance to the waste spot is approximately ${Math.round(distance)} meters.`,
          [{ text: 'OK' }]
        );
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
          
              {trash.images.length > 1 && (
                <View style={styles.thumbnailsContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {trash.images.map((img: any, index: number) => (
                      <TouchableOpacity 
                        key={img.id || index} 
                        onPress={() => setCurrentImageIndex(index)}
                        style={[
                          styles.thumbnailWrapper,
                          currentImageIndex === index && styles.activeThumbnail
                        ]}
                      >
                        <Image source={{ uri: img.uri }} style={styles.thumbnail} />
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}
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
              <TouchableOpacity style={styles.previousButton} onPress={previousImage}>
                <MaterialIcons name="chevron-left" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextButton} onPress={nextImage}>
                <MaterialIcons name="chevron-right" size={24} color="#fff" />
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
              <Text style={styles.infoText}>ID: {formatId(id)}</Text>
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
                    return Icon ? <Icon key={key} width={24} height={24} color="#4B9363" style={{ margin: 4 }} /> : null;
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
            <View style={styles.iconGrid}>
              {/* Miktara göre ikonlar */}
              {trash.type && typeof trash.type === 'object' && !Array.isArray(trash.type)
                ? Object.values(trash.type).map((qty, idx) => {
                    if (Number(qty) >= 3) {
                      return <MaterialIcons key={idx} name="local-shipping" size={24} color="#4B9363" style={{ margin: 4 }} />;
                    } else {
                      return <MaterialIcons key={idx} name="delete" size={24} color="#4B9363" style={{ margin: 4 }} />;
                    }
                  })
                : (trash.quantity >= 3
                    ? <MaterialIcons name="local-shipping" size={24} color="#4B9363" style={{ margin: 4 }} />
                    : <MaterialIcons name="delete" size={24} color="#4B9363" style={{ margin: 4 }} />
                  )
              }
            </View>
          </View>
        </View>

        {/* Other Details Section */}
        <View style={styles.otherDetailsSection}>
          <Text style={styles.sectionTitle}>Other Details</Text>
          {/* Çoklu kategori desteği */}
          {/* {trash.type && typeof trash.type === 'object' && !Array.isArray(trash.type) ? (
            <View style={{ marginBottom: 8 }}>
              <Text style={styles.detailsText}>Categories:</Text>
              {Object.entries(trash.type).map(([key, qty]) => (
                <Text style={styles.detailsText} key={key}>
                  - {wasteTypeLabels[Number(key)] || 'Unknown'}: {String(qty)}
                </Text>
              ))}
            </View>
          ) : (
            <>
              <Text style={styles.detailsText}>Category: {wasteTypeLabels[trash.type] || trash.type}</Text>
              <Text style={styles.detailsText}>Quantity: {trash.quantity}</Text>
            </>
          )} */}
          <Text style={styles.detailsText}>
          {trash.additionalInfo}
          </Text>
          
          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.outlineButton}>
              <Text style={styles.outlineButtonText}>Already Cleaned</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.outlineButton}>
              <Text style={styles.outlineButtonText}>Always Here</Text>
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

      {/* Bottom Navigation */}
      <BottomNavigation />

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
    position: 'absolute',
    left: 16,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
  },
  nextButton: {
    position: 'absolute',
    right: 16,
    top: '50%',
    transform: [{ translateY: -20 }],
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
    padding: 8,
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
});
