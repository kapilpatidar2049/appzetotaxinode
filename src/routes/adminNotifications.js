const express = require("express");
const c = require("../controllers/adminNotificationController");
const { uploadNotificationImage, uploadImageError } = require("../middleware/uploadImage");

const router = express.Router();

router.get("/", c.listNotifications);
router.post(
  "/",
  uploadNotificationImage.single("banner_image"),
  uploadImageError,
  c.createNotification
);
router.get("/:id", c.getNotification);
router.patch(
  "/:id",
  uploadNotificationImage.single("banner_image"),
  uploadImageError,
  c.updateNotification
);
router.delete("/:id", c.deleteNotification);
router.post(
  "/send",
  uploadNotificationImage.single("banner_image"),
  uploadImageError,
  c.sendNotification
);

module.exports = router;
