const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;
const MONGODB_URL = process.env.MONGODB_URL || "mongodb://127.0.0.1:27017/";
const DB_NAME = "feedbackDB";
const COLLECTION_NAME = "submissions";

app.use(express.urlencoded({ extended: false }));

app.post("/submit", async function (req, res) {
  const client = new MongoClient(MONGODB_URL);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const doc = {
      name: req.body.name || "",
      email: req.body.email || "",
      faculty: req.body.faculty || "",
      course: req.body.course !== undefined && req.body.course !== "" ? parseInt(req.body.course, 10) : null,
      birthdate: req.body.birthdate || null,
      gender: req.body.gender || null,
      topic: req.body.topic || "",
      message: req.body.message || "",
      subscribe: req.body.subscribe === "yes",
      createdAt: new Date(),
    };
    await db.collection(COLLECTION_NAME).insertOne(doc);
    res.redirect("/data");
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка сохранения данных");
  } finally {
    await client.close();
  }
});

app.get("/data", async function (req, res) {
  const client = new MongoClient(MONGODB_URL);
  try {
    await client.connect();
    const db = client.db(DB_NAME);
    const list = await db
      .collection(COLLECTION_NAME)
      .find({})
      .sort({ createdAt: -1 })
      .toArray();
    const rows = list
      .map(
        (item) => `
        <tr>
          <td>${escapeHtml(item.name)}</td>
          <td>${escapeHtml(item.email)}</td>
          <td>${escapeHtml(item.faculty || "—")}</td>
          <td>${item.course != null ? item.course : "—"}</td>
          <td>${item.birthdate ? escapeHtml(item.birthdate) : "—"}</td>
          <td>${escapeHtml(item.gender || "—")}</td>
          <td>${escapeHtml(item.topic || "—")}</td>
          <td>${escapeHtml(item.message)}</td>
          <td>${item.subscribe ? "Да" : "Нет"}</td>
          <td>${formatDate(item.createdAt)}</td>
        </tr>`
      )
      .join("");
    const html = `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Данные обратной связи | Я — студент ВШЭ</title>
  <link rel="stylesheet" href="/styles.css">
</head>
<body>
  <header class="site-header" style="position: relative;">
    <h1>Я — студент ВШЭ</h1>
    <p class="tagline">Данные обратной связи</p>
  </header>
  <nav class="main-nav" aria-label="Основная навигация">
    <ul>
      <li><a href="/">Главная</a></li>
      <li><a href="/feedback.html">Обратная связь</a></li>
      <li><a href="/data">Данные</a></li>
    </ul>
  </nav>
  <main class="main-content">
    <article>
      <header><h2>Полученные данные</h2></header>
      <div class="data-table-wrap">
        <table class="data-table">
          <thead>
            <tr>
              <th>Имя</th>
              <th>Email</th>
              <th>Факультет</th>
              <th>Курс</th>
              <th>Дата рождения</th>
              <th>Пол</th>
              <th>Тема</th>
              <th>Сообщение</th>
              <th>Рассылка</th>
              <th>Дата отправки</th>
            </tr>
          </thead>
          <tbody>${rows || "<tr><td colspan=\"10\">Нет записей</td></tr>"}</tbody>
        </table>
      </div>
      <p><a href="/feedback.html">Вернуться к форме</a></p>
    </article>
  </main>
  <footer class="site-footer" style="text-align: center;">
    <p><small>© Домашнее задание по веб-программированию. ВШЭ.</small></p>
  </footer>
</body>
</html>`;
    res.send(html);
  } catch (err) {
    console.error(err);
    res.status(500).send("Ошибка загрузки данных");
  } finally {
    await client.close();
  }
});

function escapeHtml(s) {
  if (s == null) return "";
  const str = String(s);
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function formatDate(d) {
  if (!d) return "—";
  const date = d instanceof Date ? d : new Date(d);
  return date.toLocaleString("ru-RU");
}

app.use(express.static(__dirname));

app.listen(PORT, function () {
  console.log("Сервер запущен на http://localhost:" + PORT);
});
