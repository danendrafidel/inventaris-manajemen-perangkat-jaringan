require('dotenv').config();
const express = require('express');
const cors = require('cors');
const inventoryRoutes = require('./routes/inventoryRoutes');
const areaRoutes = require('./routes/areaRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: 'http://localhost:5173', credentials: false }));
app.use(express.json());

// Routes
app.use('/api', inventoryRoutes);
app.use('/api/area', areaRoutes);

// Root point
app.get('/', (req, res) => {
  res.json({ status: 'ok', message: 'Inventaris Manajemen API' });
});

app.listen(PORT, () => {
  console.log(`Backend berjalan di http://localhost:${PORT}`);
});
