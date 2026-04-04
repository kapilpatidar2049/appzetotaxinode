const express = require("express");
const c = require("../controllers/adminOnboardingScreenController");

const router = express.Router();

router.get("/", c.listOnboardingScreens);
router.post("/", c.createOnboardingScreen);

router.get("/:id", c.getOnboardingScreen);
router.patch("/:id", c.updateOnboardingScreen);
router.delete("/:id", c.deleteOnboardingScreen);

module.exports = router;
