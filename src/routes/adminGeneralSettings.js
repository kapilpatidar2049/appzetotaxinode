const express = require("express");
const c = require("../controllers/adminGeneralSettingsController");

const router = express.Router();

router.get("/", c.getGeneralSettings);
router.patch("/", c.updateGeneralSettings);

module.exports = router;
