const express = require("express");
const adminRequestController = require("../controllers/adminRequestController");

const router = express.Router();

router.get("/", adminRequestController.listRequests);

router.post("/:id/assign-driver", adminRequestController.assignDriver);
router.post("/:id/cancel", adminRequestController.cancelRequest);

router.get("/:id", adminRequestController.getRequest);

module.exports = router;
