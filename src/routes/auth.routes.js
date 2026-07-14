const express = require('express');
const { verifyToken } = require('../middleware/auth');
const controller = require('../controllers/auth.controller');

const router = express.Router();

router.post('/signup', controller.signup);
router.post('/login', controller.login);
router.get('/me', verifyToken, controller.me);

module.exports = router;
