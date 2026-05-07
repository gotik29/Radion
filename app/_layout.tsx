import { DarkTheme, DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useState, useEffect } from 'react';
import 'react-native-reanimated';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { TaskProvider } from '@/server/TaskContext';
import { useColorScheme } from '@/hooks/use-color-scheme';
import { useRouter, useSegments } from 'expo-router';

import { AuthProvider, useAuth } from '@/server/AuthContext'; // проверь путь

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  return (
    <AuthProvider>
      <LayoutContent />
    </AuthProvider>
  );
}

function LayoutContent() {
  const { isLoggedIn } = useAuth();
  const segments = useSegments();
  const router = useRouter();
  const colorScheme = useColorScheme();

  useEffect(() => {
    if (isLoggedIn === null) return;
    const inTabsGroup = segments[0] === '(tabs)';

    if (!isLoggedIn && inTabsGroup) {
      router.replace('/AuthScreen'); // Выкидываем на логин
    } else if (isLoggedIn && !inTabsGroup) {
      router.replace('/(tabs)'); // Заводим в приложение
    }
  }, [isLoggedIn, segments]);

  if (isLoggedIn === null) return null;

  return (
    <TaskProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="(tabs)" />
        </Stack>
      </ThemeProvider>
    </TaskProvider>
  );
}