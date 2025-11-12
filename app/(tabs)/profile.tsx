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
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome } from '@expo/vector-icons';
import axios from 'axios';
import METHODS from 'methods';

export const methods = METHODS.map(method => method.toLowerCase());

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
}

export default function ProfileScreen() {
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

  // --- Получение задач с API ---
  const fetchTasks = async () => {
    try {
      const response = await axios.get<Task[]>('http://localhost:3000/tasks');
      setTasks(response.data);
    } catch (error) {
      console.log('Ошибка при получении задач', error);
    }
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await axios.get('http://localhost:3000/profile');
        if (res.data) {
          setName(res.data.name);
          setEmail(res.data.email);
          setPhone(res.data.phone);
          setCity(res.data.city);
          setAvatar(res.data.avatar || 'https://via.placeholder.com/150');
        }
      } catch (error) {
        console.log('Ошибка при загрузке профиля', error);
      }
    };

    fetchProfile();
    fetchTasks();
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
      console.log(error);
    }
  };

  // --- Обновление профиля на сервере ---
  const saveProfile = async () => {
    try {
      await axios.post('http://localhost:3000/profile', { name, email, phone, city, avatar });
      Alert.alert('Профиль сохранён');
      setEditModalVisible(false);
    } catch (error) {
      console.log('Ошибка при сохранении профиля', error);
      Alert.alert('Ошибка', 'Не удалось сохранить профиль');
    }
  };

  // --- Работа с задачами ---
  const toggleComplete = async (task: Task) => {
    try {
      const updatedTask = { ...task, completed: !task.completed };
      await axios.put(`http://localhost:3000/tasks/${task.id}`, updatedTask);
      setTasks((prev) => prev.map((t) => t.id === task.id ? updatedTask : t));
    } catch (error) {
      console.log('Ошибка при обновлении задачи', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerContainer}>
        <Text style={styles.header}>Профиль</Text>
      </View>

      <View style={[styles.profileCard, { padding: avatarMargin }]}>
        {/* --- Аватар --- */}
        <Pressable
          onPress={pickImage}
          onHoverIn={() => Platform.OS === 'web' && setHovered(true)}
          onHoverOut={() => Platform.OS === 'web' && setHovered(false)}
          style={{ width: avatarSize, height: avatarSize, borderRadius: 9999, overflow: 'hidden' }}
        >
          <Image
            source={{ uri: avatar }}
            style={{ width: avatarSize, height: avatarSize, borderRadius: 9999, opacity: hovered || showOverlay ? 0.6 : 1 }}
          />
          {(hovered || showOverlay) && (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '100%',
              height: '100%',
              backgroundColor: 'rgba(0,0,0,0.3)',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <FontAwesome name="pencil" size={28} color="#fff" />
            </View>
          )}
        </Pressable>

        {/* --- Имя и email --- */}
        <Text style={styles.name}>{name}</Text>
        <Text style={styles.email}>{email}</Text>

        <Pressable style={styles.editButton} onPress={() => setEditModalVisible(true)}>
          <Text style={styles.editButtonText}>Редактировать профиль</Text>
        </Pressable>

        {/* --- Мои задачи --- */}
        <View style={{ backgroundColor: '#fff', borderRadius: 12, padding: 12, marginTop: 16, width: '100%' }}>
          <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 8 }}>Мои задачи</Text>
          {tasks.length === 0 ? (
            <Text style={{ color: '#6b7280' }}>У вас пока нет задач</Text>
          ) : (
            tasks.map(task => (
              <View key={task.id} style={{ padding: 8, borderRadius: 8, backgroundColor: '#f9fafb', marginBottom: 8 }}>
                <Text style={[{ fontWeight: 'bold', fontSize: 16 }, task.completed && { textDecorationLine: 'line-through', color: '#6b7280' }]}>{task.title}</Text>
                {task.description && <Text style={{ color: '#6b7280', fontSize: 14 }}>{task.description}</Text>}
                <Pressable onPress={() => toggleComplete(task)} style={{ marginTop: 4 }}>

                </Pressable>
              </View>
            ))
          )}
        </View>
      </View>

      {/* --- Модалка редактирования профиля --- */}
      <Modal visible={editModalVisible} animationType="slide">
        <ScrollView contentContainerStyle={styles.modalContainer}>
          <Text style={styles.modalHeader}>Редактировать профиль</Text>

          <Text style={styles.inputLabel}>Имя</Text>
          <TextInput value={name} onChangeText={setName} style={styles.input} />

          <Text style={styles.inputLabel}>Email</Text>
          <TextInput value={email} onChangeText={setEmail} style={styles.input} keyboardType="email-address" />

          <Text style={styles.inputLabel}>Телефон</Text>
          <TextInput value={phone} onChangeText={setPhone} style={styles.input} keyboardType="phone-pad" />

          <Text style={styles.inputLabel}>Город</Text>
          <TextInput value={city} onChangeText={setCity} style={styles.input} />

          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 }}>
            <Pressable style={styles.modalButton} onPress={() => setEditModalVisible(false)}>
              <Text>Отмена</Text>
            </Pressable>
            <Pressable style={[styles.modalButton, { backgroundColor: '#1f2937' }]} onPress={saveProfile}>
              <Text style={{ color: '#fff' }}>Сохранить</Text>
            </Pressable>
          </View>
        </ScrollView>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  headerContainer: { padding: 16 },
  header: { fontSize: 28, fontWeight: 'bold' },
  profileCard: { backgroundColor: '#fff', borderRadius: 12, alignItems: 'center', margin: 16 },
  name: { fontSize: 22, fontWeight: 'bold', marginTop: 16 },
  email: { fontSize: 16, color: '#6b7280', marginTop: 4 },
  editButton: { marginTop: 16, backgroundColor: '#1f2937', paddingVertical: 10, paddingHorizontal: 24, borderRadius: 8 },
  editButtonText: { color: '#fff', fontWeight: 'bold' },
  modalContainer: { padding: 16, backgroundColor: '#fff' },
  modalHeader: { fontSize: 22, fontWeight: 'bold', marginBottom: 16 },
  inputLabel: { fontSize: 16, fontWeight: '600', marginTop: 12 },
  input: { backgroundColor: '#f3f4f6', padding: 12, borderRadius: 8, fontSize: 16, marginTop: 4 },
  modalButton: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, backgroundColor: '#e5e7eb', alignItems: 'center', flex: 1, marginHorizontal: 4 },
});
