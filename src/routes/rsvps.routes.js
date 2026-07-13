const express = require('express');
const { verifyToken } = require('../middleware/auth');
const controller = require('../controllers/rsvps.controller');

const router = express.Router();

router.use(verifyToken);
router.post('/', controller.createRsvp);
router.get('/mine', controller.listMine);
router.delete('/:id', controller.cancelRsvp);

module.exports = router;
