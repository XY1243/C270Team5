const express = require('express');
const { verifyToken } = require('../middleware/auth');
const controller = require('../controllers/users.controller');

const router = express.Router();

router.use(verifyToken);
router.get('/dashboard', controller.getDashboard);
router.post('/saved-events/:eventId', controller.saveEvent);
router.delete('/saved-events/:eventId', controller.unsaveEvent);

module.exports = router;
