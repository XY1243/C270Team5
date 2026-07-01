const pool = require('../config/db');

async function createUser({ name, email, passwordHash, role }) {
  const [result] = await pool.query(
    'INSERT INTO users (name, email, password_hash, role) VALUES (?, ?, ?, ?)',
    [name, email, passwordHash, role]
  );
  return findById(result.insertId);
}

async function findByEmail(email) {
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [id]);
  return rows[0] || null;
}

async function listUsers() {
  const [rows] = await pool.query(
    'SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC'
  );
  return rows;
}

async function setStatus(id, status) {
  await pool.query('UPDATE users SET status = ? WHERE id = ?', [status, id]);
  return findById(id);
}

async function getPlatformAnalytics() {
  const [[userCounts]] = await pool.query(
    `SELECT COUNT(*) AS total,
            CAST(SUM(role = 'organiser') AS SIGNED) AS organisers,
            CAST(SUM(role = 'user') AS SIGNED) AS regularUsers,
            CAST(SUM(status = 'suspended') AS SIGNED) AS suspended
     FROM users`
  );
  const [[eventCounts]] = await pool.query(
    `SELECT COUNT(*) AS total,
            CAST(SUM(status = 'pending') AS SIGNED) AS pending,
            CAST(SUM(status = 'approved') AS SIGNED) AS approved,
            CAST(SUM(status = 'rejected') AS SIGNED) AS rejected
     FROM events`
  );
  const [[rsvpCounts]] = await pool.query(
    "SELECT COUNT(*) AS total, CAST(COALESCE(SUM(ticket_count), 0) AS SIGNED) AS totalTickets FROM rsvps WHERE status = 'confirmed'"
  );

  return { users: userCounts, events: eventCounts, rsvps: rsvpCounts };
}

module.exports = {
  createUser,
  findByEmail,
  findById,
  listUsers,
  setStatus,
  getPlatformAnalytics,
};
