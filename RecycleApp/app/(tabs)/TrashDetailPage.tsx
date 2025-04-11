import React, { useState } from 'react';
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
} from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import BottomNavigation from '../../components/BottomNavigation';

const { width, height } = Dimensions.get('window');

const images = [
  require('../../assets/images/trash000001.jpg'),
  require('../../assets/images/plastic-waste.jpg'),
];

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
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [modalContent, setModalContent] = useState<ModalContentData | null>(null);

  const nextImage = () => {
    if (currentImageIndex < images.length - 1) {
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

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <MaterialIcons name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>TRASH INFO</Text>
        <TouchableOpacity style={styles.infoButton}>
          <MaterialIcons name="error" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        {/* Image Section */}
        <View style={styles.imageSection}>
          <TouchableOpacity onPress={() => setShowImageModal(true)}>
            <Image
              source={images[currentImageIndex]}
              style={styles.mainImage}
              resizeMode="cover"
            />
          </TouchableOpacity>
          
          {images.length > 1 && (
            <>
              <TouchableOpacity style={styles.previousButton} onPress={previousImage}>
                <MaterialIcons name="chevron-left" size={24} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity style={styles.nextButton} onPress={nextImage}>
                <MaterialIcons name="chevron-right" size={24} color="#fff" />
              </TouchableOpacity>
            </>
          )}
        </View>

        {/* Need to Clean Section */}
        <View style={styles.needCleanSection}>
          <Text style={[styles.needCleanText, { textAlign: 'center' }]}>NEED TO CLEAN!</Text>
        </View>

        {/* Info Section */}
        <View style={styles.infoSection}>
          <View style={styles.infoContainer}>
            <View style={styles.infoRowLeft}>
              <View style={styles.infoItem}>
                <MaterialIcons name="tag" size={16} color="#4B9363" />
                <Text style={styles.infoText}>ID: 1</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialIcons name="person" size={16} color="#4B9363" />
                <Text style={styles.infoText}>Yusuf Gulmez</Text>
              </View>
            </View>

            <View style={styles.infoRowRight}>
              <View style={styles.infoItem}>
                <MaterialIcons name="calendar-today" size={16} color="#4B9363" />
                <Text style={styles.infoText}>25/01/2025</Text>
              </View>
              <View style={styles.infoItem}>
                <MaterialIcons name="location-on" size={16} color="#4B9363" />
                <Text style={styles.infoText}>Sakarya, TR</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Trash Info and Volume Section */}
        <View style={styles.combinedSection}>
          <View style={styles.sectionColumn}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trash Info</Text>
              <TouchableOpacity onPress={() => openInfoModal(trashInfoDetailsData)}>
                <MaterialIcons name="info" size={22} color="#4B9363" />
              </TouchableOpacity>
            </View>
            <View style={styles.iconGrid}>
              <MaterialCommunityIcons name="recycle" size={24} color="#4B9363" />
              <MaterialCommunityIcons name="smoking" size={24} color="#4B9363" />
              <MaterialCommunityIcons name="waves" size={24} color="#4B9363" />
              <MaterialIcons name="description" size={24} color="#4B9363" />
              <MaterialCommunityIcons name="face-mask" size={24} color="#4B9363" />
              <MaterialCommunityIcons name="glass-wine" size={24} color="#4B9363" />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.sectionColumn}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trash Volume</Text>
              <TouchableOpacity onPress={() => openInfoModal(trashVolumeDetailsData)}>
                <MaterialIcons name="info" size={22} color="#4B9363" />
              </TouchableOpacity>
            </View>
            <View style={styles.iconGrid}>
              <MaterialIcons name="delete" size={24} color="#4B9363" />
              <MaterialIcons name="local-shipping" size={24} color="#4B9363" />
            </View>
          </View>
        </View>

        {/* Other Details Section */}
        <View style={styles.otherDetailsSection}>
          <Text style={styles.sectionTitle}>Other Details</Text>
          <Text style={styles.detailsText}>
            Lorem ipsum dolor sit amet consectetur. Massa mauris eros enim id aliquet. Elementum sed dignissim platea fermentum commodo mattis proin.
          </Text>
          <Text style={styles.detailsText}>
            Lorem ipsum dolor sit amet consectetur. Massa mauris eros enim id aliquet. Elementum sed dignissim platea fermentum commodo mattis proin.
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
          <TouchableOpacity style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>I Cleaned</Text>
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
          <TouchableOpacity 
            style={styles.modalBackground}
            onPress={() => setShowImageModal(false)}
          >
            <Image
              source={images[currentImageIndex]}
              style={styles.modalImage}
              resizeMode="contain"
            />
          </TouchableOpacity>
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
    height: 254,
    position: 'relative',
  },
  mainImage: {
    width: 412,
    height: 254,
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
  needCleanSection: {
    width: '100%',
    height: 52,
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  needCleanText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#A91101',
  },
  infoSection: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#D9D9D9',
  },
  infoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  infoRowLeft: {
    flexDirection: 'column',
    gap: 12,
  },
  infoRowRight: {
    flexDirection: 'column',
    gap: 12,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center'
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontFamily: 'Poppins-Medium',
    fontSize: 12,
    color: '#696969',
  },
  combinedSection: {
    flexDirection: 'row',
    padding: 24,
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
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 14,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  otherDetailsSection: {
    padding: 24,
    minHeight: 196,
  },
  detailsText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 12,
    color: '#696969',
    marginTop: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 24,
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
  },
  modalImage: {
    width: width * 1.4,
    height: width * 1.4,
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
    marginBottom: 20,
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
});
