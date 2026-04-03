const express = require("express");
const c = require("../controllers/adminCountryController");

const router = express.Router();

router.get("/", c.listCountries);
router.post("/", c.createCountry);
router.get("/:id", c.getCountry);
router.patch("/:id", c.updateCountry);
router.delete("/:id", c.deleteCountry);

module.exports = router;
