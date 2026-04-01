const express = require("express");
const adminRewardController = require("../controllers/adminRewardController");

const router = express.Router();

router.get("/", adminRewardController.listRewardPoints);
router.get("/:id", adminRewardController.getRewardPoint);

router.post("/users/:user_id/adjust", adminRewardController.adjustUserReward);
router.post("/drivers/:driver_id/adjust", adminRewardController.adjustDriverReward);

module.exports = router;

