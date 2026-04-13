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

// Routes API
app.use('/api', inventoryRoutes)
app.use('/api/area', areaRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Inventaris Manajemen API' })
})

module.exports = app

