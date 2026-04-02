const express = require("express");
const c = require("../controllers/adminReferralController");

const router = express.Router();

router.get("/dashboard", c.getReferralDashboard);
router.get("/settings", c.getAllSettings);
router.get("/settings/user", c.getUserReferralSettings);
router.patch("/settings/user", c.updateUserReferralSettings);
router.get("/settings/driver", c.getDriverReferralSettings);
router.patch("/settings/driver", c.updateDriverReferralSettings);
router.get("/settings/joining-bonus", c.getJoiningBonusSettings);
router.patch("/settings/joining-bonus", c.updateJoiningBonusSettings);

module.exports = router;
