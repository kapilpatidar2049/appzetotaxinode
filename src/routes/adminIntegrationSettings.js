const express = require("express");
const c = require("../controllers/adminIntegrationSettingsController");

const router = express.Router();

router.get("/payment-gateways", c.listPaymentGateways);
router.patch("/payment-gateways/:id", c.patchPaymentGateway);

router.get("/payment-settings", c.getPaymentSettings);
router.patch("/payment-settings", c.updatePaymentSettings);

router.get("/sms", c.getSmsSettings);
router.patch("/sms", c.updateSmsSettings);

router.get("/firebase", c.getFirebaseSettings);
router.patch("/firebase", c.updateFirebaseSettings);

router.get("/map", c.getMapSettings);
router.patch("/map", c.updateMapSettings);

router.get("/mail", c.getMailSettings);
router.patch("/mail", c.updateMailSettings);

module.exports = router;
