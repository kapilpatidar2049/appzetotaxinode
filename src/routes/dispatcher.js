const express = require("express");
const { authenticate } = require("../middleware/auth");
const dispatcherController = require("../controllers/dispatcherController");
const { requireAnyRole } = require("../middleware/roles");
const { limit120PerMinute } = require("../middleware/rateLimit");
const { validateBody, schemas } = require("../middleware/validation");

const dispatcherRoutes = express.Router();
dispatcherRoutes.use(limit120PerMinute);
const allowDispatcherRole = ["dispatcher"];

// This router corresponds to Laravel routes/api/v1/dispatcher.php
// It is mounted at /api/v1/dispatcher in apiV1.js

dispatcherRoutes.post(
  "/request/eta",
  authenticate,
  requireAnyRole(allowDispatcherRole),
  validateBody(schemas.dispatcher.requestEta),
  dispatcherController.requestEta
);

dispatcherRoutes.post(
  "/request/list_packages",
  authenticate,
  requireAnyRole(allowDispatcherRole),
  validateBody(schemas.dispatcher.listPackages),
  dispatcherController.requestListPackages
);

module.exports = dispatcherRoutes;

