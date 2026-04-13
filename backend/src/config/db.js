const { Pool } = require("pg");
require("dotenv").config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false, // Diperlukan untuk Neon PostgreSQL
  },
});

// Test connection
pool.query("SELECT NOW()", (err, res) => {
  if (err) {
    console.error("Gagal terhubung ke database:", err.message);
  } else {
    console.log("Database terhubung pada:", res.rows[0].now);
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
