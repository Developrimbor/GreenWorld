import React, { useState, useEffect } from 'react';
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
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../config/firebase';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    // Kayıtlı giriş bilgilerini kontrol et
    const loadSavedCredentials = async () => {
      try {
        const savedEmail = await AsyncStorage.getItem('userEmail');
        const savedPassword = await AsyncStorage.getItem('userPassword');
        const savedRememberMe = await AsyncStorage.getItem('rememberMe');
        
        if (savedRememberMe === 'true' && savedEmail && savedPassword) {
          setEmail(savedEmail);
          setPassword(savedPassword);
          setRememberMe(true);
        }
      } catch (error) {
        console.log('Kayıtlı bilgileri yüklerken hata:', error);
      }
    };

    loadSavedCredentials();
  }, []);

  const handleLogin = async () => {
    try {
      if (!email || !password) {
        Alert.alert('Hata', 'Email ve şifre alanları boş bırakılamaz.');
        return;
      }

      // Giriş işlemi
      await signInWithEmailAndPassword(auth, email, password);
      
      // Remember Me seçili ise bilgileri kaydet
      if (rememberMe) {
        await AsyncStorage.setItem('userEmail', email);
        await AsyncStorage.setItem('userPassword', password);
        await AsyncStorage.setItem('rememberMe', 'true');
      } else {
        // Seçili değilse kayıtlı bilgileri temizle
        await AsyncStorage.removeItem('userEmail');
        await AsyncStorage.removeItem('userPassword');
        await AsyncStorage.setItem('rememberMe', 'false');
      }

      router.push('/(tabs)/HomePage');
    } catch (error: any) {
      console.log('Firebase Error Code:', error.code);
      let errorMessage = 'Giriş yapılırken bir hata oluştu.';
      
      if (error.code === 'auth/invalid-email') {
        errorMessage = 'Lütfen geçerli bir email adresi girin.';
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = 'Bu email adresi ile kayıtlı bir kullanıcı bulunamadı.';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'Yanlış şifre. Lütfen tekrar deneyin.';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'Çok fazla giriş denemesi yapıldı. Lütfen daha sonra tekrar deneyin.';
      }
  
      Alert.alert('Giriş Hatası', errorMessage);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const toggleRememberMe = () => {
    setRememberMe(!rememberMe);
  };

  const handleGoogleLogin = () => {
    router.push('/(tabs)/HomePage');
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/logo.png')}
          style={styles.logo}
          resizeMode="contain"
        />
        <Text style={styles.slogan}>
          Would you like to volunteer for a{'\n'}
          <Text style={styles.greenText}>Green World?</Text>
        </Text>
      </View>

      <View style={styles.formContainer}>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.passwordContainer}>
            <TextInput
              style={styles.passwordInput}
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity 
              style={styles.eyeIcon} 
              onPress={togglePasswordVisibility}
              activeOpacity={0.7}
            >
              <Ionicons 
                name={showPassword ? 'eye-off' : 'eye'} 
                size={24} 
                color="#4B9363" 
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={toggleRememberMe}
            activeOpacity={0.7}
          >
            <View style={[styles.checkbox, rememberMe && styles.checked]}>
              {rememberMe && (
                <Ionicons name="checkmark" size={16} color="#fff" />
              )}
            </View>
            <Text style={styles.optionText}>Remember Me</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {}} activeOpacity={0.7}>
            <Text style={styles.forgotPassword}>Forgot Password?</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.loginButton} 
          onPress={handleLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>LOG IN</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.googleButton} 
          // onPress={handleGoogleLogin}
          activeOpacity={0.8}
        >
          <Text style={styles.buttonText}>LOG IN WITH GOOGLE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.signupContainer}>
        <Text style={styles.noAccountText}>Don't have an account?</Text>
        <TouchableOpacity 
          style={styles.signupButton}
          onPress={() => router.push('/(auth)/signup')}
          activeOpacity={0.7}
        >
          <Text style={styles.signupText}>SIGN UP</Text>
        </TouchableOpacity>
      </View>
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
    marginTop: 20,
  },
  inputContainer: {
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    padding: 12,
    fontFamily: 'Poppins-Regular',
  },
  passwordContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    padding: 12,
    fontFamily: 'Poppins-Regular',
  },
  eyeIcon: {
    padding: 10,
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#4B9363',
    borderRadius: 4,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: '#4B9363',
  },
  optionText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
  },
  forgotPassword: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#4B9363',
  },
  loginButton: {
    backgroundColor: '#4B9363',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  googleButton: {
    backgroundColor: '#4B9363',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
  },
  signupContainer: {
    alignItems: 'center',
  },
  noAccountText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    marginBottom: 10,
  },
  signupButton: {
    padding: 10,
  },
  signupText: {
    color: '#4B9363',
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
  },
});