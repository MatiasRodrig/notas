require('dotenv').config();
const express = require('express');
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 4222;
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'notes.db');

// --- Configuración de Multer (Imágenes) ---
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'dist')));
app.use('/uploads', express.static(uploadsDir));

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage: storage 
});

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
      parent_id TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (parent_id) REFERENCES categories(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS notes (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      category_id TEXT,
      type TEXT DEFAULT 'standard',
      status TEXT DEFAULT 'todo',
      priority TEXT DEFAULT 'medium',
      deadline TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS note_tags (
      note_id TEXT,
      tag_id TEXT,
      PRIMARY KEY (note_id, tag_id),
      FOREIGN KEY (note_id) REFERENCES notes(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
  `);

  // Migraciones simples para columnas nuevas
  const tableInfo = await db.all("PRAGMA table_info(notes)");
  const columns = tableInfo.map(c => c.name);
  if (!columns.includes('type')) await db.run("ALTER TABLE notes ADD COLUMN type TEXT DEFAULT 'standard'");
  if (!columns.includes('status')) await db.run("ALTER TABLE notes ADD COLUMN status TEXT DEFAULT 'todo'");
  if (!columns.includes('priority')) await db.run("ALTER TABLE notes ADD COLUMN priority TEXT DEFAULT 'medium'");
  if (!columns.includes('deadline')) await db.run("ALTER TABLE notes ADD COLUMN deadline TEXT");
  if (!columns.includes('start_date')) await db.run("ALTER TABLE notes ADD COLUMN start_date TEXT");
  if (!columns.includes('end_date')) await db.run("ALTER TABLE notes ADD COLUMN end_date TEXT");
  if (!columns.includes('is_recurring')) await db.run("ALTER TABLE notes ADD COLUMN is_recurring INTEGER DEFAULT 0");
  if (!columns.includes('rrule')) await db.run("ALTER TABLE notes ADD COLUMN rrule TEXT");
  if (!columns.includes('all_day')) await db.run("ALTER TABLE notes ADD COLUMN all_day INTEGER DEFAULT 0");
  if (!columns.includes('objective_type')) await db.run("ALTER TABLE notes ADD COLUMN objective_type TEXT DEFAULT 'none'");
  if (!columns.includes('render_mode')) await db.run("ALTER TABLE notes ADD COLUMN render_mode TEXT DEFAULT 'markdown'");
  if (!columns.includes('notification_read')) await db.run("ALTER TABLE notes ADD COLUMN notification_read INTEGER DEFAULT 0");

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

  // Asegurar que la columna parent_id existe (migración simple)
  try { await db.run('ALTER TABLE categories ADD COLUMN parent_id TEXT REFERENCES categories(id) ON DELETE CASCADE'); } catch (e) {}


  console.log(`✅ Base de datos SQLite lista en: ${DB_PATH}`);
}

// ==================== RUTAS: CATEGORIES ====================

app.get('/api/categories', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM categories ORDER BY created_at ASC');
    res.json(rows.map(r => ({ id: r.id, name: r.name, color: r.color, parentId: r.parent_id })));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  const { name, color, parentId } = req.body;
  if (!name?.trim()) return res.status(400).json({ error: 'El nombre es requerido.' });

  const id = `cat-${Date.now()}`;
  try {
    await db.run('INSERT INTO categories (id, name, color, parent_id) VALUES (?, ?, ?, ?)', id, name.trim(), color || '', parentId || null);
    res.status(201).json({ id, name: name.trim(), color: color || '', parentId: parentId || null });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/categories/:id', async (req, res) => {
  const { name, color, parentId } = req.body;
  try {
    const result = await db.run(`
      UPDATE categories
      SET name = ?, color = ?, parent_id = ?
      WHERE id = ?
    `, name?.trim() || '', color || '', parentId || null, req.params.id);

    if (result.changes === 0) return res.status(404).json({ error: 'Categoría no encontrada.' });
    res.json({ id: req.params.id, name: name.trim(), color, parentId });
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

// ==================== RUTAS: TAGS ====================

app.get('/api/tags', async (req, res) => {
  try {
    const rows = await db.all('SELECT * FROM tags ORDER BY name ASC');
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/tags', async (req, res) => {
  const { name, color } = req.body;
  const id = `tag-${Date.now()}`;
  try {
    await db.run('INSERT INTO tags (id, name, color) VALUES (?, ?, ?)', id, name, color || 'bg-slate-100 text-slate-700');
    res.status(201).json({ id, name, color });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/tags/:id', async (req, res) => {
  try {
    await db.run('DELETE FROM tags WHERE id = ?', req.params.id);
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
      // Obtener notas de la categoría O de sus subcategorías
      rows = await db.all(`
        SELECT * FROM notes 
        WHERE category_id = ? 
        OR category_id IN (SELECT id FROM categories WHERE parent_id = ?)
        ORDER BY updated_at DESC
      `, categoryId, categoryId);
    } else {
      rows = await db.all('SELECT * FROM notes ORDER BY updated_at DESC');
    }
    res.json(await Promise.all(rows.map(mapNote)));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/notes/:id', async (req, res) => {
  try {
    const row = await db.get('SELECT * FROM notes WHERE id = ?', req.params.id);
    if (!row) return res.status(404).json({ error: 'Nota no encontrada.' });
    res.json(await mapNote(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/notes', async (req, res) => {
  const { 
    title, content, categoryId, type, status, priority, deadline,
    startDate, endDate, isRecurring, rrule, allDay, objectiveType 
  } = req.body;
  const id = `note-${Date.now()}`;
  try {
    await db.run(`
      INSERT INTO notes (
        id, title, content, category_id, type, status, priority, deadline, 
        start_date, end_date, is_recurring, rrule, all_day, objective_type, render_mode, notification_read, updated_at
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
    `, [
      id, title || '', content || '', categoryId || null, type || 'standard', 
      status || 'todo', priority || 'medium', deadline || null,
      startDate || null, endDate || null, isRecurring ? 1 : 0, rrule || null, 
      allDay ? 1 : 0, objectiveType || 'none', req.body.renderMode || 'markdown',
      req.body.notificationRead ? 1 : 0
    ]);

    const row = await db.get('SELECT * FROM notes WHERE id = ?', id);
    res.status(201).json(await mapNote(row));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notes/:id', async (req, res) => {
  const { 
    title, content, categoryId, type, status, priority, deadline,
    startDate, endDate, isRecurring, rrule, allDay, objectiveType 
  } = req.body;
  try {
    const result = await db.run(`
      UPDATE notes
      SET title = ?, content = ?, category_id = ?, type = ?, status = ?, priority = ?, deadline = ?,
          start_date = ?, end_date = ?, is_recurring = ?, rrule = ?, all_day = ?, objective_type = ?,
          render_mode = ?, notification_read = ?, updated_at = datetime('now')
      WHERE id = ?
    `, [
      title || '', content || '', categoryId || null, type || 'standard', 
      status || 'todo', priority || 'medium', deadline || null,
      startDate || null, endDate || null, isRecurring ? 1 : 0, rrule || null, 
      allDay ? 1 : 0, objectiveType || 'none', req.body.renderMode || 'markdown',
      req.body.notificationRead ? 1 : 0, req.params.id
    ]);

    if (result.changes === 0) return res.status(404).json({ error: 'Nota no encontrada.' });

    const row = await db.get('SELECT * FROM notes WHERE id = ?', req.params.id);
    res.json(await mapNote(row));
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

app.post('/api/notes/:id/tags', async (req, res) => {
  const { tagId } = req.body;
  try {
    await db.run('INSERT OR IGNORE INTO note_tags (note_id, tag_id) VALUES (?, ?)', req.params.id, tagId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/notes/:id/tags/:tagId', async (req, res) => {
  try {
    await db.run('DELETE FROM note_tags WHERE note_id = ? AND tag_id = ?', req.params.id, req.params.tagId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/notes/:id/tags', async (req, res) => {
  const { tagIds } = req.body;
  try {
    await db.run('DELETE FROM note_tags WHERE note_id = ?', req.params.id);
    if (tagIds && tagIds.length > 0) {
      const placeholders = tagIds.map(() => '(?, ?)').join(', ');
      const params = [];
      tagIds.forEach(tId => { params.push(req.params.id); params.push(tId); });
      await db.run(`INSERT INTO note_tags (note_id, tag_id) VALUES ${placeholders}`, ...params);
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ==================== RUTAS: UPLOAD ====================

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ningún archivo.' });
  }
  // Devolvemos la ruta relativa para que el frontend la maneje
  const url = `/uploads/${req.file.filename}`;
  console.log(`📸 Imagen subida: ${url}`);
  res.json({ url, filename: req.file.filename });
});

app.get('/api/images', (req, res) => {
  try {
    const files = fs.readdirSync(uploadsDir);
    const images = files
      .filter(file => /\.(jpg|jpeg|png|gif|svg|webp)$/i.test(file))
      .map(file => ({
        url: `/uploads/${file}`,
        name: file
      }));
    res.json(images);
  } catch (err) {
    res.status(500).json({ error: 'No se pudo leer el directorio de imágenes.' });
  }
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

// --- Helper: convertir snake_case de SQLite a camelCase ---
async function mapNote(row) {
  const tags = await db.all(`
    SELECT t.* FROM tags t
    JOIN note_tags nt ON t.id = nt.tag_id
    WHERE nt.note_id = ?
  `, row.id);

  return {
    id: row.id,
    title: row.title,
    content: row.content,
    categoryId: row.category_id,
    type: row.type,
    status: row.status,
    priority: row.priority,
    deadline: row.deadline,
    startDate: row.start_date,
    endDate: row.end_date,
    isRecurring: row.is_recurring === 1,
    rrule: row.rrule,
    allDay: row.all_day === 1,
    objectiveType: row.objective_type || 'none',
    renderMode: row.render_mode || 'markdown',
    notificationRead: row.notification_read === 1,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
    tags: tags.map(t => ({ id: t.id, name: t.name, color: t.color }))
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
