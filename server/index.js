import express from "express";
import { Pool } from "pg";
import cors from "cors";
import bodyParser from "body-parser";

const app = express();
app.use(cors());
// Увеличиваем лимит, так как аватар в base64 может быть тяжелым
app.use(bodyParser.json({ limit: '50mb' }));

const pool = new Pool({
  user: "postgres",
  host: "localhost",
  database: "Diplom",
  password: "",
  port: 5432,
});

// --- Профиль пользователя ---
app.get("/profile", async (req, res) => {
  try {
    // Получаем первого пользователя (id=1)
    const result = await pool.query("SELECT * FROM users WHERE id = 1");
    if (result.rows.length === 0) {
      return res.status(404).json({ message: "Пользователь не найден" });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/profile', async (req, res) => {
  const { name, email, phone, city, avatar } = req.body;

  const query = `
    UPDATE users
    SET name = $1, email = $2, phone = $3, city = $4, avatar = $5
    WHERE id = 1
  `;

  try {
    await pool.query(query, [name, email, phone, city, avatar]);
    res.status(200).json({ message: 'Профиль сохранён' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// --- Задачи (Tasks) ---

// 1. Получение задач
app.get("/tasks", async (req, res) => {
  try {
    const result = await pool.query("SELECT * FROM tasks WHERE user_id = 1 ORDER BY id DESC");
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. СОЗДАНИЕ ЗАДАЧИ (Этого метода у тебя не было)
app.post("/tasks", async (req, res) => {
  const { title, description, due, priority, checklist } = req.body;
  try {
    const result = await pool.query(
      "INSERT INTO tasks (user_id, title, description, due, priority, checklist, completed) VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *",
      [1, title, description, due || null, priority, JSON.stringify(checklist || []), false]
    );
    res.json(result.rows[0]);
  } catch (err) {
    console.error(" Ошибка при создании:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 3. ОБНОВЛЕНИЕ ЗАДАЧИ (включая чеклист)
app.put("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, completed, due, priority, checklist } = req.body;

  try {
    const query = `
      UPDATE tasks
      SET title = $1, description = $2, completed = $3, due = $4, priority = $5, checklist = $6
      WHERE id = $7
    `;

    const values = [
      title,
      description,
      completed,
      due || null,
      priority,
      JSON.stringify(checklist || []),
      id
    ];

    await pool.query(query, values);
    res.json({ success: true });
  } catch (err) {
    console.error("❌ Ошибка при обновлении:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// 4. УДАЛЕНИЕ (тоже пригодится)
app.delete("/tasks/:id", async (req, res) => {
  try {
    await pool.query("DELETE FROM tasks WHERE id = $1", [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// --- УДАЛЕНИЕ ЗАДАЧИ ---
app.delete("/tasks/:id", async (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ Запрос на удаление задачи с ID: ${id}`);

  try {
    const result = await pool.query("DELETE FROM tasks WHERE id = $1", [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "Задача не найдена" });
    }

    res.json({ success: true, message: "Задача удалена" });
  } catch (err) {
    console.error("❌ Ошибка при удалении из БД:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.listen(3000, '0.0.0.0', () => console.log('🚀 Сервер запущен на порту 3000'));