const express = require("express");
const c = require("../controllers/adminGeneralSettingsController");

const router = express.Router();

router.get("/", c.getGeneralSettings);
router.patch("/", c.updateGeneralSettings);
router.get("/customize", c.getCustomizeSettings);
router.patch("/customize", c.updateCustomizeSettings);
router.get("/transport-ride", c.getTransportRideSettings);
router.patch("/transport-ride", c.updateTransportRideSettings);
router.get("/bid-ride", c.getBidRideSettings);
router.patch("/bid-ride", c.updateBidRideSettings);
router.get("/wallet", c.getWalletSettings);
router.patch("/wallet", c.updateWalletSettings);
router.get("/tip", c.getTipSettings);
router.patch("/tip", c.updateTipSettings);

module.exports = router;
