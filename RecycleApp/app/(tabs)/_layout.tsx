import { Stack } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { HapticTab } from '@/components/HapticTab';
import { IconSymbol } from '@/components/ui/IconSymbol';
import TabBarBackground from '@/components/ui/TabBarBackground';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="HomePage" />
      <Stack.Screen name="PostDetail" />
      <Stack.Screen name="UserProfile" />
      <Stack.Screen name="ProfilePage" />
    </Stack>
  );
}
