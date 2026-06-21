const express = require('express');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// PostgreSQL конекција со retry логика
const pool = new Pool({
  host: process.env.DB_HOST || 'db',
  port: parseInt(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'notesdb',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Иницијализација на табела со retry
async function initDB(retries = 10) {
  for (let i = 0; i < retries; i++) {
    try {
      await pool.query(`
        CREATE TABLE IF NOT EXISTS notes (
          id SERIAL PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          content TEXT,
          created_at TIMESTAMP DEFAULT NOW()
        )
      `);
      console.log('База на податоци иницијализирана успешно');
      return;
    } catch (err) {
      console.log(`Обид ${i + 1}/${retries} - Чекање на база...`);
      await new Promise(res => setTimeout(res, 2000));
    }
  }
  console.error('Неуспешна конекција со база');
  process.exit(1);
}

initDB();

// GET - Листа на сите белешки
app.get('/api/notes', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM notes ORDER BY created_at DESC');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST - Креирање нова белешка
app.post('/api/notes', async (req, res) => {
  const { title, content } = req.body;
  if (!title) return res.status(400).json({ error: 'Насловот е задолжителен' });
  try {
    const result = await pool.query(
      'INSERT INTO notes (title, content) VALUES ($1, $2) RETURNING *',
      [title, content || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT - Ажурирање белешка
app.put('/api/notes/:id', async (req, res) => {
  const { title, content } = req.body;
  try {
    const result = await pool.query(
      'UPDATE notes SET title=$1, content=$2 WHERE id=$3 RETURNING *',
      [title, content, req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Белешката не е најдена' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE - Бришење белешка
app.delete('/api/notes/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM notes WHERE id = $1', [req.params.id]);
    res.json({ message: 'Белешката е избришана' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check endpoint
app.get('/health', (req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend работи на порт ${PORT}`));
