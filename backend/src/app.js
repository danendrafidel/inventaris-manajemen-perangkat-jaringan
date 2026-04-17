require('dotenv').config()
const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const inventoryRoutes = require('./routes/inventoryRoutes')
const areaRoutes = require('./routes/areaRoutes')

const app = express()

// Security & Performance Middleware
app.use(helmet())
app.use(compression())

// Buka akses untuk local dev & domain Vercel
app.use(
  cors({
    origin: true,
    credentials: false,
  }),
)
app.use(express.json())

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
