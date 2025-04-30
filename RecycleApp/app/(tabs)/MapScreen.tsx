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
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import BottomNavigation from '../../components/BottomNavigation';
import MapView, { Marker, PROVIDER_GOOGLE, Circle } from 'react-native-maps';
import * as Location from 'expo-location';
import { router } from 'expo-router';

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

export default function MapScreen() {
  const mapRef = useRef<MapView>(null);
  const [region, setRegion] = useState(INITIAL_REGION);
  const [userLocation, setUserLocation] = useState<LocationCoords | null>(null);
  const [showCircle, setShowCircle] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<LocationCoords | null>(null);
  const [showConfirmButton, setShowConfirmButton] = useState(false);
  const [markers, setMarkers] = useState([
    {
      id: 1,
      coordinate: {
        latitude: 40.7558,
        longitude: 30.3954,
      },
      title: 'Plastik Atık',
      description: 'Plastik şişeler ve ambalajlar',
      pinColor: '#4B9363'
    },
    {
      id: 2,
      coordinate: {
        latitude: 40.7658,
        longitude: 30.4054,
      },
      title: 'Kağıt Atık',
      description: 'Kağıt ve karton atıklar',
      pinColor: '#4B9363'
    },
    {
      id: 3,
      coordinate: {
        latitude: 40.7758,
        longitude: 30.3854,
      },
      title: 'Tehlikeli Atık',
      description: 'Kesici ve delici atıklar',
      pinColor: '#FF0000'
    }
  ]);

  const requestLocationPermission = async () => {
    try {
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
      const newRegion = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0015,
        longitudeDelta: 0.0015
      };
      
      mapRef.current?.animateToRegion(newRegion, 200);
      
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
      Alert.alert('Hata', 'Konumunuz alınamadı. Lütfen tekrar deneyin.');
    }
  };

  const handleReportSpot = async () => {
    const hasPermission = await requestLocationPermission();
    if (hasPermission) {
      await getCurrentLocation();
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
    if (showCircle && userLocation) {
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
    }
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
            placeholder="Search"
            placeholderTextColor="#999"
          />
        </View>
        <TouchableOpacity style={styles.optionsButton}>
          <Ionicons name="options-outline" size={24} color="#000" />
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
          {markers.map(marker => (
            <Marker
              key={marker.id}
              coordinate={marker.coordinate}
              title={marker.title}
              description={marker.description}
              pinColor={marker.pinColor}
              onPress={() => router.push('/(tabs)/TrashDetailPage')}
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

        {/* Sol Alt Menü Butonu */}
        <TouchableOpacity style={styles.menuButton}>
          <Ionicons name="menu" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Sağ Alt Navigasyon Butonu */}
        <TouchableOpacity style={styles.navButton}>
          <Ionicons name="navigate" size={24} color="#fff" />
        </TouchableOpacity>

        {/* Onay Butonu */}
        {showConfirmButton && (
          <TouchableOpacity 
            style={styles.confirmButton}
            onPress={handleConfirmLocation}
          >
            <Text style={styles.confirmButtonText}>Bu Konumu Onayla</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Alt Butonlar */}
      <View style={styles.bottomButtons}>
        <TouchableOpacity style={styles.reportButton} onPress={handleReportSpot}>
          <MaterialCommunityIcons name="trash-can" size={20} color="#4B9363" />
          <Text style={styles.buttonText}>Report Spot</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.viewButton}>
          <Text style={styles.viewButtonText}>View Spots Near</Text>
        </TouchableOpacity>
      </View>

      {/* Bottom Navigation */}
      <BottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
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
    width: '100%',
    height: '100%',
  },
  menuButton: {
    position: 'absolute',
    left: 16,
    bottom: 24,
    width: 48,
    height: 48,
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
    zIndex: 10,
  },
  navButton: {
    position: 'absolute',
    right: 16,
    bottom: 24,
    width: 48,
    height: 48,
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
    zIndex: 10,
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
  bottomButtons: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 12,
    justifyContent: 'space-between',
  },
  reportButton: {
    flexDirection: 'row',
    backgroundColor: '#fff',
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
  viewButton: {
    backgroundColor: '#fff',
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
  },
}); 