const express = require("express");
const adminGoodsTypeController = require("../controllers/adminGoodsTypeController");

const router = express.Router();

router.get("/", adminGoodsTypeController.listGoodsTypes);
router.post("/", adminGoodsTypeController.createGoodsType);
router.get("/:id", adminGoodsTypeController.getGoodsType);
router.patch("/:id", adminGoodsTypeController.updateGoodsType);
router.delete("/:id", adminGoodsTypeController.deleteGoodsType);

module.exports = router;

