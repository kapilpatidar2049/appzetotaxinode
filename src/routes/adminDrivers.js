const express = require("express");
const adminDriverController = require("../controllers/adminDriverController");

const router = express.Router();

router.get("/", adminDriverController.listDrivers);
router.post("/", adminDriverController.createDriver);

router.get("/:id/requests", adminDriverController.getDriverRequests);

router.get("/:id", adminDriverController.getDriver);
router.patch("/:id", adminDriverController.updateDriver);
router.delete("/:id", adminDriverController.deleteDriver);

module.exports = router;
