import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  Image,
  Pressable,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  StyleSheet,
  Platform,
  TouchableOpacity,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import axios from 'axios';

// Импортируем общие компоненты
import AnimatedBurgerButton from '@/components/AnimatedBurgerButton';
import MainMenu from '@/components/MainMenu';

const ip = 'https://server-elfq.onrender.com';

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export default function ProfileScreen() {
  // --- Состояния меню ---
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(true); // В профиле обычно true

  // --- Профиль ---
  const [avatar, setAvatar] = useState<string>('https://via.placeholder.com/150');
  const [hovered, setHovered] = useState(false);
  const [showOverlay, setShowOverlay] = useState(false);
  const [editModalVisible, setEditModalVisible] = useState(false);

  const [name, setName] = useState('Владислав Соколовский');
  const [email, setEmail] = useState('vladislav@example.com');
  const [phone, setPhone] = useState('+7 123 456 78 90');
  const [city, setCity] = useState('Москва');

  // --- Задачи ---
  const [tasks, setTasks] = useState<Task[]>([]);

  const avatarSize = 150;
  const avatarMargin = 16;

  // --- Получение данных с API ---
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [profileRes, tasksRes] = await Promise.all([
          axios.get(`${ip}/profile`),
          axios.get<Task[]>(`${ip}/tasks`)
        ]);

        if (profileRes.data) {
          setName(profileRes.data.name);
          setEmail(profileRes.data.email);
          setPhone(profileRes.data.phone);
          setCity(profileRes.data.city);
          setAvatar(profileRes.data.avatar || 'https://via.placeholder.com/150');
        }
        setTasks(tasksRes.data);
      } catch (error) {
        console.log('Ошибка при загрузке данных', error);
      }
    };

    fetchData();
  }, []);

  // --- Смена аватара ---
  const pickImage = async () => {
    try {
      if (Platform.OS === 'web') {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        input.onchange = async () => {
          const file = input.files?.[0];
          if (file) {
            const reader = new FileReader();
            reader.onloadend = () => setAvatar(reader.result as string);
            reader.readAsDataURL(file);
          }
        };
        input.click();
      } else {
        const result = await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          allowsEditing: true,
          aspect: [1, 1],
          quality: 1,
        });
        if (!result.canceled) setAvatar(result.assets[0].uri);
      }
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось выбрать изображение');
    }
  };

  // --- Сохранение профиля ---
  const saveProfile = async () => {
    try {
      await axios.post(`${ip}/profile`, { name, email, phone, city, avatar });
      Alert.alert('Успех', 'Профиль сохранён');
      setEditModalVisible(false);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить профиль');
    }
  };

  // --- Переключение статуса задачи ---
  const toggleComplete = async (task: Task) => {
    try {
      const updatedTask = { ...task, completed: !task.completed };
      await axios.put(`${ip}/tasks/${task.id}`, updatedTask);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updatedTask : t)));
    } catch (error) {
      console.log('Ошибка при обновлении задачи', error);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      {/* 1. Глобальная кнопка вызова меню */}
      <AnimatedBurgerButton
        isOpen={isMenuOpen}
        onPress={() => setIsMenuOpen(true)}
        style={styles.burgerPosition}
      />

      <ScrollView contentContainerStyle={{ paddingTop: 60 }}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Профиль</Text>
        </View>

        <View style={[styles.profileCard, { padding: avatarMargin }]}>
          {/* Аватар */}
          <Pressable
            onPress={pickImage}
            onHoverIn={() => Platform.OS === 'web' && setHovered(true)}
            onHoverOut={() => Platform.OS === 'web' && setHovered(false)}
            onPressIn={() => setShowOverlay(true)}
            onPressOut={() => setShowOverlay(false)}
            style={{ width: avatarSize, height: avatarSize, borderRadius: 9999, overflow: 'hidden' }}
          >
            <Image
              source={{ uri: avatar }}
              style={{ width: avatarSize, height: avatarSize, borderRadius: 9999, opacity: hovered || showOverlay ? 0.6 : 1 }}
            />
            {(hovered || showOverlay) && (
              <View style={styles.avatarOverlay}>
                <FontAwesome name="pencil" size={28} color="#fff" />
              </View>
            )}
          </Pressable>

          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>

          <Pressable style={styles.editButton} onPress={() => setEditModalVisible(true)}>
            <Text style={styles.editButtonText}>Редактировать профиль</Text>
          </Pressable>

          {/* Список задач */}
          <View style={styles.tasksWrapper}>
            <Text style={styles.tasksTitle}>Мои задачи</Text>
            {tasks.length === 0 ? (
              <Text style={{ color: '#6b7280' }}>У вас пока нет задач</Text>
            ) : (
              tasks.map(task => (
                <View key={task.id} style={styles.taskItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taskTitleText, task.completed && styles.taskCompletedText]}>
                      {task.title}
                    </Text>
                    {task.description && <Text style={styles.taskDescText}>{task.description}</Text>}
                  </View>
                  <TouchableOpacity onPress={() => toggleComplete(task)}>
                    <FontAwesome
                      name={task.completed ? "check-circle" : "circle-o"}
                      size={24}
                      color={task.completed ? "#10b981" : "#d1d5db"}
                    />
                  </TouchableOpacity>
                </View>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* 2. Общее меню (одинаковое для всех страниц) */}
      <MainMenu
        isVisible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isLoggedIn={isLoggedIn}
      />

      {/* 3. Модалка редактирования (специфична только для этого экрана) */}
      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View style={styles.editOverlay}>
          <View style={styles.editCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalHeader}>Редактировать профиль</Text>

              <Text style={styles.inputLabel}>Имя</Text>
              <TextInput value={name} onChangeText={setName} style={styles.input} />

              <Text style={styles.inputLabel}>Email</Text>
              <TextInput value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" />

              <Text style={styles.inputLabel}>Телефон</Text>
              <TextInput value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />

              <Text style={styles.inputLabel}>Город</Text>
              <TextInput value={city} onChangeText={setCity} style={styles.input} />

              <View style={styles.modalButtonsRow}>
                <Pressable style={styles.cancelBtn} onPress={() => setEditModalVisible(false)}>
                  <Text>Отмена</Text>
                </Pressable>
                <Pressable style={styles.saveBtn} onPress={saveProfile}>
                  <Text style={{ color: '#fff', fontWeight: 'bold' }}>Сохранить</Text>
                </Pressable>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  burgerPosition: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 30,
    right: 20,
    zIndex: 100,
  },
  headerContainer: { padding: 16 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
  profileCard: { backgroundColor: '#fff', borderRadius: 20, alignItems: 'center', margin: 16, elevation: 2, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 4 },
  avatarOverlay: { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' },
  name: { fontSize: 22, fontWeight: 'bold', marginTop: 16, color: '#1f2937' },
  email: { fontSize: 16, color: '#6b7280', marginTop: 4 },
  editButton: { marginTop: 16, backgroundColor: '#1f2937', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12 },
  editButtonText: { color: '#fff', fontWeight: 'bold' },

  // Задачи
  tasksWrapper: { marginTop: 24, width: '100%' },
  tasksTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#1f2937' },
  taskItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: '#f9fafb', marginBottom: 8 },
  taskTitleText: { fontWeight: 'bold', fontSize: 16, color: '#374151' },
  taskCompletedText: { textDecorationLine: 'line-through', color: '#9ca3af' },
  taskDescText: { color: '#6b7280', fontSize: 14, marginTop: 2 },

  // Модалка редактирования
  editOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  editCard: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, height: '80%' },
  modalHeader: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  inputLabel: { fontSize: 14, fontWeight: '600', color: '#6b7280', marginTop: 12 },
  input: { backgroundColor: '#f3f4f6', padding: 12, borderRadius: 10, fontSize: 16, marginTop: 4 },
  modalButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#e5e7eb', alignItems: 'center' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1f2937', alignItems: 'center' },
});