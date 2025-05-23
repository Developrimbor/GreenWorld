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
  Switch,
  ScrollView,
  Platform,
  Linking,
  KeyboardAvoidingView,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, MaterialIcons, FontAwesome } from '@expo/vector-icons';
import BottomNavigation from '../../components/BottomNavigation';
import MapView, { Marker, PROVIDER_GOOGLE, Circle, Region } from 'react-native-maps';
import * as Location from 'expo-location';
import { router, useFocusEffect } from 'expo-router';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../config/firebase';
import { storage } from '../config/firebase';
import AsyncStorage from '@react-native-async-storage/async-storage';


const { width, height } = Dimensions.get('window');
const INITIAL_REGION = {
  latitude: 40.7393,
  longitude: 30.3312,
  latitudeDelta: 0.03,
  longitudeDelta: 0.03,
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
  status: string; // 'reported' veya 'cleaned' olabilir
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
  // Region değişikliklerini takip etmek için yeni bir state ekleyelim
  const [isRegionChanging, setIsRegionChanging] = useState(false);
  // Hata mesajı state'leri
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showNoSpotsModal, setShowNoSpotsModal] = useState(false);

  // Filtreleme için state'ler
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [showReportedTrash, setShowReportedTrash] = useState(true);
  const [showCleanedTrash, setShowCleanedTrash] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerType, setDatePickerType] = useState<'start' | 'end'>('start');
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [useDateFilter, setUseDateFilter] = useState(false);
  
  // Basit tarih seçici için state'ler
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth());
  const [selectedDay, setSelectedDay] = useState(new Date().getDate());

  const [isKeyboardVisible, setKeyboardVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Klavye olaylarını dinle
  useEffect(() => {
    const keyboardWillShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => setKeyboardVisible(true)
    );
    const keyboardWillHideListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => setKeyboardVisible(false)
    );

    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
    };
  }, []);

  const requestLocationPermission = async () => {
    try {
      // Önce izin durumunu kontrol edelim
      const { status: existingStatus } = await Location.getForegroundPermissionsAsync();
      
      // İzin zaten verilmiş ise
      if (existingStatus === 'granted') {
        return true;
      }
      
      // İzin henüz istenmemiş veya reddedilmiş ise
      const { status } = await Location.requestForegroundPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('Konum izni alınamadı:', error);
      return false;
    }
  };

  // Harita region'ı değiştiğinde
const onRegionChange = () => {
  if (!isRegionChanging) {
    setIsRegionChanging(true);
  }
};

  // Region değişimi tamamlandığında
const onRegionChangeComplete = (newRegion: Region) => {
  if (isRegionChanging) {
    setRegion(newRegion);
    setIsRegionChanging(false);
  }
};

  const getCurrentLocation = async () => {
    try {
      // Yükleniyor durumunu göster
      setIsLoading(true);

      // Konum almak için Promise oluştur
      const locationPromise = Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      // 10 saniye timeout ile birlikte konum almayı dene
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('TIMEOUT')), 10000);
      });

      // Promise.race ile hangisi önce tamamlanırsa onu al
      const location = await Promise.race([locationPromise, timeoutPromise]) as Location.LocationObject;

      // Yeni region'ı hesapla
      const longitudeDelta = 0.005;
      const latitudeDelta = 0.005;
      
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.005,
        longitudeDelta: 0.005
      };
      
      // Haritayı tam kullanıcı konumuna merkezle
      mapRef.current?.animateToRegion(newRegion, 1000);
      
      // Region ve kullanıcı konumunu güncelle
      setRegion(newRegion);
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      setShowCircle(true);
      // Yeni konum alındığında seçili konumu ve onay butonunu sıfırla
      setSelectedLocation(null);
      setShowConfirmButton(false);
      setIsLoading(false);

    } catch (error: any) {
      console.error('Konum alınamadı:', error);
      
      // Timeout hatası için özel mesaj
      if (error.message === 'TIMEOUT') {
        setShowErrorModal(true);
        setErrorMessage('Your location could not be retrieved. Please check if your location services are enabled and try again.');
      }
      
      // Hata durumunda butonları aktif hale getir
      setIsReportMode(false);
      setIsLoading(false);
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
      
      // Sadece userLocation'ı güncelle
      setUserLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });
      
      // Region state'ini güncellemek yerine sadece animasyon kullan
      mapRef.current?.animateToRegion(newRegion, 500);
    } catch (error) {
      console.error('Konuma gitme hatası:', error);
      setShowErrorModal(true);
      setErrorMessage('Your location could not be retrieved. Please try again.');
      setIsReportMode(false);
    }
  };

  // Haritayı yakınlaştırma fonksiyonu
  const handleZoomIn = () => {
    if (mapRef.current) {
      // Mevcut region'ı al ve yakınlaştırılmış yeni region hesapla
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta / 2,
        longitudeDelta: region.longitudeDelta / 2,
      };
      // Haritayı yeni region'a animasyonlu olarak taşı
      mapRef.current.animateToRegion(newRegion, 300);
    }
  };

  // Haritayı uzaklaştırma fonksiyonu
  const handleZoomOut = () => {
    if (mapRef.current) {
      // Mevcut region'ı al ve uzaklaştırılmış yeni region hesapla
      const newRegion = {
        ...region,
        latitudeDelta: region.latitudeDelta * 2,
        longitudeDelta: region.longitudeDelta * 2,
      };
      // Haritayı yeni region'a animasyonlu olarak taşı
      mapRef.current.animateToRegion(newRegion, 300);
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
        status: d.status || 'reported', // Varsayılan olarak 'reported' kabul ediyoruz
      };
    });
    settrashReports(data);
    applyFilters(data);

    // Artık başlangıçta atık noktaları gösterilmeyecek
    setVisibleTrashReports([]);
  };

  // Filtreleri uygulayan fonksiyon
  const applyFilters = (data = trashReports) => {
    // Başlangıçta tüm verileri filtreleme için hazırla
    let filteredData = [...data];

    // Status filtreleri (reported ve cleaned)
    if (!showReportedTrash) {
      filteredData = filteredData.filter(item => item.status !== 'reported');
    }
    if (!showCleanedTrash) {
      filteredData = filteredData.filter(item => item.status !== 'cleaned');
    }

    // Tarih filtresi
    if (useDateFilter && startDate && endDate) {
      filteredData = filteredData.filter(item => {
        if (!item.createdAt) return false;
        
        const itemDate = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
        return itemDate >= startDate && itemDate <= endDate;
      });
    }

    // Filtrelenmiş veriyi ayarla
    setVisibleTrashReports(filteredData);
  };

  // Tarih seçici değişiklikleri
  const handleDateChange = () => {
    setShowDatePicker(false);
    
    // Seçili tarih değerlerinden yeni bir Date nesnesi oluştur
    const selectedDate = new Date(selectedYear, selectedMonth, selectedDay);
    
    if (datePickerType === 'start') {
      // Başlangıç tarihine günün başlangıcını ayarla (00:00:00)
      const newStartDate = new Date(selectedDate);
      newStartDate.setHours(0, 0, 0, 0);
      setStartDate(newStartDate);

      // Bitiş tarihi yoksa veya başlangıç tarihinden önceyse, bitiş tarihini de güncelle
      if (!endDate || endDate < newStartDate) {
        const newEndDate = new Date(newStartDate);
        newEndDate.setHours(23, 59, 59, 999);
        setEndDate(newEndDate);
      }
    } else {
      // Bitiş tarihine günün sonunu ayarla (23:59:59)
      const newEndDate = new Date(selectedDate);
      newEndDate.setHours(23, 59, 59, 999);
      setEndDate(newEndDate);

      // Başlangıç tarihi yoksa veya bitiş tarihinden sonraysa, başlangıç tarihini de güncelle
      if (!startDate || startDate > newEndDate) {
        const newStartDate = new Date(newEndDate);
        newStartDate.setHours(0, 0, 0, 0);
        setStartDate(newStartDate);
      }
    }
  };

  // Ay adlarını döndüren yardımcı fonksiyon
  const getMonthName = (monthIndex: number): string => {
    const months = ['Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran', 
                   'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'];
    return months[monthIndex];
  };

  // Belirli bir ayın gün sayısını döndüren yardımcı fonksiyon
  const getDaysInMonth = (year: number, month: number): number => {
    return new Date(year, month + 1, 0).getDate();
  };

  // Tarih seçici modalını açarken mevcut tarihi seçili olarak ayarlama
  const openDatePicker = (type: 'start' | 'end') => {
    if (!useDateFilter) return;
    
    setDatePickerType(type);
    
    const targetDate = type === 'start' 
      ? (startDate || new Date()) 
      : (endDate || new Date());
    
    setSelectedYear(targetDate.getFullYear());
    setSelectedMonth(targetDate.getMonth());
    setSelectedDay(targetDate.getDate());
    
    setShowDatePicker(true);
  };

  // Filtreleri temizleme
  const resetFilters = () => {
    setShowReportedTrash(true);
    setShowCleanedTrash(true);
    setStartDate(null);
    setEndDate(null);
    setUseDateFilter(false);
    applyFilters();
  };

  // Filtreleri uygulama butonu
  const applyFilterChanges = () => {
    applyFilters();
    setShowFilterPanel(false);
  };

  // Filtrelerden herhangi biri değiştiğinde otomatik olarak filtreleri uygula
  useEffect(() => {
    applyFilters();
  }, [showReportedTrash, showCleanedTrash, useDateFilter, startDate, endDate]);

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
      let visibleSpots = trashReports.filter(trash => {
        const { latitude, longitude } = trash.location;
        return (
          latitude <= northEast.latitude &&
          latitude >= southWest.latitude &&
          longitude <= northEast.longitude &&
          longitude >= southWest.longitude
        );
      });

      // Mevcut filtreleri uygula
      if (!showReportedTrash) {
        visibleSpots = visibleSpots.filter(item => item.status !== 'reported');
      }
      if (!showCleanedTrash) {
        visibleSpots = visibleSpots.filter(item => item.status !== 'cleaned');
      }

      // Tarih filtresi
      if (useDateFilter && startDate && endDate) {
        visibleSpots = visibleSpots.filter(item => {
          if (!item.createdAt) return false;
          
          const itemDate = item.createdAt.toDate ? item.createdAt.toDate() : new Date(item.createdAt);
          return itemDate >= startDate && itemDate <= endDate;
        });
      }
      
      setVisibleTrashReports(visibleSpots);
      
      if (visibleSpots.length === 0) {
        setShowNoSpotsModal(true);
      }
    }).catch(error => {
      console.error('Map boundaries could not be obtained:', error);
      Alert.alert('Error', 'Waste points could not be displayed. Please try again.');
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
      // Konum izni kontrolü
      const permissionStatus = await requestLocationPermission();
      if (!permissionStatus) {
        Alert.alert(
          "Location Permission Required", 
          "Please grant location permission to use the search feature.",
          [
            { 
              text: "Settings", 
              onPress: () => {
                // Kullanıcıyı ayarlar sayfasına yönlendir
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              } 
            },
            { text: "Cancel", style: "cancel" }
          ]
        );
        setIsSearching(false);
        return;
      }
      
      // Arama sorgusunu Geocode API ile yap
      const response = await Location.geocodeAsync(query);
      
      if (response && response.length > 0) {
        // En fazla 5 sonuç göster
        const results = await Promise.all(
          response.slice(0, 5).map(async (loc, index) => {
            // Her koordinat için adres bilgisini al
            const locationDetails = await getLocationDetails(loc.latitude, loc.longitude);
            return {
              name: locationDetails,
              coords: {
                latitude: loc.latitude,
                longitude: loc.longitude
              }
            };
          })
        );
        
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
      
      // Hata mesajını göster
      Alert.alert(
        "Search Error", 
        "Unable to search for locations. Please check your internet connection and location permissions."
      );
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
      // Konum izni kontrolü
      const permissionStatus = await requestLocationPermission();
      if (!permissionStatus) {
        Alert.alert(
          "Location Permission Required", 
          "Please grant location permission to use the search feature.",
          [
            { 
              text: "Settings", 
              onPress: () => {
                // Kullanıcıyı ayarlar sayfasına yönlendir
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              } 
            },
            { text: "Cancel", style: "cancel" }
          ]
        );
        setIsSearching(false);
        return;
      }
      
      // Arama çubuğunu güncelle
      setSearchQuery(location.name);
      
      // Haritayı bu konuma taşı
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.02,
        longitudeDelta: 0.02,
      };
      
      setRegion(newRegion);
      mapRef.current?.animateToRegion(newRegion, 500);
      
      // Arama noktasına bir işaret eklemek için geçici seçili konum ayarla
      setSelectedLocation({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });
      
      // 5 saniye sonra işareti kaldır
      setTimeout(() => {
        setSelectedLocation(null);
      }, 5000);
      
      // Başarılı bir arama sonrası klavyeyi kapat ve önerileri gizle
      Keyboard.dismiss();
      setShowSuggestions(false);
      
      // Başarılı bir arama sonrası bir geri bildirim göster
      // Vibration.vibrate(100); // Haptik geri bildirim (isteğe bağlı)
    } catch (error) {
      console.error('Location selection error:', error);
      Alert.alert('Error', 'Unable to navigate to the selected location. Please check your location permissions.');
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
      // Konum izni kontrolü
      const permissionStatus = await requestLocationPermission();
      if (!permissionStatus) {
        Alert.alert(
          "Location Permission Required", 
          "Please grant location permission to use the search feature.",
          [
            { 
              text: "Settings", 
              onPress: () => {
                // Kullanıcıyı ayarlar sayfasına yönlendir
                if (Platform.OS === 'ios') {
                  Linking.openURL('app-settings:');
                } else {
                  Linking.openSettings();
                }
              } 
            },
            { text: "Cancel", style: "cancel" }
          ]
        );
        setIsSearching(false);
        return;
      }
      
      const response = await Location.geocodeAsync(searchQuery);
      
      if (response && response.length > 0) {
        const { latitude, longitude } = response[0];
        
        const newRegion = {
          latitude,
          longitude,
          latitudeDelta: 0.02, // Biraz daha yakın bir görünüm
          longitudeDelta: 0.02,
        };
        
        // Haritayı yeni bölgeye taşı
        setRegion(newRegion);
        mapRef.current?.animateToRegion(newRegion, 500);
        
        // Arama noktasına bir işaret eklemek için geçici seçili konum ayarla (opsiyonel)
        setSelectedLocation({
          latitude,
          longitude
        });
        
        // 5 saniye sonra işareti kaldır
        setTimeout(() => {
          setSelectedLocation(null);
        }, 5000);
      } else {
        Alert.alert('No Results', 'No locations found for your search. Please try a different search term.');
      }
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'An error occurred while searching. Please check your internet connection and location permissions.');
    } finally {
      setIsSearching(false);
    }
  };

  // Takvim içindeki günleri oluşturma fonksiyonu
  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(selectedYear, selectedMonth);
    const firstDayOfMonth = new Date(selectedYear, selectedMonth, 1).getDay();
    
    // Boş günler (ay başlangıcından önceki günler için)
    const emptyDays = [];
    for (let i = 0; i < firstDayOfMonth; i++) {
      emptyDays.push(
        <View key={`empty-${i}`} style={styles.calendarDay} />
      );
    }
    
    // Ayın günleri
    const days = [];
    for (let i = 1; i <= daysInMonth; i++) {
      const isSelected = i === selectedDay;
      days.push(
        <TouchableOpacity
          key={`day-${i}`}
          style={[
            styles.calendarDay,
            isSelected && styles.selectedCalendarDay
          ]}
          onPress={() => setSelectedDay(i)}
        >
          <Text style={[
            styles.calendarDayText,
            isSelected && styles.selectedCalendarDayText
          ]}>
            {i}
          </Text>
        </TouchableOpacity>
      );
    }
    
    return [...emptyDays, ...days];
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
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>MAP</Text>
        <TouchableOpacity 
          style={styles.infoButton}
          onPress={() => setShowInfoDialog(true)}
        >
          <MaterialIcons name="info-outline" size={24} color="#4B9363" />
        </TouchableOpacity>
      </View>
      
      {/* Arama Çubuğu */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color="#4B9363" />
          <TextInput
            style={styles.searchInput}
            placeholder="Search location or address..."
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
          {isSearching && <ActivityIndicator size="small" color="#4B9363" style={styles.searchLoader} />}
        </View>
        <TouchableOpacity style={styles.optionsButton} onPress={handleSearch}>
          <Ionicons name="search" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>
      
      {/* Harita Alanı */}
      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_GOOGLE}
          style={styles.map}
          initialRegion={region}  // region yerine initialRegion kullanıyoruz
          onRegionChange={onRegionChange}
          onRegionChangeComplete={onRegionChangeComplete}
          showsUserLocation={true}
          showsMyLocationButton={false}
          onPress={handleMapPress}
          moveOnMarkerPress={false}  // Marker'a tıklandığında otomatik kaymayı engelle
          rotateEnabled={false}      // Harita rotasyonunu devre dışı bırak
          pitchEnabled={false}       // Eğim özelliğini devre dışı bırak
        >
          {visibleTrashReports.map(trash => (
            <Marker
              key={trash.id}
              coordinate={trash.location}
              pinColor={trash.status === 'cleaned' ? "#4B9363" : "#E74C3C"}
              onPress={() => {
                if (trash.status === 'cleaned') {
                  router.push({ 
                    pathname: '/(tabs)/CleanedTrashPage', 
                    params: { id: trash.id } 
                  });
                } else {
                  router.push({ 
                    pathname: '/(tabs)/TrashDetailPage', 
                    params: { id: trash.id } 
                  });
                }
              }}
            />
          ))}
          {showCircle && userLocation && (
            <Circle
              center={{
                latitude: userLocation.latitude,
                longitude: userLocation.longitude,
              }}
              radius={30}
              fillColor="rgba(40, 187, 227, 0.9)"
              strokeColor="#28BBE3"
              strokeWidth={1}
            />
          )}
          {selectedLocation && (
            <Marker
              coordinate={selectedLocation}
              pinColor="#28BBE3"
              title="Selected Location"
            >
              {!showConfirmButton && (
                <View style={styles.searchMarkerContainer}>
                  <View style={styles.searchMarker} />
                  <View style={styles.searchMarkerBottom} />
                </View>
              )}
            </Marker>
          )}
        </MapView>

        {/* Arama Önerileri */}
        {showSuggestions && searchSuggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <View style={styles.suggestionHeader}>
              <Text style={styles.suggestionHeaderText}>Location Suggestions</Text>
            </View>
            <FlatList
              data={searchSuggestions}
              keyExtractor={(item, index) => `suggestion-${index}`}
              renderItem={({ item }) => (
                <TouchableOpacity 
                  style={styles.suggestionItem}
                  onPress={() => selectSuggestion(item)}
                >
                  <View style={styles.suggestionIcon}>
                    <Ionicons name="location" size={18} color="#4B9363" />
                  </View>
                  <View style={styles.suggestionContent}>
                    <Text style={styles.suggestionText} numberOfLines={1}>{item.name}</Text>
                    <Text style={styles.suggestionSubtext}>
                      {`${item.coords.latitude.toFixed(4)}, ${item.coords.longitude.toFixed(4)}`}
                    </Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#CCC" />
                </TouchableOpacity>
              )}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            />
          </View>
        )}

        {/* Navigasyon ve Menü Butonları (Harita Üzerinde) */}
        <View style={styles.topButtonsContainer}>
          <TouchableOpacity 
            style={styles.topButton} 
            onPress={() => setShowFilterPanel(true)}
          >
            <Ionicons name="menu" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.topButton} onPress={navigateToUserLocation}>
            <Ionicons name="navigate" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Zoom Kontrol Butonları - Klavye açıkken gizle */}
        {!isKeyboardVisible && (
          <View style={styles.zoomControlContainer}>
            <TouchableOpacity 
              style={styles.zoomButton}
              onPress={handleZoomIn}
            >
              <Ionicons name="add" size={24} color="#000" />
            </TouchableOpacity>
            <View style={styles.zoomButtonDivider} />
            <TouchableOpacity 
              style={styles.zoomButton}
              onPress={handleZoomOut}
            >
              <Ionicons name="remove" size={24} color="#000" />
            </TouchableOpacity>
          </View>
        )}

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
      
      {/* Alt Butonlar - Report Spot ve View Spots Near - Klavye açıkken gizle */}
      {!isKeyboardVisible && (
        <View style={styles.bottomButtons}>
          <TouchableOpacity 
            style={[styles.reportButton, isReportMode && styles.reportActiveButton]} 
            onPress={handleReportSpot}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color={isReportMode ? "#FFFFFF" : "#4B9363"} />
            ) : (
              <>
                <MaterialCommunityIcons 
                  name="trash-can" 
                  size={20} 
                  color={isReportMode ? "#FFFFFF" : "#4B9363"} 
                />
                <Text style={[
                  styles.buttonText, 
                  isReportMode && styles.reportActiveButtonText
                ]}>Report Spot</Text>
              </>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.viewButton} 
            onPress={showSpotsInVisibleArea}
          >
            <Ionicons name="eye-outline" size={20} color="#4B9363" />
            <Text style={styles.viewButtonText}>View Spots Near</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Bottom Navigation - Klavye açıkken gizle */}
      {!isKeyboardVisible && <BottomNavigation />}

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
                  <Text style={styles.infoDialogTitle}>Location Verification System</Text>
                  {/* <TouchableOpacity onPress={() => setShowInfoDialog(false)}>
                    <Ionicons name="close" size={24} color="#000" />
                  </TouchableOpacity> */}
                </View>

                <Text style={styles.infoDialogDescription}>
                  RecycleApp uses location verification to ensure that waste removal is real and accurate.
                </Text>

                <View style={styles.infoStep}>
                  <View style={styles.infoStepNumber}>
                    <Text style={styles.infoStepNumberText}>1</Text>
                  </View>
                  <Text style={styles.infoStepText}>
                    When reporting waste, the app takes your location and defines a 30-meter radius around you.
                  </Text>
                </View>

                <View style={styles.infoStep}>
                  <View style={styles.infoStepNumber}>
                    <Text style={styles.infoStepNumberText}>2</Text>
                  </View>
                  <Text style={styles.infoStepText}>
                    The waste point can only be marked within this area, which confirms that the waste is actually there.
                  </Text>
                </View>

                <View style={styles.infoStep}>
                  <View style={styles.infoStepNumber}>
                    <Text style={styles.infoStepNumberText}>3</Text>
                  </View>
                  <Text style={styles.infoStepText}>
                    When cleaning, you must be within 100 meters of the waste point.
                  </Text>
                </View>

                <View style={styles.infoStep}>
                  <View style={styles.infoStepNumber}>
                    <Text style={styles.infoStepNumberText}>4</Text>
                  </View>
                  <Text style={styles.infoStepText}>
                    This system prevents false reports and cleanings, ensuring the reliability of the app.
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
                  <Text style={styles.infoDialogButtonText}>Let's Clean Up</Text>
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
            <Text style={styles.errorModalTitle}>Error</Text>
            <Text style={styles.errorModalMessage}>{errorMessage}</Text>
            <TouchableOpacity 
              style={styles.errorModalButton}
              onPress={() => closeErrorModal()}
            >
              <Text style={styles.errorModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* No Waste Points Modal */}
      <Modal
        visible={showNoSpotsModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNoSpotsModal(false)}
      >
        <View style={styles.errorModalOverlay}>
          <View style={styles.noSpotsModalContainer}>
            <Text style={styles.noSpotsModalTitle}>No waste points to display in this field.</Text>
            <TouchableOpacity 
              style={styles.noSpotsModalButton}
              onPress={() => setShowNoSpotsModal(false)}
            >
              <Text style={styles.noSpotsModalButtonText}>OK</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Filtreleme Paneli */}
      <Modal
        visible={showFilterPanel}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterPanel(false)}
      >
        <View style={styles.filterModalOverlay}>
          <View style={styles.filterModalContainer}>
            <View style={styles.filterHeader}>
              <Text style={styles.filterTitle}>Filters</Text>
              <TouchableOpacity onPress={() => setShowFilterPanel(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.filterScrollView}>
              {/* Atık Durumu Filtresi */}
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Trash Status</Text>
                
                <View style={styles.filterOption}>
                  <View style={styles.filterOptionLeft}>
                    <View style={[styles.statusIndicator, { backgroundColor: '#E74C3C' }]} />
                    <Text style={styles.filterOptionText}>Reported Trash</Text>
                  </View>
                  <Switch
                    trackColor={{ false: '#dddddd', true: '#4B936380' }}
                    thumbColor={showReportedTrash ? '#4B9363' : '#f4f3f4'}
                    onValueChange={() => setShowReportedTrash(!showReportedTrash)}
                    value={showReportedTrash}
                  />
                </View>
                
                <View style={styles.filterOption}>
                  <View style={styles.filterOptionLeft}>
                    <View style={[styles.statusIndicator, { backgroundColor: '#4B9363' }]} />
                    <Text style={styles.filterOptionText}>Cleaned Trash</Text>
                  </View>
                  <Switch
                    trackColor={{ false: '#dddddd', true: '#4B936380' }}
                    thumbColor={showCleanedTrash ? '#4B9363' : '#f4f3f4'}
                    onValueChange={() => setShowCleanedTrash(!showCleanedTrash)}
                    value={showCleanedTrash}
                  />
                </View>
              </View>

              {/* Tarih Filtresi */}
              <View style={styles.filterSection}>
                <View style={styles.filterSectionTitleRow}>
                  <Text style={styles.filterSectionTitle}>Date Filter</Text>
                  <Switch
                    trackColor={{ false: '#dddddd', true: '#4B936380' }}
                    thumbColor={useDateFilter ? '#4B9363' : '#f4f3f4'}
                    onValueChange={() => setUseDateFilter(!useDateFilter)}
                    value={useDateFilter}
                  />
                </View>

                <View style={styles.dateRangeContainer}>
                  <TouchableOpacity 
                    style={[styles.dateRangeButton, !useDateFilter && styles.disabledButton]}
                    onPress={() => openDatePicker('start')}
                  >
                    <View style={styles.dateRangeButtonInner}>
                      <View style={styles.dateRangeIconLabel}>
                        <FontAwesome name="calendar-o" size={16} color={useDateFilter ? "#4B9363" : "#999"} />
                        <Text style={styles.dateRangeLabel}>Start Date:</Text>
                      </View>
                      <Text style={[styles.dateRangeValue, !useDateFilter && styles.disabledButtonText]}>
                        {startDate ? startDate.toLocaleDateString() : 'Not Selected'}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <View style={styles.dateRangeSeparator}>
                    <View style={styles.dateRangeLine} />
                    <Text style={styles.dateRangeSeparatorText}>and</Text>
                    <View style={styles.dateRangeLine} />
                  </View>

                  <TouchableOpacity 
                    style={[styles.dateRangeButton, !useDateFilter && styles.disabledButton]}
                    onPress={() => openDatePicker('end')}
                  >
                    <View style={styles.dateRangeButtonInner}>
                      <View style={styles.dateRangeIconLabel}>
                        <FontAwesome name="calendar-o" size={16} color={useDateFilter ? "#4B9363" : "#999"} />
                        <Text style={styles.dateRangeLabel}>End Date:</Text>
                      </View>
                      <Text style={[styles.dateRangeValue, !useDateFilter && styles.disabledButtonText]}>
                        {endDate ? endDate.toLocaleDateString() : 'Not Selected'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                </View>

                {/* {useDateFilter && (
                  <View style={styles.dateRangeHint}>
                    <Ionicons name="information-circle-outline" size={16} color="#4B9363" />
                    <Text style={styles.dateRangeHintText}>
                      {startDate && endDate 
                        ? `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()} dates will be shown.`
                        : 'You can filter by selecting a date range.'}
                    </Text>
                  </View>
                )} */}
              </View>

              {/* Filtreleme Hakkında Bilgiler
              <View style={styles.filterInfoContainer}>
                <View style={styles.filterInfoHeader}>
                  <Ionicons name="information-circle" size={20} color="#4B9363" />
                  <Text style={styles.filterInfoTitle}>Map Markings</Text>
                </View>
                
                <View style={styles.filterLegendContainer}>
                  <View style={styles.filterLegendItem}>
                    <View style={[styles.statusIndicator, { backgroundColor: '#E74C3C' }]} />
                    <Text style={styles.filterLegendText}>Reported Trash</Text>
                  </View>
                  <View style={styles.filterLegendItem}>
                    <View style={[styles.statusIndicator, { backgroundColor: '#4B9363' }]} />
                    <Text style={styles.filterLegendText}>Cleaned Trash</Text>
                  </View>
                </View>
                
                <View style={styles.filterHintBox}>
                  <Ionicons name="time-outline" size={18} color="#4B9363" />
                  <Text style={styles.filterHintText}>
                    When the date filter is active, the reports for the selected date range will be shown.
                  </Text>
                </View>
              </View> */}

            </ScrollView>

            {/* Butonlar */}
            <View style={styles.filterButtonBar}>
              <TouchableOpacity 
                style={styles.filterButtonReset}
                onPress={resetFilters}
              >
                <Ionicons name="refresh-outline" size={18} color="#666" />
                <Text style={styles.filterButtonResetText}>Reset</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.filterButtonApply}
                onPress={applyFilterChanges}
              >
                <Ionicons name="checkmark" size={18} color="#FFF" />
                <Text style={styles.filterButtonApplyText}>Apply</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* DatePicker Modal */}
      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDatePicker(false)}
      >
        <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
          <View style={styles.datePickerOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.datePickerContainer}>
                <Text style={styles.datePickerTitle}>
                  {datePickerType === 'start' ? 'Start Date' : 'End Date'} Select
                </Text>
                
                <View style={styles.calendarContainer}>
                  {/* Yıl ve Ay Seçici */}
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity 
                      style={styles.yearMonthSelector}
                      onPress={() => {
                        setSelectedMonth(selectedMonth === 0 ? 11 : selectedMonth - 1);
                        if (selectedMonth === 0) {
                          setSelectedYear(selectedYear - 1);
                        }
                      }}
                    >
                      <Ionicons name="chevron-back" size={24} color="#4B9363" />
                    </TouchableOpacity>
                    
                    <Text style={styles.yearMonthText}>
                      {getMonthName(selectedMonth)} {selectedYear}
                    </Text>
                    
                    <TouchableOpacity 
                      style={styles.yearMonthSelector}
                      onPress={() => {
                        setSelectedMonth(selectedMonth === 11 ? 0 : selectedMonth + 1);
                        if (selectedMonth === 11) {
                          setSelectedYear(selectedYear + 1);
                        }
                      }}
                    >
                      <Ionicons name="chevron-forward" size={24} color="#4B9363" />
                    </TouchableOpacity>
                  </View>

                  {/* Haftanın Günleri */}
                  <View style={styles.weekDaysContainer}>
                    {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day, index) => (
                      <Text key={index} style={styles.weekDayText}>{day}</Text>
                    ))}
                  </View>

                  {/* Takvim Günleri */}
                  <View style={styles.calendarDaysContainer}>
                    {renderCalendarDays()}
                  </View>

                  {/* Hızlı Erişim Butonları */}
                  <View style={styles.quickAccessContainer}>
                    <TouchableOpacity 
                      style={styles.quickAccessButton}
                      onPress={() => {
                        const today = new Date();
                        setSelectedYear(today.getFullYear());
                        setSelectedMonth(today.getMonth());
                        setSelectedDay(today.getDate());
                      }}
                    >
                      <Text style={styles.quickAccessButtonText}>Today</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.quickAccessButton}
                      onPress={() => {
                        // Önceki yıl
                        setSelectedYear(selectedYear - 1);
                      }}
                    >
                      <Text style={styles.quickAccessButtonText}>-1 Year</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity 
                      style={styles.quickAccessButton}
                      onPress={() => {
                        // Sonraki yıl
                        setSelectedYear(selectedYear + 1);
                      }}
                    >
                      <Text style={styles.quickAccessButtonText}>+1 Year</Text>
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.datePickerButtonsRow}>
                  <TouchableOpacity 
                    style={styles.datePickerCancelButton}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.datePickerCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={styles.datePickerConfirmButton}
                    onPress={handleDateChange}
                  >
                    <Text style={styles.datePickerConfirmButtonText}>Apply</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
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
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'space-between',
    // backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 24,
    paddingHorizontal: 16,
    flex: 1,
    marginRight: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1.5,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 16,
    paddingVertical: 10,
    color: '#333',
  },
  searchLoader: {
    marginLeft: 8,
  },
  optionsButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4B9363',
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
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
    paddingHorizontal: 24,
    paddingBottom: 8,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  topButton: {
    width: 40,
    height: 40,
    top: 24,
    borderRadius: 8,
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
    bottom: 100, // BottomNavigation'ın üzerinde
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 8,
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  reportButton: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 1)', // Yarı şeffaf beyaz
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    // justifyContent: 'center',
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
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    alignItems: 'center',
    // justifyContent: 'center',
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
    textAlign: 'center',
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
    left: 24,
    bottom: 80,
    backgroundColor: '#4B9363',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
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
    borderRadius: 12,
    marginHorizontal: 24,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  suggestionHeader: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#F9F9F9',
  },
  suggestionHeaderText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4B9363',
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
    backgroundColor: '#FFFFFF',
  },
  suggestionIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(75, 147, 99, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  suggestionContent: {
    flex: 1,
  },
  suggestionText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
    marginBottom: 4,
  },
  suggestionSubtext: {
    fontSize: 12,
    color: '#666',
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
    right: 24,
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
    borderColor: '#ddd',
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
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    // backgroundColor: '#E8E8E8',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noSpotsModalContainer: {
    width: '85%',
    backgroundColor: 'white',
    borderRadius: 10,
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
  noSpotsModalTitle: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    color: '#333',
    marginBottom: 20,
    lineHeight: 22,
  },
  noSpotsModalButton: {
    backgroundColor: '#4B9363',
    paddingHorizontal: 40,
    paddingVertical: 10,
    borderRadius: 8,
  },
  noSpotsModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  zoomControlContainer: {
    position: 'absolute',
    right: 24,
    bottom: 120, // BottomNavigation'ın üzerinde
    backgroundColor: 'rgba(255, 255, 255, 1)',
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  zoomButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomButtonDivider: {
    height: 1,
    // backgroundColor: '#E8E8E8',
  },
  // Filtreleme Paneli Stilleri
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModalContainer: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingVertical: 20,
    paddingHorizontal: 16,
    maxHeight: '80%',
  },
  filterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B9363',
  },
  filterScrollView: {
    maxHeight: 500,
  },
  filterSection: {
    marginTop: 8,
    marginBottom: 4,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  filterSectionTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  filterOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  filterOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 16,
    height: 16,
    borderRadius: 8,
    marginRight: 10,
  },
  filterOptionText: {
    fontSize: 15,
    color: '#444',
  },
  dateRangeContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  dateRangeButton: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#FAFAFA',
  },
  dateRangeButtonInner: {
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRangeIconLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  dateRangeLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginLeft: 8,
  },
  dateRangeValue: {
    fontSize: 14,
    color: '#4B9363',
    fontWeight: '500',
  },
  dateRangeSeparator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 8,
  },
  dateRangeLine: {
    height: 1,
    backgroundColor: '#E8E8E8',
    flex: 1,
  },
  dateRangeSeparatorText: {
    color: '#999',
    fontSize: 12,
    marginHorizontal: 8,
  },
  dateRangeHint: {
    flexDirection: 'row',
    backgroundColor: '#F0F9F0',
    padding: 8,
    borderRadius: 6,
    marginTop: 8,
    alignItems: 'flex-start',
  },
  dateRangeHintText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    flex: 1,
    lineHeight: 16,
  },
  calendarNavButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  datePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  datePickerContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    width: '85%',
    alignItems: 'center',
  },
  datePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#4B9363',
  },
  datePickerButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  datePickerCancelButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  datePickerCancelButtonText: {
    color: '#555',
    fontSize: 16,
  },
  datePickerConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#4B9363',
    marginLeft: 8,
  },
  datePickerConfirmButtonText: {
    color: 'white',
    fontSize: 16,
  },
  // Tarih Seçici Modal Stilleri
  customDatePicker: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  datePickerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flex: 1,
  },
  datePickerLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    width: 60,
  },
  datePickerValue: {
    fontSize: 16,
    fontWeight: '500',
    width: 100,
    textAlign: 'center',
  },
  filterInfoContainer: {
    marginTop: 16,
    marginBottom: 8,
    padding: 16,
    backgroundColor: '#F0F9F0',
    borderRadius: 8,
  },
  filterInfoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  filterInfoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4B9363',
    marginLeft: 8,
  },
  filterLegendContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  filterLegendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  filterLegendText: {
    fontSize: 14,
    color: '#333',
    marginLeft: 8,
  },
  filterHintBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 8,
  },
  filterHintText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  filterButtonBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#EFEFEF',
  },
  filterButtonReset: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    marginRight: 8,
  },
  filterButtonResetText: {
    color: '#666',
    fontSize: 16,
    marginLeft: 8,
  },
  filterButtonApply: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#4B9363',
    marginLeft: 8,
  },
  filterButtonApplyText: {
    color: '#fff',
    fontSize: 16,
    marginLeft: 8,
  },
  calendarContainer: {
    width: '100%',
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 16,
    marginVertical: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  yearMonthSelector: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  yearMonthText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  weekDayText: {
    width: '14%', // 7 günün her biri için
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    marginBottom: 8,
  },
  calendarDaysContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  quickAccessContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 16,
    flexWrap: 'wrap',
  },
  quickAccessButton: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  quickAccessButtonText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#4B9363',
  },
  calendarDay: {
    width: '14%', // 7 günün her biri için
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  selectedCalendarDay: {
    backgroundColor: '#4B9363',
    borderRadius: 20,
  },
  calendarDayText: {
    fontSize: 14,
    color: '#333',
  },
  selectedCalendarDayText: {
    color: '#FFF',
    fontWeight: '500',
  },
  searchMarkerContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    padding: 8,
    borderRadius: 8,
  },
  searchMarker: {
    width: '100%',
    height: 4,
    backgroundColor: '#28BBE3',
    borderRadius: 4,
  },
  searchMarkerBottom: {
    width: '100%',
    height: 4,
    backgroundColor: '#28BBE3',
    borderRadius: 4,
    marginTop: 4,
  },
}); 