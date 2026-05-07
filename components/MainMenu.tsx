import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, SafeAreaView, Dimensions, TouchableWithoutFeedback, Platform } from 'react-native';

const { height } = Dimensions.get('window');

interface MainMenuProps {
  isVisible: boolean;
  onClose: () => void;
  isLoggedIn: boolean;
  onLogout: () => void;
}

const MainMenu = ({ isVisible, onClose, isLoggedIn, onLogout }: MainMenuProps) => {
  const handleLogoutPress = () => {
    onLogout(); // Вызываем логику выхода
    onClose();  // Закрываем модальное окно
  };
  return (
    <Modal
      visible={isVisible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}

    >
      {/* TouchableWithoutFeedback позволит закрыть меню, если нажать на пустую область сверху */}
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.menuOverlay}>

          <TouchableWithoutFeedback>
            <View style={styles.menuCard}>
              <SafeAreaView style={styles.menuSafe}>

                {/* ВАЖНО: Мы убрали отсюда AnimatedBurgerButton.
                  За закрытие теперь отвечает кнопка, которая осталась на главном экране.
                  Освобождаем место под заголовком.
                */}

                <Text style={styles.menuHeader}>
                  {isLoggedIn ? 'Навигация' : 'Меню'}
                </Text>

                <View style={styles.menuItems}>
                  <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuText}>⚙️ Настройки</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuText}>📊 Статистика</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.menuItem}>
                    <Text style={styles.menuText}>🏆 Достижения</Text>
                  </TouchableOpacity>
                </View>

                <View style={styles.menuFooter}>
                  {isLoggedIn ? (
                    <TouchableOpacity
                      style={styles.logoutBtn}
                      onPress={handleLogoutPress} // Добавляем обработчик здесь
                    >
                      <Text style={styles.logoutText}>👤 Выйти из аккаунта</Text>
                    </TouchableOpacity>
                  ) : (
                    // Кнопка входа (тут тоже стоит добавить onPress={onLogin} позже)
                    <TouchableOpacity style={styles.loginBtn}>
                      <Text style={styles.loginText}>👤 Авторизация / Вход</Text>
                    </TouchableOpacity>
                  )}
                  <Text style={styles.version}>v 1.1.0</Text>
                </View>
              </SafeAreaView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  menuOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)', // Затемнение фона
    justifyContent: 'flex-end'
  },
  menuCard: {
    height: height * 0.85,
    backgroundColor: '#fff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    // Добавим небольшую тень для объема
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 20,
  },
  menuSafe: {
    flex: 1,
    padding: 25,
    alignItems: 'center'
  },
  menuHeader: {
    fontSize: 28,
    fontWeight: 'bold',
    marginTop: 30, // Уменьшили отступ, так как кнопки внутри больше нет
    marginBottom: 40,
    color: '#1f2937'
  },
  menuItems: {
    width: '100%',
    flex: 1
  },
  menuItem: {
    backgroundColor: '#f3f4f6',
    padding: 25,
    borderRadius: 25,
    marginBottom: 15,
    flexDirection: 'row',
    alignItems: 'center'
  },
  menuText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937'
  },
  menuFooter: {
    width: '100%',
    alignItems: 'center',
    paddingBottom: Platform.OS === 'ios' ? 0 : 20
  },
  loginBtn: {
    backgroundColor: '#1f2937',
    width: '100%',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center'
  },
  loginText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16
  },
  logoutBtn: {
    backgroundColor: '#fee2e2',
    width: '100%',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center'
  },
  logoutText: {
    color: '#ef4444',
    fontWeight: 'bold',
    fontSize: 16
  },
  version: {
    color: '#9ca3af',
    fontSize: 12,
    marginTop: 15
  }
});

export default MainMenu;