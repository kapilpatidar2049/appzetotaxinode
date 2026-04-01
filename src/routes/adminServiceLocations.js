const express = require("express");
const adminServiceLocationController = require("../controllers/adminServiceLocationController");

const router = express.Router();

router.get("/", adminServiceLocationController.listServiceLocations);
router.post("/", adminServiceLocationController.createServiceLocation);

router.get("/:id", adminServiceLocationController.getServiceLocation);
router.patch("/:id", adminServiceLocationController.updateServiceLocation);
router.delete("/:id", adminServiceLocationController.deleteServiceLocation);

module.exports = router;
