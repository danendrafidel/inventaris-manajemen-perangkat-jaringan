require('dotenv').config()
const express = require('express')
const cors = require('cors')
const inventoryRoutes = require('./routes/inventoryRoutes')
const areaRoutes = require('./routes/areaRoutes')

const app = express()

// Buka akses untuk local dev & domain Vercel
app.use(
  cors({
    origin: true,
    credentials: false,
  }),
)
app.use(express.json())

// Debug Logging Middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Routes API
app.use('/api', inventoryRoutes)
app.use('/api/area', areaRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Inventaris Manajemen API' })
})

// 404 Handler for API
app.use('/api', (req, res) => {
  res.status(404).json({ success: false, message: `Endpoint ${req.method} ${req.originalUrl} tidak ditemukan` });
});

module.exports = app

