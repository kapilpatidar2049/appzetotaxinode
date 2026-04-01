const express = require("express");
const adminBannerController = require("../controllers/adminBannerController");

const router = express.Router();

router.get("/", adminBannerController.listBanners);
router.post("/", adminBannerController.createBanner);

router.get("/:id", adminBannerController.getBanner);
router.patch("/:id", adminBannerController.updateBanner);
router.delete("/:id", adminBannerController.deleteBanner);
router.post("/:id/push", adminBannerController.sendBannerPushNotification);

module.exports = router;
