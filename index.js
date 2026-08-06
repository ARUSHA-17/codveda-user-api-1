const express = require('express');
const app = express();

// Middleware to parse JSON data from requests
app.use(express.json());

// ============================================
// IN-MEMORY DATABASE (Array of users)
// ============================================
let users = [
    { id: 1, name: 'Alice', email: 'alice@example.com', age: 25 },
    { id: 2, name: 'Bob', email: 'bob@example.com', age: 30 }
];

// ============================================
// ROUTES
// ============================================

// Home Route
app.get('/', (req, res) => {
    res.json({
        message: 'Welcome to User Management API!',
        endpoints: {
            getAllUsers: 'GET /api/users',
            getUserById: 'GET /api/users/:id',
            createUser: 'POST /api/users',
            updateUser: 'PUT /api/users/:id',
            deleteUser: 'DELETE /api/users/:id'
        }
    });
});

// --------------------------------------------
// 1. CREATE - Add a new user (POST)
// --------------------------------------------
app.post('/api/users', (req, res) => {
    try {
        const { name, email, age } = req.body;

        // Validation
        if (!name || !email || !age) {
            return res.status(400).json({
                success: false,
                message: 'Please provide name, email, and age'
            });
        }

        // Create new user
        const newUser = {
            id: users.length > 0 ? Math.max(...users.map(u => u.id)) + 1 : 1,
            name,
            email,
            age
        };

        users.push(newUser);

        res.status(201).json({
            success: true,
            message: 'User created successfully',
            data: newUser
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// --------------------------------------------
// 2. READ - Get all users (GET)
// --------------------------------------------
app.get('/api/users', (req, res) => {
    try {
        res.status(200).json({
            success: true,
            count: users.length,
            data: users
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// --------------------------------------------
// 3. READ - Get single user by ID (GET)
// --------------------------------------------
app.get('/api/users/:id', (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const user = users.find(u => u.id === userId);

        if (!user) {
            return res.status(404).json({
                success: false,
                message: `User with ID ${userId} not found`
            });
        }

        res.status(200).json({
            success: true,
            data: user
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// --------------------------------------------
// 4. UPDATE - Update user by ID (PUT)
// --------------------------------------------
app.put('/api/users/:id', (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const { name, email, age } = req.body;

        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: `User with ID ${userId} not found`
            });
        }

        // Update only provided fields
        if (name) users[userIndex].name = name;
        if (email) users[userIndex].email = email;
        if (age) users[userIndex].age = age;

        res.status(200).json({
            success: true,
            message: 'User updated successfully',
            data: users[userIndex]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// --------------------------------------------
// 5. DELETE - Delete user by ID (DELETE)
// --------------------------------------------
app.delete('/api/users/:id', (req, res) => {
    try {
        const userId = parseInt(req.params.id);
        const userIndex = users.findIndex(u => u.id === userId);

        if (userIndex === -1) {
            return res.status(404).json({
                success: false,
                message: `User with ID ${userId} not found`
            });
        }

        const deletedUser = users.splice(userIndex, 1);

        res.status(200).json({
            success: true,
            message: 'User deleted successfully',
            data: deletedUser[0]
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: 'Server error',
            error: error.message
        });
    }
});

// ============================================
// ERROR HANDLING - 404 Route Not Found
// ============================================
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found'
    });
});

// ============================================
// START SERVER
// ============================================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`🚀 Server is running on http://localhost:${PORT}`);
    console.log(`📋 Try these endpoints:`);
    console.log(`   GET    http://localhost:${PORT}/api/users`);
    console.log(`   POST   http://localhost:${PORT}/api/users`);
    console.log(`   GET    http://localhost:${PORT}/api/users/1`);
    console.log(`   PUT    http://localhost:${PORT}/api/users/1`);
    console.log(`   DELETE http://localhost:${PORT}/api/users/1`);
});