const express = require('express');
const controller = require('../controllers/views.controller');

const router = express.Router();

router.get('/', (req, res) => res.redirect('/map'));
router.get('/map', controller.renderMap);
router.get('/events/:id', controller.renderEventDetail);
router.get('/login', controller.renderLogin);

module.exports = router;
