const pool = require('../config/db');

const REMAINING_CAPACITY_SQL = `
  CAST((e.capacity - COALESCE((
    SELECT SUM(r.ticket_count) FROM rsvps r WHERE r.event_id = e.id AND r.status = 'confirmed'
  ), 0)) AS SIGNED) AS remaining_capacity
`;

async function createEvent({
  organiserId,
  title,
  description,
  category,
  venueName,
  lat,
  lng,
  startsAt,
  endsAt,
  capacity,
}) {
  const [result] = await pool.query(
    `INSERT INTO events
      (organiser_id, title, description, category, venue_name, lat, lng, starts_at, ends_at, capacity)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [organiserId, title, description, category, venueName, lat, lng, startsAt, endsAt, capacity]
  );
  return findById(result.insertId);
}

async function findById(id) {
  const [rows] = await pool.query(
    `SELECT e.*, ${REMAINING_CAPACITY_SQL} FROM events e WHERE e.id = ?`,
    [id]
  );
  return rows[0] || null;
}

async function listApproved({ category, search } = {}) {
  const clauses = ["e.status = 'approved'"];
  const params = [];

  if (category) {
    clauses.push('e.category = ?');
    params.push(category);
  }
  if (search) {
    clauses.push('e.title LIKE ?');
    params.push(`%${search}%`);
  }

  const [rows] = await pool.query(
    `SELECT e.*, ${REMAINING_CAPACITY_SQL} FROM events e WHERE ${clauses.join(' AND ')} ORDER BY e.starts_at ASC`,
    params
  );
  return rows;
}

async function listByOrganiser(organiserId) {
  const [rows] = await pool.query(
    `SELECT e.*, ${REMAINING_CAPACITY_SQL} FROM events e WHERE e.organiser_id = ? ORDER BY e.created_at DESC`,
    [organiserId]
  );
  return rows;
}

async function listPending() {
  const [rows] = await pool.query(
    `SELECT e.*, ${REMAINING_CAPACITY_SQL} FROM events e WHERE e.status = 'pending' ORDER BY e.created_at ASC`
  );
  return rows;
}

async function updateEvent(id, fields) {
  const columns = {
    title: 'title',
    description: 'description',
    category: 'category',
    venueName: 'venue_name',
    lat: 'lat',
    lng: 'lng',
    startsAt: 'starts_at',
    endsAt: 'ends_at',
    capacity: 'capacity',
  };

  const sets = [];
  const params = [];
  for (const [key, column] of Object.entries(columns)) {
    if (fields[key] !== undefined) {
      sets.push(`${column} = ?`);
      params.push(fields[key]);
    }
  }

  if (sets.length === 0) return findById(id);

  params.push(id);
  await pool.query(`UPDATE events SET ${sets.join(', ')} WHERE id = ?`, params);
  return findById(id);
}

async function deleteEvent(id) {
  await pool.query('DELETE FROM events WHERE id = ?', [id]);
}

async function setBannerUrl(id, bannerUrl) {
  await pool.query('UPDATE events SET banner_url = ? WHERE id = ?', [bannerUrl, id]);
  return findById(id);
}

async function setStatus(id, status) {
  await pool.query('UPDATE events SET status = ? WHERE id = ?', [status, id]);
  return findById(id);
}

async function findInBoundingBox({ minLat, maxLat, minLng, maxLng }) {
  const [rows] = await pool.query(
    `SELECT e.id, e.title, e.category, e.venue_name, e.lat, e.lng, e.starts_at, ${REMAINING_CAPACITY_SQL}
     FROM events e
     WHERE e.status = 'approved' AND e.lat BETWEEN ? AND ? AND e.lng BETWEEN ? AND ?`,
    [minLat, maxLat, minLng, maxLng]
  );
  return rows;
}

module.exports = {
  createEvent,
  findById,
  listApproved,
  listByOrganiser,
  listPending,
  updateEvent,
  deleteEvent,
  setBannerUrl,
  setStatus,
  findInBoundingBox,
};
