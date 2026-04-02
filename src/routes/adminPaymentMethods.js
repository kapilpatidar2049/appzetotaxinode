const express = require("express");
const c = require("../controllers/adminPaymentMethodController");

const router = express.Router();

router.get("/", c.list);
router.post("/", c.create);
router.get("/:id", c.getOne);
router.patch("/:id", c.update);
router.delete("/:id", c.remove);

module.exports = router;
