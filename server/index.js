import express from "express";
import mysql from "mysql2";
import cors from "cors";
import bodyParser from "body-parser";


const app = express();
app.use(cors());
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
app.post("/profile", (req, res) => {
  const { name, email, phone, city, avatar } = req.body;
  db.query(
    "UPDATE users SET name=?, email=?, phone=?, city=?, avatar=? WHERE id=1",
    [name, email, phone, city, avatar],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ success: true });
    }
  );
});

// --- Получить задачи пользователя ---
app.get("/tasks", (req, res) => {
  db.query("SELECT * FROM tasks WHERE user_id = 1", (err, results) => {
    if (err) return res.status(500).json({ error: err });
    res.json(results);
  });
});

// --- Обновить задачу ---
app.put("/tasks/:id", (req, res) => {
  const { title, description, completed } = req.body;
  db.query(
    "UPDATE tasks SET title=?, description=?, completed=? WHERE id=?",
    [title, description, completed, req.params.id],
    (err) => {
      if (err) return res.status(500).json({ error: err });
      res.json({ success: true });
    }
  );
});

app.listen(3000, () => console.log("🚀 Сервер запущен на порту 3000"));
