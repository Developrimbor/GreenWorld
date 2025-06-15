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
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
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
import IconifyGarbageIcon from '../../components/ui/IconifyGarbage';

const { width } = Dimensions.get('window');

// Kategori yardımcıları
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

export default function CleanedTrashPage() {
  const { id } = useLocalSearchParams();
  const [trash, setTrash] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [locationName, setLocationName] = useState<string>('');
  const [authorUsername, setAuthorUsername] = useState<string>('');
  const [cleanedByUsername, setCleanedByUsername] = useState<string>('');
  const [authorId, setAuthorId] = useState<string | null>(null);
  const [cleanedById, setCleanedById] = useState<string | null>(null);

  useEffect(() => {
    const fetchTrash = async () => {
      if (!id) return;
      setLoading(true);
      
      // Önce cleanedReports koleksiyonundan kontrol edelim
      const cleanedDocRef = doc(db, 'cleanedReports', id as string);
      let docSnap = await getDoc(cleanedDocRef);
      
      // Eğer cleanedReports'ta yoksa trashReports'ta kontrol edelim
      if (!docSnap.exists()) {
        const trashDocRef = doc(db, 'trashReports', id as string);
        docSnap = await getDoc(trashDocRef);
      }
      
      if (docSnap.exists()) {
        const trashData = docSnap.data();
        setTrash(trashData);
        
        // Atığı bildiren kişinin bilgilerini getir
        if (trashData.authorId) {
          setAuthorId(trashData.authorId);
          fetchUserDetails(trashData.authorId, 'author');
        }
        
        // Atığı temizleyen kişinin bilgilerini getir
        if (trashData.cleanedBy) {
          setCleanedById(trashData.cleanedBy);
          fetchUserDetails(trashData.cleanedBy, 'cleaner');
        }
        
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
  const fetchUserDetails = async (userId: string, userType: 'author' | 'cleaner') => {
    try {
      const userDocRef = doc(db, 'users', userId);
      const userDocSnap = await getDoc(userDocRef);
      
      if (userDocSnap.exists()) {
        const userData = userDocSnap.data();
        // Kullanıcının username'ini al, yoksa displayName veya email kontrolü yap
        const username = userData.username || userData.displayName || userData.email || 'Bilinmiyor';
        
        if (userType === 'author') {
          setAuthorUsername(username);
        } else {
          setCleanedByUsername(username);
        }
      }
    } catch (error) {
      console.error('Kullanıcı bilgileri alınamadı:', error);
      if (userType === 'author') {
        setAuthorUsername('Bilinmiyor');
      } else {
        setCleanedByUsername('Bilinmiyor');
      }
    }
  };

  // ID'nin kısaltılmış versiyonunu oluştur (ilk 3 karakter + **)
  const formatId = (fullId: string | string[] | undefined) => {
    if (!fullId || typeof fullId !== 'string') return '---**';
    return fullId.substring(0, 3) + '**';
  };

  const formatDate = (dateObj: any) => {
    if (!dateObj) return 'Tarih bilgisi yok';
    
    const date = dateObj.toDate ? dateObj.toDate() : new Date(dateObj);
    return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
  };

  const nextImage = () => {
    const displayImages = getDisplayImages();
    if (currentImageIndex < displayImages.length - 1) {
      setCurrentImageIndex(currentImageIndex + 1);
    }
  };

  const previousImage = () => {
    if (currentImageIndex > 0) {
      setCurrentImageIndex(currentImageIndex - 1);
    }
  };

  const getDisplayImages = () => {
    // Temizlik öncesi ve sonrası görüntüleri içeren bir dizi oluştur
    const images = [];
    
    if (trash?.beforeCleaningImage) {
      images.push({ uri: trash.beforeCleaningImage, id: 'before' });
    }
    
    if (trash?.afterCleaningImage) {
      images.push({ uri: trash.afterCleaningImage, id: 'after' });
    }
    
    // Eski format görüntüler varsa onları da ekle
    if (trash?.images && trash.images.length > 0) {
      trash.images.forEach((img: any, index: number) => {
        if (typeof img === 'string') {
          images.push({ uri: img, id: `legacy-${index}` });
        } else if (img.uri) {
          images.push({ uri: img.uri, id: img.id || `img-${index}` });
        }
      });
    }
    
    return images;
  };

  if (loading) {
    return (
      <View style={styles.centered}><ActivityIndicator size="large" color="#4B9363" /></View>
    );
  }

  if (!trash) {
    return (
      <View style={styles.centered}><Text>Temizlenmiş atık bulunamadı.</Text></View>
    );
  }

  const displayImages = getDisplayImages();

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>CLEANED TRASH</Text>
        <TouchableOpacity style={styles.infoButton}>
          <MaterialIcons name="info-outline" size={24} color="#4B9363" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Image Section */}
        <View style={styles.imageSection}>
          {displayImages.length > 0 ? (
            <>
              <TouchableOpacity onPress={() => setShowImageModal(true)}>
                <Image
                  source={{ uri: displayImages[currentImageIndex].uri }}
                  style={styles.mainImage}
                  resizeMode="cover"
                />
              </TouchableOpacity>
          
              {/* {displayImages.length > 1 && (
                <View style={styles.thumbnailsContainer}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {displayImages.map((img: any, index: number) => (
                      <TouchableOpacity 
                        key={img.id} 
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
              )} */}
            </>
          ) : (
            <View style={[styles.mainImage, styles.noImageContainer]}>
              <MaterialIcons name="image-not-supported" size={48} color="#ccc" />
              <Text style={styles.noImageText}>Görsel yok</Text>
            </View>
          )}
          
          {displayImages.length > 1 && (
            <>
              <TouchableOpacity 
                style={styles.previousButton} 
                onPress={previousImage}
                disabled={currentImageIndex === 0}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <MaterialIcons name="chevron-left" size={24} color={currentImageIndex === 0 ? "#bbb" : "#fff"} />
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.nextButton} 
                onPress={nextImage}
                disabled={currentImageIndex === displayImages.length - 1}
                hitSlop={{ top: 10, bottom: 0, left: 10, right: 10 }}
              >
                <MaterialIcons name="chevron-right" size={24} color={currentImageIndex === displayImages.length - 1 ? "#bbb" : "#fff"} />
              </TouchableOpacity>
              <View style={styles.paginationContainer}>
                <Text style={styles.paginationText}>
                  {currentImageIndex + 1}/{displayImages.length}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Cleaned Section */}
        <View style={styles.cleanedSection}>
          <Text style={[styles.cleanedText, { textAlign: 'center' }]}>CLEANED</Text>
          <Text style={[styles.cleanedAuthorText, { color: '#4B9363' }]}>by {cleanedByUsername}</Text>
        </View>

        {/* Info Section */}
        <View style={styles.combinedSection}>
          <View style={styles.sectionColumn}>
            <View style={styles.infoItem}>
              <MaterialIcons name="tag" size={16} color="#4B9363" />
              <Text style={styles.infoText}>ID: {typeof id === 'string' ? id.substring(0, 3) + '**' : '---**'}</Text>
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
                <Text style={[styles.infoText, { color: '#4B9363' }]}>: {authorUsername}</Text>
              </TouchableOpacity>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.sectionColumn}>
            <View style={styles.infoItem}>
              <MaterialIcons name="calendar-today" size={16} color="#4B9363" />
              <Text style={styles.infoText}>: {trash.cleanedAt ? (() => { const d = trash.cleanedAt.toDate ? trash.cleanedAt.toDate() : new Date(trash.cleanedAt); return `${d.getDate()}/${d.getMonth() + 1}/${d.getFullYear()}`; })() : ''}</Text>
            </View>
            <View style={styles.infoItem}>
              <MaterialIcons name="location-on" size={16} color="#4B9363" />
              <Text style={styles.infoText}>: {locationName}</Text>
            </View>
          </View>
        </View>
        {/* Alt çizgi */}
        <View style={{ height: 1, backgroundColor: '#E8E8E8', marginHorizontal: 8, marginBottom: 8 }} />
        {/* Trash Info & Trash Volume Section */}
        <View style={styles.combinedSection}>
          <View style={styles.sectionColumn}>
            <View style={styles.sectionHeader}>
              <MaterialIcons name="info-outline" size={22} color="#4B9363" />
              <Text style={styles.sectionTitle}>Trash Info</Text>
            </View>
            <View style={styles.iconGrid}>
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
              <MaterialIcons name="info-outline" size={22} color="#4B9363" />
              <Text style={styles.sectionTitle}>Trash Volume</Text>
            </View>
            <View style={styles.iconGrid}>
              <IconifyGarbageIcon width={24} height={24} color="#4B9363" style={{ marginTop: 2 }} />
              <Text style={{ fontFamily: 'Poppins-Regular', fontSize: 14, color: '#333', marginLeft: 2, alignSelf: 'center' }}>{trash.quantity || 1}</Text>
            </View>
          </View>
        </View>

        {/* Temizlik Notu */}
        {trash.cleaningInfo && (
          <View style={styles.detailsSection}>
            <Text style={styles.additionalInfoTitle}>Other Details:</Text>
            <Text style={styles.additionalInfoText}>{trash.cleaningInfo}</Text>
          </View>
        )}
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
              {displayImages.length > 0 && (
                <Image
                  source={{ uri: displayImages[currentImageIndex].uri }}
                  style={styles.modalImage}
                  resizeMode="contain"
                />
              )}
            </View>
          </TouchableWithoutFeedback>
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
  nextButton: {
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
  cleanedSection: {
    width: '100%',
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cleanedText: {
    fontFamily: 'Poppins-Medium',
    marginTop: 6,
    // marginBottom: 8,
    fontSize: 16,
    color: '#4B9363',
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
    color: '#111',
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  cleanedAuthorText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#696969',
    marginBottom: 4,
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
  detailsSection: {
    paddingHorizontal: 24,
  },
  additionalInfoTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  additionalInfoText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#696969',
    lineHeight: 20,
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
});
