const express = require('express');
const router = express.Router();
const inventoryController = require('../controllers/inventoryController');

router.post('/login', inventoryController.login);
router.get('/inventory/stats', inventoryController.getInventoryStats);
router.get('/inventory/options', inventoryController.getInventoryOptions);
router.get('/inventory/devices', inventoryController.fetchInventoryDevices);
router.post('/inventory/devices', inventoryController.createDevice);
router.put('/inventory/devices/:id', inventoryController.updateDevice);
router.delete('/inventory/devices/:id', inventoryController.deleteDevice);
router.get('/dashboard', inventoryController.getDashboard);

// PMR Routes
router.post('/pmr', inventoryController.createPmrReport);
router.get('/pmr', inventoryController.getAllPmrReports);

// User Management Routes
router.get('/users', inventoryController.getAllUsers);
router.post('/users', inventoryController.createUser);
router.put('/users/:id', inventoryController.updateUser);
router.patch('/users/:id/password', inventoryController.changePassword);
router.patch('/users/:id/status', inventoryController.toggleUserStatus);

// Profile Routes
router.get('/profile/:id', inventoryController.getProfile);
router.put('/profile/:id', inventoryController.updateProfile);

module.exports = router;
