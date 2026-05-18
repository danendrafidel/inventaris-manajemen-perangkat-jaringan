const express = require("express");
const router = express.Router();
const inventoryController = require("../controllers/inventoryController");

router.get("/inventory/stats", inventoryController.getInventoryStats);
router.get("/inventory/options", inventoryController.getInventoryOptions);
router.get("/inventory/devices", inventoryController.fetchInventoryDevices);
router.post("/inventory/ping", inventoryController.pingDevices);
router.post("/inventory/devices", inventoryController.createDevice);
router.put("/inventory/devices/:id", inventoryController.updateDevice);
router.delete("/inventory/devices/:id", inventoryController.deleteDevice);

module.exports = router;
