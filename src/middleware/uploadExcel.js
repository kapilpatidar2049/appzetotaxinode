const multer = require("multer");

const storage = multer.memoryStorage();

const uploadExcel = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, cb) {
    if (/\.(xlsx|xls|csv)$/i.test(file.originalname)) {
      return cb(null, true);
    }
    cb(new Error("Only .xlsx, .xls, or .csv files are allowed"));
  },
});

function uploadExcelError(err, req, res, next) {
  if (!err) return next();
  const status = err.message && err.message.includes("allowed") ? 400 : 400;
  return res.status(status).json({
    success: false,
    message: err.message || "File upload failed",
  });
}

module.exports = { uploadExcel, uploadExcelError };
