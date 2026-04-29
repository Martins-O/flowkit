import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { requestNotificationPermissions } from '../src/lib/notifications.js';

export default function RootLayout() {
  useEffect(() => {
    requestNotificationPermissions().catch(console.error);
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: '#0f0f13' },
          headerTintColor: '#f0eff8',
          contentStyle: { backgroundColor: '#0f0f13' },
          headerShadowVisible: false,
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ title: 'Sign in', presentation: 'modal' }} />
      </Stack>
    </SafeAreaProvider>
  );
}
