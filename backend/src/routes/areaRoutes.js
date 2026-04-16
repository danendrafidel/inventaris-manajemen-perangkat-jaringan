const express = require('express');
const router = express.Router();
const areaController = require('../controllers/areaController');

// AREA ROUTES (Sebelumnya Kota)
router.get('/areas', areaController.getAllAreas);
router.post('/areas', areaController.createArea);
router.put('/areas/:id', areaController.updateArea);
router.delete('/areas/:id', areaController.deleteArea);
router.patch('/areas/:id/status', areaController.toggleAreaStatus);

// STO ROUTES
router.get('/stos', areaController.getAllStos);
router.post('/stos', areaController.createSto);
router.put('/stos/:id', areaController.updateSto);
router.delete('/stos/:id', areaController.deleteSto);
router.patch('/stos/:id/status', areaController.toggleStoStatus);

// OFFICE ROUTES (Kantor)
router.get('/offices', areaController.getAllOffices);
router.post('/offices', areaController.createOffice);
router.put('/offices/:id', areaController.updateOffice);
router.delete('/offices/:id', areaController.deleteOffice);
router.patch('/offices/:id/status', areaController.toggleOfficeStatus);

module.exports = router;
