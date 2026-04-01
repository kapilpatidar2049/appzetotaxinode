const express = require("express");
const adminVehicleTypeController = require("../controllers/adminVehicleTypeController");

const router = express.Router();

router.get("/vehicle-types", adminVehicleTypeController.listVehicleTypes);
router.post("/vehicle-types", adminVehicleTypeController.createVehicleType);
router.get("/vehicle-types/:id", adminVehicleTypeController.getVehicleType);
router.patch("/vehicle-types/:id", adminVehicleTypeController.updateVehicleType);
router.delete("/vehicle-types/:id", adminVehicleTypeController.deleteVehicleType);

router.get("/sub-vehicle-types", adminVehicleTypeController.listSubVehicleTypes);
router.post("/sub-vehicle-types", adminVehicleTypeController.createSubVehicleType);
router.get("/sub-vehicle-types/:id", adminVehicleTypeController.getSubVehicleType);
router.patch("/sub-vehicle-types/:id", adminVehicleTypeController.updateSubVehicleType);
router.delete("/sub-vehicle-types/:id", adminVehicleTypeController.deleteSubVehicleType);

module.exports = router;

