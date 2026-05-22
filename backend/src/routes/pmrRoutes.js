const express = require("express");
const router = express.Router();
const pmrController = require("../controllers/pmrController");
const upload = require("../config/upload");

router.get("/pmr", pmrController.getAllPmrReports);
router.post(
  "/pmr",
  upload.fields([
    { name: "maintenance_photo", maxCount: 10 },
    { name: "fuel_receipt", maxCount: 1 },
  ]),
  pmrController.createPmrReport,
);
router.put(
  "/pmr/:id",
  upload.fields([
    { name: "maintenance_photo", maxCount: 10 },
    { name: "fuel_receipt", maxCount: 1 },
  ]),
  pmrController.updatePmrReport,
);

router.delete("/pmr/:id/image/:index", pmrController.removePmrImage);
router.patch("/pmr/:id/metadata", pmrController.updatePmrMetadata);

module.exports = router;
