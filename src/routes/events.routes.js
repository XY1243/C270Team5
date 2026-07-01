const express = require('express');
const { verifyToken, requireRole } = require('../middleware/auth');
const upload = require('../middleware/upload');
const controller = require('../controllers/events.controller');
const rsvpController = require('../controllers/rsvps.controller');

const router = express.Router();

router.get('/organiser/mine', verifyToken, requireRole('organiser'), controller.listMine);

router.get('/', controller.listEvents);
router.get('/:id', controller.getEvent);
router.get('/:id/availability', rsvpController.getAvailability);
router.get('/:id/rsvp-count', verifyToken, requireRole('organiser'), controller.getRsvpCount);

router.post('/', verifyToken, requireRole('organiser'), controller.createEvent);
router.put('/:id', verifyToken, requireRole('organiser'), controller.updateEvent);
router.delete('/:id', verifyToken, requireRole('organiser'), controller.deleteEvent);
router.post('/:id/banner', verifyToken, requireRole('organiser'), upload.single('banner'), controller.uploadBanner);

module.exports = router;
