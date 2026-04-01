const express = require("express");
const adminPromoController = require("../controllers/adminPromoController");

const router = express.Router();

router.get("/", adminPromoController.listPromos);
router.post("/", adminPromoController.createPromo);

router.get("/:id", adminPromoController.getPromo);
router.patch("/:id", adminPromoController.updatePromo);
router.delete("/:id", adminPromoController.deletePromo);

module.exports = router;
