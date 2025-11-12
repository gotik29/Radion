CREATE DATABASE task_manager CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE task_manager;
CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(150) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  avatar_url VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE TABLE tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  status ENUM('новая', 'в процессе', 'выполнена') DEFAULT 'новая',
  due_date DATE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);
-- Добавим пользователя
INSERT INTO users (name, email, password, avatar_url)
VALUES ('Владислав', 'vlad@example.com', 'hashed_password', 'https://example.com/avatar.png');

-- Добавим задачи
INSERT INTO tasks (user_id, title, description, status, due_date)
VALUES
(1, 'Сделать дизайн профиля', 'Завершить UI для страницы профиля', 'в процессе', '2025-11-12'),
(1, 'Связать задачи с БД', 'Реализовать MySQL интеграцию', 'новая', '2025-11-15');
