const express = require("express");
const c = require("../controllers/adminAirportController");

const router = express.Router();

router.get("/", c.listAirports);
router.post("/", c.createAirport);
router.get("/:id", c.getAirport);
router.patch("/:id", c.updateAirport);
router.delete("/:id", c.deleteAirport);

module.exports = router;

