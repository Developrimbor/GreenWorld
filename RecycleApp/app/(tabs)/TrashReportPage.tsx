import React, { useState, useEffect } from 'react';
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
  Alert,
  Platform,
  PermissionsAndroid,
  Modal,
  ActivityIndicator,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import MapView, { Marker } from 'react-native-maps';
import * as ImagePicker from 'expo-image-picker';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableFlatList, { RenderItemParams } from 'react-native-draggable-flatlist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { addDoc, collection, updateDoc, increment, doc, serverTimestamp } from 'firebase/firestore';
import { db, auth } from '../config/firebase';
import { storage } from '../config/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import IconifyHelpCircleIcon from '../../components/ui/IconifyHelpCircleIcon';
import IconifyExampleIcon from '../../components/ui/IconifyExampleIcon';
import IconifyGarbageIcon from '../../components/ui/IconifyGarbage';
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
import IconifyGarbageTruckIcon from '../../components/ui/IconifyGarbageTruck';

const SCREEN_WIDTH = Dimensions.get('window').width;

// Örnek atık resimleri (yorum satırına alındı)
// const dummyImages = [
//   require('../../assets/images/trash000001.jpg'),
//   require('../../assets/images/plastic-waste.jpg'),
//   require('../../assets/images/trash000001.jpg'),
//   require('../../assets/images/plastic-waste.jpg'),
//   require('../../assets/images/trash000001.jpg'),
// ];

interface ImageItem {
  id: string;
  uri: string;
}

const CAMERA_PERMISSION_KEY = 'CAMERA_PERMISSION_GRANTED';
const GALLERY_PERMISSION_KEY = 'GALLERY_PERMISSION_GRANTED';

const checkPermission = async (key: string) => {
  const value = await AsyncStorage.getItem(key);
  return value === 'true';
};

const setPermission = async (key: string, granted: boolean) => {
  await AsyncStorage.setItem(key, granted ? 'true' : 'false');
};

export default function TrashReportPage() {
  const params = useLocalSearchParams();
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: params.latitude ? parseFloat(params.latitude as string) : 40.7429,
    longitude: params.longitude ? parseFloat(params.longitude as string) : 30.3273,
  });
  const [selectedTypes, setSelectedTypes] = useState<{ [key: number]: number }>({});
  const [selectedQuantity, setSelectedQuantity] = useState<number | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState('');
  const [images, setImages] = useState<ImageItem[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showAllWasteTypes, setShowAllWasteTypes] = useState(false);
  const [wasteTypesAnim] = useState(new Animated.Value(0));
  const [infoModalVisible, setInfoModalVisible] = useState(false);
  const [wasteGuideVisible, setWasteGuideVisible] = useState(false);
  const [customModal, setCustomModal] = useState<{visible: boolean, title: string, message: string, onOk?: () => void}>({visible: false, title: '', message: ''});
  const [quantityModalVisible, setQuantityModalVisible] = useState(false);
  const [selectedBagQuantity, setSelectedBagQuantity] = useState<string | null>(null);
  const [tempBagQuantity, setTempBagQuantity] = useState<string | null>(null);
  const [truckSelected, setTruckSelected] = useState(false);

  useEffect(() => {
    if (params.latitude && params.longitude) {
      setSelectedLocation({
        latitude: parseFloat(params.latitude as string),
        longitude: parseFloat(params.longitude as string),
      });
    }
  }, []);

  const requestCameraPermission = async () => {
    if (Platform.OS === 'android') {
      const alreadyGranted = await checkPermission(CAMERA_PERMISSION_KEY);
      if (alreadyGranted) return true;
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.CAMERA,
          {
            title: 'Kamera İzni',
            message: 'Uygulamanın kameraya erişmesine izin vermeniz gerekiyor.',
            buttonNeutral: 'Daha Sonra Sor',
            buttonNegative: 'İptal',
            buttonPositive: 'Tamam',
          },
        );
        const isGranted = granted === PermissionsAndroid.RESULTS.GRANTED;
        await setPermission(CAMERA_PERMISSION_KEY, isGranted);
        return isGranted;
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
    return true;
  };

  const handleTakePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert('İzin reddedildi', 'Kamera erişimi için izin vermeniz gerekiyor.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!result.canceled && result.assets) {
      setImages(prev => [...prev, { id: Date.now().toString(), uri: result.assets[0].uri }]);
    }
  };

  const handleDeleteImage = (id: string) => {
    setImages(images.filter(img => img.id !== id));
  };

  const handleDragEnd = ({ data }: { data: ImageItem[] }) => {
    setImages(data);
  };

  // Form gönderimi
  const handleSubmit = async () => {
    if (!selectedTypes || images.length === 0) {
      Alert.alert('Eksik bilgi', 'Lütfen tüm alanları doldurun ve en az bir görsel ekleyin.');
      return;
    }

    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        Alert.alert('Error', 'You must be logged in to report trash');
        return;
      }

      // Önce resimleri Firebase Storage'a yükle
      const uploadPromises = images.map(async (image) => {
        const response = await fetch(image.uri);
        const blob = await response.blob();
        
        const fileName = `trash_images/${Date.now()}_${Math.random().toString(36).substr(2, 9)}.jpg`;
        const imageRef = ref(storage, fileName);
        
        await uploadBytes(imageRef, blob);
        return getDownloadURL(imageRef);
      });

      const imageUrls = await Promise.all(uploadPromises);

      const reportData = {
        location: selectedLocation,
        type: selectedTypes,
        quantity: selectedQuantity,
        additionalInfo,
        imageUrls: imageUrls, // Artık Firebase Storage URL'lerini kullanıyoruz
        status: 'reported',
        authorId: currentUser.uid,
        createdAt: new Date(),
      };

      // Trash report'u Firebase'e kaydet
      const docRef = await addDoc(collection(db, 'trashReports'), reportData);

      // Kullanıcının reported sayısını ve puanını güncelle
      const userRef = doc(db, 'users', currentUser.uid);
      await updateDoc(userRef, {
        reported: increment(1),
        points: increment(10) // Atık bildirimi başına 10 puan
      });

      showCustomModal('Success', 'Trash report submitted successfully', () => router.replace('/(tabs)/MapScreen'));
    } catch (error) {
      console.error('Error submitting report:', error);
      showCustomModal('Error', 'Failed to submit report');
    }

    // // Kullanıcı bilgisini al
    // const user = auth.currentUser;
    // const userName = user?.displayName || user?.email || 'Anonim';

    // const trashData = {
    //   images, // [{id, uri}]
    //   type: selectedType,
    //   quantity: selectedQuantity,
    //   additionalInfo,
    //   location: selectedLocation,
    //   user: { id: user?.uid, name: userName },
    //   createdAt: serverTimestamp(),
    // };

    // try {
    //   await addDoc(collection(db, 'trashes'), trashData);
    //   router.replace('/(tabs)/MapScreen');
    // } catch (e) {
    //   Alert.alert('Hata', 'Atık kaydedilemedi.');
    // }
  };

  // Trash Images görseline tıklama
  const handleImagePress = (uri: string) => {
    setSelectedImage(uri);
    setModalVisible(true);
  };

  const renderItem = ({ item, drag, isActive }: RenderItemParams<ImageItem>) => (
    <View style={styles.imageWrapper}>
      <TouchableOpacity
        style={[styles.imageContainer, isActive && styles.activeImageContainer]}
        onLongPress={drag}
        disabled={isActive}
        activeOpacity={1}
        onPress={() => handleImagePress(item.uri)}
      >
        <Image source={{ uri: item.uri }} style={styles.image} />
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.deleteButton}
        onPress={() => handleDeleteImage(item.id)}
        activeOpacity={0.7}
      >
        <MaterialIcons name="close" size={18} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const wasteTypeIcons = [
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

  const openWasteTypes = () => {
    setShowAllWasteTypes(true);
    Animated.timing(wasteTypesAnim, {
      toValue: 1,
      duration: 340,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };
  const closeWasteTypes = () => {
    setShowAllWasteTypes(false);
    Animated.timing(wasteTypesAnim, {
      toValue: 0,
      duration: 340,
      easing: Easing.inOut(Easing.cubic),
      useNativeDriver: false,
    }).start();
  };

  const showCustomModal = (title: string, message: string, onOk?: () => void) => {
    setCustomModal({ visible: true, title, message, onOk });
  };

  const handleGarbageTruckClick = () => {
    setTruckSelected(prev => !prev);
  };

  const handleGarbageIconClick = () => {
    setTempBagQuantity(selectedBagQuantity);
    setQuantityModalVisible(true);
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
        <Text style={styles.headerTitle}>TRASH REPORT</Text>
        <TouchableOpacity style={styles.infoButton} onPress={() => setInfoModalVisible(true)}>
          <MaterialIcons name="info-outline" size={24} color="#4B9363" />
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
              latitudeDelta: 0.005,
              longitudeDelta: 0.005,
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
        {/* <View style={styles.cameraButtonContainer}>
          <TouchableOpacity style={styles.cameraButton} onPress={handleTakePhoto}>
            <Ionicons name="camera" size={30} color="#4B9363" />
          </TouchableOpacity>
        </View> */}

        {/* Trash Images Section */}
        <View style={styles.sectionAddImage}>
          
          <Text style={styles.sectionTitle}>Trash Images</Text>
          <GestureHandlerRootView>
            {images.length === 0 ? (
              <TouchableOpacity style={styles.emptyImageBox} onPress={handleTakePhoto}>
                <Ionicons name="add" size={32} color="#AAA" />
                <Text style={styles.emptyImageText}>Add Photo</Text>
              </TouchableOpacity>
            ) : (
              <DraggableFlatList
                data={images}
                onDragEnd={handleDragEnd}
                keyExtractor={(item) => item.id}
                horizontal
                showsHorizontalScrollIndicator={false}
                renderItem={renderItem}
              />
            )}
          </GestureHandlerRootView>
        </View>

        {/* Location Info */}
        <View style={styles.locationInfo}>
          <Text style={styles.locationText}>
            You are about to create a waste point at the location you have selected.
          </Text>
        </View>

        {/* Waste Type Selection */}
        <View style={styles.sectionContainer}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 8 }}>
            <TouchableOpacity onPress={() => setWasteGuideVisible(true)}>
              <Ionicons name="help-circle" size={24} color="#4B9363" style={{ marginRight: 1, left: -3 }} />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setWasteGuideVisible(true)}>
              <Text style={styles.sectionInfo}>Waste Guide  </Text>
            </TouchableOpacity>
            <Text style={styles.sectionTitle}>Please select the type of waste.</Text>
          </View>
          {/* Kısa görünüm: 9 ikon + + butonu */}
          {!showAllWasteTypes && (
            <>
              <View style={styles.wasteTypesGrid}>
                {wasteTypeIcons.slice(0, 5).map(({ key, Icon }) => {
                  const isSelected = selectedTypes[key] !== undefined;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.wasteTypeItem, isSelected && styles.selectedItem]}
                      onPress={() => {
                        setSelectedTypes(prev => {
                          const copy = { ...prev };
                          if (copy[key]) {
                            delete copy[key];
                          } else {
                            copy[key] = 1;
                          }
                          return copy;
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ alignItems: 'center' }}>
                        <Icon width={24} height={24} color={isSelected ? '#4B9363' : '#555'} />
                      </View>
                      {isSelected && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setSelectedTypes(prev => {
                                const copy = { ...prev };
                                if (copy[key] > 1) copy[key]--;
                                return copy;
                              });
                            }}
                            style={{ paddingHorizontal: 4 }}
                          >
                            <Text style={{ fontSize: 18, color: '#4B9363', fontWeight: 'bold' }}>-</Text>
                          </TouchableOpacity>
                          <Text style={{ fontSize: 14, color: '#333', minWidth: 18, textAlign: 'center' }}>{selectedTypes[key]}</Text>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setSelectedTypes(prev => {
                                const copy = { ...prev };
                                copy[key]++;
                                return copy;
                              });
                            }}
                            style={{ paddingHorizontal: 4 }}
                          >
                            <Text style={{ fontSize: 18, color: '#4B9363', fontWeight: 'bold' }}>+</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.wasteTypesGrid}>
                {wasteTypeIcons.slice(5, 9).map(({ key, Icon }) => {
                  const isSelected = selectedTypes[key] !== undefined;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.wasteTypeItem, isSelected && styles.selectedItem]}
                      onPress={() => {
                        setSelectedTypes(prev => {
                          const copy = { ...prev };
                          if (copy[key]) {
                            delete copy[key];
                          } else {
                            copy[key] = 1;
                          }
                          return copy;
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ alignItems: 'center' }}>
                        <Icon width={24} height={24} color={isSelected ? '#4B9363' : '#555'} />
                      </View>
                      {isSelected && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setSelectedTypes(prev => {
                                const copy = { ...prev };
                                if (copy[key] > 1) copy[key]--;
                                return copy;
                              });
                            }}
                            style={{ paddingHorizontal: 4 }}
                          >
                            <Text style={{ fontSize: 18, color: '#4B9363', fontWeight: 'bold' }}>-</Text>
                          </TouchableOpacity>
                          <Text style={{ fontSize: 14, color: '#333', minWidth: 18, textAlign: 'center' }}>{selectedTypes[key]}</Text>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setSelectedTypes(prev => {
                                const copy = { ...prev };
                                copy[key]++;
                                return copy;
                              });
                            }}
                            style={{ paddingHorizontal: 4 }}
                          >
                            <Text style={{ fontSize: 18, color: '#4B9363', fontWeight: 'bold' }}>+</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
                {/* + butonu */}
                <TouchableOpacity
                  style={[styles.wasteTypeItem, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#ECECEC',  }]}
                  onPress={openWasteTypes}
                >
                  <Ionicons name="add" size={26} color="#4B9363" />
                  <Text style={{ color: '#4B9363', fontWeight:'500', fontSize: 12 }}>More</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
          {/* Uzun görünüm: 10-20. ikonlar, + yerine FishingNets gelir, en altta Show less */}
          {showAllWasteTypes && (
            <Animated.View style={{
              overflow: 'hidden',
              opacity: wasteTypesAnim,
              maxHeight: wasteTypesAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [0, 600],
              }),
              transform: [
                {
                  scale: wasteTypesAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.96, 1],
                  }),
                },
                {
                  translateY: wasteTypesAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [40, 0],
                  }),
                },
              ],
            }}>
              <View style={styles.wasteTypesGrid}>
                {wasteTypeIcons.slice(0, 5).map(({ key, Icon }) => {
                  const isSelected = selectedTypes[key] !== undefined;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.wasteTypeItem, isSelected && styles.selectedItem]}
                      onPress={() => {
                        setSelectedTypes(prev => {
                          const copy = { ...prev };
                          if (copy[key]) {
                            delete copy[key];
                          } else {
                            copy[key] = 1;
                          }
                          return copy;
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ alignItems: 'center' }}>
                        <Icon width={24} height={24} color={isSelected ? '#4B9363' : '#555'} />
                      </View>
                      {isSelected && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setSelectedTypes(prev => {
                                const copy = { ...prev };
                                if (copy[key] > 1) copy[key]--;
                                return copy;
                              });
                            }}
                            style={{ paddingHorizontal: 4 }}
                          >
                            <Text style={{ fontSize: 18, color: '#4B9363', fontWeight: 'bold' }}>-</Text>
                          </TouchableOpacity>
                          <Text style={{ fontSize: 14, color: '#333', minWidth: 18, textAlign: 'center' }}>{selectedTypes[key]}</Text>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setSelectedTypes(prev => {
                                const copy = { ...prev };
                                copy[key]++;
                                return copy;
                              });
                            }}
                            style={{ paddingHorizontal: 4 }}
                          >
                            <Text style={{ fontSize: 18, color: '#4B9363', fontWeight: 'bold' }}>+</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <View style={styles.wasteTypesGrid}>
                {wasteTypeIcons.slice(5, 9).map(({ key, Icon }) => {
                  const isSelected = selectedTypes[key] !== undefined;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.wasteTypeItem, isSelected && styles.selectedItem]}
                      onPress={() => {
                        setSelectedTypes(prev => {
                          const copy = { ...prev };
                          if (copy[key]) {
                            delete copy[key];
                          } else {
                            copy[key] = 1;
                          }
                          return copy;
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ alignItems: 'center' }}>
                        <Icon width={24} height={24} color={isSelected ? '#4B9363' : '#555'} />
                      </View>
                      {isSelected && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setSelectedTypes(prev => {
                                const copy = { ...prev };
                                if (copy[key] > 1) copy[key]--;
                                return copy;
                              });
                            }}
                            style={{ paddingHorizontal: 4 }}
                          >
                            <Text style={{ fontSize: 18, color: '#4B9363', fontWeight: 'bold' }}>-</Text>
                          </TouchableOpacity>
                          <Text style={{ fontSize: 14, color: '#333', minWidth: 18, textAlign: 'center' }}>{selectedTypes[key]}</Text>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setSelectedTypes(prev => {
                                const copy = { ...prev };
                                copy[key]++;
                                return copy;
                              });
                            }}
                            style={{ paddingHorizontal: 4 }}
                          >
                            <Text style={{ fontSize: 18, color: '#4B9363', fontWeight: 'bold' }}>+</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
                {/* + yerine FishingNets */}
                <TouchableOpacity
                  style={[styles.wasteTypeItem, selectedTypes[10] !== undefined && styles.selectedItem]}
                  onPress={() => {
                    setSelectedTypes(prev => {
                      const copy = { ...prev };
                      if (copy[10]) {
                        delete copy[10];
                      } else {
                        copy[10] = 1;
                      }
                      return copy;
                    });
                  }}
                >
                  <IconifyFishingNetsIcon width={28} height={28} color={selectedTypes[10] !== undefined ? '#4B9363' : '#555'} />
                </TouchableOpacity>
              </View>
              {/* 11-15 */}
              <View style={styles.wasteTypesGrid}>
                {wasteTypeIcons.slice(10, 15).map(({ key, Icon }) => {
                  const isSelected = selectedTypes[key] !== undefined;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.wasteTypeItem, isSelected && styles.selectedItem]}
                      onPress={() => {
                        setSelectedTypes(prev => {
                          const copy = { ...prev };
                          if (copy[key]) {
                            delete copy[key];
                          } else {
                            copy[key] = 1;
                          }
                          return copy;
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ alignItems: 'center' }}>
                        <Icon width={24} height={24} color={isSelected ? '#4B9363' : '#555'} />
                      </View>
                      {isSelected && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setSelectedTypes(prev => {
                                const copy = { ...prev };
                                if (copy[key] > 1) copy[key]--;
                                return copy;
                              });
                            }}
                            style={{ paddingHorizontal: 4 }}
                          >
                            <Text style={{ fontSize: 18, color: '#4B9363', fontWeight: 'bold' }}>-</Text>
                          </TouchableOpacity>
                          <Text style={{ fontSize: 14, color: '#333', minWidth: 18, textAlign: 'center' }}>{selectedTypes[key]}</Text>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setSelectedTypes(prev => {
                                const copy = { ...prev };
                                copy[key]++;
                                return copy;
                              });
                            }}
                            style={{ paddingHorizontal: 4 }}
                          >
                            <Text style={{ fontSize: 18, color: '#4B9363', fontWeight: 'bold' }}>+</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              {/* 16-20 */}
              <View style={styles.wasteTypesGrid}>
                {wasteTypeIcons.slice(15, 20).map(({ key, Icon }) => {
                  const isSelected = selectedTypes[key] !== undefined;
                  return (
                    <TouchableOpacity
                      key={key}
                      style={[styles.wasteTypeItem, isSelected && styles.selectedItem]}
                      onPress={() => {
                        setSelectedTypes(prev => {
                          const copy = { ...prev };
                          if (copy[key]) {
                            delete copy[key];
                          } else {
                            copy[key] = 1;
                          }
                          return copy;
                        });
                      }}
                      activeOpacity={0.8}
                    >
                      <View style={{ alignItems: 'center' }}>
                        <Icon width={24} height={24} color={isSelected ? '#4B9363' : '#555'} />
                      </View>
                      {isSelected && (
                        <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setSelectedTypes(prev => {
                                const copy = { ...prev };
                                if (copy[key] > 1) copy[key]--;
                                return copy;
                              });
                            }}
                            style={{ paddingHorizontal: 4 }}
                          >
                            <Text style={{ fontSize: 18, color: '#4B9363', fontWeight: 'bold' }}>-</Text>
                          </TouchableOpacity>
                          <Text style={{ fontSize: 14, color: '#333', minWidth: 18, textAlign: 'center' }}>{selectedTypes[key]}</Text>
                          <TouchableOpacity
                            onPress={(e) => {
                              e.stopPropagation();
                              setSelectedTypes(prev => {
                                const copy = { ...prev };
                                copy[key]++;
                                return copy;
                              });
                            }}
                            style={{ paddingHorizontal: 4 }}
                          >
                            <Text style={{ fontSize: 18, color: '#4B9363', fontWeight: 'bold' }}>+</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <TouchableOpacity onPress={closeWasteTypes} style={{ alignSelf: 'center', marginTop: 8 }}>
                <Text style={{ color: '#4B9363', fontWeight: 'bold', fontSize: 15 }}>Show less</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>

        {/* Waste Quantity Selection */}
        <View style={styles.sectionContainer}>
          <Text style={styles.sectionTitle}>Please select the quantity of waste.</Text>
          <View style={styles.wasteQuantityGrid}>
            {/* Garbage Truck Icon - LEFT */}
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <TouchableOpacity
                style={[styles.wasteQuantityItem, truckSelected && styles.selectedItem]}
                onPress={handleGarbageTruckClick}
              >
                <IconifyGarbageTruckIcon width={24} height={24} color={'#555'} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.wasteQuantityItem, selectedBagQuantity && styles.selectedItem, { marginLeft: 16 }]}
                onPress={handleGarbageIconClick}
              >
                <IconifyGarbageIcon width={24} height={24} color={'#555'} />
              </TouchableOpacity>
            </View>
          </View>
          {/* Selected Bag Quantity Display */}
          {selectedBagQuantity && (
            <View style={{ alignItems: 'center', marginTop: 8 }}>
              <Text style={{ color: '#4B9363', fontWeight: 'bold', fontSize: 15 }}>
                Bag need: {selectedBagQuantity}
              </Text>
            </View>
          )}
          {/* Selected Truck Display */}
          {truckSelected && (
            <View style={{ alignItems: 'center', marginTop: 4 }}>
              <Text style={{ color: '#4B9363', fontWeight: 'bold', fontSize: 15 }}>
                Truck need: Yes
              </Text>
            </View>
          )}
        </View>

        {/* Quantity Modal */}
        <Modal
          visible={quantityModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setQuantityModalVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' }}>
            <View style={{ backgroundColor: '#fff', borderRadius: 14, padding: 28, width: '85%', alignItems: 'center' }}>
              <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#4B9363', marginBottom: 18 }}>How many trash bags are needed?</Text>
              {['1-4 bags', '5-10 bags', '10+ bags'].map(option => (
                <TouchableOpacity
                  key={option}
                  style={{
                    width: '100%',
                    paddingVertical: 12,
                    marginVertical: 6,
                    borderRadius: 8,
                    backgroundColor: tempBagQuantity === option ? '#E6F4EA' : '#ECECEC',
                    borderWidth: tempBagQuantity === option ? 1 : 0,
                    borderColor: tempBagQuantity === option ? '#4B9363' : 'transparent',
                    alignItems: 'center',
                  }}
                  onPress={() => {
                    if (tempBagQuantity === option) {
                      setTempBagQuantity(null);
                    } else {
                      setTempBagQuantity(option);
                    }
                  }}
                >
                  <Text style={{ color: '#333', fontWeight: '500', fontSize: 16 }}>{option}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={{ marginTop: 18, paddingVertical: 8, paddingHorizontal: 24, borderRadius: 8, backgroundColor: '#4B9363' }}
                onPress={() => {
                  setSelectedBagQuantity(tempBagQuantity);
                  setQuantityModalVisible(false);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Additional Information */}
        <View style={styles.commentContainer}>
          <Text style={styles.sectionTitle}>If you want to give information about waste:</Text>
          <TextInput
            style={styles.textInput}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            placeholder="Add additional information here... Don't forget to wear gloves when collecting waste, as it may be sharp."
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
            style={[styles.confirmButton, (!selectedTypes || images.length === 0) && styles.disabledButton]} 
            onPress={handleSubmit}
            disabled={!selectedTypes || images.length === 0}
          >
            <Text style={styles.confirmButtonText}>Confirm</Text>
          </TouchableOpacity>
        </View>


      </ScrollView>

      {/* Trash Images Modal */}
      <Modal visible={modalVisible} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' }}>
          <TouchableOpacity style={{ position: 'absolute', top: 40, right: 30, zIndex: 10 }} onPress={() => setModalVisible(false)}>
            <MaterialIcons name="close" size={36} color="#fff" />
          </TouchableOpacity>
          {selectedImage && (
            <Image source={{ uri: selectedImage }} style={{ width: '95%', height: '80%', resizeMode: 'contain' }} />
          )}
        </View>
      </Modal>

      {/* Info Modal */}
      <Modal
        visible={infoModalVisible}
        transparent
        animationType="fade"
        onRequestClose={() => setInfoModalVisible(false)}
      >
        <View style={styles.infoModalOverlay}>
          <View style={styles.infoModalContainer}>
            <Text style={styles.infoModalTitle}>How to Report Trash?</Text>
            <Text style={styles.infoModalSubtitle}>Please follow these steps and pay attention to the following points when reporting waste:</Text>
            <View style={styles.infoModalList}>
              <Text style={styles.infoModalItem}>• Select the correct waste type and quantity.</Text>
              <Text style={styles.infoModalItem}>• Take clear photos of the waste. Make sure the waste is visible and identifiable.</Text>
              <Text style={styles.infoModalItem}>• Choose the exact location on the map where the waste is found.</Text>
              <Text style={styles.infoModalItem}>• Add any additional information that may help cleaning teams (e.g. access, hazards, etc.).</Text>
              <Text style={styles.infoModalItem}>• Do not report fake or already cleaned waste. Misuse may result in restrictions.</Text>
              <Text style={styles.infoModalItem}>• Always wear gloves and be careful of sharp or hazardous materials when collecting waste.</Text>
              <Text style={styles.infoModalItem}>• If possible, separate recyclable and non-recyclable waste.</Text>
            </View>
            <TouchableOpacity style={styles.infoModalButton} onPress={() => setInfoModalVisible(false)}>
              <Text style={styles.infoModalButtonText}>Got it</Text>
            </TouchableOpacity>
          </View>
        </View>
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
              {wasteTypeIcons.map(({ key, Icon, label }) => {
                // İngilizce örnek ve öneri metinleri
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

      <Modal
        visible={customModal.visible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCustomModal({ ...customModal, visible: false })}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ width: '85%', backgroundColor: '#fff', borderRadius: 12, padding: 24, alignItems: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 4, elevation: 5 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', color: customModal.title === 'Success' ? '#4B9363' : '#A91101', marginBottom: 12, textAlign: 'center' }}>{customModal.title}</Text>
            <Text style={{ fontSize: 15, color: '#333', marginBottom: 24, textAlign: 'center' }}>{customModal.message}</Text>
            <TouchableOpacity
              style={{ backgroundColor: '#4B9363', borderRadius: 8, paddingVertical: 12, paddingHorizontal: 32, alignItems: 'center' }}
              onPress={() => {
                setCustomModal({ ...customModal, visible: false });
                if (customModal.onOk) customModal.onOk();
              }}
            >
              <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>OK</Text>
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
    height: 200,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  cameraButtonContainer: {
    alignItems: 'center',
    marginTop: -30,
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
    paddingHorizontal: 24,
    paddingTop: 6,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  commentContainer: {
    paddingHorizontal: 24,
    paddingTop: 6,
    // paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 12,
    marginTop: 12,
  },
  sectionInfo: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4B9363',
  },
  imageContainer: {
    position: 'relative',
    marginRight: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: -1,
    right:6,
    zIndex: 1,
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  trashImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
  },
  locationInfo: {
    paddingHorizontal: 24,
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
    width: (SCREEN_WIDTH - 60) / 6,
    height: (SCREEN_WIDTH - 60) / 6,
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
    width: (SCREEN_WIDTH - 60) / 6,
    height: (SCREEN_WIDTH - 60) / 6,
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
    fontSize: 14,
    color: '#333',
    marginBottom: 16,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginTop: 8,
    marginBottom: 16,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 10,
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
    paddingVertical: 10,
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

  activeImageContainer: {
    borderWidth: 2,
    borderColor: '#4B9363',
  },
  image: {
    width: 72,
    height: 72,
    borderRadius: 8,
  },
  imageWrapper: {
    position: 'relative',
    marginRight: 8,
  },
  emptyImageBox: {
    width: 72,
    height: 72,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    borderStyle: 'dashed',
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    // marginBottom:12,
    // marginBottom: 8,
  },
  emptyImageText: {
    fontSize: 10,
    color: '#AAA',
    marginTop: 4,
  },
  sectionAddImage: {
    paddingHorizontal: 24,
  },
  infoModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
  },
  infoModalContainer: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    // alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 6,
  },
  infoModalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4B9363',
    marginBottom: 10,
    textAlign: 'left',
  },
  infoModalSubtitle: {
    fontSize: 14,
    color: '#333',
    marginBottom: 14,
    // textAlign: 'center',
  },
  infoModalList: {
    alignSelf: 'stretch',
    marginBottom: 18,
  },
  infoModalItem: {
    fontSize: 13,
    color: '#444',
    marginBottom: 6,
    lineHeight: 18,
  },
  infoModalButton: {
    backgroundColor: '#4B9363',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 36,
    alignItems: 'center',
  },
  infoModalButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
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
    // marginHorizontal: 6,
    // maxWidth: 400,
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
    // marginTop:4 ,
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