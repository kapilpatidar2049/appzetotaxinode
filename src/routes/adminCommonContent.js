const express = require("express");
const adminCommonContentController = require("../controllers/adminCommonContentController");

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

module.exports = router;

