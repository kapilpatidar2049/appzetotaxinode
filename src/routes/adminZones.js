const express = require("express");
const adminZoneController = require("../controllers/adminZoneController");

const router = express.Router();

router.get("/", adminZoneController.listZones);
router.post("/", adminZoneController.createZone);

router.get("/:id", adminZoneController.getZone);
router.patch("/:id", adminZoneController.updateZone);
router.delete("/:id", adminZoneController.deleteZone);

module.exports = router;
