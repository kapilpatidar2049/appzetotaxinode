const express = require("express");
const adminRequestController = require("../controllers/adminRequestController");

const router = express.Router();

router.get("/", adminRequestController.listRequests);
router.get("/trips", adminRequestController.listTripRequests);
router.get("/trips/:id", adminRequestController.getTripRequest);
router.get("/delivery", adminRequestController.listDeliveryRequests);
router.get("/delivery/:id", adminRequestController.getDeliveryRequest);
router.get("/ongoing", adminRequestController.listOngoingRequests);
router.get("/ongoing/:id", adminRequestController.getOngoingRequest);

router.post("/:id/assign-driver", adminRequestController.assignDriver);
router.post("/:id/cancel", adminRequestController.cancelRequest);

router.get("/:id", adminRequestController.getRequest);

module.exports = router;
