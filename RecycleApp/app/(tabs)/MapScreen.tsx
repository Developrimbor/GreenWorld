import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  TextInput,
  Dimensions,
  Alert,
  ActivityIndicator,
  Keyboard,
  FlatList,
  Modal,
  TouchableWithoutFeedback,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import BottomNavigation from '../../components/BottomNavigation';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { storage } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width, height } = Dimensions.get('window');
const INITIAL_REGION = {
  latitude: 40.7558,
  longitude: 30.3954,
  latitudeDelta: 0.0922,
  longitudeDelta: 0.0421,
};

interface LocationCoords {
  latitude: number;
  longitude: number;
}

// Atık tipi
interface Trash {
  id: string;
  images: { id: string; uri: string }[];
  type: number;
  quantity: number;
  additionalInfo: string;
  location: { latitude: number; longitude: number };
  user: { id: string; name: string };
  authorId: string;
  createdAt: any;
}

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState(INITIAL_REGION);
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [showCircle, setShowCircle] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationCoords | null>(null);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const [trashReports, settrashReports] = useState<Trash[]>([]);
  const [visibleTrashReports, setVisibleTrashReports] = useState<Trash[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchSuggestions, setSearchSuggestions] = useState<{name: string, coords: {latitude: number, longitude: number}}[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showInfoDialog, setShowInfoDialog] = useState(false);
  const [isReportMode, setIsReportMode] = useState(false);
  // Hata mesajı state'leri
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const requestLocationPermission = async () => {
    try {
      // Konum izni iste (daha önce denendi mi kontrol edilmeden)
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('İzin Gerekli', 'Konum izni olmadan atık bildirimi yapamazsınız.');
        return false;
      }
      return true;
    } catch (error) {
      console.error('Konum izni alınamadı:', error);
      return false;
    }
  };

  const getCurrentLocation = async () => {
    try {
      const location = await Location.getCurrentPositionAsync({});
      // Yeni region'ı hesaplarken longitude/latitude delta'yı eşit tutuyoruz
      // Bu, haritanın çarpık görünmesini önler
      const longitudeDelta = 0.005;
      const latitudeDelta = 0.005;
      
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: latitudeDelta,
        longitudeDelta: longitudeDelta
      };
      
      // Haritayı tam kullanıcı konumuna merkezliyoruz
      mapRef.current?.animateToRegion(newRegion, 500);
      
      // Region ve kullanıcı konumunu güncelliyoruz
      setRegion(newRegion);
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      setShowCircle(true);
      // Yeni konum alındığında seçili konumu ve onay butonunu sıfırla
      setSelectedLocation(null);
      setShowConfirmButton(false);
    } catch (error) {
      console.error('Konum alınamadı:', error);
      
      // Özelleştirilmiş hata mesajı göster
      setShowErrorModal(true);
      setErrorMessage('Konumunuz alınamadı. Lütfen tekrar deneyin.');
      
      // Hata durumunda butonları aktif hale getir
      setIsReportMode(false);
    }
  };

  const handleReportSpot = async () => {
    // İptal et - tıklamadan önce herhangi bir report mode aktifse temizle
    setIsReportMode(false);
    setShowCircle(false);
    setSelectedLocation(null);
    setShowConfirmButton(false);
    
    try {
      // İlk kullanımda bilgi dialogu göster
      const hasShownInfo = await AsyncStorage.getItem('hasShownLocationInfo');
      if (!hasShownInfo) {
        setShowInfoDialog(true);
        await AsyncStorage.setItem('hasShownLocationInfo', 'true');
        return;
      }

      // Konum izni iste - her tıklamada konum izni isteyelim
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        try {
          await getCurrentLocation();
          // Sadece konum başarıyla alındığında report mode'u aktif et
          setIsReportMode(true);
        } catch (err) {
          // Konum alma hatası durumunda butonları aktif hale getir
          console.error('Konum alma hatası:', err);
          setIsReportMode(false);
        }
      } else {
        // Kullanıcı konum iznini vermezse, report mode'u deaktif yap
        setIsReportMode(false);
      }
    } catch (error) {
      console.error('Tercih verisini okuma hatası:', error);
      // Hata olursa da lokasyon izni isteyip, devam et
      const hasPermission = await requestLocationPermission();
      if (hasPermission) {
        try {
          await getCurrentLocation();
          // Sadece konum başarıyla alındığında report mode'u aktif et
          setIsReportMode(true);
        } catch (err) {
          // Konum alma hatası durumunda butonları aktif hale getir
          console.error('Konum alma hatası:', err);
          setIsReportMode(false);
        }
      } else {
        // Kullanıcı konum iznini vermezse, report mode'u deaktif yap
        setIsReportMode(false);
      }
    }
  };

  // Konum seçim modunu iptal et
  const cancelReportMode = () => {
    setShowCircle(false);
    setSelectedLocation(null);
    setShowConfirmButton(false);
    setIsReportMode(false);
  };

  // Kullanıcının konumuna git
  const navigateToUserLocation = async () => {
    try {
      const hasPermission = await requestLocationPermission();
      if (!hasPermission) return;
      
      const location = await Location.getCurrentPositionAsync({});
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01
      };
      
      setRegion(newRegion);
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      mapRef.current?.animateToRegion(newRegion, 500);
    } catch (error) {
      console.error('Konuma gitme hatası:', error);
      
      // Özelleştirilmiş hata mesajı göster
      setShowErrorModal(true);
      setErrorMessage('Konumunuz alınamadı. Lütfen tekrar deneyin.');
      
      // Hata durumunda report modu kapat
      setIsReportMode(false);
    }
  };

  const isLocationInCircle = (location: LocationCoords) => {
    if (!userLocation) return false;
    
    // Haversine formülü ile iki nokta arasındaki mesafeyi hesapla
    const R = 6371e3; // Dünya'nın yarıçapı (metre)
    const φ1 = userLocation.latitude * Math.PI/180;
    const φ2 = location.latitude * Math.PI/180;
    const Δφ = (location.latitude - userLocation.latitude) * Math.PI/180;
    const Δλ = (location.longitude - userLocation.longitude) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const distance = R * c; // metre cinsinden mesafe
    return distance <= 30; // 30 metre yarıçap
  };

  const handleMapPress = (event: any) => {
    // Sadece isReportMode true ve showCircle true ise harita tıklamalarını işle
    // Bu, View Spots Near modunda yanlışlıkla atık noktasına tıklanmasını önler
    if (isReportMode && showCircle && userLocation) {
      const { coordinate } = event.nativeEvent;
      
      if (isLocationInCircle(coordinate)) {
        setSelectedLocation(coordinate);
        setShowConfirmButton(true);
      } else {
        Alert.alert(
          'Uyarı',
          'Lütfen mavi yuvarlak içindeki bir konum seçin.',
          [{ text: 'Tamam' }]
        );
      }
    }
  };

  const handleConfirmLocation = () => {
    if (selectedLocation) {
      router.push({
        pathname: '/(tabs)/TrashReportPage',
        params: {
          latitude: selectedLocation.latitude,
          longitude: selectedLocation.longitude,
        }
      });
      // Yönlendirme sonrası state'leri sıfırla
      setSelectedLocation(null);
      setShowConfirmButton(false);
      setIsReportMode(false);
    }
  };

  const fetchtrashReports = async () => {
    const querySnapshot = await getDocs(collection(db, 'trashReports'));
    const data = querySnapshot.docs.map(doc => {
      const d = doc.data();
      return {
        id: doc.id,
        images: d.images || [],
        type: d.type || 0,
        quantity: d.quantity || 0,
        additionalInfo: d.additionalInfo || '',
        location: d.location || { latitude: 0, longitude: 0 },
        user: d.user || { id: '', name: '' },
        authorId: d.authorId || d.user?.id || '',
        createdAt: d.createdAt || null,
      };
    });
    settrashReports(data);
    // Artık başlangıçta atık noktaları gösterilmeyecek
    setVisibleTrashReports([]);
  };

  useEffect(() => {
    fetchtrashReports();
  }, []);

  // Ekran odaklandığında verileri yeniden çek
  useFocusEffect(
    React.useCallback(() => {
      fetchtrashReports();
      return () => {};
    }, [])
  );

  // Haritanın görünüm alanındaki atık noktalarını göster
  const showSpotsInVisibleArea = () => {
    if (!mapRef.current) return;
    
    // View Spots Near kullanıldığında report mode'u devre dışı bırak
    // Bu, View Spots Near kullanıldığında mavi dairenin ve harita tıklama işlevinin 
    // inaktif olmasını sağlar
    setIsReportMode(false);
    setShowCircle(false);
    setSelectedLocation(null);
    setShowConfirmButton(false);
    
    // Haritanın görünür alanını al
    mapRef.current.getMapBoundaries().then(({northEast, southWest}) => {
      // Görünür alandaki atık noktalarını filtrele
      const visibleSpots = trashReports.filter(trash => {
        const { latitude, longitude } = trash.location;
        return (
          latitude <= northEast.latitude &&
          latitude >= southWest.latitude &&
          longitude <= northEast.longitude &&
          longitude >= southWest.longitude
        );
      });
      
      setVisibleTrashReports(visibleSpots);
      
      if (visibleSpots.length === 0) {
        Alert.alert('Bilgi', 'Bu alanda görüntülenecek atık noktası bulunamadı.');
      }
    }).catch(error => {
      console.error('Harita sınırları alınamadı:', error);
      Alert.alert('Hata', 'Atık noktaları görüntülenemedi. Lütfen tekrar deneyin.');
    });
  };

  // Arama yapıldığında yerler için öneri oluştur
  const getSuggestions = async (query: string) => {
    if (!query.trim()) {
      setSearchSuggestions([]);
      setShowSuggestions(false);
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Arama sorgusunu Geocode API ile yap
      const response = await Location.geocodeAsync(query);
      
      if (response && response.length > 0) {
        // En fazla 5 sonuç göster
        const results = response.slice(0, 5).map((loc, index) => ({
          name: `Konum ${index + 1}`,  // API konum adlarını döndürmüyor, sadece koordinatlar
          coords: {
            latitude: loc.latitude,
            longitude: loc.longitude
          }
        }));
        
        // Sonuçları göster
        setSearchSuggestions(results);
        setShowSuggestions(true);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    } catch (error) {
      console.error('Öneri hatası:', error);
      setSearchSuggestions([]);
      setShowSuggestions(false);
    } finally {
      setIsSearching(false);
    }
  };
  
  // Arama sonuçlarından daha detaylı bilgi almak için ters geocoding yap
  const getLocationDetails = async (latitude: number, longitude: number) => {
    try {
      const response = await Location.reverseGeocodeAsync({
        latitude,
        longitude
      });
      
      if (response && response.length > 0) {
        const location = response[0];
        let locationName = '';
        
        // Adres bilgilerini birleştir
        if (location.name) locationName += location.name;
        if (location.street) {
          if (locationName) locationName += ', ';
          locationName += location.street;
        }
        if (location.city) {
          if (locationName) locationName += ', ';
          locationName += location.city;
        }
        if (location.region) {
          if (locationName) locationName += ', ';
          locationName += location.region;
        }
        if (location.country) {
          if (locationName) locationName += ', ';
          locationName += location.country;
        }
        
        return locationName || `Konum (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
      }
      
      return `Konum (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    } catch (error) {
      console.error('Ters geocoding hatası:', error);
      return `Konum (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`;
    }
  };
  
  // Arama sorgusunu değiştirdiğimizde önerileri güncelle
  useEffect(() => {
    // 500ms bekleyerek her tuş vuruşunda API çağrısı yapılmasını engelle
    const timer = setTimeout(() => {
      if (searchQuery.length > 1) {
        getSuggestions(searchQuery);
      } else {
        setSearchSuggestions([]);
        setShowSuggestions(false);
      }
    }, 500);
    
    return () => clearTimeout(timer);
  }, [searchQuery]);
  
  // Kullanıcı önerilen bir konumu seçtiğinde
  const selectSuggestion = async (location: {name: string, coords: {latitude: number, longitude: number}}) => {
    setIsSearching(true);
    
    try {
      // Konum detaylarını al
      const locationName = await getLocationDetails(
        location.coords.latitude,
        location.coords.longitude
      );
      
      // Arama çubuğunu güncelle
      setSearchQuery(locationName);
      
      // Haritayı bu konuma taşı
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
      
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 500);
      
      // Önerileri kapat
      setShowSuggestions(false);
    } catch (error) {
      console.error('Konum seçme hatası:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setShowSuggestions(false);
    Keyboard.dismiss();
    
    try {
      const response = await Location.geocodeAsync(searchQuery);
      
      if (response && response.length > 0) {
        const { latitude, longitude } = response[0];
        
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        };
        
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 500);
      } else {
        Alert.alert('Sonuç Bulunamadı', 'Aradığınız konum bulunamadı. Lütfen başka bir arama yapın.');
      }
    } catch (error) {
      console.error('Arama hatası:', error);
      Alert.alert('Hata', 'Arama yapılırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setIsSearching(false);
    }
  };

  // Modal kapatıldığında tüm butonları aktif hale getiren fonksiyon
  const closeErrorModal = () => {
    setShowErrorModal(false);
    setIsReportMode(false); // Report mode'u deaktif et
    // Tüm modu sıfırla
    setShowCircle(false);
    setSelectedLocation(null);
    setShowConfirmButton(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header - Başlık */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>MAP</Text>
      </View>
      
      {/* Arama Çubuğu */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
          {isSearching && <ActivityIndicator size="small" color="#4B9363" style={styles.searchLoader} />}
        </View>
        <TouchableOpacity style={styles.optionsButton} onPress={handleSearch}>
          <Ionicons name="search" size={24} color="#000" />
        </TouchableOpacity>
      </View>
      
      {/* Harita Alanı */}
      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          region={region}
          onRegionChangeComplete={setRegion}
          showsUserLocation={true}
          showsMyLocationButton={false}
          onPress={handleMapPress}
        >
          {visibleTrashReports.map(trash => (
            <Marker
              key={trash.id}
              coordinate={trash.location}
              pinColor="#4B9363"
              onPress={() => router.push({ pathname: '/(tabs)/TrashDetailPage', params: { id: trash.id } })}
            />
          ))}
          {showCircle && userLocation && (
            <Circle
              center={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              radius={30}
              fillColor="rgba(40, 187, 227, 0.5)"
              strokeColor="#28BBE3"
              strokeWidth={1}
            />
          )}
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              pinColor="#28BBE3"
              title="Seçilen Konum"
            />
          )}
        </MapView>

        {/* Arama Önerileri */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <FlatList
              data={searchSuggestions}
              keyExtractor={(item, index) => `suggestion-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(item)}
                >
                  <Ionicons name="location-outline" size={20} color="#666" />
                  <Text style={styles.suggestionText}>{item.name}</Text>
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled"
            />
          </View>
        )}

        {/* Navigasyon ve Menü Butonları (Harita Üzerinde) */}
        <View style={styles.topButtonsContainer}>
          <TouchableOpacity style={styles.topButton}>
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.topButton} onPress={navigateToUserLocation}>
            <Ionicons name="navigate" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Onay Butonu */}
        {showConfirmButton && (
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={handleConfirmLocation}
          >
            <Text style={styles.confirmButtonText}>Bu Konumu Onayla</Text>
          </TouchableOpacity>
        )}

        {/* İptal butonu - Sadece report mode aktifken ve konum izni varken göster */}
        {isReportMode && showCircle && (
          <TouchableOpacity 
            style={[styles.cancelButton, showConfirmButton ? styles.cancelButtonWithConfirm : {}]}
            onPress={cancelReportMode}
          >
            <Text style={styles.cancelButtonText}>İptal</Text>
          </TouchableOpacity>
        )}
      </View>
      
      {/* Alt Butonlar - Report Spot ve View Spots Near */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity 
          style={[styles.reportButton, isReportMode && styles.reportActiveButton]} 
          onPress={handleReportSpot}
        >
          <MaterialCommunityIcons 
            name="trash-can" 
            size={20} 
            color={isReportMode ? "#FFFFFF" : "#4B9363"} 
          />
          <Text style={[
            styles.buttonText, 
            isReportMode && styles.reportActiveButtonText
          ]}>Report Spot</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.viewButton} 
          onPress={showSpotsInVisibleArea}
        >
          <Ionicons name="eye-outline" size={20} color="#4B9363" />
          <Text style={styles.viewButtonText}>View Spots Near</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation />

      {/* Konum Doğrulama Bilgi Modal */}
      <Modal
        visible={showInfoDialog}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowInfoDialog(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowInfoDialog(false)}>
          <View style={styles.infoDialogOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.infoDialogContainer}>
                <View style={styles.infoDialogHeader}>
                  <Text style={styles.infoDialogTitle}>Konum Doğrulama Sistemi</Text>
                  <TouchableOpacity onPress={() => setShowInfoDialog(false)}>
                    <Ionicons name="close" size={24} color="#000" />
                  </TouchableOpacity>
                </View>

                <Text style={styles.infoDialogDescription}>
                  RecycleApp, atık temizleme işlemlerinin gerçek ve doğru olmasını sağlamak için konum doğrulama sistemini kullanır.
                </Text>

                <View style={styles.infoStep}>
                  <View style={styles.infoStepNumber}>
                    <Text style={styles.infoStepNumberText}>1</Text>
                  </View>
                  <Text style={styles.infoStepText}>
                    Atık bildirimi yaparken, uygulama konumunuzu alır ve çevrenizde 30 metrelik bir alan belirler.
                  </Text>
                </View>

                <View style={styles.infoStep}>
                  <View style={styles.infoStepNumber}>
                    <Text style={styles.infoStepNumberText}>2</Text>
                  </View>
                  <Text style={styles.infoStepText}>
                    Atık noktası yalnızca bu alan içinde işaretlenebilir, bu da atığın gerçekten orada olduğunu doğrular.
                  </Text>
                </View>

                <View style={styles.infoStep}>
                  <View style={styles.infoStepNumber}>
                    <Text style={styles.infoStepNumberText}>3</Text>
                  </View>
                  <Text style={styles.infoStepText}>
                    Temizlik yapmak istediğinizde, atık noktasına en fazla 100 metre mesafede olmanız gerekir.
                  </Text>
                </View>

                <View style={styles.infoStep}>
                  <View style={styles.infoStepNumber}>
                    <Text style={styles.infoStepNumberText}>4</Text>
                  </View>
                  <Text style={styles.infoStepText}>
                    Bu sistem, sahte bildirimler ve temizlikleri engelleyerek uygulamanın güvenilirliğini sağlar.
                  </Text>
                </View>

                <TouchableOpacity 
                  style={styles.infoDialogButton}
                  onPress={() => {
                    setShowInfoDialog(false);
                    requestLocationPermission().then(hasPermission => {
                      if (hasPermission) getCurrentLocation();
                    });
                  }}
                >
                  <Text style={styles.infoDialogButtonText}>Anladım, Devam Et</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Özelleştirilmiş Hata Modal */}
      <Modal
        visible={showErrorModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => closeErrorModal()}
      >
        <View style={styles.errorModalOverlay}>
          <View style={styles.errorModalContainer}>
            <Text style={styles.errorModalTitle}>Hata</Text>
            <Text style={styles.errorModalMessage}>{errorMessage}</Text>
            <TouchableOpacity 
              style={styles.errorModalButton}
              onPress={() => closeErrorModal()}
            >
              <Text style={styles.errorModalButtonText}>Tamam</Text>
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
    backgroundColor: 'transparent',
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#fff',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  searchContainer: {
    flexDirection: 'row',
    padding: 8,
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8E8E8',
    borderRadius: 24,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 12,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 16,
    paddingVertical: 8,
  },
  searchLoader: {
    marginLeft: 8,
  },
  optionsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapArea: {
    flex: 1,
    position: 'relative',
  },
  map: {
    ...StyleSheet.absoluteFillObject, // Haritayı tüm alanı kapsayacak şekilde ayarla
  },
  topButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  topButton: {
    width: 40,
    height: 40,
    borderRadius: 24,
    backgroundColor: '#4B9363',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  bottomButtons: {
    position: 'absolute',
    bottom: 80, // BottomNavigation'ın üzerinde
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  reportButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 1)', // Yarı şeffaf beyaz
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  reportActiveButton: {
    backgroundColor: '#4B9363', // Aktif report mode için yeşil arka plan
  },
  reportActiveButtonText: {
    color: '#FFFFFF', // Aktif report mode için beyaz yazı
  },
  viewButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 1)', // Yarı şeffaf beyaz
    borderRadius: 24,
    paddingHorizontal: 20,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  buttonText: {
    color: '#000',
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    marginLeft: 8,
  },
  viewButtonText: {
    color: '#000',
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
    marginLeft: 8,
  },
  confirmButton: {
    position: 'absolute',
    left: 16,
    bottom: 80,
    backgroundColor: '#4B9363',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 10,
  },
  confirmButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  suggestionsContainer: {
    backgroundColor: 'white',
    position: 'absolute',
    top: 115, // Header + Search bar height
    left: 0,
    right: 0,
    zIndex: 100,
    borderRadius: 8,
    marginHorizontal: 16,
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  suggestionText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#333',
  },
  // Info Dialog styles
  infoDialogOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoDialogContainer: {
    width: '90%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    maxHeight: '80%',
  },
  infoDialogHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  infoDialogTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B9363',
  },
  infoDialogDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
    lineHeight: 20,
  },
  infoStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  infoStepNumber: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#4B9363',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  infoStepNumberText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  infoStepText: {
    flex: 1,
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  infoDialogButton: {
    marginTop: 16,
    backgroundColor: '#4B9363',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  infoDialogButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  reportModeBanner: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(75, 147, 99, 0.9)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 5,
  },
  reportModeText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  cancelButton: {
    position: 'absolute',
    right: 16,
    bottom: 80,
    backgroundColor: '#e74c3c',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    zIndex: 10,
  },
  cancelButtonWithConfirm: {
    bottom: 140, // Onay butonunun üzerinde göster
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  disabledButton: {
    backgroundColor: 'rgba(200, 200, 200, 0.8)',
  },
  disabledButtonText: {
    color: '#999',
  },
  // Hata Modal Stilleri
  errorModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorModalContainer: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  errorModalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#E74C3C',
    marginBottom: 12,
  },
  errorModalMessage: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  errorModalButton: {
    backgroundColor: '#4B9363',
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 8,
  },
  errorModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
}); 