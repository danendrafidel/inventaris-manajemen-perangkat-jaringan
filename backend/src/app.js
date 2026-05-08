require('dotenv').config()
const express = require('express')
const path = require('path')
const cors = require('cors')
const helmet = require('helmet')
const compression = require('compression')
const inventoryRoutes = require('./routes/inventoryRoutes')
const areaRoutes = require('./routes/areaRoutes')

const app = express()

// Middleware untuk CORS pada file statis
const corsMiddleware = cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
});

// Security & Performance Middleware
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(compression())

// Buka akses untuk semua origin
app.use(corsMiddleware);

app.use(express.json())
app.use('/api/uploads', corsMiddleware, express.static(path.join(__dirname, '../uploads')))

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
