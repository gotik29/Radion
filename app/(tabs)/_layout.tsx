import { Tabs } from 'expo-router';
import React from 'react';
import { Ionicons, FontAwesome5 } from '@expo/vector-icons';
import { useTasks } from '@/server/TaskContext';
import { Colors } from '@/constants/theme';
import { useColorScheme } from '@/hooks/use-color-scheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const { tasks } = useTasks();

  const uncompletedCount = tasks.filter(t => !t.completed).length;

  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen
        name="TimerPomodoro"
        options={{
          title: 'Таймер',
          tabBarIcon: ({ color }) => <Ionicons name="timer" size={28} color={color} />,
        }}
      />
      <Tabs.Screen
        name="index"
        options={{
          title: 'Задачи',
          tabBarIcon: ({ color }) => <FontAwesome5 name="tasks" size={28} color={color} />,
          tabBarBadge: uncompletedCount > 0 ? uncompletedCount : undefined,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Профиль',
          tabBarIcon: ({ color }) => <Ionicons name="person-outline" size={28} color={color} />,
        }}
      />
    </Tabs>
  );
}