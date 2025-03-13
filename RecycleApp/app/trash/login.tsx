/*
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
} from 'react-native';
import { router } from 'expo-router';

export default function LoginScreen() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.logoContainer}>
        <Image
          source={require('../assets/images/logo.png')}
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
            placeholder="Username"
            value={username}
            onChangeText={setUsername}
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Şifre"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.optionsContainer}>
          <TouchableOpacity 
            style={styles.checkboxContainer}
            onPress={() => setRememberMe(!rememberMe)}
          >
            <View style={[styles.checkbox, rememberMe && styles.checked]} />
            <Text style={styles.optionText}>Beni Hatırla</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {}}>
            <Text style={styles.forgotPassword}>Şifremi unuttum</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={styles.loginButton} onPress={() => {}}>
          <Text style={styles.buttonText}>LOG IN</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.googleButton} onPress={() => {}}>
          <Text style={styles.buttonText}>LOG IN WITH GOOGLE</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.signupContainer}>
        <Text style={styles.noAccountText}>Don't have an account?</Text>
        <TouchableOpacity 
          style={styles.signupButton}
          onPress={() => router.push('/signup')}
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
    padding: 20,
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
  },
  logoContainer: {
    alignItems: 'center',
    marginTop: 60,
  },
  logo: {
    width: 200,
    height: 200,
  },
  slogan: {
    fontFamily: 'Poppins-Regular',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 20,
  },
  greenText: {
    color: '#4B9363',
    fontFamily: 'Poppins-Medium',
  },
  formContainer: {
    marginTop: 30,
  },
  inputContainer: {
    marginBottom: 15,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    padding: 15,
    fontFamily: 'Poppins-Regular',
  },
  optionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
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
    padding: 15,
    alignItems: 'center',
    marginBottom: 15,
  },
  googleButton: {
    backgroundColor: '#4B9363',
    borderRadius: 8,
    padding: 15,
    alignItems: 'center',
    marginBottom: 30,
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
*/