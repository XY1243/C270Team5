const express = require('express');
const { google } = require('googleapis');
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');
const controller = require('../controllers/auth.controller');

const router = express.Router();

router.post('/signup', controller.signup);
router.post('/login', controller.login);
router.get('/me', verifyToken, controller.me);

router.get('/google-calendar/authorize', verifyToken, (req, res) => {
  const oAuth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google-calendar/callback'
  );

  const url = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/calendar'],
  });

  return res.redirect(url);
});

router.get('/google-calendar/callback', verifyToken, async (req, res) => {
  const code = req.query.code;
  if (!code) {
    return res.redirect('/my-bookings');
  }

  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI || 'http://localhost:3000/api/auth/google-calendar/callback'
    );

    const { tokens } = await oAuth2Client.getToken(code);
    await pool.query('UPDATE users SET google_refresh_token = ? WHERE id = ?', [tokens.refresh_token, req.user.id]);
    return res.redirect('/my-bookings');
  } catch (err) {
    console.error('[auth] google calendar callback error:', err.message);
    return res.status(500).send('Failed to finish Google authorization.');
  }
});

module.exports = router;
