const express = require("express");
const { authenticate } = require("../middleware/auth");
const paymentController = require("../controllers/paymentController");
const { limit30PerMinute } = require("../middleware/rateLimit");
const { validateBody, validateParams, schemas } = require("../middleware/validation");

const paymentRoutes = express.Router();
paymentRoutes.use(limit30PerMinute);
const body = validateBody(schemas.generic.object);

// This router corresponds to Laravel routes/api/v1/payment.php
// It is mounted at /api/v1/payment in apiV1.js

// Authenticated payment routes (/payment with auth in Laravel)

// Cards
paymentRoutes.get("/cards/list", authenticate, paymentController.listCards);

paymentRoutes.post("/cards/make-default", authenticate, body, paymentController.makeDefaultCard);

paymentRoutes.post(
  "/cards/delete/:card",
  authenticate,
  validateParams(schemas.params.card),
  paymentController.deleteCard
);

// Wallet
paymentRoutes.get("/wallet/history", authenticate, paymentController.walletHistory);

paymentRoutes.get(
  "/wallet/withdrawal-requests",
  authenticate,
  paymentController.withdrawalRequests
);

paymentRoutes.post(
  "/wallet/request-for-withdrawal",
  authenticate,
  body,
  paymentController.requestForWithdrawal
);

paymentRoutes.post(
  "/wallet/transfer-money-from-wallet",
  authenticate,
  body,
  paymentController.transferMoneyFromWallet
);

paymentRoutes.post(
  "/wallet/convert-point-to-wallet",
  authenticate,
  body,
  paymentController.convertPointToWallet
);

// Stripe
paymentRoutes.post(
  "/stripe/create-setup-intent",
  authenticate,
  body,
  paymentController.createStripeIntent
);

paymentRoutes.post("/stripe/save-card", authenticate, body, paymentController.saveCard);

paymentRoutes.post(
  "/stripe/add-money-to-wallet",
  authenticate,
  body,
  paymentController.addMoneyToWalletByStripe
);

// Orange
paymentRoutes.get("/orange", authenticate, paymentController.orangePayment);

// MercadoPago
paymentRoutes.get("/mercadopago", authenticate, paymentController.mercadoPagoPayment);

// Bankily
paymentRoutes.get(
  "/bankily/authenticate",
  authenticate,
  paymentController.bankilyAuthenticate
);

paymentRoutes.get("/bankily/refresh", authenticate, paymentController.bankilyRefresh);

paymentRoutes.get("/bankily/payment", authenticate, paymentController.bankilyPayment);

paymentRoutes.get("/bankily/status", authenticate, paymentController.bankilyStatus);

// Razorpay
paymentRoutes.post(
  "/razorpay/create-order",
  authenticate,
  body,
  paymentController.razorpayCreateOrder
);

paymentRoutes.post(
  "/razorpay/verify-payment",
  authenticate,
  body,
  paymentController.razorpayVerifyPayment
);

// Public + semi-public payment routes

paymentRoutes.get("/gateway", authenticate, paymentController.paymentGateways);

paymentRoutes.get("/gateway-for-ride", paymentController.paymentGatewaysForRide);

paymentRoutes.post("/stripe/listen-webhooks", paymentController.stripeWebhook);

// OpenPix webhook (outside of /payment in Laravel, but kept here)
paymentRoutes.all("/open-pix/callback", paymentController.openPixWebhook);

module.exports = paymentRoutes;

