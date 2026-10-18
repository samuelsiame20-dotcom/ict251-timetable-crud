// db.js — one shared Postgres connection pool, configured from .env
const { Pool } = require('pg');
require('dotenv').config();

if (!process.env.DATABASE_URL) {
  console.error('DATABASE_URL is missing. Copy .env.example to .env and fill it in.');
  process.exit(1);
}

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Supabase requires SSL; a local Postgres usually doesn't.
  ssl: process.env.DB_SSL === 'false' ? false : { rejectUnauthorized: false },
  max: 5, // free-tier databases limit connections, keep the pool small
});

pool.on('error', (err) => console.error('Unexpected DB pool error:', err.message));

module.exports = pool;
