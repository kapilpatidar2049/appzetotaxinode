const express = require("express");
const rootApiController = require("../controllers/rootApiController");

const rootApiRoutes = express.Router();

// This router corresponds to non-v1 routes in Laravel routes/api.php
// e.g. /api/privacy-content, /api/terms-content, etc.

rootApiRoutes.get("/privacy-content", rootApiController.privacyContent);

rootApiRoutes.get("/terms-content", rootApiController.termsContent);

rootApiRoutes.get("/compliance-content", rootApiController.complianceContent);

rootApiRoutes.get("/dmv-content", rootApiController.dmvContent);

module.exports = rootApiRoutes;

