const express = require("express");
const { authenticate } = require("../middleware/auth");
const requestController = require("../controllers/requestController");
const { requireAnyRole } = require("../middleware/roles");
const { limit120PerMinute } = require("../middleware/rateLimit");
const { validateBody, validateParams, schemas } = require("../middleware/validation");

const requestRoutes = express.Router();
requestRoutes.use(limit120PerMinute);
const allowRequestRoles = ["user", "driver", "owner", "dispatcher"];
const body = validateBody(schemas.generic.object);

// This router corresponds to Laravel routes/api/v1/request.php
// It is mounted at /api/v1/request in apiV1.js

// USER routes
requestRoutes.post(
  "/list-packages",
  authenticate,
  requireAnyRole(allowRequestRoles),
  body,
  requestController.listPackages
);

requestRoutes.get("/promocode-list", authenticate, requestController.promoList);

requestRoutes.post("/promocode-redeem", authenticate, body, requestController.promoRedeem);

requestRoutes.post("/promocode-clear", authenticate, body, requestController.promoClear);

requestRoutes.post("/create", authenticate, body, requestController.createRequest);

requestRoutes.post("/delivery/create", authenticate, body, requestController.createDeliveryRequest);

requestRoutes.post("/change-drop-location", authenticate, body, requestController.changeDropLocation);

requestRoutes.post("/cancel", authenticate, body, requestController.cancelByUser);

requestRoutes.post("/respond-for-bid", authenticate, body, requestController.respondForBid);

requestRoutes.post("/user/payment-method", authenticate, body, requestController.userPaymentMethod);

requestRoutes.post("/user/payment-confirm", authenticate, body, requestController.userPaymentConfirm);

requestRoutes.post("/user/driver-tip", authenticate, body, requestController.driverTip);

// ETA
requestRoutes.post("/eta", authenticate, body, requestController.eta);

requestRoutes.post("/eta/update-amount", authenticate, body, requestController.updateEtaAmount);

requestRoutes.post("/serviceVerify", authenticate, body, requestController.serviceVerify);

requestRoutes.post("/list-recent-searches", authenticate, body, requestController.recentSearches);

requestRoutes.get("/get-directions", authenticate, requestController.getDirections);

// DRIVER routes
requestRoutes.post("/create-instant-ride", authenticate, body, requestController.createInstantRide);

requestRoutes.post(
  "/create-delivery-instant-ride",
  authenticate,
  body,
  requestController.createDeliveryInstantRide
);

requestRoutes.post("/respond", authenticate, body, requestController.respondRequest);

requestRoutes.post("/arrived", authenticate, body, requestController.arrivedRequest);

requestRoutes.post("/started", authenticate, body, requestController.tripStart);

requestRoutes.post("/cancel/by-driver", authenticate, body, requestController.cancelByDriver);

requestRoutes.post("/end", authenticate, body, requestController.endRequest);

requestRoutes.post("/trip-meter", authenticate, body, requestController.tripMeterRideUpdate);

requestRoutes.post("/upload-proof", authenticate, body, requestController.uploadProof);

requestRoutes.post("/payment-confirm", authenticate, body, requestController.paymentConfirm);

requestRoutes.post("/payment-method", authenticate, body, requestController.paymentMethod);

requestRoutes.post("/ready-to-pickup", authenticate, body, requestController.readyToPickup);

requestRoutes.post("/stop-complete", authenticate, body, requestController.tripEndByStop);

requestRoutes.post("/stop-otp-verify", authenticate, body, requestController.stopOtpVerify);

requestRoutes.post("/additional-charge", authenticate, body, requestController.additionalChargeUpdate);

// HISTORY & RATINGS
requestRoutes.get("/history", authenticate, requestController.history);

requestRoutes.get(
  "/history/:id",
  authenticate,
  validateParams(schemas.params.historyId),
  requestController.historyById
);

requestRoutes.get(
  "/invoice/:requestmodel",
  authenticate,
  validateParams(schemas.params.requestmodel),
  requestController.invoice
);

requestRoutes.post("/rating", authenticate, body, requestController.rateRequest);

// CHAT
requestRoutes.get(
  "/chat-history/:request",
  authenticate,
  validateParams(schemas.params.request),
  requestController.chatHistory
);

requestRoutes.post("/send", authenticate, body, requestController.chatSend);

requestRoutes.post("/seen", authenticate, body, requestController.chatSeen);

requestRoutes.get("/user-chat-history", authenticate, requestController.userChatHistory);

requestRoutes.post("/user-send-message", authenticate, body, requestController.userSendMessage);

requestRoutes.post(
  "/update-notification-count",
  authenticate,
  body,
  requestController.updateNotificationCount
);

requestRoutes.get(
  "/vehicle-pricing-options",
  authenticate,
  requestController.vehiclePricingOptions
);

requestRoutes.get("/outstation_rides", authenticate, requestController.outstationRides);

module.exports = requestRoutes;

