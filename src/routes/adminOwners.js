const express = require("express");
const adminOwnerController = require("../controllers/adminOwnerController");

const router = express.Router();

router.get("/", adminOwnerController.listOwners);
router.post("/", adminOwnerController.createOwner);

router.get("/:id", adminOwnerController.getOwner);
router.patch("/:id", adminOwnerController.updateOwner);
router.delete("/:id", adminOwnerController.deleteOwner);

module.exports = router;
