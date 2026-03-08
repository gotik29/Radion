import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Modal,
  FlatList,
  Easing,
  Platform,
  SafeAreaView
} from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useTasks } from '@/server/TaskContext';

// Импортируем наши общие компоненты
import AnimatedBurgerButton from '@/components/AnimatedBurgerButton';
import MainMenu from '@/components/MainMenu';

const { width } = Dimensions.get('window');
const TIMER_SIZE = Math.min(width * 0.8, 300);
const STROKE_WIDTH = 10;
const RADIUS = Math.max((TIMER_SIZE - STROKE_WIDTH) / 2, 10);
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const TIME_OPTIONS = [15, 20, 25, 30, 45, 60];

export default function PomodoroScreen() {
  const { tasks } = useTasks();

  // --- Состояния меню ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // Можно связать с твоей логикой профиля

  // --- Логика таймера ---
  const [mode, setMode] = useState<'work' | 'break'>('work');
  const [workDuration, setWorkDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);

  // Состояния модалок (специфичные для таймера)
  const [isTimeModalVisible, setIsTimeModalVisible] = useState(false);
  const [isTaskModalVisible, setIsTaskModalVisible] = useState(false);

  const totalTime = (mode === 'work' ? workDuration : breakDuration) * 60;
  const [timeLeft, setTimeLeft] = useState(totalTime);
  const [isActive, setIsActive] = useState(false);

  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const animatedValue = useRef(new Animated.Value(1)).current;

  const currentTask = selectedTaskId
    ? tasks.find(t => t.id === selectedTaskId)
    : tasks.find(t => !t.completed);

  // Синхронизация при смене режима или настроек
  useEffect(() => {
    if (!isActive) {
      setTimeLeft(totalTime);
      animatedValue.setValue(1);
    }
  }, [workDuration, breakDuration, mode]);

  // Анимация круга
  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: timeLeft / totalTime,
      duration: 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();
  }, [timeLeft, totalTime]);

  useEffect(() => {
    let interval: any;
    if (isActive && timeLeft > 0) {
      interval = setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0) {
      handlePhaseEnd();
    }
    return () => clearInterval(interval);
  }, [isActive, timeLeft]);

  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [CIRCUMFERENCE, 0],
  });

  const handlePhaseEnd = () => {
    setIsActive(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMode(prev => (prev === 'work' ? 'break' : 'work'));
  };

  const toggleTimer = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsActive(!isActive);
  };

  const resetTimer = () => {
    setIsActive(false);
    setTimeLeft(totalTime);
    animatedValue.setValue(1);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const selectDuration = (mins: number) => {
    if (mode === 'work') setWorkDuration(mins);
    else setBreakDuration(mins);
    setIsTimeModalVisible(false);
    Haptics.selectionAsync();
  };

  const selectTask = (id: string) => {
    setSelectedTaskId(id);
    setIsTaskModalVisible(false);
    Haptics.selectionAsync();
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 1. Глобальная кнопка вызова меню */}
      <AnimatedBurgerButton
        isOpen={isMenuOpen}
        onPress={() => setIsMenuOpen(true)}
        style={styles.burgerPosition}
      />

      <Text style={styles.modeText}>{mode === 'work' ? 'Концентрация' : 'Отдых'}</Text>

      <View style={styles.timerContainer}>
        <Svg width={TIMER_SIZE} height={TIMER_SIZE} style={styles.svg}>
          <Circle cx={TIMER_SIZE / 2} cy={TIMER_SIZE / 2} r={RADIUS} stroke="#e5e7eb" strokeWidth={STROKE_WIDTH} fill="transparent" />
          <AnimatedCircle
            cx={TIMER_SIZE / 2}
            cy={TIMER_SIZE / 2}
            r={RADIUS}
            stroke="#1f2937"
            strokeWidth={STROKE_WIDTH}
            fill="transparent"
            strokeDasharray={`${CIRCUMFERENCE} ${CIRCUMFERENCE}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform={`rotate(-90, ${TIMER_SIZE / 2}, ${TIMER_SIZE / 2})`}
          />
        </Svg>

        <TouchableOpacity onPress={() => !isActive && setIsTimeModalVisible(true)} disabled={isActive}>
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
          {!isActive && <Text style={styles.editHint}>нажми, чтобы изменить время</Text>}
        </TouchableOpacity>
      </View>

      <View style={styles.controls}>
        <TouchableOpacity style={styles.button} onPress={toggleTimer}>
          <Text style={styles.buttonText}>{isActive ? 'Пауза' : 'Старт'}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[styles.button, styles.resetButton]} onPress={resetTimer}>
          <Text style={styles.resetButtonText}>Сброс</Text>
        </TouchableOpacity>
      </View>

      {/* Карточка задачи */}
      <TouchableOpacity style={styles.taskCard} onPress={() => setIsTaskModalVisible(true)} activeOpacity={0.7}>
        <Text style={styles.taskLabel}>Текущая задача (нажми, чтобы изменить):</Text>
        <Text style={styles.taskTitle}>{currentTask ? currentTask.title : 'Задачи не выбраны'}</Text>
      </TouchableOpacity>

      {/* 2. Общее меню (Навигация) */}
      <MainMenu
        isVisible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isLoggedIn={isLoggedIn}
      />

      {/* 3. Модалки выбора (специфичные для экрана) */}
      <Modal visible={isTimeModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalOverlayCenter}>
          <View style={styles.modalContentSmall}>
            <Text style={styles.modalTitle}>Длительность</Text>
            <View style={styles.optionsGrid}>
              {TIME_OPTIONS.map(mins => (
                <TouchableOpacity key={mins} style={styles.optionButton} onPress={() => selectDuration(mins)}>
                  <Text style={styles.optionText}>{mins} мин</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setIsTimeModalVisible(false)} style={styles.cancelLink}>
              <Text style={styles.cancelText}>Отмена</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={isTaskModalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalOverlayBottom}>
          <View style={styles.modalContentFull}>
            <Text style={styles.modalTitle}>Выберите задачу</Text>
            <FlatList
              data={tasks.filter(t => !t.completed)}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity style={styles.taskItem} onPress={() => selectTask(item.id)}>
                  <Text style={styles.taskItemText}>{item.title}</Text>
                  {selectedTaskId === item.id && <Text style={styles.checkIcon}>✓</Text>}
                </TouchableOpacity>
              )}
              ListEmptyComponent={<Text style={styles.emptyText}>Нет активных задач</Text>}
            />
            <TouchableOpacity style={styles.closeButton} onPress={() => setIsTaskModalVisible(false)}>
              <Text style={styles.closeButtonText}>Закрыть</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#d1d5db', justifyContent: 'center', alignItems: 'center', padding: 20 },
  burgerPosition: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 30,
    right: 25,
    zIndex: 10,
  },
  modeText: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, color: '#1f2937' },
  timerContainer: { width: TIMER_SIZE, height: TIMER_SIZE, justifyContent: 'center', alignItems: 'center' },
  svg: { position: 'absolute' },
  timerText: { fontSize: TIMER_SIZE * 0.2, fontWeight: '200', color: '#1f2937', textAlign: 'center' },
  editHint: { fontSize: 10, color: '#9ca3af', textAlign: 'center', marginTop: -5 },
  controls: { flexDirection: 'row', marginTop: 40 },
  button: { backgroundColor: '#1f2937', paddingHorizontal: 40, paddingVertical: 15, borderRadius: 30, marginHorizontal: 10 },
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  resetButton: { backgroundColor: 'transparent', borderWidth: 2, borderColor: '#1f2937' },
  resetButtonText: { color: '#1f2937', fontSize: 18 },

  taskCard: {
    marginTop: 50, padding: 20, backgroundColor: '#fff', borderRadius: 15, width: '100%', alignItems: 'center',
    borderWidth: 1, borderColor: '#e5e7eb',
    ...Platform.select({
      ios: { shadowOpacity: 0.1, shadowRadius: 10 },
      android: { elevation: 5 },
      web: { boxShadow: '0 4px 10px rgba(0,0,0,0.05)' }
    })
  },
  taskLabel: { fontSize: 12, color: '#6b7280', marginBottom: 5 },
  taskTitle: { fontSize: 18, fontWeight: '600' },

  // Стили модалок
  modalOverlayCenter: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center' },
  modalOverlayBottom: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContentSmall: { backgroundColor: '#fff', borderRadius: 25, padding: 25, width: '80%', alignItems: 'center' },
  modalContentFull: { backgroundColor: '#fff', borderTopLeftRadius: 25, borderTopRightRadius: 25, padding: 20, maxHeight: '70%' },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  optionsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center' },
  optionButton: { backgroundColor: '#f3f4f6', padding: 15, borderRadius: 15, margin: 5, minWidth: 90, alignItems: 'center' },
  optionText: { fontWeight: '600' },
  cancelLink: { marginTop: 15 },
  cancelText: { color: '#ef4444', fontWeight: 'bold' },

  taskItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#f3f4f6' },
  taskItemText: { fontSize: 16 },
  checkIcon: { color: '#10b981', fontWeight: 'bold' },
  emptyText: { textAlign: 'center', color: '#9ca3af', marginVertical: 20 },
  closeButton: { marginTop: 20, padding: 15, backgroundColor: '#f3f4f6', borderRadius: 15, alignItems: 'center' },
  closeButtonText: { fontWeight: '600' }
});