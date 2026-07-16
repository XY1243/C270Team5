const pool = require('../config/db');

function apiError(statusCode, code, message) {
  const err = new Error(message);
  err.statusCode = statusCode;
  err.code = code;
  return err;
}

async function createRsvp({ eventId, userId, ticketCount = 1 }) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();

    const [eventRows] = await connection.query(
      'SELECT capacity FROM events WHERE id = ? FOR UPDATE',
      [eventId]
    );
    if (eventRows.length === 0) {
      await connection.rollback();
      throw apiError(404, 'EVENT_NOT_FOUND', 'Event not found');
    }

    const [[{ booked }]] = await connection.query(
      "SELECT COALESCE(SUM(ticket_count), 0) AS booked FROM rsvps WHERE event_id = ? AND status = 'confirmed'",
      [eventId]
    );

    const remaining = eventRows[0].capacity - booked;
    if (remaining < ticketCount) {
      await connection.rollback();
      throw apiError(409, 'CAPACITY_EXCEEDED', 'Not enough remaining capacity for this event');
    }

    let insertId;
    try {
      const [result] = await connection.query(
        'INSERT INTO rsvps (event_id, user_id, ticket_count, google_event_id) VALUES (?, ?, ?, NULL)',
        [eventId, userId, ticketCount]
      );
      insertId = result.insertId;
    } catch (err) {
      await connection.rollback();
      if (err.code === 'ER_DUP_ENTRY') {
        throw apiError(409, 'ALREADY_RSVPD', "You've already RSVP'd to this event. Cancel first to rebook.");
      }
      throw err;
    }

    await connection.commit();

    const [rows] = await pool.query('SELECT * FROM rsvps WHERE id = ?', [insertId]);
    return rows[0];
  } finally {
    connection.release();
  }
}

async function cancelRsvp(id, userId) {
  const [result] = await pool.query(
    "UPDATE rsvps SET status = 'cancelled' WHERE id = ? AND user_id = ? AND status = 'confirmed'",
    [id, userId]
  );
  return result.affectedRows > 0;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM rsvps WHERE id = ?', [id]);
  return rows[0] || null;
}

async function listByUser(userId) {
  const [rows] = await pool.query(
    `SELECT r.*, e.title, e.starts_at, e.venue_name
     FROM rsvps r JOIN events e ON e.id = r.event_id
     WHERE r.user_id = ? ORDER BY r.created_at DESC`,
    [userId]
  );
  return rows;
}

async function countConfirmedForEvent(eventId) {
  const [[{ total }]] = await pool.query(
    "SELECT CAST(COALESCE(SUM(ticket_count), 0) AS SIGNED) AS total FROM rsvps WHERE event_id = ? AND status = 'confirmed'",
    [eventId]
  );
  return total;
}

async function setGoogleEventId(rsvpId, googleEventId) {
  if (!googleEventId) return null;
  await pool.query('UPDATE rsvps SET google_event_id = ? WHERE id = ?', [googleEventId, rsvpId]);
  return true;
}

async function findByUserAndEvent(userId, eventId) {
  const [rows] = await pool.query(
    "SELECT * FROM rsvps WHERE user_id = ? AND event_id = ? ORDER BY id DESC LIMIT 1",
    [userId, eventId]
  );
  return rows[0] || null;
}

async function getRsvpWithEvent(rsvpId) {
  const [rows] = await pool.query(
    `SELECT r.*, e.title, e.description, e.starts_at, e.ends_at, e.venue_name
     FROM rsvps r JOIN events e ON e.id = r.event_id
     WHERE r.id = ?`,
    [rsvpId]
  );
  return rows[0] || null;
}

module.exports = {
  createRsvp,
  cancelRsvp,
  findById,
  listByUser,
  countConfirmedForEvent,
  setGoogleEventId,
  findByUserAndEvent,
  getRsvpWithEvent,
};
