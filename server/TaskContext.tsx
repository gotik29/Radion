import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Task } from '@/constants/types';

interface TaskContextType {
  tasks: Task[];
  refreshTasks: () => Promise<void>;
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

// Твой URL на Render
const API_URL = 'https://server-elfq.onrender.com/tasks';

export const TaskProvider = ({ children }: { children: React.ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const refreshTasks = async () => {
    try {
      // 1. Достаем токен из памяти устройства
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        console.warn("Токен не найден, пропуск загрузки задач");
        return;
      }

      // 2. Отправляем запрос с заголовком Authorization
      const res = await axios.get(API_URL, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setTasks(res.data);
    } catch (err: any) {
      // Если сервер вернул 401 или 403, значит сессия протухла
      if (err.response?.status === 401 || err.response?.status === 403) {
        console.error("Ошибка авторизации: сессия истекла");
      }
      console.error("Ошибка синхронизации с БД:", err.message);
    }
  };

  useEffect(() => {
    refreshTasks();
  }, []);

  return (
    <TaskContext.Provider value={{ tasks, refreshTasks }}>
      {children}
    </TaskContext.Provider>
  );
};

export const useTasks = () => {
  const context = useContext(TaskContext);
  if (!context) throw new Error('useTasks must be used within TaskProvider');
  return context;
};