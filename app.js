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
const authController = require('./src/controllers/auth.controller');
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

app.use(cors({ origin: env.corsOrigin || '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.resolve(__dirname, 'public')));
app.use('/uploads', express.static(path.resolve(__dirname, 'uploads')));

// Database Configuration
const sqlConfig = {
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'event_finder'
};

let pool;
function getPool() {
    if (!pool) {
        pool = mysql.createPool(sqlConfig);
    }
    return pool;
}

// ============================================
// AUTHENTICATION FUNCTION - PUT HERE
// ============================================
async function authenticateUser(email, password) {
    if (!email || !password) {
        return { success: false, error: { message: 'Email and password are required.' } };
    }

    const normalizedEmail = String(email).trim().toLowerCase();

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

        // Check password against the hash in database
        const passwordMatches = await bcrypt.compare(password, user.password_hash);

        if (!passwordMatches) {
            return { success: false, error: { message: 'Invalid credentials.' } };
        }

        const token = crypto.randomBytes(24).toString('hex');

        return {
            success: true,
            data: {
                token,
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
        console.error('Login error:', error);
        return { success: false, error: { message: 'Unable to connect to the database.' } };
    }
}
// ============================================
// END OF AUTHENTICATION FUNCTION
// ============================================

// ==================== VIEW ROUTES ====================
app.get('/my-bookings', (req, res) => {
    res.render('my_bookings', {
        title: 'My Bookings',
        user: req.query.user || 'User'
    });
});

// ADD THIS NEW BLOCK: The Event Details Page Route
app.get('/events/:id', async (req, res) => {
    try {
        const db = getPool();
        const [event] = await db.query(
            `SELECT e.*, u.name as organiser_name 
             FROM events e 
             JOIN users u ON e.organiser_id = u.id 
             WHERE e.id = ?`,
            [req.params.id]
        );
        
        if (event.length === 0) {
            return res.status(404).render('partials/error', {
                title: 'Event Not Found',
                message: 'The event you are looking for does not exist.'
            });
        }
        
        res.render('event', { 
            title: event[0].title || 'Event Details',
            event: event[0],
            user: req.query.user || 'User'
        });
    } catch (error) {
        console.error('Error rendering event page:', error);
        res.status(500).render('partials/error', {
            title: 'Server Error',
            message: 'Something went wrong while loading the event.'
        });
    }
});

app.get('/my-bookings', (req, res) => {
    res.render('my_bookings', {
        title: 'My Bookings',
        user: req.query.user || 'User'
    });
});

// ADD THIS NEW BLOCK: The Event Details Page Route
app.get('/events/:id', async (req, res) => {
    try {
        const db = getPool();
        const [event] = await db.query(
            `SELECT e.*, u.name as organiser_name 
             FROM events e 
             JOIN users u ON e.organiser_id = u.id 
             WHERE e.id = ?`,
            [req.params.id]
        );
        
        if (event.length === 0) {
            return res.status(404).render('partials/error', {
                title: 'Event Not Found',
                message: 'The event you are looking for does not exist.'
            });
        }
        
        res.render('event', { 
            title: event[0].title || 'Event Details',
            event: event[0],
            user: req.query.user || 'User'
        });
    } catch (error) {
        console.error('Error rendering event page:', error);
        res.status(500).render('partials/error', {
            title: 'Server Error',
            message: 'Something went wrong while loading the event.'
        });
    }
});
// Home - Login Page
app.get('/', (req, res) => {
    res.render('login', { 
        title: 'Events Finder - Login',
        error: null
    });
});

app.get('/login', (req, res) => {
    res.render('login', {
        title: 'Events Finder - Login',
        error: null
    });
});

app.get('/entry', (req, res) => {
    res.render('entry', {
        title: 'Event Finder',
        user: req.query.user || 'User'
    });
});

app.get('/history', (req, res) => {
    res.render('history', {
        title: 'Event History',
        history: []
    });
});

app.get('/my-bookings', (req, res) => {
    res.render('my_bookings', {
        title: 'My Bookings',
        user: req.query.user || 'User'
    });
});


// ==================== POST ROUTES ====================

// Login - Redirects based on role
app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    const result = await authenticateUser(email, password);

    if (!result.success) {
        return res.render('login', { 
            title: 'Events Finder - Login', 
            error: result.error.message 
        });
    }

    const user = result.data.user;
    const encodedName = encodeURIComponent(user.name);
    const encodedRole = encodeURIComponent(user.role);

    // Redirect based on user role
    if (user.role === 'admin') {
        return res.redirect(`/admin/dashboard?user=${encodedName}&role=${encodedRole}`);
    } else if (user.role === 'organiser') {
        return res.redirect(`/organiser/dashboard?user=${encodedName}&role=${encodedRole}`);
    } else {
        return res.redirect(`/user/dashboard?user=${encodedName}&role=${encodedRole}`);
    }
});

// API Login
app.post('/api/auth/login', authController.login);

// ==================== USER ROUTES ====================

app.get('/user/dashboard', async (req, res) => {
    try {
        const db = getPool();
        const [events] = await db.query(
            `SELECT e.*, u.name as organiser_name 
             FROM events e 
             JOIN users u ON e.organiser_id = u.id 
             WHERE e.status = 'approved' 
             ORDER BY e.starts_at DESC 
             LIMIT 10`
        );
        
        res.render('partials/user-dashboard', { 
            title: 'User Dashboard',
            user: req.query.user || 'User',
            role: 'user',
            events: events
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.render('partials/user-dashboard', { 
            title: 'User Dashboard',
            user: req.query.user || 'User',
            role: 'user',
            events: []
        });
    }
});

app.get('/user/events', async (req, res) => {
    try {
        const db = getPool();
        const [events] = await db.query(
            `SELECT e.*, u.name as organiser_name 
             FROM events e 
             JOIN users u ON e.organiser_id = u.id 
             WHERE e.status = 'approved' 
             ORDER BY e.starts_at DESC`
        );
        
        res.render('partials/user-events', { 
            title: 'All Events',
            user: req.query.user || 'User',
            events: events
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.render('partials/user-events', { 
            title: 'All Events',
            user: req.query.user || 'User',
            events: []
        });
    }
});

app.get('/map', (req, res) => {
    res.render('map', {
        title: 'Events Map',
        user: req.query.user || 'User'
    });
});

app.get('/user/map', (req, res) => {
    res.render('map', {
        title: 'Events Map',
        user: req.query.user || 'User'
    });
});

// Get detailed view of an event by ID
app.get('/events/:id', async (req, res) => {
    try {
        const db = getPool();
        const [rows] = await db.query(
            `SELECT e.*, u.name as organiser_name 
             FROM events e 
             JOIN users u ON e.organiser_id = u.id 
             WHERE e.id = ?`,
            [req.params.id]
        );
        
        if (rows.length === 0) {
            return res.status(404).render('partials/error', {
                title: 'Event Not Found',
                message: 'The event you are looking for does not exist or has been removed.'
            });
        }
        
        // Render the event.ejs view template with the database results
        res.render('event', { 
            title: rows[0].title,
            event: rows[0],
            user: req.query.user || 'User'
        });
    } catch (error) {
        console.error('Error rendering event page:', error);
        res.status(500).render('partials/error', {
            title: 'Server Error',
            message: 'Failed to retrieve event details.'
        });
    }
});

app.get('/create', (req, res) => {
    res.redirect('/login?next=/organiser/create-event');
});

app.get('/user/create-event', (req, res) => {
    res.redirect('/user/dashboard');
});

// ==================== ORGANISER ROUTES ====================

app.get('/organiser/dashboard', async (req, res) => {
    try {
        const db = getPool();
        const [events] = await db.query(
            `SELECT e.*, COUNT(r.id) as rsvp_count 
             FROM events e 
             LEFT JOIN rsvps r ON e.id = r.event_id 
             GROUP BY e.id 
             ORDER BY e.created_at DESC`
        );
        
        res.render('partials/organiser-dashboard', { 
            title: 'Organiser Dashboard',
            user: req.query.user || 'Organiser',
            role: 'organiser',
            events: events
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.render('partials/organiser-dashboard', { 
            title: 'Organiser Dashboard',
            user: req.query.user || 'Organiser',
            role: 'organiser',
            events: []
        });
    }
});

app.get('/organiser/events', async (req, res) => {
    try {
        const db = getPool();
        const [events] = await db.query(
            `SELECT e.*, COUNT(r.id) as rsvp_count 
             FROM events e 
             LEFT JOIN rsvps r ON e.id = r.event_id 
             GROUP BY e.id 
             ORDER BY e.created_at DESC`
        );
        
        res.render('partials/organiser-events', { 
            title: 'My Events',
            user: req.query.user || 'Organiser',
            events: events
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.render('partials/organiser-events', { 
            title: 'My Events',
            user: req.query.user || 'Organiser',
            events: []
        });
    }
});

app.get('/organiser/create-event', (req, res) => {
    res.render('create', {
        title: 'Create Event',
        user: req.query.user || 'Organiser'
    });
});

// ==================== ADMIN ROUTES ====================

app.get('/admin/dashboard', async (req, res) => {
    try {
        const db = getPool();
        const [userCount] = await db.query('SELECT COUNT(*) as count FROM users');
        const [eventCount] = await db.query('SELECT COUNT(*) as count FROM events');
        const [pendingEvents] = await db.query('SELECT COUNT(*) as count FROM events WHERE status = "pending"');
        const [recentUsers] = await db.query(
            'SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC LIMIT 5'
        );
        const [recentEvents] = await db.query(
            'SELECT e.*, u.name as organiser_name FROM events e JOIN users u ON e.organiser_id = u.id ORDER BY e.created_at DESC LIMIT 5'
        );
        
        res.render('partials/admin-dashboard', { 
            title: 'Admin Dashboard',
            user: req.query.user || 'Admin',
            role: 'admin',
            stats: {
                users: userCount[0].count,
                events: eventCount[0].count,
                pending: pendingEvents[0].count
            },
            recentUsers: recentUsers,
            recentEvents: recentEvents
        });
    } catch (error) {
        console.error('Error fetching admin data:', error);
        res.render('partials/admin-dashboard', { 
            title: 'Admin Dashboard',
            user: req.query.user || 'Admin',
            role: 'admin',
            stats: { users: 0, events: 0, pending: 0 },
            recentUsers: [],
            recentEvents: []
        });
    }
});

app.get('/admin/users', async (req, res) => {
    try {
        const db = getPool();
        const [users] = await db.query(
            'SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC'
        );
        
        res.render('partials/admin-users', { 
            title: 'Manage Users',
            user: req.query.user || 'Admin',
            users: users
        });
    } catch (error) {
        console.error('Error fetching users:', error);
        res.render('partials/admin-users', { 
            title: 'Manage Users',
            user: req.query.user || 'Admin',
            users: []
        });
    }
});


app.post('/admin/users/:id/role', async (req, res) => {
    try {
        const db = getPool();

        // Prevent removing admin from the main admin account
        if (req.params.id == 1) {
            return res.status(403).send("Cannot change role of the main administrator.");
        }

        await db.query(
            'UPDATE users SET role = ? WHERE id = ?',
            [req.body.role, req.params.id]
        );

        res.redirect('/admin/users');

    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to update user.');
    }
});


app.get('/admin/events', async (req, res) => {
    try {
        const db = getPool();
        const [events] = await db.query(
            `SELECT e.*, u.name as organiser_name, COUNT(r.id) as rsvp_count 
             FROM events e 
             JOIN users u ON e.organiser_id = u.id 
             LEFT JOIN rsvps r ON e.id = r.event_id 
             GROUP BY e.id 
             ORDER BY e.created_at DESC`
        );
        
        res.render('partials/admin-events', { 
            title: 'Manage Events',
            user: req.query.user || 'Admin',
            events: events
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.render('partials/admin-events', { 
            title: 'Manage Events',
            user: req.query.user || 'Admin',
            events: []
        });
    }
});

app.post('/admin/events/:id/status', async (req, res) => {
    try {
        const db = getPool();

        const { status } = req.body;

        // Only allow approved or rejected
        if (!['approved', 'rejected'].includes(status)) {
            return res.status(400).send('Invalid event status.');
        }

        await db.query(
            'UPDATE events SET status = ? WHERE id = ?',
            [status, req.params.id]
        );

        res.redirect('/admin/events');

    } catch (error) {
        console.error('Event Status Error:', error);
        res.status(500).send('Failed to update event status.');
    }
});

app.post('/admin/users/:id/status', async (req, res) => {
    try {
        const db = getPool();

        // Prevent suspending the main admin account
        if (req.params.id == 1) {
            return res.status(403).send("Cannot suspend the main administrator.");
        }


        await db.query(
            'UPDATE users SET status = ? WHERE id = ?',
            [req.body.status, req.params.id]
        );

        res.redirect('/admin/users');

    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to update user status.');
    }
});

app.post('/admin/users/:id/delete', async (req, res) => {
    try {
        const db = getPool();

        // Prevent deleting the main admin account
        if (req.params.id == 1) {
            return res.status(403).send("Cannot delete the main administrator.");
        }


        await db.query(
            'DELETE FROM users WHERE id = ?',
            [req.params.id]
        );

        res.redirect('/admin/users');

    } catch (error) {
        console.error(error);
        res.status(500).send('Failed to delete user.');
    }
});

// ==================== API ROUTES ====================

// Get all events (API)
app.get('/api/events', async (req, res) => {
    try {
        const db = getPool();
        const [events] = await db.query(
            `SELECT e.*, u.name as organiser_name 
             FROM events e 
             JOIN users u ON e.organiser_id = u.id 
             WHERE e.status = 'approved' 
             ORDER BY e.starts_at DESC`
        );
        
        res.json({
            success: true,
            data: events
        });
    } catch (error) {
        console.error('Error fetching events:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch events' }
        });
    }
});

// Get event by ID (API)
app.get('/api/events/:id', async (req, res) => {
    try {
        const db = getPool();
        const [event] = await db.query(
            `SELECT e.*, u.name as organiser_name 
             FROM events e 
             JOIN users u ON e.organiser_id = u.id 
             WHERE e.id = ?`,
            [req.params.id]
        );
        
        if (event.length === 0) {
            return res.status(404).json({
                success: false,
                error: { message: 'Event not found' }
            });
        }
        
        res.json({
            success: true,
            data: event[0]
        });
    } catch (error) {
        console.error('Error fetching event:', error);
        res.status(500).json({
            success: false,
            error: { message: 'Failed to fetch event' }
        });
    }
});

// Mount modular routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/rsvps', rsvpsRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/admin', adminRoutes);

// ==================== ERROR HANDLING ====================

// 404 - Not Found
app.use((req, res) => {
    if (req.path.startsWith('/api/')) {
        res.status(404).json({
            success: false,
            error: { message: 'API endpoint not found' }
        });
    } else {
        res.status(404).render('partials/error', {
            title: 'Page Not Found',
            message: 'The page you are looking for does not exist.'
        });
    }
});

// Global error handler
app.use((err, req, res, next) => {
    console.error('Server Error:', err);
    
    if (req.path.startsWith('/api/')) {
        res.status(500).json({
            success: false,
            error: { message: 'Internal server error' }
        });
    } else {
        res.status(500).render('partials/error', {
            title: 'Server Error',
            message: 'Something went wrong. Please try again later.'
        });
    }
});

// ==================== SERVER START ====================

if (require.main === module) {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => {
        console.log(`🚀 Server running on http://localhost:${PORT}`);
        console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
        console.log(`👥 Roles: User | Organiser | Admin`);
        console.log(`🔐 Test Accounts:`);
        console.log(`   Admin: admin@example.com / Password123!`);
        console.log(`   Organiser: organiser@example.com / Password123!`);
    });
}

module.exports = app;
