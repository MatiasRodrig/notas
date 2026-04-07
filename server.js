const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 4222;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'notes.db');

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));

let db;

// --- Inicialización de la DB (Asíncrona) ---
async function initDB() {
  const dataDir = path.dirname(DB_PATH);
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

  db = await open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });

  // Habilitar WAL para mejor rendimiento concurrente
  await db.run('PRAGMA journal_mode = WAL');

  // Crear tablas si no existen
  await db.exec(`
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      category_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );
  `);

  // Insertar datos iniciales si la DB está vacía
  const catCount = await db.get('SELECT COUNT(*) as count FROM categories');
  if (catCount.count === 0) {
    await db.run('INSERT INTO categories (id, name, color) VALUES (?, ?, ?)', 'cat-1', 'Personal', 'bg-blue-100 text-blue-800 border-blue-200');
    await db.run('INSERT INTO categories (id, name, color) VALUES (?, ?, ?)', 'cat-2', 'Trabajo', 'bg-green-100 text-green-800 border-green-200');
    await db.run('INSERT INTO categories (id, name, color) VALUES (?, ?, ?)', 'cat-3', 'Estudio', 'bg-purple-100 text-purple-800 border-purple-200');

    await db.run(`
      INSERT INTO notes (id, title, content, category_id, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `, 'note-1', 'Guía de uso de la App', '¡Bienvenido a tu nueva app de notas!', 'cat-1');
  }

  console.log(`✅ Base de datos SQLite lista en: ${DB_PATH}`);
}

// ==================== RUTAS: CATEGORIES ====================

app.get('/api/categories', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM categories ORDER BY created_at ASC');
    res.json(rows.map(r => ({ id: r.id, name: r.name, color: r.color })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  const { name, color } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });

  const id = `cat-${Date.now()}`;
  try {
    await db.run('INSERT INTO categories (id, name, color) VALUES (?, ?, ?)', id, name.trim(), color || '');
    res.status(201).json({ id, name: name.trim(), color: color || '' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM categories WHERE id = ?', req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== RUTAS: NOTES ====================

app.get('/api/notes', async (req, res) => {
  try {
    const { categoryId } = req.query;
    let rows;
    if (categoryId && categoryId !== 'all') {
      rows = await db.all('SELECT * FROM notes WHERE category_id = ? ORDER BY updated_at DESC', categoryId);
    } else {
      rows = await db.all('SELECT * FROM notes ORDER BY updated_at DESC');
    }
    res.json(rows.map(mapNote));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notes/:id', async (req, res) => {
  try {
    const row = await db.get('SELECT * FROM notes WHERE id = ?', req.params.id);
    if (!row) return res.status(404).json({ error: 'Nota no encontrada.' });
    res.json(mapNote(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notes', async (req, res) => {
  const { title, content, categoryId } = req.body;
  const id = `note-${Date.now()}`;
  try {
    await db.run(`
      INSERT INTO notes (id, title, content, category_id, updated_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `, id, title || '', content || '', categoryId || null);

    const row = await db.get('SELECT * FROM notes WHERE id = ?', id);
    res.status(201).json(mapNote(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  const { title, content, categoryId } = req.body;
  try {
    const result = await db.run(`
      UPDATE notes
      SET title = ?, content = ?, category_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `, title || '', content || '', categoryId || null, req.params.id);

    if (result.changes === 0) return res.status(404).json({ error: 'Nota no encontrada.' });

    const row = await db.get('SELECT * FROM notes WHERE id = ?', req.params.id);
    res.json(mapNote(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const result = await db.run('DELETE FROM notes WHERE id = ?', req.params.id);
    if (result.changes === 0) return res.status(404).json({ error: 'Nota no encontrada.' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- Helper: convertir snake_case de SQLite a camelCase ---
function mapNote(row) {
  return {
    id: row.id,
    title: row.title,
    content: row.content,
    categoryId: row.category_id,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  };
}

// --- Arrancar servidor ---
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📡 API lista en http://localhost:${PORT}/api`);
  });
}).catch(err => {
  console.error('❌ Error al iniciar la base de datos:', err);
});

// Cerrar la DB limpiamente
process.on('SIGINT', async () => { if (db) await db.close(); process.exit(0); });
process.on('SIGTERM', async () => { if (db) await db.close(); process.exit(0); });
