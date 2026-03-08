import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { Task } from '@/constants/types';

interface TaskContextType {
  tasks: Task[];
  refreshTasks: () => Promise<void>; // Функция для ручного обновления данных из БД
}

const TaskContext = createContext<TaskContextType | undefined>(undefined);

export const TaskProvider = ({ children }: { children: React.ReactNode }) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  const refreshTasks = async () => {
    try {
      const res = await axios.get('https://server-elfq.onrender.com/tasks');
      setTasks(res.data);
    } catch (err) {
      console.error("Ошибка синхронизации с БД:", err);
    }
  };

  useEffect(() => {
    refreshTasks(); // Загружаем при старте приложения
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