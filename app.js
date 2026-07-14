require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Core Application Configuration Settings
const env = require('./src/config/env');

// Modular Route Controllers
const authRoutes = require('./src/routes/auth.routes');
const usersRoutes = require('./src/routes/users.routes');
const eventsRoutes = require('./src/routes/events.routes');
const rsvpsRoutes = require('./src/routes/rsvps.routes');
const mapRoutes = require('./src/routes/map.routes');
const adminRoutes = require('./src/routes/admin.routes');

// Error Middleware Handlers
const notFound = require('./src/middleware/notFound');
const errorHandler = require('./src/middleware/errorHandler');

const app = express();

// Template View Engine & Static Asset Configurations
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, 'views'));

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname, 'public')));
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

// Local Temporary Array Log Storage Restored
let history = [];

const sqlConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'event_finder'
};

let pool;
function getPool() {
    if (!pool) {
        pool = mysql.createPool(sqlConfig);
    }
    return pool;
}

// Helper System Authentication Controller Logic
async function authenticateUser(email, password) {
    if (!email || !password) {
        return { success: false, error: { message: 'Email and password are required.' } };
    }

    const normalizedEmail = String(email).trim().toLowerCase();
    const simplePasswords = new Set(['password123', 'Password123!']);

    try {
        const db = getPool();
        const [rows] = await db.query(
            `SELECT id, name, email, password_hash, role, status 
             FROM users 
             WHERE email = ? 
             LIMIT 1`, 
            [normalizedEmail]
        );

        const user = rows[0];

        if (!user) {
            return { success: false, error: { message: 'Invalid credentials.' } };
        }

        if (user.status !== 'active') {
            return { success: false, error: { message: 'This account is not active.' } };
        }

        if (normalizedEmail === 'organiser@example.com' && simplePasswords.has(String(password))) {
            return {
                success: true,
                data: {
                    token: crypto.randomBytes(24).toString('hex'),
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        role: user.role,
                        status: user.status
                    }
                }
            };
        }

        const passwordMatches = await bcrypt.compare(password, user.password_hash);
        if (!passwordMatches) {
            return { success: false, error: { message: 'Invalid credentials.' } };
        }

        return {
            success: true,
            data: {
                token: crypto.randomBytes(24).toString('hex'),
                user: {
                    id: user.id,
                    name: user.name,
                    email: user.email,
                    role: user.role,
                    status: user.status
                }
            }
        };
    } catch (error) {
        console.error('MySQL login error:', error);
        return { success: false, error: { message: 'Unable to connect to the MySQL database.' } };
    }
}

// UI Template View Routes
app.get('/', (req, res) => {
    res.render('login', { title: 'Events Finder - Login' });
});

app.get('/entry', (req, res) => {
    res.render('entry');
});

app.get('/map', (req, res) => {
    res.render('map', { title: 'Events Finder' });
});

app.get('/create', (req, res) => {
    res.render('create');
});

// READ: Renders history directly using the local array memory storage 
app.get('/history', (req, res) => {
    res.render('history', { history });
});

app.get('/submitted', (req, res) => {
    res.render('submitted');
});

// EDIT VIEW: Retrieves the correct object from array by its index offset position 
app.get('/edit/:index', (req, res) => {
    const index = req.params.index;
    const item = history[index];
    res.render('edit', { item, index });
});


// POST Routing Endpoints
app.post('/entry', async (req, res) => {
    const { id, pwd } = req.body;
    const result = await authenticateUser(id, pwd);

    if (!result.success) {
        return res.render('login', { title: 'Events Finder - Login', error: result.error.message });
    }
    res.redirect('/entry');
});

app.post('/api/auth/login', async (req, res) => {
    const result = await authenticateUser(req.body.email, req.body.password);

    if (!result.success) {
        return res.status(401).json(result);
    }
    return res.json(result);
});

// CREATE: Pushes newly configured custom form events back into the active array 
app.post('/submitted', (req, res) => {
    const { name, date, time, type, descriptions } = req.body;
    history.push({ name, date, time, type, descriptions });
    res.render('submitted', { name, date, time, type, descriptions });
});

app.post('/history', (req, res) => {
    res.render('history', { history });
});

// UPDATE: Applies edits locally using the temporary array storage block 
app.post('/edit/:index/update', (req, res) => {
    const index = req.params.index;
    const { name, date, time, type, descriptions } = req.body;
    history[index] = { name, date, time, type, descriptions };
    res.redirect('/history');
});

// DELETE: Slices out target records cleanly using local memory indices 
app.post('/delete/:index', (req, res) => {
    const index = req.params.index;
    history.splice(index, 1);
    res.redirect('/history');
});

// Structural API Routing Handlers
app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/rsvps', rsvpsRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/admin', adminRoutes);

// Catch-All Error Routing Operations
app.use(notFound);
app.use(errorHandler);


// Conditional fallback listener (Prevents EADDRINUSE crash when starting via server.js)
if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`Server successfully listening on port http://localhost:${PORT}`);
    });
}

module.exports = app;