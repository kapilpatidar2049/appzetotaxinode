const express = require("express");
const adminDriverController = require("../controllers/adminDriverController");

const router = express.Router();

router.get("/", adminDriverController.listDrivers);
router.post("/", adminDriverController.createDriver);
router.get("/deleted", adminDriverController.listDeletedDrivers);
router.get("/deleted/:id/profile", adminDriverController.getDeletedDriverProfile);
router.patch("/deleted/:id/restore", adminDriverController.restoreDeletedDriver);
router.delete("/deleted/:id", adminDriverController.deleteDeletedDriverPermanently);

router.get("/:id/requests", adminDriverController.getDriverRequests);

router.get("/:id", adminDriverController.getDriver);
router.patch("/:id", adminDriverController.updateDriver);
router.delete("/:id", adminDriverController.deleteDriver);

module.exports = router;
