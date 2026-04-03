const express = require("express");
const adminCommonContentController = require("../controllers/adminCommonContentController");
const { uploadAppModuleIcon, uploadImageError } = require("../middleware/uploadImage");

const router = express.Router();

// FAQs
router.get("/faqs", adminCommonContentController.listFaqs);
router.post("/faqs", adminCommonContentController.createFaq);
router.get("/faqs/:id", adminCommonContentController.getFaq);
router.patch("/faqs/:id", adminCommonContentController.updateFaq);
router.delete("/faqs/:id", adminCommonContentController.deleteFaq);

// Cancellation reasons
router.get("/cancellation-reasons", adminCommonContentController.listCancellationReasons);
router.post("/cancellation-reasons", adminCommonContentController.createCancellationReason);
router.get("/cancellation-reasons/:id", adminCommonContentController.getCancellationReason);
router.patch("/cancellation-reasons/:id", adminCommonContentController.updateCancellationReason);
router.delete("/cancellation-reasons/:id", adminCommonContentController.deleteCancellationReason);

// SOS master
router.get("/sos", adminCommonContentController.listSos);
router.post("/sos", adminCommonContentController.createSos);
router.get("/sos/:id", adminCommonContentController.getSos);
router.patch("/sos/:id", adminCommonContentController.updateSos);
router.delete("/sos/:id", adminCommonContentController.deleteSos);

// App modules
router.get("/app-modules", adminCommonContentController.listAppModules);
router.post(
  "/app-modules",
  uploadAppModuleIcon.single("mobile_menu_icon"),
  uploadImageError,
  adminCommonContentController.createAppModule
);
router.get("/app-modules/:id", adminCommonContentController.getAppModule);
router.patch(
  "/app-modules/:id",
  uploadAppModuleIcon.single("mobile_menu_icon"),
  uploadImageError,
  adminCommonContentController.updateAppModule
);
router.delete("/app-modules/:id", adminCommonContentController.deleteAppModule);

module.exports = router;

