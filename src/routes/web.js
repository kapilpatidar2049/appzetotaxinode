const express = require("express");
const web = require("../controllers/webController");
const { registerWebRoutes } = require("./registerWebRoutes");

/**
 * Laravel routes/web.php — JSON equivalents under prefix `/web` (public).
 * Admin panel should use `/api/v1/admin` + JWT instead.
 */
const webRoutes = express.Router();

registerWebRoutes(webRoutes);
webRoutes.use(web.notImplemented);

module.exports = webRoutes;
