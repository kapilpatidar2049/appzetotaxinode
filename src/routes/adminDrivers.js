const express = require("express");
const adminDriverController = require("../controllers/adminDriverController");
const { uploadExcel, uploadExcelError } = require("../middleware/uploadExcel");

const router = express.Router();

router.get("/", adminDriverController.listDrivers);
router.get("/pending", adminDriverController.listPendingDrivers);
router.get("/approved", adminDriverController.listApprovedDrivers);
router.post("/", adminDriverController.createDriver);
router.post(
  "/bulk-upload",
  uploadExcel.single("file"),
  uploadExcelError,
  adminDriverController.bulkUploadDrivers
);
router.get("/deleted", adminDriverController.listDeletedDrivers);
router.get("/deleted/:id/profile", adminDriverController.getDeletedDriverProfile);
router.patch("/deleted/:id/restore", adminDriverController.restoreDeletedDriver);
router.delete("/deleted/:id", adminDriverController.deleteDeletedDriverPermanently);

router.get("/:id/requests", adminDriverController.getDriverRequests);
router.get("/:id/review-history", adminDriverController.getDriverReviewHistory);
router.get("/:id/reviews", adminDriverController.getDriverReviewHistory);

router.get("/:id", adminDriverController.getDriver);
router.patch("/:id", adminDriverController.updateDriver);
router.delete("/:id", adminDriverController.deleteDriver);

module.exports = router;
