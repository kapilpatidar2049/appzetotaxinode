const express = require("express");
const { authenticate } = require("../middleware/auth");
const ownerController = require("../controllers/ownerController");
const { requireAnyRole } = require("../middleware/roles");
const { limit120PerMinute } = require("../middleware/rateLimit");
const { validateBody, validateParams, schemas } = require("../middleware/validation");

const ownerRoutes = express.Router();
ownerRoutes.use(limit120PerMinute);
const allowOwnerRole = ["owner"];
const body = validateBody(schemas.generic.object);

// This router corresponds to Laravel routes/api/v1/owner.php
// It is mounted at /api/v1/owner in apiV1.js

// Fleet Management
ownerRoutes.get(
  "/list-fleets",
  authenticate,
  requireAnyRole(allowOwnerRole),
  ownerController.listFleets
);

ownerRoutes.get(
  "/fleet/documents/needed",
  authenticate,
  ownerController.neededDocuments
);

ownerRoutes.get(
  "/fleet/:fleet/documents",
  authenticate,
  validateParams(schemas.params.fleet),
  ownerController.listFleetDocuments
);

ownerRoutes.post(
  "/fleet/:fleet/documents",
  authenticate,
  validateParams(schemas.params.fleet),
  body,
  ownerController.uploadFleetDocument
);

ownerRoutes.get("/list-drivers", authenticate, ownerController.listDrivers);

ownerRoutes.post(
  "/assign-driver/:fleet",
  authenticate,
  validateParams(schemas.params.fleet),
  body,
  ownerController.assignDriver
);

ownerRoutes.post("/add-fleet", authenticate, body, ownerController.addFleet);

ownerRoutes.post(
  "/update-fleet/:fleet",
  authenticate,
  validateParams(schemas.params.fleet),
  body,
  ownerController.updateFleet
);

ownerRoutes.post(
  "/delete-fleet/:fleet",
  authenticate,
  validateParams(schemas.params.fleet),
  body,
  ownerController.deleteFleet
);

// Fleet Drivers
ownerRoutes.post("/add-drivers", authenticate, body, ownerController.addDrivers);

ownerRoutes.get(
  "/drivers/:driver/documents",
  authenticate,
  validateParams(schemas.params.driver),
  ownerController.listDriverDocuments
);

ownerRoutes.post(
  "/drivers/:driver/documents",
  authenticate,
  validateParams(schemas.params.driver),
  body,
  ownerController.uploadDriverDocument
);

ownerRoutes.get(
  "/delete-driver/:driver",
  authenticate,
  validateParams(schemas.params.driver),
  ownerController.deleteDriver
);

// Owner Dashboards
ownerRoutes.post("/dashboard", authenticate, body, ownerController.ownerDashboard);

ownerRoutes.post("/fleet-dashboard", authenticate, body, ownerController.fleetDashboard);

ownerRoutes.post(
  "/fleet-driver-dashboard",
  authenticate,
  body,
  ownerController.fleetDriverDashboard
);

module.exports = ownerRoutes;

