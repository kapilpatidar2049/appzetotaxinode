const express = require("express");
const Joi = require("joi");

const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { validateBody, schemas } = require("../middleware/validation");
const {
  limit120PerMinute,
  limit10PerMinute,
} = require("../middleware/rateLimit");

const loginSchema = Joi.alternatives().try(
  schemas.auth.loginWithMobile,
  schemas.auth.loginWithEmail
);

const authRoutes = express.Router();
authRoutes.use(limit120PerMinute);

// This authRoutes handles endpoints equivalent to Laravel routes/api/v1/auth.php
// Base path here is /api/v1/auth (we'll keep internal paths same as much as possible)

// OTP for login (POST only; GET returns hint for wrong method)
authRoutes.get("/mobile-otp", (req, res) => {
  res.status(405).json({
    success: false,
    message:
      "Use POST with JSON body { mobile, country_code? }. Paths: POST /api/v1/auth/mobile-otp or POST /api/auth/mobile-otp",
  });
});
authRoutes.post(
  "/mobile-otp",
  validateBody(schemas.auth.mobileOtp),
  authController.mobileOtp
);

authRoutes.post(
  "/validate-otp",
  validateBody(schemas.auth.validateSmsOtp),
  authController.validateSmsOtp
);

// User & driver login
authRoutes.post("/user/login", validateBody(loginSchema), authController.loginUser);

authRoutes.post("/driver/login", validateBody(loginSchema), authController.loginDriver);

/** React admin panel — JWT for `Authorization: Bearer` on `/api/v1/admin/*` */
authRoutes.post("/admin/login", validateBody(loginSchema), authController.loginAdmin);

// Logout (requires auth)
authRoutes.post(
  "/logout",
  limit10PerMinute,
  authenticate,
  validateBody(schemas.generic.emptyOrObject),
  authController.logout
);

// Reset password (mobile check)
authRoutes.post(
  "/reset-password",
  validateBody(schemas.auth.resetPasswordMobileCheck),
  authController.resetPasswordMobileCheck
);

// Registration related routes (user, driver, owner, admin)
authRoutes.post(
  "/user/register",
  validateBody(schemas.auth.registerUser),
  authController.registerUser
);

authRoutes.post(
  "/user/validate-mobile",
  validateBody(schemas.auth.validateUserMobile),
  authController.validateUserMobile
);

authRoutes.post(
  "/user/validate-mobile-for-login",
  validateBody(schemas.auth.validateUserMobileForLogin),
  authController.validateUserMobileForLogin
);

authRoutes.post(
  "/user/update-password",
  validateBody(schemas.auth.updateUserPassword),
  authController.updateUserPassword
);

authRoutes.post(
  "/driver/update-password",
  validateBody(schemas.auth.updateUserPassword),
  authController.updateDriverPassword
);

authRoutes.post(
  "/driver/register",
  validateBody(schemas.auth.registerDriver),
  authController.registerDriver
);

authRoutes.post(
  "/driver/validate-mobile",
  validateBody(schemas.auth.validateDriverMobile),
  authController.validateDriverMobile
);

authRoutes.post(
  "/driver/validate-mobile-for-login",
  validateBody(schemas.auth.validateDriverMobileForLogin),
  authController.validateDriverMobileForLogin
);

authRoutes.post(
  "/user/register/send-otp",
  validateBody(schemas.auth.sendRegistrationOtp),
  authController.sendRegistrationOtp
);

authRoutes.post(
  "/owner/register",
  validateBody(schemas.auth.ownerRegister),
  authController.ownerRegister
);

// Referral
authRoutes.post(
  "/update/user/referral",
  limit10PerMinute,
  authenticate,
  validateBody(schemas.auth.updateReferral),
  authController.updateUserReferral
);

authRoutes.post(
  "/update/driver/referral",
  limit10PerMinute,
  authenticate,
  validateBody(schemas.auth.updateReferral),
  authController.updateDriverReferral
);

authRoutes.get("/get/referral", limit10PerMinute, authenticate, authController.getReferral);

// Email OTP
authRoutes.post(
  "/send-mail-otp",
  validateBody(schemas.auth.sendMailOtp),
  authController.sendMailOtp
);

authRoutes.post(
  "/validate-email-otp",
  validateBody(schemas.auth.validateEmailOtp),
  authController.validateEmailOtp
);

// Validate registration OTP
authRoutes.post(
  "/user/register/validate-otp",
  validateBody(schemas.auth.validateRegistrationOtp),
  authController.validateRegistrationOtp
);

// Admin registration
authRoutes.post(
  "/admin/register",
  validateBody(schemas.auth.adminRegister),
  authController.adminRegister
);

// Password routes equivalent to prefix('password')
authRoutes.post(
  "/password/forgot",
  validateBody(schemas.auth.passwordForgot),
  authController.passwordForgot
);

authRoutes.post(
  "/password/validate-token",
  validateBody(schemas.auth.passwordValidateToken),
  authController.passwordValidateToken
);

authRoutes.post(
  "/password/reset",
  validateBody(schemas.auth.passwordReset),
  authController.passwordReset
);

module.exports = authRoutes;
