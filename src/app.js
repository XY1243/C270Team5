const path = require('path');
const express = require('express');
const cors = require('cors');
const env = require('./config/env') || {};
const env = require('./config/env') || {};

const authRoutes = require('./routes/auth.routes');
const usersRoutes = require('./routes/users.routes');
const eventsRoutes = require('./routes/events.routes');
const rsvpsRoutes = require('./routes/rsvps.routes');
const mapRoutes = require('./routes/map.routes');
const adminRoutes = require('./routes/admin.routes');

const notFound = require('./middleware/notFound');
const errorHandler = require('./middleware/errorHandler');

const app = express();

app.set('view engine', 'ejs');
app.set('views', path.resolve(__dirname, '..', 'views'));

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use(express.static(path.resolve(__dirname, '..', 'public')));

app.use(cors({ origin: env.corsOrigin }));
app.use(express.json());
app.use('/uploads', express.static(path.resolve(__dirname, '..', 'uploads')));

app.get('/my-bookings', (req, res) => {
  res.render('my_bookings', { title: 'My Bookings' });
});

// ADD THIS NEW BLOCK: The Event Details Page Route
app.get('/events/:id', async (req, res) => {
  try {
    // Dynamically load the model to fetch the specific event
    const eventModel = require('./models/event.model'); 
    const event = await eventModel.findById(req.params.id);
    
    // Render the event.ejs file and inject the database data into it
    res.render('event', { 
      title: event ? event.title : 'Event Details', 
      event: event 
    });
  } catch (err) {
    console.error("Error loading event page:", err);
    res.render('event', { title: 'Event Not Found', event: null });
  }
});

app.use('/api/auth', authRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/rsvps', rsvpsRoutes);
app.use('/api/map', mapRoutes);
app.use('/api/admin', adminRoutes);

app.use(notFound);
app.use(errorHandler);

module.exports = app;
