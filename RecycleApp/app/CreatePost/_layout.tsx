import { Stack } from 'expo-router';

export default function CreatePostLayout() {
  return (
    <Stack screenOptions={{
      headerShown: true,
      presentation: 'modal',
      animation: 'slide_from_bottom'
    }} />
  );
}