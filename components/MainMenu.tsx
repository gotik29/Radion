import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions, Platform } from 'react-native';
import AnimatedBurgerButton from './AnimatedBurgerButton';

const { height } = Dimensions.get('window');

interface MainMenuProps {
  isVisible: boolean;
  onClose: () => void;
  isLoggedIn: boolean; // Добавим проверку, вошел ли пользователь
}

const MainMenu = ({ isVisible, onClose, isLoggedIn }: MainMenuProps) => {
  return (
    <Modal visible={isVisible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.menuOverlay}>
        <View style={styles.menuCard}>
          <SafeAreaView style={styles.menuSafe}>
            {/* Кнопка закрытия (крестик) */}
            <AnimatedBurgerButton
              isOpen={true}
              onPress={onClose}
              style={styles.burgerInside}
            />

            <Text style={styles.menuHeader}>{isLoggedIn ? 'Навигация' : 'Меню'}</Text>

            <View style={styles.menuItems}>
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuText}>⚙️ Настройки</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuText}>📊 Статистика</Text>
              </TouchableOpacity>

              {/* Эти пункты будут видны всегда, если мы так решим */}
              <TouchableOpacity style={styles.menuItem}>
                <Text style={styles.menuText}>🏆 Достижения</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.menuFooter}>
              {isLoggedIn ? (
                <TouchableOpacity style={styles.logoutBtn}>
                  <Text style={styles.logoutText}>👤 Выйти из аккаунта</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity style={styles.loginBtn}>
                  <Text style={styles.loginText}>👤 Авторизация / Вход</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.version}>v 1.1.0</Text>
            </View>
          </SafeAreaView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  menuOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  menuCard: { height: height * 0.85, backgroundColor: '#fff', borderTopLeftRadius: 40, borderTopRightRadius: 40 },
  menuSafe: { flex: 1, padding: 25, alignItems: 'center' },
  burgerInside: { position: 'absolute', top: 20, right: 25 },
  menuHeader: { fontSize: 28, fontWeight: 'bold', marginTop: 60, marginBottom: 40 },
  menuItems: { width: '100%', flex: 1 },
  menuItem: { backgroundColor: '#f3f4f6', padding: 25, borderRadius: 20, marginBottom: 15 },
  menuText: { fontSize: 18, fontWeight: '600' },
  menuFooter: { width: '100%', alignItems: 'center', paddingBottom: 20 },
  loginBtn: { backgroundColor: '#1f2937', width: '100%', padding: 20, borderRadius: 20, alignItems: 'center' },
  loginText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  logoutBtn: { backgroundColor: '#fee2e2', width: '100%', padding: 20, borderRadius: 20, alignItems: 'center' },
  logoutText: { color: '#ef4444', fontWeight: 'bold', fontSize: 16 },
  version: { color: '#9ca3af', fontSize: 12, marginTop: 15 }
});

export default MainMenu;