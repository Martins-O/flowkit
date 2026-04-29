import React from 'react';
import { Tabs, router } from 'expo-router';
import { useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useTimerStore } from '@/store/timerStore.js';

export default function TabsLayout() {
  const accessToken = useTimerStore((s) => s.accessToken);

  useEffect(() => {
    if (!accessToken) {
      router.replace('/login');
    }
  }, [accessToken]);

  return (
    <Tabs
      screenOptions={{
        tabBarStyle: {
          backgroundColor: '#0f0f13',
          borderTopColor: '#1e1d2e',
        },
        tabBarActiveTintColor: '#7F77DD',
        tabBarInactiveTintColor: '#555',
        headerStyle: { backgroundColor: '#0f0f13' },
        headerTintColor: '#f0eff8',
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Timer',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="timer-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="tasks"
        options={{
          title: 'Tasks',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="checkmark-circle-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="analytics"
        options={{
          title: 'Analytics',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="bar-chart-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
