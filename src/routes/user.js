const express = require("express");

const userController = require("../controllers/userController");
const { authenticate } = require("../middleware/auth");
const { requireAnyRole } = require("../middleware/roles");
const { limit120PerMinute } = require("../middleware/rateLimit");
const { validateBody, validateParams, schemas } = require("../middleware/validation");

const userRoutes = express.Router();
userRoutes.use(limit120PerMinute);

const allowUserGroup = [ "user", "driver", "owner", "dispatcher" ];
const body = validateBody(schemas.generic.object);

// This router corresponds to Laravel routes/api/v1/user.php
// It is mounted at /api/v1/user in apiV1.js

// GET /api/v1/user/  (me)
userRoutes.get("/", authenticate, requireAnyRole(allowUserGroup), userController.me);

// Authenticated user routes block

// Profile updates
userRoutes.post(
  "/profile",
  authenticate,
  requireAnyRole(allowUserGroup),
  body,
  userController.updateProfile
);

userRoutes.post(
  "/driver-profile",
  authenticate,
  requireAnyRole(["driver", "owner"]),
  body,
  userController.updateDriverProfile
);

userRoutes.post(
  "/update-my-lang",
  authenticate,
  requireAnyRole(allowUserGroup),
  body,
  userController.updateMyLanguage
);

userRoutes.post(
  "/update-bank-info",
  authenticate,
  requireAnyRole(allowUserGroup),
  body,
  userController.updateBankInfo
);

userRoutes.get(
  "/get-bank-info",
  authenticate,
  requireAnyRole(allowUserGroup),
  userController.getBankInfo
);

// Favourite locations
userRoutes.get(
  "/list-favourite-location",
  authenticate,
  requireAnyRole(allowUserGroup),
  userController.favouriteLocationList
);

userRoutes.post(
  "/add-favourite-location",
  authenticate,
  requireAnyRole(allowUserGroup),
  body,
  userController.addFavouriteLocation
);

userRoutes.get(
  "/delete-favourite-location/:favourite_location",
  authenticate,
  requireAnyRole(allowUserGroup),
  validateParams(schemas.params.favouriteLocation),
  userController.deleteFavouriteLocation
);

// Account actions
userRoutes.post(
  "/delete-user-account",
  authenticate,
  requireAnyRole(allowUserGroup),
  body,
  userController.userDeleteAccount
);

userRoutes.post(
  "/update-location",
  authenticate,
  requireAnyRole(allowUserGroup),
  body,
  userController.updateLocation
);

// Invoice download – still to be ported from TripRequestController
userRoutes.get(
  "/download-invoice/:requestId",
  authenticate,
  requireAnyRole(allowUserGroup),
  validateParams(schemas.params.requestId),
  userController.downloadInvoice
);

module.exports = userRoutes;

