const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');

router.get('/fuel', settingsController.getFuelSettings);
router.put('/fuel', settingsController.updateFuelSettings);

module.exports = router;
