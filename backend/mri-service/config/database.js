// MRI Service - Database Configuration
const { Pool } = require('pg');

let pool;

async function connectDB() {
  pool = new Pool({
    host:     process.env.DB_HOST || 'localhost',
    port:     parseInt(process.env.DB_PORT) || 5432,
    database: process.env.DB_NAME || 'neuroscan',
    user:     process.env.DB_USER || 'neuroscan_user',
    password: process.env.DB_PASS || 'neuroscan_pass',
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 2000,
  });

  let retries = 5;
  while (retries > 0) {
    try {
      const client = await pool.connect();
      console.log('[MRI Service] Database connected successfully');
      client.release();
      return;
    } catch (err) {
      retries--;
      console.log(`[MRI Service] DB connection failed, retrying... (${retries} left)`);
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  throw new Error('Failed to connect to database after 5 retries');
}

function getPool() {
  if (!pool) throw new Error('Database not initialized');
  return pool;
}

module.exports = { connectDB, getPool };
