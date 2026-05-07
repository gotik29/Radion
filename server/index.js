import express from "express";
import pkg from 'pg';
const { Pool } = pkg;
import cors from "cors";
import bodyParser from "body-parser";
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const app = express();
// Секрет для JWT. На Render обязательно добавь его в Environment Variables
const JWT_SECRET = process.env.JWT_SECRET || 'radion_super_secret_key_2026';

app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }, // Обязательно для Neon
});

// --- Middleware для проверки авторизации ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: "Токен не найден" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Сессия истекла" });
    req.user = user;
    next();
  });
};

// --- АВТОРИЗАЦИЯ (Регистрация и Вход) ---

app.post('/register', async (req, res) => {
  const { email, password, name } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    // Вставляем данные в твою таблицу profile
    const result = await pool.query(
      "INSERT INTO profile (name, email, password) VALUES ($1, $2, $3) RETURNING id",
      [name || 'Новый пользователь', email, hashedPassword]
    );

    const userId = result.rows[0].id;
    const token = jwt.sign({ userId }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, userId });
  } catch (err) {
    res.status(500).json({ error: "Email уже занят" });
  }
});

app.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM profile WHERE email = $1", [email]);
    if (result.rows.length === 0) return res.status(401).json({ error: "Пользователь не найден" });

    const user = result.rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Неверный пароль" });

    const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: '30d' });
    res.json({ token, userId: user.id });
  } catch (err) {
    res.status(500).json({ error: "Ошибка сервера" });
  }
});

// --- ПРОФИЛЬ (Используем req.user.userId вместо id=1) ---

app.get("/profile", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, name, email, phone, city, avatar FROM profile WHERE id = $1",
      [req.user.userId]
    );
    res.json(result.rows[0] || { name: "Новый пользователь", email: "" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/profile', authenticateToken, async (req, res) => {
  const { name, email, phone, city, avatar } = req.body;
  const query = `
    UPDATE profile
    SET name = $1, email = $2, phone = $3, city = $4, avatar = $5
    WHERE id = $6
  `;
  try {
    await pool.query(query, [name, email, phone, city, avatar, req.user.userId]);
    res.status(200).json({ message: 'Профиль сохранён' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- ЗАДАЧИ (Фильтрация по user_id) ---

app.get("/tasks", authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM tasks WHERE user_id = $1 ORDER BY id DESC",
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/tasks", authenticateToken, async (req, res) => {
  const { title, description, due, priority, checklist } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO tasks (user_id, title, description, due, priority, checklist, completed) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [req.user.userId, title, description, due || null, priority, JSON.stringify(checklist || []), false]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put("/tasks/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, completed, due, priority, checklist } = req.body;
  try {
    const query = `
      UPDATE tasks
      SET title = $1, description = $2, completed = $3, due = $4, priority = $5, checklist = $6
      WHERE id = $7 AND user_id = $8
    `;
    const result = await pool.query(query, [
      title, description, completed, due || null, priority,
      JSON.stringify(checklist || []), id, req.user.userId
    ]);

    if (result.rowCount === 0) return res.status(403).json({ error: "Доступ запрещен" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/tasks/:id", authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const result = await pool.query(
      "DELETE FROM tasks WHERE id = $1 AND user_id = $2",
      [id, req.user.userId]
    );
    if (result.rowCount === 0) return res.status(403).json({ error: "Не удалось удалить" });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Сервер запущен на порту ${PORT}`);
});