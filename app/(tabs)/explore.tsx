import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Animated, Modal, FlatList } from 'react-native';
import * as Haptics from 'expo-haptics';
import { useTasks } from '@/server/TaskContext';
import { Task } from '@/constants/types';
const { width, height } = Dimensions.get('window');
const TIMER_SIZE = Math.min(width * 0.8, 300);


export default function PomodoroScreen() {
  const { tasks } = useTasks();
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isActive, setIsActive] = useState(false);
  const [mode, setMode] = useState<'work' | 'break'>('work');


  // Состояние для выбранной вручную задачи
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Определяем, какую задачу показывать: выбранную или первую из списка
  const currentTask = selectedTaskId
    ? tasks.find(t => t.id === selectedTaskId)
    : tasks.find(t => !t.completed);

  useEffect(() => {
    let interval: any;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      handlePhaseEnd();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const handlePhaseEnd = () => {
    setIsActive(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (mode === 'work') {
      alert('Время отдыхать!');
      setMode('break');
      setTimeLeft(5 * 60);
    } else {
      alert('Пора за работу!');
      setMode('work');
      setTimeLeft(25 * 60);
    }
  };

  const toggleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(mode === 'work' ? 25 * 60 : 5 * 60);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const selectTask = (id: string) => {
    setSelectedTaskId(id);
    setIsModalVisible(false);
    Haptics.selectionAsync();
  };


  return (
    <View style={[styles.container, { backgroundColor: mode === 'work' ? '#fef2f2' : '#f0fdf4' }]}>
      <Text style={styles.modeText}>{mode === 'work' ? 'Концентрация' : 'Отдых'}</Text>

      <View style={styles.timerContainer}>
        <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={toggleTimer}>
          <Text style={styles.buttonText}>{isActive ? 'Пауза' : 'Старт'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={resetTimer}>
          <Text style={styles.resetButtonText}>Сброс</Text>
        </TouchableOpacity>
      </View>

      {/* Интерактивная карточка задачи */}
      <TouchableOpacity
        style={styles.taskCard}
        onPress={() => setIsModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.taskLabel}>Текущая задача (нажми, чтобы изменить):</Text>
        <Text style={styles.taskTitle}>
          {currentTask ? currentTask.title : 'Задачи не выбраны'}
        </Text>
      </TouchableOpacity>

      {/* Модальное окно выбора задачи */}
      <Modal visible={isModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Выберите задачу</Text>
            <FlatList
              data={tasks.filter(t => !t.completed)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.taskItem}
                  onPress={() => selectTask(item.id)}
                >
                  <Text style={styles.taskItemText}>{item.title}</Text>
                  {selectedTaskId === item.id && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Нет активных задач</Text>}
            />
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setIsModalVisible(false)}
            >
              <Text style={styles.closeButtonText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  modeText: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  timerContainer: {
    width: TIMER_SIZE,
    height: TIMER_SIZE,
    borderRadius: TIMER_SIZE / 2, // Чтобы всегда был идеальный круг
    borderWidth: 8,
    borderColor: '#1f2937',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
    // Добавим тени для объема
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  timerText: {
    // Размер шрифта тоже сделаем зависимым от размера круга
    fontSize: TIMER_SIZE * 0.25,
    fontWeight: '300',
    color: '#1f2937',
  },
  controls: { flexDirection: 'row', marginTop: 40 },
  button: { backgroundColor: '#1f2937', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30, marginHorizontal: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  resetButton: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#1f2937' },
  resetButtonText: { color: '#1f2937', fontSize: 18 },
  taskCard: {
    marginTop: 50,
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    width: '100%',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
  },
  taskLabel: { fontSize: 12, color: '#6b7280', marginBottom: 5 },
  taskTitle: { fontSize: 18, fontWeight: '600', color: '#111827' },

  // Стили для модалки
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 20,
    maxHeight: '70%'
  },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  taskItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6'
  },
  taskItemText: { fontSize: 16 },
  checkIcon: { color: '#10b981', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginVertical: 20 },
  closeButton: { marginTop: 20, padding: 15, backgroundColor: '#f3f4f6', borderRadius: 15, alignItems: 'center' },
  closeButtonText: { fontWeight: '600', color: '#374151' }
});

