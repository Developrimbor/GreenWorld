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

export default function SignUpScreen() {
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleSignUp = () => {
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
          />
        </View>

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
            placeholder="Mail"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={styles.signupButton} 
          onPress={handleSignUp}
        >
          <Text style={styles.buttonText}>SIGN UP</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity 
        style={styles.loginContainer}
        onPress={() => router.push('/(auth)/login')}
      >
        <Text style={styles.loginText}>Already have an account?</Text>
      </TouchableOpacity>
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
    width: 300,
    height: 300,
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
  loginText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#000',
  },
}); 