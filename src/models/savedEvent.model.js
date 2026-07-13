const pool = require('../config/db');

async function addSavedEvent(userId, eventId) {
  await pool.query(
    'INSERT INTO saved_events (user_id, event_id) VALUES (?, ?)',
    [userId, eventId]
  );
}

async function removeSavedEvent(userId, eventId) {
  const [result] = await pool.query(
    'DELETE FROM saved_events WHERE user_id = ? AND event_id = ?',
    [userId, eventId]
  );
  return result.affectedRows > 0;
}

async function listSavedEvents(userId) {
  const [rows] = await pool.query(
    `SELECT e.* FROM saved_events se
     JOIN events e ON e.id = se.event_id
     WHERE se.user_id = ? ORDER BY se.created_at DESC`,
    [userId]
  );
  return rows;
}

module.exports = { addSavedEvent, removeSavedEvent, listSavedEvents };
