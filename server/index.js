import express from "express";
import mysql from "mysql2";
import cors from "cors";
import bodyParser from "body-parser";


const app = express();
app.use(cors());
app.use((req, res, next) => {
  console.log(`➡️ ${req.method} ${req.url}`);
  next();
});

app.use(bodyParser.json());

// --- Подключение к базе данных ---
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "db",
});

db.connect((err) => {
  if (err) console.error("Ошибка подключения:", err);
  else console.log("✅ Подключено к MySQL");
});


// --- Получить профиль пользователя (первого для примера) ---
app.get("/profile", (req, res) => {
  db.query("SELECT * FROM users LIMIT 1", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results[0]);
  });
});

// --- Сохранить/обновить профиль ---
app.post('/profile', (req, res) => {
  const { name, email, phone, city, avatar } = req.body;

  console.log('📩 Получены данные:', req.body);

  const query = `
    UPDATE users
    SET name = ?, email = ?, phone = ?, city = ?, avatar = ?
    WHERE id = 1
  `;

  db.query(query, [name, email, phone, city, avatar], (err, result) => {
    if (err) {
      console.error('❌ Ошибка SQL:', err);
      return res.status(500).json({ error: err.message });
    }

    console.log('✅ Результат запроса:', result);
    res.status(200).json({ message: 'Профиль сохранён' });
  });
});

// --- Получить задачи пользователя ---
app.get("/tasks", (req, res) => {
  db.query("SELECT * FROM tasks WHERE user_id = 1", (err, results) => {
    if (err) return res.status(500).json({ error: err });

    const tasks = results.map((t) => {
      let checklist = [];
      try {
        checklist = t.checklist ? JSON.parse(t.checklist) : [];
      } catch (e) {
        console.error(`Ошибка парсинга checklist для задачи ${t.id}:`, e.message);
      }
      return {
        ...t,
        checklist,
      };
    });

    res.json(tasks);
  });
});


// --- Обновить задачу ---
app.put("/tasks/:id", (req, res) => {
  const { title, description, completed, due, priority, checklist } = req.body;
  const checklistJson = JSON.stringify(Array.isArray(checklist) ? checklist : []);
  db.query(
    "UPDATE tasks SET title=?, description=?, completed=?, due=?, priority=?, checklist=? WHERE id=?",
    [title, description, completed, due, priority, checklistJson, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ success: true });
    }
  );
});

// --- Создать новую задачу ---
app.post("/tasks", (req, res) => {
  const { title, description, due, priority, checklist } = req.body;
  const checklistJson = JSON.stringify(Array.isArray(checklist) ? checklist : []);

  const query = `
    INSERT INTO tasks (user_id, title, description, completed, due, priority, checklist)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `;

  db.query(
    query,
    [1, title, description, false, due, priority, checklistJson],
    (err, result) => {
      if (err) {
        console.error("❌ Ошибка SQL при создании задачи:", err);
        return res.status(500).json({ error: err.message });
      }
      res.json({ success: true, id: result.insertId });
    }
  );
});



app.listen(3000, '0.0.0.0', () => console.log('🚀 Сервер запущен на порту 3000'));

