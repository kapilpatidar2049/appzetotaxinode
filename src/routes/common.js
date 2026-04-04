const express = require("express");
const { authenticate } = require("../middleware/auth");
const commonController = require("../controllers/commonController");
const { limit120PerMinute } = require("../middleware/rateLimit");
const { validateBody, validateParams, schemas } = require("../middleware/validation");

const commonRoutes = express.Router();
commonRoutes.use(limit120PerMinute);
const body = validateBody(schemas.generic.object);

// This router corresponds to Laravel routes/api/v1/common.php
// It is mounted at /api/v1/ in apiV1.js

// Public country / onboarding routes
commonRoutes.get("/countries", commonController.countries);

commonRoutes.get("/on-boarding", commonController.onBoarding);

commonRoutes.get("/on-boarding-driver", commonController.onBoardingDriver);

commonRoutes.get("/on-boarding-owner", commonController.onBoardingOwner);

// Prefix 'common'
commonRoutes.get("/common/modules", commonController.modules);

commonRoutes.get("/common/test-api", commonController.testApi);

commonRoutes.get("/common/ride_modules", commonController.rideModules);

// Authenticated 'common' routes
commonRoutes.get("/common/goods-types", authenticate, commonController.goodsTypes);

commonRoutes.get(
  "/common/cancallation/reasons",
  authenticate,
  commonController.cancellationReasons
);

/** Flutter ApiEndpoints: `common/faq/list` (no lat/lng) */
commonRoutes.get("/common/faq/list", authenticate, commonController.faqList);

commonRoutes.get(
  "/common/faq/list/:lat/:lng",
  authenticate,
  validateParams(schemas.params.latLng),
  commonController.faqList
);

commonRoutes.get(
  "/common/sos/list/:lat/:lng",
  authenticate,
  validateParams(schemas.params.latLng),
  commonController.sosList
);

commonRoutes.post("/common/sos/store", authenticate, body, commonController.sosStore);

commonRoutes.post(
  "/common/sos/delete/:sos",
  authenticate,
  validateParams(schemas.params.sos),
  body,
  commonController.sosDelete
);

// Support Tickets
commonRoutes.get("/common/ticket-titles", authenticate, commonController.ticketTitles);

commonRoutes.post("/common/make-ticket", authenticate, body, commonController.makeTicket);

commonRoutes.post(
  "/common/reply-message/:supportTicket",
  authenticate,
  validateParams(schemas.params.supportTicket),
  body,
  commonController.replyMessage
);

commonRoutes.get(
  "/common/view-ticket/:supportTicket",
  authenticate,
  validateParams(schemas.params.supportTicket),
  commonController.viewTicket
);

commonRoutes.get("/common/list", authenticate, commonController.ticketList);

// Complaints (ride / service complaints — titles + submit)
commonRoutes.get("/common/complaint-titles", authenticate, commonController.complaintTitles);

commonRoutes.post("/common/make-complaint", authenticate, body, commonController.makeComplaint);

// Preferences
commonRoutes.get("/common/preferences", authenticate, commonController.preferences);

commonRoutes.post(
  "/common/preferences/store",
  authenticate,
  body,
  commonController.preferencesStore
);

// Referral (prefix referral)
commonRoutes.get(
  "/common/referral/progress",
  authenticate,
  commonController.referralProgress
);

commonRoutes.get("/common/referral/history", authenticate, commonController.referralHistory);

commonRoutes.get(
  "/common/referral/referral-condition",
  authenticate,
  commonController.referralCondition
);

commonRoutes.get(
  "/common/referral/driver-referral-condition",
  authenticate,
  commonController.driverReferralCondition
);

// Public quick links for mobile
commonRoutes.get("/common/mobile/privacy", commonController.mobilePrivacy);

commonRoutes.get("/common/mobile/terms", commonController.mobileTerms);

commonRoutes.get("/common/car/makes", commonController.carMakes);

commonRoutes.get(
  "/common/car/models/:make",
  validateParams(schemas.params.carMake),
  commonController.carModelsByMake
);

// Vehicle Type routes — `/types/service` must be registered before `/types/:service_location`
commonRoutes.get("/types/service", commonController.vehicleTypesServicePath);

commonRoutes.get(
  "/types/:service_location",
  validateParams(schemas.params.service_location),
  commonController.vehicleTypes
);

commonRoutes.get(
  "/types/sub-vehicle/:service_location",
  validateParams(schemas.params.service_location),
  commonController.subVehicleTypes
);

// Notification routes
commonRoutes.get(
  "/notifications/get-notification",
  authenticate,
  commonController.notifications
);

commonRoutes.all(
  "/notifications/delete-notification/:notification",
  authenticate,
  validateParams(schemas.params.notification),
  commonController.deleteNotification
);

commonRoutes.all(
  "/notifications/delete-all-notification",
  authenticate,
  commonController.deleteAllNotification
);

// Promotions
commonRoutes.get("/promotions/popup", commonController.promotionsPopup);

module.exports = commonRoutes;

