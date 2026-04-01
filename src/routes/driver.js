const express = require("express");
const { authenticate } = require("../middleware/auth");
const driverController = require("../controllers/driverController");
const { requireAnyRole } = require("../middleware/roles");
const { limit120PerMinute } = require("../middleware/rateLimit");
const { validateBody, validateParams, schemas } = require("../middleware/validation");

const driverRoutes = express.Router();
driverRoutes.use(limit120PerMinute);
const allowDriverGroup = ["driver", "owner"];
const body = validateBody(schemas.generic.object);

// This router corresponds to Laravel routes/api/v1/driver.php
// It is mounted at /api/v1/driver in apiV1.js

// Driver Documents
driverRoutes.get(
  "/documents/needed",
  authenticate,
  requireAnyRole(allowDriverGroup),
  driverController.documentsNeeded
);

driverRoutes.post(
  "/upload/documents",
  authenticate,
  requireAnyRole(allowDriverGroup),
  body,
  driverController.uploadDocuments
);

driverRoutes.get(
  "/diagnostic",
  authenticate,
  requireAnyRole(allowDriverGroup),
  driverController.diagnostics
);

// Online / Offline
driverRoutes.post("/online-offline", authenticate, body, driverController.toggleOnlineOffline);

driverRoutes.post("/add-my-route-address", authenticate, body, driverController.addMyRouteAddress);

driverRoutes.post(
  "/enable-my-route-booking",
  authenticate,
  body,
  driverController.enableMyRouteBooking
);

// Earnings
driverRoutes.get("/today-earnings", authenticate, driverController.todayEarnings);

driverRoutes.get("/weekly-earnings", authenticate, driverController.weeklyEarnings);

driverRoutes.get(
  "/earnings-report/:from_date/:to_date",
  authenticate,
  validateParams(schemas.params.earningsDates),
  driverController.earningsReport
);

driverRoutes.get("/history-report", authenticate, driverController.historyReport);

driverRoutes.post("/update-price", authenticate, body, driverController.updatePrice);

driverRoutes.get("/new-earnings", authenticate, driverController.newEarnings);

driverRoutes.post("/earnings-by-date", authenticate, body, driverController.earningsByDate);

driverRoutes.get("/all-earnings", authenticate, driverController.allEarnings);

driverRoutes.get("/leader-board/trips", authenticate, driverController.leaderBoardTrips);

driverRoutes.get(
  "/leader-board/earnings",
  authenticate,
  driverController.leaderBoardEarnings
);

driverRoutes.get("/invoice-history", authenticate, driverController.invoiceHistory);

// Subscription
driverRoutes.get("/list_of_plans", authenticate, driverController.listOfPlans);

driverRoutes.post("/subscribe", authenticate, body, driverController.subscribe);

// Incentives
driverRoutes.get("/new-incentives", authenticate, driverController.newIncentives);

driverRoutes.get("/week-incentives", authenticate, driverController.weekIncentives);

// Bank Info
driverRoutes.get("/list/bankinfo", authenticate, driverController.listBankInfo);

driverRoutes.post("/update/bankinfo", authenticate, body, driverController.updateBankInfo);

// Loyalty & Rewards
driverRoutes.get("/loyalty/history", authenticate, driverController.loyaltyHistory);

driverRoutes.get("/rewards/history", authenticate, driverController.rewardsHistory);

module.exports = driverRoutes;

