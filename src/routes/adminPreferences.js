const express = require("express");
const c = require("../controllers/adminPreferenceController");
const { uploadPreferenceIcon, uploadImageError } = require("../middleware/uploadImage");

const router = express.Router();

router.get("/", c.listPreferenceOptions);
router.post(
  "/",
  uploadPreferenceIcon.single("icon"),
  uploadImageError,
  c.createPreferenceOption
);
router.patch("/:id/status", c.updatePreferenceStatus);
router.get("/:id", c.getPreferenceOption);
router.patch(
  "/:id",
  uploadPreferenceIcon.single("icon"),
  uploadImageError,
  c.updatePreferenceOption
);
router.delete("/:id", c.deletePreferenceOption);

module.exports = router;
