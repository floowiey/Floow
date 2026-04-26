
import express, { Request, Response, NextFunction } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { readDb, writeDb } from './src/server/db.ts';
import { User, Task, Note, DiaryEntry } from './src/types.ts';
import { v4 as uuidv4 } from 'uuid'; // I need to install uuid

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const JWT_SECRET = process.env.JWT_SECRET || 'floow-secret-key-123';

// Middleware to authenticate JWT
const authenticateToken = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.status(401).json({ error: 'Unauthorized' });

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.status(403).json({ error: 'Forbidden' });
    (req as any).user = user;
    next();
  });
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- AUTH ROUTES ---
  app.post('/api/auth/signup', async (req, res) => {
    const { username, password } = req.body;
    const db = await readDb();

    if (db.users.find((u: User) => u.username === username)) {
      return res.status(400).json({ error: 'Username already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser: User = {
      id: Math.random().toString(36).substring(7),
      username,
      passwordHash,
      createdAt: new Date().toISOString(),
      darkMode: false
    };

    db.users.push(newUser);

    // Create 15 default tasks for new user
    const defaultTaskNames = [
      'Morning Meditation', 'Drink 2L Water', 'Read 10 Pages', 
      'Plan Tomorrow', 'Express Gratitude', 'Exercise 30m',
      'No Social Media', 'Early Wake-up', 'Journaling',
      'Healthy Breakfast', 'Tidy Workspace', 'Stretching',
      'Learn Something New', 'Sleep 8 Hours', 'Focus Work'
    ];

    const newTasks = defaultTaskNames.map(name => ({
      id: Math.random().toString(36).substring(7),
      userId: newUser.id,
      name,
      description: `Default task for ${name}`,
      createdAt: new Date().toISOString(),
      checks: {}
    }));

    db.tasks.push(...newTasks);
    await writeDb(db);

    const token = jwt.sign({ id: newUser.id, username: newUser.username }, JWT_SECRET);
    res.json({ token, user: { id: newUser.id, username: newUser.username, darkMode: newUser.darkMode } });
  });

  app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const db = await readDb();

    const user = db.users.find((u: User) => u.username === username);
    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET);
    res.json({ token, user: { id: user.id, username: user.username, darkMode: user.darkMode } });
  });

  // --- TASK ROUTES ---
  app.get('/api/tasks', authenticateToken, async (req, res) => {
    const db = await readDb();
    const userId = (req as any).user.id;
    const tasks = db.tasks.filter((t: Task) => t.userId === userId);
    res.json(tasks);
  });

  app.post('/api/tasks', authenticateToken, async (req, res) => {
    const { name, description, timeRange } = req.body;
    const db = await readDb();
    const userId = (req as any).user.id;

    const newTask: Task = {
      id: Math.random().toString(36).substring(7),
      userId,
      name,
      description,
      timeRange,
      createdAt: new Date().toISOString(),
      checks: {}
    };

    db.tasks.push(newTask);
    await writeDb(db);
    res.json(newTask);
  });

  app.put('/api/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { name, description, timeRange } = req.body;
    const db = await readDb();
    const userId = (req as any).user.id;

    const task = db.tasks.find((t: Task) => t.id === id && t.userId === userId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    task.name = name ?? task.name;
    task.description = description ?? task.description;
    task.timeRange = timeRange ?? task.timeRange;

    await writeDb(db);
    res.json(task);
  });

  app.patch('/api/tasks/:id/toggle', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const { date, completed } = req.body; // date is YYYY-MM-DD
    const db = await readDb();
    const userId = (req as any).user.id;

    const task = db.tasks.find((t: Task) => t.id === id && t.userId === userId);
    if (!task) return res.status(404).json({ error: 'Task not found' });

    // Prevent editing future dates
    if (new Date(date) > new Date()) {
        return res.status(400).json({ error: 'Cannot edit future dates' });
    }

    task.checks[date] = completed;
    await writeDb(db);
    res.json(task);
  });

  app.delete('/api/tasks/:id', authenticateToken, async (req, res) => {
    const { id } = req.params;
    const db = await readDb();
    const userId = (req as any).user.id;

    db.tasks = db.tasks.filter((t: Task) => !(t.id === id && t.userId === userId));
    await writeDb(db);
    res.json({ success: true });
  });

  // --- NOTES ROUTES ---
  app.get('/api/notes/:date', authenticateToken, async (req, res) => {
    const { date } = req.params;
    const db = await readDb();
    const userId = (req as any).user.id;
    const note = db.notes.find((n: Note) => n.userId === userId && n.date === date);
    res.json(note || { userId, date, text: '' });
  });

  app.post('/api/notes', authenticateToken, async (req, res) => {
    const { date, text } = req.body;
    const db = await readDb();
    const userId = (req as any).user.id;

    let note = db.notes.find((n: Note) => n.userId === userId && n.date === date);
    if (note) {
      note.text = text;
    } else {
      note = { id: Math.random().toString(36).substring(7), userId, date, text };
      db.notes.push(note);
    }

    await writeDb(db);
    res.json(note);
  });

  // --- DIARY ROUTES ---
  app.get('/api/diary/:date', authenticateToken, async (req, res) => {
    const { date } = req.params;
    const db = await readDb();
    const userId = (req as any).user.id;
    const entry = db.diaryEntries.find((d: DiaryEntry) => d.userId === userId && d.date === date);
    res.json(entry || { userId, date, content: '' });
  });

  app.post('/api/diary', authenticateToken, async (req, res) => {
    const { date, content } = req.body;
    const db = await readDb();
    const userId = (req as any).user.id;

    let entry = db.diaryEntries.find((d: DiaryEntry) => d.userId === userId && d.date === date);
    if (entry) {
      entry.content = content;
    } else {
      entry = { id: Math.random().toString(36).substring(7), userId, date, content };
      db.diaryEntries.push(entry);
    }

    await writeDb(db);
    res.json(entry);
  });

  // --- SETTINGS ---
  app.post('/api/settings/darkMode', authenticateToken, async (req, res) => {
    const { darkMode } = req.body;
    const db = await readDb();
    const userId = (req as any).user.id;

    const user = db.users.find((u: User) => u.id === userId);
    if (user) {
      user.darkMode = darkMode;
      await writeDb(db);
    }
    res.json({ success: true });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Floow Server running on http://localhost:${PORT}`);
  });
}

startServer();
