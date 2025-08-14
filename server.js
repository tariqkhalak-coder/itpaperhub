const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// ✅ CORS Configuration
app.use(cors({
  origin: [
    "http://localhost:3000", // Local frontend
    "https://YOUR-FRONTEND-URL.onrender.com" // Replace with your frontend Render URL
  ],
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));

// Middleware
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Database setup
const db = new sqlite3.Database(path.join(__dirname, 'database.db'), (err) => {
  if (err) console.error(err);
  console.log('✅ SQLite Connected');
});

// Create tables if not exist
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'user',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

db.run(`CREATE TABLE IF NOT EXISTS papers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  batch TEXT NOT NULL,
  semester TEXT NOT NULL,
  subject TEXT NOT NULL,
  subject_code TEXT,
  file_path TEXT NOT NULL,
  uploaded_by INTEGER,
  uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)`);

// Multer storage for PDF uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(__dirname, 'uploads');
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  }
});
const upload = multer({ storage });

// Auth Middleware
function auth(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (!token) return res.status(401).json({ success: false, error: 'No token provided' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ success: false, error: 'Invalid token' });
    req.user = user;
    next();
  });
}

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password } = req.body;
  const hashed = await bcrypt.hash(password, 10);
  db.run(`INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)`,
    [name, email, hashed],
    function (err) {
      if (err) return res.json({ success: false, error: 'Email already exists' });
      res.json({ success: true });
    });
});

// Login
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body;
  db.get(`SELECT * FROM users WHERE email = ?`, [email], async (err, user) => {
    if (!user) return res.json({ success: false, error: 'Invalid credentials' });
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.json({ success: false, error: 'Invalid credentials' });
    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '1d' });
    res.json({ success: true, token, user: { id: user.id, name: user.name, role: user.role } });
  });
});

// Forgot password
app.post('/api/auth/forgot', async (req, res) => {
  const { email, newPassword } = req.body;
  const hashed = await bcrypt.hash(newPassword, 10);
  db.run(`UPDATE users SET password_hash = ? WHERE email = ?`,
    [hashed, email],
    function (err) {
      if (err || this.changes === 0) return res.json({ success: false, error: 'Email not found' });
      res.json({ success: true });
    });
});

// Upload paper
app.post('/api/papers/upload', auth, upload.single('file'), (req, res) => {
  const { batch, semester, subject, subject_code } = req.body;
  const filePath = `uploads/${req.file.filename}`;
  db.run(`INSERT INTO papers (batch, semester, subject, subject_code, file_path, uploaded_by) VALUES (?, ?, ?, ?, ?, ?)`,
    [batch, semester, subject, subject_code, filePath, req.user.id],
    function (err) {
      if (err) return res.json({ success: false, error: 'Database insert failed' });
      res.json({ success: true, message: 'Paper uploaded successfully!' });
    });
});

// List papers
app.get('/api/papers', (req, res) => {
  const { batch, semester } = req.query;
  let sql = `SELECT * FROM papers WHERE 1=1`;
  const params = [];
  if (batch) { sql += ` AND batch = ?`; params.push(batch); }
  if (semester) { sql += ` AND semester = ?`; params.push(semester); }
  db.all(sql, params, (err, rows) => {
    if (err) return res.json({ success: false });
    res.json({ success: true, papers: rows });
  });
});

// Delete paper
app.delete('/api/papers/:id', auth, (req, res) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ success: false, error: 'Not authorized' });
  }

  db.get(`SELECT file_path FROM papers WHERE id = ?`, [req.params.id], (err, row) => {
    if (err || !row) return res.json({ success: false, error: 'Paper not found' });

    db.run(`DELETE FROM papers WHERE id = ?`, [req.params.id], function (err) {
      if (err) return res.json({ success: false, error: 'Delete failed' });

      const filePath = path.join(__dirname, row.file_path);
      fs.unlink(filePath, (err) => {
        if (err) console.error("File delete error:", err);
      });

      res.json({ success: true, message: 'Paper and file deleted successfully' });
    });
  });
});

// TEMP: Make a user admin (remove after use)
app.get('/make-admin', (req, res) => {
  const email = 'tariq@gmail.com'; // Change to your email
  db.run(`UPDATE users SET role='admin' WHERE email = ?`, [email], function (err) {
    if (err) return res.json({ success: false, error: err.message });
    if (this.changes === 0) return res.json({ success: false, error: 'No user found with that email' });
    res.json({ success: true, message: `${email} is now an admin` });
  });
});

// Serve frontend
app.use(express.static(path.join(__dirname, 'public')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
