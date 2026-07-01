const express = require('express');
const controller = require('../controllers/map.controller');

const router = express.Router();

router.get('/events', controller.getMapEvents);

module.exports = router;
