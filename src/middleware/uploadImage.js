const fs = require("fs");
const path = require("path");
const multer = require("multer");

const rootUploadDir = path.join(process.cwd(), "uploads");
function createImageUploader(subdir, prefix) {
  const dir = path.join(rootUploadDir, subdir);
  fs.mkdirSync(dir, { recursive: true });
  const storage = multer.diskStorage({
    destination(req, file, cb) {
      cb(null, dir);
    },
    filename(req, file, cb) {
      const ext = path.extname(file.originalname || "").toLowerCase();
      const safeExt = [".png", ".jpg", ".jpeg", ".webp", ".gif"].includes(ext) ? ext : ".jpg";
      cb(null, `${prefix}-${Date.now()}-${Math.round(Math.random() * 1e9)}${safeExt}`);
    },
  });
  return multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter(req, file, cb) {
      if (/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype || "")) return cb(null, true);
      cb(new Error("Only image files (png, jpg, jpeg, webp, gif) are allowed"));
    },
  });
}

const uploadNotificationImage = createImageUploader("notifications", "notification");
const uploadDriverRewardImage = createImageUploader("driver-rewards", "driver-reward");
const uploadAppModuleIcon = createImageUploader("app-modules", "app-module");
const uploadPreferenceIcon = createImageUploader("preferences", "preference");

const uploadImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (/^image\/(png|jpe?g|webp|gif)$/i.test(file.mimetype || "")) return cb(null, true);
    cb(new Error("Only image files (png, jpg, jpeg, webp, gif) are allowed"));
  },
});

function uploadImageError(err, req, res, next) {
  if (!err) return next();
  return res.status(400).json({
    success: false,
    message: err.message || "Image upload failed",
  });
}

module.exports = {
  uploadImage,
  uploadNotificationImage,
  uploadDriverRewardImage,
  uploadAppModuleIcon,
  uploadPreferenceIcon,
  uploadImageError,
};
