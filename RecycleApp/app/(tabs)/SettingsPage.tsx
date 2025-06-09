import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { auth, db } from '../config/firebase';
import { updateDoc, doc, getDoc } from 'firebase/firestore';
import { updateEmail, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import BottomNavigation from '../../components/BottomNavigation';

// Stil tanımları için TypeScript arayüzü
interface Styles {
  container: ViewStyle;
  header: ViewStyle;
  backButton: ViewStyle;
  headerTitle: TextStyle;
  loadingContainer: ViewStyle;
  loadingText: TextStyle;
  scrollView: ViewStyle;
  section: ViewStyle;
  sectionTitle: TextStyle;
  inputContainer: ViewStyle;
  inputLabel: TextStyle;
  input: TextStyle;
  inputError: ViewStyle;
  errorText: TextStyle;
  saveButton: ViewStyle;
  saveButtonText: TextStyle;
  passwordHeader: ViewStyle;
  passwordHeaderExpanded: ViewStyle;
  passwordContainer: ViewStyle;
  passwordInput: TextStyle;
  visibilityIcon: ViewStyle;
  settingItem: ViewStyle;
  settingLabel: TextStyle;
  disabledToggle: ViewStyle;
  disabledText: TextStyle;
  aboutItem: ViewStyle;
  aboutLabel: TextStyle;
  aboutValue: TextStyle;
  spacer: ViewStyle;
}

export default function SettingsPage() {
  // Form state için değişkenler
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // UI state için değişkenler
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordSection, setPasswordSection] = useState(false);
  
  // Hata mesajları
  const [nameError, setNameError] = useState('');
  const [usernameError, setUsernameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // Kullanıcı bilgilerini yükleme
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setIsLoading(true);
        const currentUser = auth.currentUser;
        
        if (!currentUser) {
          router.push('/(auth)/login');
          return;
        }
        
        // Firebase'den kullanıcı verilerini al
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        
        if (userDoc.exists()) {
          const userData = userDoc.data();
          // Form state'i güncelle
          setName(userData.name || '');
          setUsername(userData.username || '');
          setEmail(currentUser.email || '');
        }
      } catch (error) {
        Alert.alert('An error occurred while loading user information. Please try again later.');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadUserData();
  }, []);
  
  // Kullanıcı bilgilerini kaydetme
  const saveUserInfo = async () => {
    // Validation
    let isValid = true;
    
    if (!name.trim()) {
      setNameError('Name field cannot be empty.');
      isValid = false;
    } else {
      setNameError('');
    }
    
    if (!username.trim()) {
      setUsernameError('Username cannot be empty.');
      isValid = false;
    } else {
      setUsernameError('');
    }
    
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Enter a valid email address.');
      isValid = false;
    } else {
      setEmailError('');
    }
    
    if (!isValid) return;
    
    const currentUser = auth.currentUser;
    if (!currentUser) {
      router.push('/(auth)/login');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Firestore'da kullanıcı bilgilerini güncelle
      await updateDoc(doc(db, 'users', currentUser.uid), {
        name,
        username,
      });
      
      // E-posta değişikliği varsa güncelle
      if (email !== currentUser.email) {
        await updateEmail(currentUser, email);
      }
      
      Alert.alert('Your user information has been updated.');
    } catch (error) {
      Alert.alert('An error occurred while updating your information. Please try again later.');
    } finally {
      setIsSaving(false);
    }
  };
  
  // Şifre değiştirme
  const changePassword = async () => {
    // Validation
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters long.');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      return;
    }
    
    if (!currentPassword) {
      setPasswordError('Enter your current password.');
      return;
    }
    
    setPasswordError('');
    
    const currentUser = auth.currentUser;
    if (!currentUser || !currentUser.email) {
      Alert.alert('User information could not be accessed.');
      return;
    }
    
    try {
      setIsSaving(true);
      
      // Mevcut kimlik bilgileriyle yeniden kimlik doğrulama
      const credential = EmailAuthProvider.credential(
        currentUser.email,
        currentPassword
      );
      
      // Kullanıcının kimliğini doğrula
      await reauthenticateWithCredential(currentUser, credential);
      
      // Şifreyi güncelle
      await updatePassword(currentUser, newPassword);
      
      // Başarı mesajı göster
      Alert.alert('Your password has been updated.');
      
      // Şifre alanlarını temizle
      setNewPassword('');
      setConfirmPassword('');
      setCurrentPassword('');
      setPasswordSection(false);
    } catch (error) {
      // Doğrulama hatası
      Alert.alert('Your current password is incorrect or a problem occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <MaterialIcons name="chevron-left" size={24} color="#000" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>SETTINGS</Text>
          <View style={{width: 40}} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4B9363" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
        <BottomNavigation />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <MaterialIcons name="chevron-left" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>SETTINGS</Text>
        <View style={{width: 40}} />
      </View>

      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}
      >
        <ScrollView style={styles.scrollView}>
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Personal Details</Text>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Name</Text>
              <TextInput
                style={[styles.input, nameError ? styles.inputError : null]}
                value={name}
                onChangeText={setName}
                placeholder="Enter your name and surname"
              />
              {nameError ? <Text style={styles.errorText}>{nameError}</Text> : null}
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Username</Text>
              <TextInput
                style={[styles.input, usernameError ? styles.inputError : null]}
                value={username}
                onChangeText={setUsername}
                placeholder="Enter your username"
              />
              {usernameError ? <Text style={styles.errorText}>{usernameError}</Text> : null}
            </View>
            
            <View style={styles.inputContainer}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                value={email}
                onChangeText={setEmail}
                placeholder="Enter your email address"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={saveUserInfo}
              disabled={isSaving}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.saveButtonText}>SAVE</Text>
              )}
            </TouchableOpacity>
          </View>
          
          <View style={styles.section}>
            <TouchableOpacity 
              style={passwordSection ? styles.passwordHeaderExpanded : styles.passwordHeader}
              onPress={() => setPasswordSection(!passwordSection)}
            >
              <Text style={styles.sectionTitle}>Change Password</Text>
              <MaterialIcons 
                name={passwordSection ? "keyboard-arrow-up" : "keyboard-arrow-down"} 
                size={24} 
                color="#333" 
              />
            </TouchableOpacity>
            
            {passwordSection && (
              <View>
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Current Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.passwordInput, passwordError ? styles.inputError : null]}
                      value={currentPassword}
                      onChangeText={setCurrentPassword}
                      placeholder="Enter your current password"
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity 
                      style={styles.visibilityIcon}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-off" : "eye"} 
                        size={20} 
                        color="#666" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>New Password</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.passwordInput, passwordError ? styles.inputError : null]}
                      value={newPassword}
                      onChangeText={setNewPassword}
                      placeholder="Enter your new password"
                      secureTextEntry={!showPassword}
                    />
                  </View>
                </View>
                
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>New Password Again</Text>
                  <View style={styles.passwordContainer}>
                    <TextInput
                      style={[styles.passwordInput, passwordError ? styles.inputError : null]}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Enter your new password again"
                      secureTextEntry={!showPassword}
                    />
                    <TouchableOpacity 
                      style={styles.visibilityIcon}
                      onPress={() => setShowPassword(!showPassword)}
                    >
                      <Ionicons 
                        name={showPassword ? "eye-off" : "eye"} 
                        size={20} 
                        color="#666" 
                      />
                    </TouchableOpacity>
                  </View>
                </View>
                
                {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
                
                <TouchableOpacity 
                  style={styles.saveButton}
                  onPress={changePassword}
                  disabled={isSaving}
                >
                  {isSaving ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.saveButtonText}>SAVE</Text>
                  )}
                </TouchableOpacity>
              </View>
            )}
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Other Settings</Text>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Dark Theme</Text>
              <View style={styles.disabledToggle}>
                <Text style={styles.disabledText}>Coming Soon</Text>
              </View>
            </View>
            
            <View style={styles.settingItem}>
              <Text style={styles.settingLabel}>Notifications</Text>
              <View style={styles.disabledToggle}>
                <Text style={styles.disabledText}>Coming Soon</Text>
              </View>
            </View>
          </View>
          
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>About</Text>
            
            <View style={styles.aboutItem}>
              <Text style={styles.aboutLabel}>App Version</Text>
              <Text style={styles.aboutValue}>1.0.0</Text>
            </View>
          </View>
          
          <View style={styles.spacer} />
        </ScrollView>
      </KeyboardAvoidingView>

      <BottomNavigation />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create<Styles>({
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
    width: 40,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
    padding: 24,
  },
  section: {
    marginBottom: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    marginBottom: 8,
    color: '#666',
  },
  input: {
    height: 48,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#F9F9F9',
  },
  inputError: {
    borderColor: '#FF3B30',
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 12,
    marginTop: 4,
  },
  saveButton: {
    backgroundColor: '#4B9363',
    borderRadius: 8,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  passwordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 0,
  },
  passwordHeaderExpanded: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    backgroundColor: '#F9F9F9',
  },
  passwordInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 16,
  },
  visibilityIcon: {
    padding: 10,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  settingLabel: {
    fontSize: 16,
    color: '#333',
  },
  disabledToggle: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  disabledText: {
    fontSize: 12,
    color: '#666',
  },
  aboutItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  aboutLabel: {
    fontSize: 16,
    color: '#333',
  },
  aboutValue: {
    fontSize: 16,
    color: '#666',
  },
  spacer: {
    height: 100,
  },
});
