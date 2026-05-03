const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env') });
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db');

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'yusri_insight_super_secret_key_2026';

// Initialize DB
db.initDB();

// Middleware
app.use(cors());
app.use(express.json());

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ message: 'Access denied. No token provided.' });

    try {
        const decoded = jwt.verify(token.split(' ')[1] || token, JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        res.status(400).json({ message: 'Invalid token.' });
    }
};

// --- AUTH ROUTES ---
app.post('/api/auth/register', async (req, res) => {
    try {
        const { username, email, password } = req.body;
        
        // Check if email or username exists
        const userCheck = await db.query('SELECT * FROM users WHERE email = $1 OR username = $2', [email, username]);
        if (userCheck.rows.length > 0) {
            const existing = userCheck.rows[0];
            if (existing.email === email) return res.status(400).json({ message: 'Email already registered' });
            if (existing.username === username) return res.status(400).json({ message: 'Username already taken' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        const id = Date.now().toString();

        await db.query(
            'INSERT INTO users (id, username, email, password) VALUES ($1, $2, $3, $4)',
            [id, username, email, hashedPassword]
        );

        res.status(201).json({ message: 'User registered successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ _id: user.id, username: user.username, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

        res.json({ token, user: { _id: user.id, username: user.username, email: user.email } });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// --- NOTES ROUTES ---
app.get('/api/notes', verifyToken, async (req, res) => {
    try {
        const result = await db.query('SELECT * FROM notes WHERE user_id = $1 ORDER BY created_at DESC', [req.user._id]);
        
        // Parse JSONB back for frontend if needed, though pg automatically parses JSONB
        const notes = result.rows.map(n => ({
            _id: n.id,
            userId: n.user_id,
            title: n.title,
            content: n.content,
            category: n.category,
            icon: n.icon,
            isPinned: n.is_pinned,
            isFavorite: n.is_favorite,
            sections: n.sections,
            createdAt: n.created_at,
            updatedAt: n.updated_at
        }));
        
        res.json(notes);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// CREATE a note
app.post('/api/notes', verifyToken, async (req, res) => {
    try {
        const id = Date.now().toString();
        const { title, content, category, icon, isPinned, isFavorite, sections } = req.body;
        
        await db.query(
            'INSERT INTO notes (id, user_id, title, content, category, icon, is_pinned, is_favorite, sections) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [id, req.user._id, title, content, category, icon, isPinned || false, isFavorite || false, JSON.stringify(sections || [])]
        );
        
        const newNote = {
            _id: id,
            userId: req.user._id,
            ...req.body,
            createdAt: new Date().toISOString()
        };
        res.status(201).json(newNote);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// DELETE a note
app.delete('/api/notes/:id', verifyToken, async (req, res) => {
    try {
        const result = await db.query('DELETE FROM notes WHERE id = $1 AND user_id = $2 RETURNING id', [req.params.id, req.user._id]);
        if (result.rowCount === 0) return res.status(404).json({ message: 'Note not found or unauthorized' });
        res.json({ message: 'Note deleted' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// UPDATE a note
app.put('/api/notes/:id', verifyToken, async (req, res) => {
    try {
        const { title, content, category, icon, isPinned, isFavorite, sections } = req.body;
        
        const result = await db.query(
            'UPDATE notes SET title = $1, content = $2, category = $3, icon = $4, is_pinned = $5, is_favorite = $6, sections = $7, updated_at = CURRENT_TIMESTAMP WHERE id = $8 AND user_id = $9 RETURNING *',
            [title, content, category, icon, isPinned || false, isFavorite || false, JSON.stringify(sections || []), req.params.id, req.user._id]
        );
        
        if (result.rowCount === 0) return res.status(404).json({ message: 'Note not found or unauthorized' });
        
        const n = result.rows[0];
        res.json({
            _id: n.id,
            userId: n.user_id,
            title: n.title,
            content: n.content,
            category: n.category,
            icon: n.icon,
            isPinned: n.is_pinned,
            isFavorite: n.is_favorite,
            sections: n.sections,
            createdAt: n.created_at,
            updatedAt: n.updated_at
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

if (process.env.VERCEL) {
  // Vercel will use the exported app as a Serverless Function
  module.exports = app;
} else {
  // Local development
  app.listen(PORT, () => {
    console.log(`Server is running on port: ${PORT}`);
    console.log(`Connected to Neon PostgreSQL Database`);
  });
}
