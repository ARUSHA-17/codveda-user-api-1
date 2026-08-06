require('dotenv').config();
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// ============================================
// IN-MEMORY DATABASE
// ============================================
let users = [
    { id: 1, name: 'Alice', email: 'alice@example.com', password: '$2a$10$abcdefghijklmnopqrstuv', age: 25 },
    { id: 2, name: 'Bob', email: 'bob@example.com', password: '$2a$10$abcdefghijklmnopqrstuv', age: 30 }
];

// JWT Secret from .env
const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

// ============================================
// MIDDLEWARE: Verify JWT Token
// ============================================
function authenticateToken(req, res, next) {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
        return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
    }

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Invalid or expired token.' });
        }
        req.user = decoded; // { userId, email }
        next();
    });
}

// ============================================
// AUTH ROUTES
// ============================================

// SIGNUP
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { name, email, password, age } = req.body;

        if (!name || !email || !password || !age) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        // Check if user already exists
        const existingUser = users.find(u => u.email === email);
        if (existingUser) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create user
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            name,
            email,
            password: hashedPassword,
            age: parseInt(age)
        };

        users.push(newUser);

        // Generate token
        const token = jwt.sign({ userId: newUser.id, email: newUser.email }, JWT_SECRET, { expiresIn: '24h' });

        res.status(201).json({
            success: true,
            message: 'User registered successfully',
            token,
            user: { id: newUser.id, name: newUser.name, email: newUser.email, age: newUser.age }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// LOGIN
app.post('/api/auth/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password required' });
        }

        // Find user
        const user = users.find(u => u.email === email);
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Compare password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '24h' });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: { id: user.id, name: user.name, email: user.email, age: user.age }
        });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// GET all users (protected)
app.get('/api/users', authenticateToken, (req, res) => {
    res.json({ success: true, data: users });
});

// GET CURRENT USER (Protected)
app.get('/api/auth/me', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === req.user.userId);
    if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
    }
    res.json({
        success: true,
        user: { id: user.id, name: user.name, email: user.email, age: user.age }
    });
});

// ============================================
// USER CRUD ROUTES (Protected)
// ============================================

// CREATE user (protected)
app.post('/api/users', authenticateToken, (req, res) => {
    try {
        const { name, email, age } = req.body;
        if (!name || !email || !age) {
            return res.status(400).json({ success: false, message: 'Please provide name, email, and age' });
        }

        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            name,
            email,
            password: '$2a$10$placeholder',
            age: parseInt(age)
        };

        users.push(newUser);
        res.status(201).json({ success: true, message: 'User created', data: newUser });

    } catch (error) {
        res.status(500).json({ success: false, message: 'Server error', error: error.message });
    }
});

// GET all users (protected)
app.get('/api/users', authenticateToken, (req, res) => {
    const safeUsers = users.map(({ password, ...u }) => u);
    res.status(200).json({ success: true, count: safeUsers.length, data: safeUsers });
});

// GET single user (protected)
app.get('/api/users/:id', authenticateToken, (req, res) => {
    const user = users.find(u => u.id === parseInt(req.params.id));
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });
    const { password, ...safeUser } = user;
    res.status(200).json({ success: true, data: safeUser });
});

// UPDATE user (protected)
app.put('/api/users/:id', authenticateToken, (req, res) => {
    const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
    if (userIndex === -1) return res.status(404).json({ success: false, message: 'User not found' });

    const { name, email, age } = req.body;
    if (name) users[userIndex].name = name;
    if (email) users[userIndex].email = email;
    if (age) users[userIndex].age = parseInt(age);

    const { password, ...safeUser } = users[userIndex];
    res.status(200).json({ success: true, message: 'User updated', data: safeUser });
});

// DELETE user (protected)
app.delete('/api/users/:id', authenticateToken, (req, res) => {
    const userIndex = users.findIndex(u => u.id === parseInt(req.params.id));
    if (userIndex === -1) return res.status(404).json({ success: false, message: 'User not found' });

    const deletedUser = users.splice(userIndex, 1);
    const { password, ...safeUser } = deletedUser[0];
    res.status(200).json({ success: true, message: 'User deleted', data: safeUser });
});

// ============================================
// ERROR HANDLING
// ============================================
app.use((req, res) => {
    res.status(404).json({ success: false, message: 'Route not found' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log(`🔐 Auth endpoints:`);
    console.log(`   POST /api/auth/signup`);
    console.log(`   POST /api/auth/login`);
    console.log(`   GET  /api/auth/me (protected)`);
});