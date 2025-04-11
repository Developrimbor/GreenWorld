import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../config/firebase';

export default function EditPost() {
  const params = useLocalSearchParams();
  console.log('EditPost - Received params:', params);
  const { id } = params;
  
  // State tanımlamalarını ekleyelim
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [location, setLocation] = useState('');

  useEffect(() => {
    if (!id) {
      console.error('No post ID received');
      Alert.alert('Error', 'No post ID found');
      router.back();
      return;
    }
    console.log('EditPost - Using ID:', id);
    const fetchPost = async () => {
      try {
        const postDoc = await getDoc(doc(db, 'posts', id as string));
        if (postDoc.exists()) {
          const postData = postDoc.data();
          setTitle(postData.title || '');
          setContent(postData.content || '');
          setLocation(postData.location || '');
        }
      } catch (error) {
        console.error('Error fetching post:', error);
        Alert.alert('Error', 'Failed to load post');
      }
    };

    if (id) fetchPost();
  }, [id]);

  const handleUpdate = async () => {
    try {
      await updateDoc(doc(db, 'posts', id as string), {
        title,
        content,
        location,
        updatedAt: new Date(),
      });
      Alert.alert('Success', 'Post updated successfully');
      router.push({pathname: "/(tabs)/PostDetail", params: {id: id}});
    } catch (error) {
      console.error('Error updating post:', error);
      Alert.alert('Error', 'Failed to update post');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>EDIT POST</Text>
        <TouchableOpacity 
          style={styles.saveButton}
          onPress={handleUpdate}
        >
          <Ionicons name="checkmark" size={24} color="#4B9363" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.inputContainer}>
          <Text style={styles.label}>Title</Text>
          <TextInput
            style={styles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="Enter title"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Location</Text>
          <TextInput
            style={styles.input}
            value={location}
            onChangeText={setLocation}
            placeholder="Enter location"
          />
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>Content</Text>
          <TextInput
            style={[styles.input, styles.contentInput]}
            value={content}
            onChangeText={setContent}
            placeholder="Enter content"
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
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
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    padding: 4,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  contentInput: {
    height: 200,
  },
});