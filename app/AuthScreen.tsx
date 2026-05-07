import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  StyleSheet, Alert, SafeAreaView, ActivityIndicator, ScrollView,
  Animated
} from 'react-native';
import axios from 'axios';
import { useAuth } from '@/server/AuthContext';

const ip = 'https://server-elfq.onrender.com';

interface AuthScreenProps {
  onLoginSuccess: () => void;
}

export default function AuthScreen({ onLoginSuccess }: AuthScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  const [emailError, setEmailError] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Состояния для уведомления
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  // Функция для показа и плавного скрытия уведомления
  const showToast = (msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);

    // Анимация появления
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();


    setTimeout(() => {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setToastVisible(false);
      });
    }, 3000);
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

  const validateEmail = (text: string) => {
    setEmail(text);
    if (text.length > 0 && !/\S+@\S+\.\S+/.test(text)) {
      setEmailError('Некорректный формат почты');
    } else {
      setEmailError('');
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

  const handleAuth = async () => {
    if (!email || !password || (!isLogin && (!name || !phone))) {
      showToast('Заполните все поля');
      return;
    }

    if (emailError || (phoneError && !isLogin)) {
      showToast('Исправьте ошибки');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${ip}${isLogin ? '/login' : '/register'}`, {
        email: email.trim().toLowerCase(),
        password: password.trim(),
        name: isLogin ? undefined : name.trim(),
        phone: isLogin ? undefined : phone.replace(/\D/g, ''),
      });

      if (response.data.token) {
        await login(response.data.token, response.data.userId.toString());
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Проблема со входом.';
      showToast(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Анимированное всплывающее уведомление */}
      {toastVisible && (
        <Animated.View style={[styles.toast, { opacity: fadeAnim }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </Animated.View>
      )}

      <ScrollView contentContainerStyle={styles.scrollContainer} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <Text style={styles.title}>{isLogin ? 'Вход в Radion' : 'Регистрация'}</Text>

          {!isLogin && (
            <>
              <TextInput
                style={styles.input}
                placeholder="Имя"
                value={name}
                onChangeText={setName}
              />
              <TextInput
                style={[styles.input, phoneError ? styles.inputError : null]}
                placeholder="Номер телефона"
                value={phone}
                onChangeText={handlePhoneChange}
                keyboardType="phone-pad"
              />
              {phoneError ? <Text style={styles.errorText}>{phoneError}</Text> : null}
            </>
          )}

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
            style={styles.input}
            placeholder="Пароль"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            style={[styles.button, loading && { opacity: 0.7 }]}
            onPress={handleAuth}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>{isLogin ? 'Войти' : 'Создать аккаунт'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity onPress={() => {
            setIsLogin(!isLogin);
            setEmailError('');
            setPhoneError('');
            setToastVisible(false);
          }} style={{ marginTop: 15 }}>
            <Text style={styles.switchText}>
              {isLogin ? (
                <>Нет аккаунта? <Text style={styles.blueText}>Зарегистрироваться</Text></>
              ) : (
                <>Уже есть аккаунт? <Text style={styles.blueText}>Войти</Text></>
              )}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f3f4f6' },
  scrollContainer: { flexGrow: 1, justifyContent: 'center', padding: 20 },


  toast: {
    position: 'absolute',
    top: 60,
    right: 20,
    backgroundColor: '#ef4444',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 15,
    zIndex: 1000,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    maxWidth: '85%',
  },
  toastText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center'
  },

  card: { backgroundColor: '#fff', padding: 25, borderRadius: 20, elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 8 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20, textAlign: 'center', color: '#1f2937' },
  input: { backgroundColor: '#f3f4f6', padding: 15, borderRadius: 10, fontSize: 16, marginTop: 10 },
  inputError: { borderWidth: 1, borderColor: '#ef4444' },
  errorText: { color: '#ef4444', fontSize: 12, marginLeft: 5, marginTop: 5 },
  button: { backgroundColor: '#1f2937', padding: 15, borderRadius: 10, alignItems: 'center', marginTop: 20 },
  buttonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  switchText: { color: '#6b7280', textAlign: 'center' },
  blueText: { color: '#007AFF', fontWeight: '600' }
});