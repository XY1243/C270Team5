const path = require('path');
const express = require('express');
const cors = require('cors');
<<<<<<< Updated upstream
const env = require('./config/env');
=======
const env = require('./config/env') || {};
>>>>>>> Stashed changes

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const eventsRoutes = require('./routes/events.routes');
const rsvpsRoutes = require('./routes/rsvps.routes');
const mapRoutes = require('./routes/map.routes');
const adminRoutes = require('./routes/admin.routes');
<<<<<<< HEAD
const viewsRoutes = require('./routes/views.routes');
=======
>>>>>>> origin/main

const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

<<<<<<< Updated upstream
<<<<<<< HEAD
=======
>>>>>>> Stashed changes
app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, '..', 'views'));

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '..', 'public')));
=======
app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
>>>>>>> origin/main
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

app.get('/my-bookings', (req, res) => {
  res.render('my_bookings', { title: 'My Bookings' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/rsvps', rsvpsRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/admin', adminRoutes);

<<<<<<< HEAD
app.use('/', viewsRoutes);

=======
>>>>>>> origin/main
app.use(notFound);
app.use(errorHandler);

module.exports = app;
