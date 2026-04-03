const express = require("express");
const c = require("../controllers/adminLanguageController");

const router = express.Router();

router.get("/", c.listLanguages);
router.post("/", c.createLanguage);
router.patch("/:id/status", c.updateLanguageStatus);
router.get("/:id", c.getLanguage);
router.patch("/:id", c.updateLanguage);
router.delete("/:id", c.deleteLanguage);

module.exports = router;
