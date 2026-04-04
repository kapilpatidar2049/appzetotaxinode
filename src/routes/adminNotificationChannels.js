const express = require("express");
const c = require("../controllers/adminNotificationChannelController");

const router = express.Router();

router.get("/", c.listNotificationChannels);
router.post("/", c.createNotificationChannel);
router.patch("/:id/push", c.togglePush);
router.patch("/:id/mail", c.toggleMail);
router.get("/:id", c.getNotificationChannel);
router.patch("/:id", c.updateNotificationChannel);

module.exports = router;
