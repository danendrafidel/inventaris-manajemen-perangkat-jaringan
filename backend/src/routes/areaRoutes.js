const express = require('express');
const router = express.Router();
const areaController = require('../controllers/areaController');

// DIVISION ROUTES (Sebelumnya Witel)
router.get('/divisions', areaController.getAllDivisions);
router.post('/divisions', areaController.createDivision);
router.put('/divisions/:id', areaController.updateDivision);
router.delete('/divisions/:id', areaController.deleteDivision);
router.patch('/divisions/:id/status', areaController.toggleDivisionStatus);

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

module.exports = router;
