import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  Image,
  ScrollView,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import BottomNavigation from '../../components/BottomNavigation';
import MapView, { Marker } from 'react-native-maps';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Örnek atık resimleri
const dummyImages = [
  require('../../assets/images/trash000001.jpg'),
  require('../../assets/images/plastic-waste.jpg'),
  require('../../assets/images/trash000001.jpg'),
  require('../../assets/images/plastic-waste.jpg'),
  require('../../assets/images/trash000001.jpg'),
];

export default function TrashReportPage() {
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 40.7429,
    longitude: 30.3273,
  });
  const [selectedType, setSelectedType] = useState<number | null>(null);
  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');

  // Kamera ile fotoğraf çekme
  const handleTakePhoto = () => {
    // Burada kamera fonksiyonalitesi eklenecek
    console.log('Kamera açılıyor...');
  };

  // Form gönderimi
  const handleSubmit = () => {
    console.log('Atık raporu oluşturuluyor...');
    console.log({
      location: selectedLocation,
      type: selectedType,
      quantity: selectedQuantity,
      additionalInfo,
    });
    
    // Burada form verilerini API'ye gönderme işlemi yapılabilir
    
    // Başarılı gönderim sonrası ana sayfaya dönüş
    router.replace('/HomePage');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="chevron-back" size={24} color="#4B9363" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TRASH REPORT</Text>
        <TouchableOpacity style={styles.infoButton}>
          <Ionicons name="information-circle-outline" size={24} color="#4B9363" />
        </TouchableOpacity>
      </View>

      {/* Main Content - Scrollable */}
      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Map Section */}
        <View style={styles.mapContainer}>
          <MapView
            style={styles.map}
            initialRegion={{
              latitude: selectedLocation.latitude,
              longitude: selectedLocation.longitude,
              latitudeDelta: 0.01,
              longitudeDelta: 0.01,
            }}
            customMapStyle={[
              {
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#212121"
                  }
                ]
              },
              {
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#757575"
                  }
                ]
              },
              {
                "elementType": "labels.text.stroke",
                "stylers": [
                  {
                    "color": "#212121"
                  }
                ]
              },
              {
                "featureType": "administrative",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#757575"
                  }
                ]
              },
              {
                "featureType": "administrative.country",
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#9e9e9e"
                  }
                ]
              },
              {
                "featureType": "administrative.locality",
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#bdbdbd"
                  }
                ]
              },
              {
                "featureType": "poi",
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#757575"
                  }
                ]
              },
              {
                "featureType": "poi.park",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#181818"
                  }
                ]
              },
              {
                "featureType": "poi.park",
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#616161"
                  }
                ]
              },
              {
                "featureType": "poi.park",
                "elementType": "labels.text.stroke",
                "stylers": [
                  {
                    "color": "#1b1b1b"
                  }
                ]
              },
              {
                "featureType": "road",
                "elementType": "geometry.fill",
                "stylers": [
                  {
                    "color": "#2c2c2c"
                  }
                ]
              },
              {
                "featureType": "road",
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#8a8a8a"
                  }
                ]
              },
              {
                "featureType": "road.arterial",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#373737"
                  }
                ]
              },
              {
                "featureType": "road.highway",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#3c3c3c"
                  }
                ]
              },
              {
                "featureType": "road.highway.controlled_access",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#4e4e4e"
                  }
                ]
              },
              {
                "featureType": "road.local",
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#616161"
                  }
                ]
              },
              {
                "featureType": "transit",
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#757575"
                  }
                ]
              },
              {
                "featureType": "water",
                "elementType": "geometry",
                "stylers": [
                  {
                    "color": "#000000"
                  }
                ]
              },
              {
                "featureType": "water",
                "elementType": "labels.text.fill",
                "stylers": [
                  {
                    "color": "#3d3d3d"
                  }
                ]
              }
            ]}
          >
            <Marker
              coordinate={selectedLocation}
              pinColor="#4B9363"
            />
          </MapView>
        </View>

        {/* Camera Button */}
        <View style={styles.cameraButtonContainer}>
          <TouchableOpacity style={styles.cameraButton} onPress={handleTakePhoto}>
            <Ionicons name="camera" size={36} color="#4B9363" />
          </TouchableOpacity>
        </View>

        {/* Trash Images Section */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Trash Images</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imagesScroll}>
            {dummyImages.map((image, index) => (
              <Image
                key={index}
                source={image}
                style={styles.trashImage}
              />
            ))}
          </ScrollView>
        </View>

        {/* Location Info */}
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            You are about to create a waste point at the location you have selected.
          </Text>
        </View>

        {/* Waste Type Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Please select the type of waste.</Text>
          <View style={styles.wasteTypesGrid}>
            <TouchableOpacity
              style={[styles.wasteTypeItem, selectedType === 1 && styles.selectedItem]}
              onPress={() => setSelectedType(selectedType === 1 ? null : 1)}
            >
              <MaterialIcons
                name="directions-car"
                size={28}
                color={selectedType === 1 ? '#4B9363' : '#555'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.wasteTypeItem, selectedType === 2 && styles.selectedItem]}
              onPress={() => setSelectedType(selectedType === 2 ? null : 2)}
            >
              <MaterialIcons
                name="time-to-leave"
                size={28}
                color={selectedType === 2 ? '#4B9363' : '#555'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.wasteTypeItem, selectedType === 3 && styles.selectedItem]}
              onPress={() => setSelectedType(selectedType === 3 ? null : 3)}
            >
              <MaterialIcons
                name="local-drink"
                size={28}
                color={selectedType === 3 ? '#4B9363' : '#555'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.wasteTypeItem, selectedType === 4 && styles.selectedItem]}
              onPress={() => setSelectedType(selectedType === 4 ? null : 4)}
            >
              <MaterialIcons
                name="description"
                size={28}
                color={selectedType === 4 ? '#4B9363' : '#555'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.wasteTypeItem, selectedType === 5 && styles.selectedItem]}
              onPress={() => setSelectedType(selectedType === 5 ? null : 5)}
            >
              <MaterialIcons
                name="masks"
                size={28}
                color={selectedType === 5 ? '#4B9363' : '#555'}
              />
            </TouchableOpacity>
          </View>
          <View style={styles.wasteTypesGrid}>
            <TouchableOpacity
              style={[styles.wasteTypeItem, selectedType === 6 && styles.selectedItem]}
              onPress={() => setSelectedType(selectedType === 6 ? null : 6)}
            >
              <MaterialIcons
                name="liquor"
                size={28}
                color={selectedType === 6 ? '#4B9363' : '#555'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.wasteTypeItem, selectedType === 7 && styles.selectedItem]}
              onPress={() => setSelectedType(selectedType === 7 ? null : 7)}
            >
              <MaterialIcons
                name="smoking-rooms"
                size={28}
                color={selectedType === 7 ? '#4B9363' : '#555'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.wasteTypeItem, selectedType === 8 && styles.selectedItem]}
              onPress={() => setSelectedType(selectedType === 8 ? null : 8)}
            >
              <MaterialIcons
                name="pest-control"
                size={28}
                color={selectedType === 8 ? '#4B9363' : '#555'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.wasteTypeItem, selectedType === 9 && styles.selectedItem]}
              onPress={() => setSelectedType(selectedType === 9 ? null : 9)}
            >
              <MaterialIcons
                name="recycling"
                size={28}
                color={selectedType === 9 ? '#4B9363' : '#555'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.wasteTypeItem, selectedType === 10 && styles.selectedItem]}
              onPress={() => setSelectedType(selectedType === 10 ? null : 10)}
            >
              <MaterialIcons
                name="delete"
                size={28}
                color={selectedType === 10 ? '#4B9363' : '#555'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Waste Quantity Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Please select the quantity of waste.</Text>
          <View style={styles.wasteQuantityGrid}>
            <TouchableOpacity
              style={[styles.wasteQuantityItem, selectedQuantity === 1 && styles.selectedItem]}
              onPress={() => setSelectedQuantity(selectedQuantity === 1 ? null : 1)}
            >
              <MaterialIcons
                name="delete"
                size={24}
                color={selectedQuantity === 1 ? '#4B9363' : '#555'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.wasteQuantityItem, selectedQuantity === 2 && styles.selectedItem]}
              onPress={() => setSelectedQuantity(selectedQuantity === 2 ? null : 2)}
            >
              <MaterialIcons
                name="delete"
                size={24}
                color={selectedQuantity === 2 ? '#4B9363' : '#555'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.wasteQuantityItem, selectedQuantity === 3 && styles.selectedItem]}
              onPress={() => setSelectedQuantity(selectedQuantity === 3 ? null : 3)}
            >
              <MaterialIcons
                name="delete"
                size={24}
                color={selectedQuantity === 3 ? '#4B9363' : '#555'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.wasteQuantityItem, selectedQuantity === 4 && styles.selectedItem]}
              onPress={() => setSelectedQuantity(selectedQuantity === 4 ? null : 4)}
            >
              <MaterialIcons
                name="delete"
                size={24}
                color={selectedQuantity === 4 ? '#4B9363' : '#555'}
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.wasteQuantityItem, selectedQuantity === 5 && styles.selectedItem]}
              onPress={() => setSelectedQuantity(selectedQuantity === 5 ? null : 5)}
            >
              <MaterialIcons
                name="delete"
                size={24}
                color={selectedQuantity === 5 ? '#4B9363' : '#555'}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Additional Information */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>If you want to give information about waste:</Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholder="Add additional information here..."
            placeholderTextColor="#AAA"
            value={additionalInfo}
            onChangeText={setAdditionalInfo}
          />
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity style={styles.cancelButton} onPress={() => router.back()}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.confirmButton, (!selectedType || !selectedQuantity) && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={!selectedType || !selectedQuantity}
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
    backgroundColor: '#FFF',
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  infoButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },
  mapContainer: {
    width: '100%',
    height: 250,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraButtonContainer: {
    alignItems: 'center',
    marginTop: -30,
    marginBottom: 10,
  },
  cameraButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  sectionContainer: {
    paddingHorizontal: 16,
    marginTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
  },
  imagesScroll: {
    marginBottom: 8,
  },
  trashImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 8,
  },
  locationInfo: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  locationText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  wasteTypesGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  wasteTypeItem: {
    width: (SCREEN_WIDTH - 40) / 5,
    height: (SCREEN_WIDTH - 40) / 5,
    backgroundColor: '#ECECEC',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  wasteQuantityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  wasteQuantityItem: {
    width: (SCREEN_WIDTH - 40) / 5,
    height: (SCREEN_WIDTH - 40) / 5,
    backgroundColor: '#ECECEC',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedItem: {
    backgroundColor: '#E6F4EA',
    borderWidth: 1,
    borderColor: '#4B9363',
  },
  textInput: {
    backgroundColor: '#ECECEC',
    borderRadius: 8,
    padding: 12,
    height: 100,
    fontSize: 16,
    color: '#333',
    marginBottom: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#4B9363',
    borderRadius: 6,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#4B9363',
    fontWeight: '500',
    fontSize: 16,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 14,
    backgroundColor: '#4B9363',
    borderRadius: 6,
    alignItems: 'center',
    marginLeft: 8,
  },
  disabledButton: {
    backgroundColor: '#AAA',
  },
  confirmButtonText: {
    color: '#FFF',
    fontWeight: '500',
    fontSize: 16,
  },
  bottomSpacing: {
    height: 80, // Provides space for bottom navigation
  },
}); 