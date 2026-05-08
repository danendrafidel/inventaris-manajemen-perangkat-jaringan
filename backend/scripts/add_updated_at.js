const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

async function runMigration() {
  try {
    await pool.query('ALTER TABLE pmr_reports ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;');
    console.log('Kolom updated_at berhasil ditambahkan (atau sudah ada).');
  } catch (err) {
    console.error('Error saat migrasi:', err);
  } finally {
    await pool.end();
  }
}

runMigration();