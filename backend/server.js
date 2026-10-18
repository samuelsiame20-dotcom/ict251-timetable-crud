// server.js — REST API for the timetable resource + serves the frontend
const path = require('path');
const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const app = express();
const PORT = process.env.PORT || 3000;

// Columns the client is allowed to write. Anything else in the body is ignored,
// and only these names ever reach the SQL string (prevents column injection).
const FIELDS = ['course_code', 'course_name', 'lecturer', 'day_of_week',
                'start_time', 'end_time', 'venue', 'weekly_goal'];
const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// ---------- helpers ----------
function parseId(req, res) {
  const id = Number(req.params.id);
  if (!Number.isInteger(id) || id <= 0) {
    res.status(400).json({ error: 'id must be a positive integer' });
    return null;
  }
  return id;
}

/**
 * Check a request body before it touches the database.
 * @param {object} body     - req.body
 * @param {boolean} partial - true for PUT (only check the fields that were sent)
 * @returns {string[]}      - list of error messages (empty = valid)
 */
function validate(body, partial) {
  const errors = [];
  const has = (f) => body[f] !== undefined;

  // Required fields only matter when creating (POST)
  if (!partial) {
    for (const f of ['course_code', 'day_of_week', 'start_time', 'end_time']) {
      if (!has(f) || String(body[f]).trim() === '') errors.push(`${f} is required`);
    }
  }

  // TODO(Sammy): add the business rules for this table here (5-10 lines).
  // Ideas to decide on:
  //   - day_of_week must be one of DAYS
  //   - start_time / end_time must look like HH:MM
  //   - end_time must be after start_time (only when both are present)
  //   - course_code max 20 chars (matches VARCHAR(20))
  // Push a message into `errors` for each rule that fails.

  return errors;
}

// Turns Postgres errors into the right HTTP status instead of a generic 500
function handleDbError(res, err) {
  if (err.code === '23514' || err.code === '22007' || err.code === '22P02' || err.code === '22001') {
    return res.status(400).json({ error: 'Invalid data', detail: err.message });
  }
  console.error(err);
  return res.status(500).json({ error: 'Internal server error' });
}

// ---------- routes ----------
app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

// GET all
app.get('/api/timetable', async (_req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT * FROM timetable
       ORDER BY ARRAY_POSITION($1::text[], day_of_week), start_time`, [DAYS]);
    res.json(rows);
  } catch (err) { handleDbError(res, err); }
});

// GET one
app.get('/api/timetable/:id', async (req, res) => {
  const id = parseId(req, res); if (id === null) return;
  try {
    const { rows } = await pool.query('SELECT * FROM timetable WHERE id = $1', [id]);
    if (rows.length === 0) return res.status(404).json({ error: `Record ${id} not found` });
    res.json(rows[0]);
  } catch (err) { handleDbError(res, err); }
});

// POST create
app.post('/api/timetable', async (req, res) => {
  const body = req.body || {};
  const errors = validate(body, false);
  if (errors.length) return res.status(400).json({ errors });

  const values = FIELDS.map((f) => (body[f] === '' ? null : body[f] ?? null));
  const placeholders = FIELDS.map((_, i) => `$${i + 1}`).join(', ');
  try {
    const { rows } = await pool.query(
      `INSERT INTO timetable (${FIELDS.join(', ')}) VALUES (${placeholders}) RETURNING *`, values);
    res.status(201).json(rows[0]);
  } catch (err) { handleDbError(res, err); }
});

// PUT update (accepts full or partial body; only sent fields change)
app.put('/api/timetable/:id', async (req, res) => {
  const id = parseId(req, res); if (id === null) return;
  const body = req.body || {};
  const sent = FIELDS.filter((f) => body[f] !== undefined);
  if (sent.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

  const errors = validate(body, true);
  if (errors.length) return res.status(400).json({ errors });

  const setClause = sent.map((f, i) => `${f} = $${i + 1}`).join(', ');
  const values = sent.map((f) => (body[f] === '' ? null : body[f]));
  try {
    const { rows } = await pool.query(
      `UPDATE timetable SET ${setClause} WHERE id = $${sent.length + 1} RETURNING *`, [...values, id]);
    if (rows.length === 0) return res.status(404).json({ error: `Record ${id} not found` });
    res.json(rows[0]);
  } catch (err) { handleDbError(res, err); }
});

// DELETE
app.delete('/api/timetable/:id', async (req, res) => {
  const id = parseId(req, res); if (id === null) return;
  try {
    const { rows } = await pool.query('DELETE FROM timetable WHERE id = $1 RETURNING *', [id]);
    if (rows.length === 0) return res.status(404).json({ error: `Record ${id} not found` });
    res.json({ message: `Record ${id} deleted`, deleted: rows[0] });
  } catch (err) { handleDbError(res, err); }
});

// Unknown /api routes → JSON 404 (keeps "all responses are JSON" true)
app.use('/api', (_req, res) => res.status(404).json({ error: 'Route not found' }));

// Bad JSON bodies → JSON 400 instead of an HTML error page
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON body' });
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => console.log(`Timetable API running on http://localhost:${PORT}`));
