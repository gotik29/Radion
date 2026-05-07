import React, { useState, useEffect } from 'react';
import {
  View, Text, Image, Pressable, ScrollView, TextInput,
  Modal, Alert, StyleSheet, Platform, TouchableOpacity,
  Dimensions,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useLayoutEffect } from 'react';
import { useNavigation } from 'expo-router';
import { useAuth } from '@/server/AuthContext';

// Импорты компонентов
import AnimatedBurgerButton from '@/components/AnimatedBurgerButton';
import MainMenu from '@/components/MainMenu';

const { width } = Dimensions.get('window');
const ip = 'https://server-elfq.onrender.com';

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export default function ProfileScreen() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const navigation = useNavigation();
  const { logout } = useAuth();
  const [avatar, setAvatar] = useState<string>('https://via.placeholder.com/150');

  const [editModalVisible, setEditModalVisible] = useState(false);
  const placeholder = 'https://via.placeholder.com/150';

  const [name, setName] = useState('Загрузка...');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [city, setCity] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);

  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const [isLogin, setIsLogin] = useState(true);

  // --- Функция для получения заголовков с токеном ---
  const getAuthHeaders = async () => {
    const token = await AsyncStorage.getItem('userToken');
    return { headers: { Authorization: `Bearer ${token}` } };
  };

  const validateEmail = (text: string) => {
    setEmail(text);
    if (text.length > 0 && !/\S+@\S+\.\S+/.test(text)) {
      setEmailError('Некорректный формат почты');
    } else {
      setEmailError('');
    }
  };

  const formatPhoneNumber = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    let formatted = cleaned;
    if (cleaned.length > 0) {
      formatted = '+' + cleaned.substring(0, 1);
      if (cleaned.length > 1) formatted += ' (' + cleaned.substring(1, 4);
      if (cleaned.length > 4) formatted += ') ' + cleaned.substring(4, 7);
      if (cleaned.length > 7) formatted += '-' + cleaned.substring(7, 9);
      if (cleaned.length > 9) formatted += '-' + cleaned.substring(9, 11);
    }
    return formatted.substring(0, 18);
  };

  useLayoutEffect(() => {
    navigation.getParent()?.setOptions({
      tabBarStyle: {
        display: isMenuOpen ? 'none' : 'flex',
        height: 60,
        backgroundColor: '#fff',
      },
    });
  }, [isMenuOpen, navigation]);

  const handleLogout = async () => {
    try {
      setIsMenuOpen(false);

      await logout();

    } catch (error) {
      console.error("Ошибка при выходе:", error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const headers = await getAuthHeaders();
        const [profileRes, tasksRes] = await Promise.all([
          axios.get(`${ip}/profile`, headers),
          axios.get<Task[]>(`${ip}/tasks`, headers)
        ]);

        if (profileRes.data) {
          setName(profileRes.data.name);
          setEmail(profileRes.data.email);
          setPhone(profileRes.data.phone || '');
          setCity(profileRes.data.city || '');
          setAvatar(profileRes.data.avatar || 'https://via.placeholder.com/150');
          const savedAvatar = profileRes.data.avatar;
          if (savedAvatar && !savedAvatar.startsWith('blob:')) {
            setAvatar(savedAvatar);
          } else {
            setAvatar(placeholder);
          }
        }
        setTasks(tasksRes.data);
      } catch (error: any) {
        if (error.response?.status === 401) handleLogout();
        console.log('Ошибка при загрузке данных', error.message);
      }
    };

    fetchData();
  }, []);

  const saveProfile = async () => {
    try {
      const headers = await getAuthHeaders();
      await axios.post(`${ip}/profile`,
        { name, email, phone, city, avatar },
        headers
      );
      Alert.alert('Успех', 'Профиль сохранён');
      setEditModalVisible(false);
    } catch (error) {
      Alert.alert('Ошибка', 'Не удалось сохранить профиль');
    }
  };

  const toggleComplete = async (task: Task) => {
    try {
      const headers = await getAuthHeaders();
      const updatedTask = { ...task, completed: !task.completed };
      await axios.put(`${ip}/tasks/${task.id}`, updatedTask, headers);
      setTasks((prev) => prev.map((t) => (t.id === task.id ? updatedTask : t)));
    } catch (error) {
      console.log('Ошибка при обновлении задачи', error);
    }
  };

  const handlePhoneChange = (text: string) => {
    const formatted = formatPhoneNumber(text);
    setPhone(formatted);
    if (!isLogin && formatted.length > 0 && formatted.replace(/\D/g, '').length < 11) {
      setPhoneError('Номер слишком короткий');
    } else {
      setPhoneError('');
    }
  };



  // Рендеринг компонента
  return (
    <View style={{ flex: 1, backgroundColor: '#f3f4f6' }}>
      <AnimatedBurgerButton
        isOpen={isMenuOpen}
        onPress={() => setIsMenuOpen(true)}
        style={styles.burgerPosition}
      />

      <ScrollView contentContainerStyle={{ paddingTop: 60 }}>
        <View style={styles.headerContainer}>
          <Text style={styles.header}>Профиль</Text>
        </View>

        <View style={[styles.profileCard, { padding: 16 }]}>
          <Pressable
            onPress={async () => {

              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.3,
                base64: true,
              });
              if (!result.canceled && result.assets[0].base64) {
                const base64Image = `data:image/jpeg;base64,${result.assets[0].base64}`;
                setAvatar(base64Image);
              }
            }}
            style={{ width: 150, height: 150, borderRadius: 9999, overflow: 'hidden' }}
          >
            <Image source={{ uri: avatar }} style={{ width: 150, height: 150, borderRadius: 9999 }} />
          </Pressable>

          <Text style={styles.name}>{name}</Text>
          <Text style={styles.email}>{email}</Text>

          <Pressable style={styles.editButton} onPress={() => setEditModalVisible(true)}>
            <Text style={styles.editButtonText}>Редактировать профиль</Text>
          </Pressable>

          <View style={styles.tasksWrapper}>
            <Text style={styles.tasksTitle}>Мои задачи</Text>
            {tasks.length === 0 ? (
              <Text style={{ color: '#6b7280', padding: 20 }}>Задач нет</Text>
            ) : (
              tasks.map(task => (
                <View key={task.id} style={styles.taskItem}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.taskTitleText, task.completed && styles.taskCompletedText]}>
                      {task.title}
                    </Text>
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

      <MainMenu
        isVisible={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        isLoggedIn={true}
        onLogout={handleLogout}
      />

      <Modal visible={editModalVisible} animationType="slide" transparent={true}>
        <View style={styles.editOverlay}>
          <View style={styles.editCard}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.modalHeader}>Редактировать профиль</Text>
              <TextInput value={name} onChangeText={setName} style={styles.input} placeholder="Имя" />
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                placeholder="Email"
                value={email}
                onChangeText={validateEmail}
                autoCapitalize="none"
                keyboardType="email-address"
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
              <TextInput
                style={[styles.input, phoneError ? styles.inputError : null]}
                placeholder="Номер телефона"
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
              />
              {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
              <TextInput value={city} onChangeText={setCity} style={styles.input} placeholder="Город" />
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
  burgerPosition: { position: 'absolute', top: Platform.OS === 'ios' ? 40 : 10, right: 20, zIndex: 2000 },
  headerContainer: { padding: 16 },
  header: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
  profileCard: { backgroundColor: '#fff', borderRadius: 20, alignItems: 'center', margin: 16, elevation: 2 },
  name: { fontSize: 22, fontWeight: 'bold', marginTop: 16, color: '#1f2937' },
  inputError: { borderWidth: 1, borderColor: '#ef4444' },
  errorText: { color: '#ef4444', fontSize: 12, marginLeft: 5, marginTop: 5 },
  email: { fontSize: 16, color: '#6b7280', marginTop: 4 },
  editButton: { marginTop: 16, backgroundColor: '#1f2937', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 12 },
  editButtonText: { color: '#fff', fontWeight: 'bold' },
  tasksWrapper: { marginTop: 24, width: '100%', paddingHorizontal: 16 },
  tasksTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12, color: '#1f2937' },
  taskItem: { flexDirection: 'row', alignItems: 'center', padding: 12, borderRadius: 12, backgroundColor: '#f9fafb', marginBottom: 8 },
  taskTitleText: { fontWeight: 'bold', fontSize: 16, color: '#374151' },
  taskCompletedText: { textDecorationLine: 'line-through', color: '#9ca3af' },
  editOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  editCard: { backgroundColor: '#fff', borderTopLeftRadius: 30, borderTopRightRadius: 30, padding: 20, height: '80%' },
  modalHeader: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  input: { backgroundColor: '#f3f4f6', padding: 12, borderRadius: 10, fontSize: 16, marginTop: 10 },
  modalButtonsRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 24, gap: 10 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#e5e7eb', alignItems: 'center' },
  saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, backgroundColor: '#1f2937', alignItems: 'center' },
});