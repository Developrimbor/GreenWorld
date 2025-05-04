import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  KeyboardAvoidingView,
  Platform,
  Alert,
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
import { ScrollView } from 'react-native';  // ScrollView'ı import edelim

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

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
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Name"
              value={name}
              onChangeText={setName}
              autoCapitalize="words"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Username"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

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
    padding: 15,
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
    marginTop: 10,
  },
  greenText: {
    color: '#4B9363',
    fontFamily: 'Poppins-Medium',
  },
  formContainer: {
    marginTop: 15,
  },
  inputContainer: {
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Poppins-Regular',
  },
  signupButton: {
    backgroundColor: '#4B9363',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginTop: 5,
    marginBottom: 15,
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
      marginTop: 10,
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