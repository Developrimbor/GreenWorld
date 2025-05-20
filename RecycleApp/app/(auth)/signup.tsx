import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ScrollView,
} from 'react-native';
import { router } from 'expo-router';
import { signUp, createUserProfile } from './services/authService';
// import { auth, db } from './services/firebaseConfig';
import { auth, db } from '../config/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs,
  doc,
  setDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import FloatingLabelInput from '../../components/FloatingLabelInput';
import { Ionicons } from '@expo/vector-icons';

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validateUsername = (username: string) => {
    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    return usernameRegex.test(username);
  };

  const handleSignUp = async () => {
    try {
      if (!validateUsername(username)) {
        Alert.alert(
          'Hata',
          'Kullanıcı adı 3-20 karakter arasında olmalı ve sadece harf, rakam ve alt çizgi içermelidir.'
        );
        return;
      }

      if (password !== confirmPassword) {
        Alert.alert('Hata', 'Şifreler eşleşmiyor');
        return;
      }

      // Kullanıcı adı kontrolü
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('username', '==', username));
      const querySnapshot = await getDocs(q);

      if (!querySnapshot.empty) {
        Alert.alert('Hata', 'Bu kullanıcı adı zaten kullanılıyor');
        return;
      }

      // Kullanıcı oluştur
      const { user } = await createUserWithEmailAndPassword(auth, email, password);

      // Profil güncelle
      await updateProfile(user, {
        displayName: name
      });

      // Firestore'a kaydet
      await setDoc(doc(db, 'users', user.uid), {
        name,
        username,
        email,
        createdAt: serverTimestamp(),
        points: 0,
        reported: 0,
        cleaned: 0,
        posts: 0
      });

      router.push('/(tabs)/HomePage');
    } catch (error: any) {
      Alert.alert('Hata', error.message);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <Image
            source={require('../../assets/images/logo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={styles.slogan}>
            One last step to become a{'\n'}
            <Text style={styles.greenText}>Green World</Text> Volunteer!!
          </Text>
        </View>

        <View style={styles.formContainer}>
          <FloatingLabelInput
            label="Name"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />

          <FloatingLabelInput
            label="Username"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <FloatingLabelInput
            label="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />

          <FloatingLabelInput
            label="Password"
            value={password}
            onChangeText={setPassword}
            isPassword={!showPassword}
            rightIcon={
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={showPassword ? 'eye-off' : 'eye'} 
                  size={24} 
                  color="#4B9363" 
                />
              </TouchableOpacity>
            }
          />

          <FloatingLabelInput
            label="Confirm Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            isPassword={!showConfirmPassword}
            rightIcon={
              <TouchableOpacity 
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                activeOpacity={0.7}
              >
                <Ionicons 
                  name={showConfirmPassword ? 'eye-off' : 'eye'} 
                  size={24} 
                  color="#4B9363" 
                />
              </TouchableOpacity>
            }
          />

          <TouchableOpacity 
            style={styles.signupButton} 
            onPress={handleSignUp}
          >
            <Text style={styles.buttonText}>SIGN UP</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.loginWrapper}>
          <Text style={styles.loginText}>Do you already have an account? </Text>
          <TouchableOpacity 
            onPress={() => router.push('/(auth)/login')}
          >
            <Text style={styles.greenText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingHorizontal: 24,
    paddingTop: Platform.OS === 'ios' ? 40 : 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 30,
  },
  logo: {
    width: 200,
    height: 200,
  },
  slogan: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    textAlign: 'center',
    // marginTop: 4,
  },
  greenText: {
    color: '#4B9363',
    fontFamily: 'Poppins-Medium',
  },
  formContainer: {
    marginTop: 14,
  },
  inputContainer: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Poppins-Regular',
  },
  signupButton: {
    backgroundColor: '#4B9363',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 2,
    marginBottom: 12,
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
  },
  loginContainer: {
    alignItems: 'center',
  },
  loginWrapper: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      marginTop: 6,
    },
    loginText: {
      fontFamily: 'Poppins-Regular',
      fontSize: 14,
      color: '#000',
    },
  scrollContainer: {
    flexGrow: 1,
    paddingBottom: 20, // Alt kısımda extra padding
  },
});