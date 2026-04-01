/**
 * Generates postman/ApiEndpoints.postman_collection.json (single full collection).
 * Run: node scripts/generate-postman-collection.js
 */
const fs = require("fs");
const path = require("path");

const B = "{{baseUrl}}";

function req(name, method, pathSuffix, opts = {}) {
  const {
    auth = "bearer",
    tokenVar = "token",
    noauth = false,
    body = null,
    rawBody = "{}",
  } = opts;
  const r = {
    name,
    request: {
      method,
      url: `${B}${pathSuffix}`,
    },
  };
  if (noauth) {
    r.request.auth = { type: "noauth" };
  } else if (auth === "bearer") {
    r.request.auth = {
      type: "bearer",
      bearer: [{ key: "token", value: `{{${tokenVar}}}`, type: "string" }],
    };
  }
  if (body === "raw") {
    r.request.header = [{ key: "Content-Type", value: "application/json" }];
    r.request.body = { mode: "raw", raw: rawBody };
  }
  return r;
}

/** Every path from `src/routes/registerWebRoutes.js` (public `/web` + same paths on `/api/v1/admin` with JWT). */
const WEB_STUB_ROUTES = [
  ["Status", "GET", "/web/status"],
  ["Healthcheck", "GET", "/web/healthcheck"],
  ["Set locale", "POST", "/web/set-locale"],
  ["Track request", "GET", "/web/track/request/{{requestId}}"],
  ["Download user invoice", "GET", "/web/download-user-invoice/{{requestId}}"],
  ["Download driver invoice", "GET", "/web/download-driver-invoice/{{requestId}}"],
  ["Landing home", "GET", "/web/"],
  ["Landing driver", "GET", "/web/driver"],
  ["About us", "GET", "/web/aboutus"],
  ["Landing user", "GET", "/web/user"],
  ["Contact", "GET", "/web/contact"],
  ["Privacy", "GET", "/web/privacy"],
  ["Compliance", "GET", "/web/compliance"],
  ["Terms", "GET", "/web/terms"],
  ["DMV", "GET", "/web/dmv"],
  ["MI login stub", "GET", "/web/mi-login"],
  ["PayPal", "GET", "/web/paypal"],
  ["PayPal payment POST", "POST", "/web/paypal/payment"],
  ["PayPal success", "GET", "/web/paypal/payment/success"],
  ["PayPal cancel", "GET", "/web/paypal/payment/cancel"],
  ["Stripe", "GET", "/web/stripe"],
  ["Stripe checkout POST", "POST", "/web/stripe-checkout"],
  ["Stripe checkout success", "GET", "/web/stripe-checkout-success"],
  ["Stripe checkout error", "GET", "/web/stripe-checkout-error"],
  ["Flutterwave", "GET", "/web/flutterwave"],
  ["Flutterwave success", "GET", "/web/flutterwave/payment/success"],
  ["Cashfree", "GET", "/web/cashfree"],
  ["Cashfree store", "POST", "/web/cashfree/payments/store"],
  ["Cashfree success (all)", "GET", "/web/cashfree/payments/success"],
  ["Paystack", "GET", "/web/paystack"],
  ["Paystack success", "GET", "/web/paystack/payment/success"],
  ["Khalti", "GET", "/web/khalti"],
  ["Khalti checkout", "POST", "/web/khalti/checkout"],
  ["Razorpay", "GET", "/web/razorpay"],
  ["Payment success (razor)", "GET", "/web/payment-success"],
  ["Mercadopago", "GET", "/web/mercadopago"],
  ["Mercadopago success", "GET", "/web/mercadopago/payment/success"],
  ["Mercadopago webhook", "GET", "/web/webhook/mercadopago"],
  ["Open Pix", "GET", "/web/open-pix"],
  ["Paytech", "GET", "/web/paytech"],
  ["Paytech initiate", "POST", "/web/paytech/initiate"],
  ["Paytech success", "GET", "/web/paytech/payment/success"],
  ["Flexpaie", "GET", "/web/flexpaie"],
  ["Flexpaie pay", "POST", "/web/flexpaie/pay"],
  ["Flexpaie success", "GET", "/web/flexpaie/payment/success"],
  ["CCAvenue", "GET", "/web/ccavenue"],
  ["CCAvenue checkout", "POST", "/web/ccavenue/checkout"],
  ["CCAvenue success", "GET", "/web/ccavenue/payment/success"],
  ["CCAvenue failure", "GET", "/web/ccavenue/payment/failure"],
  ["Payphone", "GET", "/web/payphone"],
  ["Payphone success", "GET", "/web/payphone/payment-success"],
  ["MyFatoora", "GET", "/web/myfatoora"],
  ["MyFatoora checkout", "POST", "/web/myfatoora-checkout"],
  ["MyFatoora success", "GET", "/web/myfatoora-checkout-success"],
  ["Easypaisa", "GET", "/web/easypaisa"],
  ["Easypaisa success", "GET", "/web/easypaisa/payment-success"],
  ["Paymongo", "GET", "/web/paymongo"],
  ["Paymongo checkout", "POST", "/web/paymongo-checkout"],
  ["Paymongo success", "GET", "/web/paymongo-checkout-success"],
  ["FedaPay", "GET", "/web/fedapay"],
  ["FedaPay checkout", "POST", "/web/fedapay-checkout"],
  ["FedaPay success", "GET", "/web/fedapay-checkout-success"],
  ["Static success", "GET", "/web/success"],
  ["Static failure", "GET", "/web/failure"],
  ["Static pending", "GET", "/web/pending"],
];

function webStubItems() {
  return WEB_STUB_ROUTES.map(([name, method, pathSuffix]) => {
    const opts =
      method === "POST"
        ? { noauth: true, body: "raw", rawBody: "{}" }
        : { noauth: true };
    return req(name, method, pathSuffix, opts);
  });
}

const collection = {
  info: {
    name: "Taxi Backend — All APIs (Node)",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    description:
      "**Node backend surface area** (JSON): `api/v1` mobile API (mirrors `routes/api/v1/*.php`), CMS under `/api/*-content`, " +
      "public JSON stubs under `/web/*` from `registerWebRoutes.js`, admin REST + same web-style stubs under `/api/v1/admin/*`. " +
      "**Not included:** full Laravel `routes/web.php` admin SPA (Inertia/Blade, hundreds of HTML dashboard routes) — those are not ported 1:1 to this API. " +
      "Regenerate: `npm run postman:collection`. " +
      "Set `baseUrl` (e.g. http://localhost:4000). Use `token` / `driverToken` / `ownerToken` / `dispatcherToken` / `adminToken` as appropriate.",
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:4000" },
    { key: "token", value: "" },
    { key: "driverToken", value: "" },
    { key: "ownerToken", value: "" },
    { key: "dispatcherToken", value: "" },
    { key: "adminToken", value: "" },
    { key: "requestId", value: "" },
    { key: "driverId", value: "" },
    { key: "userId", value: "" },
    { key: "fleetId", value: "" },
    { key: "cardId", value: "" },
    { key: "notificationId", value: "" },
    { key: "supportTicketId", value: "" },
    { key: "sosId", value: "" },
    { key: "favouriteLocationId", value: "" },
    { key: "serviceLocationId", value: "" },
    { key: "historyId", value: "" },
    { key: "adminUserId", value: "" },
    { key: "adminDriverId", value: "" },
    { key: "adminOwnerId", value: "" },
    { key: "promoId", value: "" },
    { key: "mobilePage", value: "privacy" },
  ],
  item: [
    {
      name: "0. Root",
      item: [
        req("Health", "GET", "/", { noauth: true }),
      ],
    },
    {
      name: "1. CMS (no /v1)",
      item: [
        req("Privacy content", "GET", "/api/privacy-content", { noauth: true }),
        req("Terms content", "GET", "/api/terms-content", { noauth: true }),
        req("Compliance content", "GET", "/api/compliance-content", { noauth: true }),
        req("DMV content", "GET", "/api/dmv-content", { noauth: true }),
      ],
    },
    {
      name: "2. Web public /web (all stubs)",
      item: webStubItems(),
    },
    {
      name: "2b. Admin — same paths as /web (JWT adminToken)",
      description:
        "`registerWebRoutes` is mounted on `/api/v1/admin` after auth. Replace `/web` with `/api/v1/admin` and send Bearer adminToken.",
      item: WEB_STUB_ROUTES.map(([name, method, pathSuffix]) => {
        const adminPath = pathSuffix.replace(/^\/web/, "/api/v1/admin");
        const opts =
          method === "POST"
            ? { tokenVar: "adminToken", body: "raw", rawBody: "{}" }
            : { tokenVar: "adminToken" };
        return req(`${name} (admin)`, method, adminPath, opts);
      }),
    },
    {
      name: "3. Auth /api/v1",
      item: [
        {
          name: "Login & OTP",
          item: [
            req("User login", "POST", "/api/v1/user/login", { noauth: true, body: "raw", rawBody: '{"mobile":"1234567890","password":"secret"}' }),
            req("Driver login", "POST", "/api/v1/driver/login", { noauth: true, body: "raw", rawBody: '{"mobile":"1234567890","password":"secret"}' }),
            req("Admin login", "POST", "/api/v1/admin/login", { noauth: true, body: "raw", rawBody: '{"email":"admin@example.com","password":"secret"}' }),
            req("Mobile OTP", "POST", "/api/v1/mobile-otp", { noauth: true, body: "raw", rawBody: '{"mobile":"1234567890"}' }),
            req("Validate OTP", "POST", "/api/v1/validate-otp", { noauth: true, body: "raw", rawBody: "{}" }),
            req("Logout", "POST", "/api/v1/logout", { body: "raw", rawBody: "{}" }),
            req("Reset password (mobile check)", "POST", "/api/v1/reset-password", { noauth: true, body: "raw", rawBody: "{}" }),
          ],
        },
        {
          name: "Register",
          item: [
            req("Register user", "POST", "/api/v1/user/register", { noauth: true, body: "raw", rawBody: "{}" }),
            req("Validate user mobile", "POST", "/api/v1/user/validate-mobile", { noauth: true, body: "raw", rawBody: "{}" }),
            req("Validate mobile for login", "POST", "/api/v1/user/validate-mobile-for-login", { noauth: true, body: "raw", rawBody: "{}" }),
            req("User update password", "POST", "/api/v1/user/update-password", { noauth: true, body: "raw", rawBody: "{}" }),
            req("Register driver", "POST", "/api/v1/driver/register", { noauth: true, body: "raw", rawBody: "{}" }),
            req("Driver validate mobile", "POST", "/api/v1/driver/validate-mobile", { noauth: true, body: "raw", rawBody: "{}" }),
            req("Driver validate mobile for login", "POST", "/api/v1/driver/validate-mobile-for-login", { noauth: true, body: "raw", rawBody: "{}" }),
            req("Driver update password", "POST", "/api/v1/driver/update-password", { noauth: true, body: "raw", rawBody: "{}" }),
            req("Send registration OTP", "POST", "/api/v1/user/register/send-otp", { noauth: true, body: "raw", rawBody: "{}" }),
            req("Register validate OTP", "POST", "/api/v1/user/register/validate-otp", { noauth: true, body: "raw", rawBody: "{}" }),
            req("Owner register", "POST", "/api/v1/owner/register", { noauth: true, body: "raw", rawBody: "{}" }),
            req("Admin register", "POST", "/api/v1/admin/register", { noauth: true, body: "raw", rawBody: "{}" }),
          ],
        },
        {
          name: "Email & password",
          item: [
            req("Send mail OTP", "POST", "/api/v1/send-mail-otp", { noauth: true, body: "raw", rawBody: "{}" }),
            req("Validate email OTP", "POST", "/api/v1/validate-email-otp", { noauth: true, body: "raw", rawBody: "{}" }),
            req("Password forgot", "POST", "/api/v1/password/forgot", { noauth: true, body: "raw", rawBody: "{}" }),
            req("Password validate token", "POST", "/api/v1/password/validate-token", { noauth: true, body: "raw", rawBody: "{}" }),
            req("Password reset", "POST", "/api/v1/password/reset", { noauth: true, body: "raw", rawBody: "{}" }),
          ],
        },
        {
          name: "Referral (auth)",
          item: [
            req("Update user referral", "POST", "/api/v1/update/user/referral", { body: "raw", rawBody: "{}" }),
            req("Update driver referral", "POST", "/api/v1/update/driver/referral", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
            req("Get referral", "GET", "/api/v1/get/referral"),
          ],
        },
      ],
    },
    {
      name: "4. Common /api/v1",
      item: [
        req("Countries", "GET", "/api/v1/countries", { noauth: true }),
        req("On boarding", "GET", "/api/v1/on-boarding", { noauth: true }),
        req("On boarding driver", "GET", "/api/v1/on-boarding-driver", { noauth: true }),
        req("On boarding owner", "GET", "/api/v1/on-boarding-owner", { noauth: true }),
        req("Common modules", "GET", "/api/v1/common/modules", { noauth: true }),
        req("Test API", "GET", "/api/v1/common/test-api", { noauth: true }),
        req("Ride modules", "GET", "/api/v1/common/ride_modules", { noauth: true }),
        req("Goods types", "GET", "/api/v1/common/goods-types"),
        req("Cancellation reasons", "GET", "/api/v1/common/cancallation/reasons"),
        req("FAQ list", "GET", "/api/v1/common/faq/list"),
        req("FAQ list lat lng", "GET", "/api/v1/common/faq/list/12.97/77.59"),
        req("SOS list", "GET", "/api/v1/common/sos/list/12.97/77.59"),
        req("SOS store", "POST", "/api/v1/common/sos/store", { body: "raw", rawBody: "{}" }),
        req("SOS delete", "POST", "/api/v1/common/sos/delete/{{sosId}}", { body: "raw", rawBody: "{}" }),
        req("Ticket titles", "GET", "/api/v1/common/ticket-titles"),
        req("Make ticket", "POST", "/api/v1/common/make-ticket", { body: "raw", rawBody: "{}" }),
        req("Reply ticket", "POST", "/api/v1/common/reply-message/{{supportTicketId}}", { body: "raw", rawBody: "{}" }),
        req("View ticket", "GET", "/api/v1/common/view-ticket/{{supportTicketId}}"),
        req("Ticket list", "GET", "/api/v1/common/list"),
        req("Preferences", "GET", "/api/v1/common/preferences"),
        req("Preference store", "POST", "/api/v1/common/preferences/store", { body: "raw", rawBody: "{}" }),
        req("Referral history", "GET", "/api/v1/common/referral/history"),
        req("Referral condition", "GET", "/api/v1/common/referral/referral-condition"),
        req("Driver referral condition", "GET", "/api/v1/common/referral/driver-referral-condition"),
        req("Mobile privacy", "GET", "/api/v1/common/mobile/privacy", { noauth: true }),
        req("Mobile terms", "GET", "/api/v1/common/mobile/terms", { noauth: true }),
        req("Mobile page", "GET", "/api/v1/common/mobile/{{mobilePage}}", { noauth: true }),
        req("Vehicle types", "GET", "/api/v1/types/{{serviceLocationId}}", { noauth: true }),
        req("Sub vehicle types", "GET", "/api/v1/types/sub-vehicle/{{serviceLocationId}}", { noauth: true }),
        req("Notifications", "GET", "/api/v1/notifications/get-notification"),
        req("Delete notification", "POST", "/api/v1/notifications/delete-notification/{{notificationId}}", { body: "raw", rawBody: "{}" }),
        req("Delete all notifications", "POST", "/api/v1/notifications/delete-all-notification", { body: "raw", rawBody: "{}" }),
        req("Promotions popup", "GET", "/api/v1/promotions/popup", { noauth: true }),
      ],
    },
    {
      name: "5. Api common /api/v1",
      item: [
        req("Translation get", "GET", "/api/v1/translation/get", { noauth: true }),
        req("Translation user get", "GET", "/api/v1/translation-user/get", { noauth: true }),
        req("Translation list", "GET", "/api/v1/translation/list", { noauth: true }),
        req("Service location (auth)", "GET", "/api/v1/servicelocation"),
      ],
    },
    {
      name: "6. User /api/v1/user",
      item: [
        req("Me", "GET", "/api/v1/user/"),
        req("Profile update", "POST", "/api/v1/user/profile", { body: "raw", rawBody: "{}" }),
        req("Driver profile", "POST", "/api/v1/user/driver-profile", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("Update language", "POST", "/api/v1/user/update-my-lang", { body: "raw", rawBody: '{"lang":"en"}' }),
        req("Update bank info", "POST", "/api/v1/user/update-bank-info", { body: "raw", rawBody: "{}" }),
        req("Get bank info", "GET", "/api/v1/user/get-bank-info"),
        req("List favourite locations", "GET", "/api/v1/user/list-favourite-location"),
        req("Add favourite location", "POST", "/api/v1/user/add-favourite-location", { body: "raw", rawBody: "{}" }),
        req("Delete favourite", "GET", "/api/v1/user/delete-favourite-location/{{favouriteLocationId}}"),
        req("Delete account", "POST", "/api/v1/user/delete-user-account", { body: "raw", rawBody: "{}" }),
        req("Update location", "POST", "/api/v1/user/update-location", { body: "raw", rawBody: "{}" }),
        req("Download invoice", "GET", "/api/v1/user/download-invoice/{{requestId}}"),
      ],
    },
    {
      name: "7. Request /api/v1/request",
      item: [
        req("List packages", "POST", "/api/v1/request/list-packages", { body: "raw", rawBody: "{}" }),
        req("Promo list", "GET", "/api/v1/request/promocode-list"),
        req("Promo redeem", "POST", "/api/v1/request/promocode-redeem", { body: "raw", rawBody: "{}" }),
        req("Promo clear", "POST", "/api/v1/request/promocode-clear", { body: "raw", rawBody: "{}" }),
        req("Create", "POST", "/api/v1/request/create", { body: "raw", rawBody: "{}" }),
        req("Delivery create", "POST", "/api/v1/request/delivery/create", { body: "raw", rawBody: "{}" }),
        req("Change drop", "POST", "/api/v1/request/change-drop-location", { body: "raw", rawBody: "{}" }),
        req("Cancel", "POST", "/api/v1/request/cancel", { body: "raw", rawBody: "{}" }),
        req("Respond bid", "POST", "/api/v1/request/respond-for-bid", { body: "raw", rawBody: "{}" }),
        req("User payment method", "POST", "/api/v1/request/user/payment-method", { body: "raw", rawBody: "{}" }),
        req("User payment confirm", "POST", "/api/v1/request/user/payment-confirm", { body: "raw", rawBody: "{}" }),
        req("Driver tip", "POST", "/api/v1/request/user/driver-tip", { body: "raw", rawBody: "{}" }),
        req("ETA", "POST", "/api/v1/request/eta", { body: "raw", rawBody: "{}" }),
        req("ETA update amount", "POST", "/api/v1/request/eta/update-amount", { body: "raw", rawBody: "{}" }),
        req("Service verify", "POST", "/api/v1/request/serviceVerify", { body: "raw", rawBody: "{}" }),
        req("Recent searches", "POST", "/api/v1/request/list-recent-searches", { body: "raw", rawBody: "{}" }),
        req("Get directions", "GET", "/api/v1/request/get-directions"),
        req("Create instant ride", "POST", "/api/v1/request/create-instant-ride", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("Create delivery instant", "POST", "/api/v1/request/create-delivery-instant-ride", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("Respond", "POST", "/api/v1/request/respond", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("Arrived", "POST", "/api/v1/request/arrived", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("Started", "POST", "/api/v1/request/started", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("Cancel by driver", "POST", "/api/v1/request/cancel/by-driver", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("End", "POST", "/api/v1/request/end", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("Trip meter", "POST", "/api/v1/request/trip-meter", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("Upload proof", "POST", "/api/v1/request/upload-proof", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("Payment confirm", "POST", "/api/v1/request/payment-confirm", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("Payment method", "POST", "/api/v1/request/payment-method", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("Ready to pickup", "POST", "/api/v1/request/ready-to-pickup", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("Stop complete", "POST", "/api/v1/request/stop-complete", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("Stop OTP verify", "POST", "/api/v1/request/stop-otp-verify", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("Additional charge", "POST", "/api/v1/request/additional-charge", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("History", "GET", "/api/v1/request/history"),
        req("History by id", "GET", "/api/v1/request/history/{{historyId}}"),
        req("Invoice", "GET", "/api/v1/request/invoice/{{requestId}}"),
        req("Rating", "POST", "/api/v1/request/rating", { body: "raw", rawBody: "{}" }),
        req("Chat history", "GET", "/api/v1/request/chat-history/{{requestId}}"),
        req("Chat send", "POST", "/api/v1/request/send", { body: "raw", rawBody: "{}" }),
        req("Chat seen", "POST", "/api/v1/request/seen", { body: "raw", rawBody: "{}" }),
        req("User chat history", "GET", "/api/v1/request/user-chat-history"),
        req("User send message", "POST", "/api/v1/request/user-send-message", { body: "raw", rawBody: "{}" }),
        req("Update notification count", "POST", "/api/v1/request/update-notification-count", { body: "raw", rawBody: "{}" }),
        req("Vehicle pricing options", "GET", "/api/v1/request/vehicle-pricing-options"),
        req("Outstation rides", "GET", "/api/v1/request/outstation_rides"),
      ],
    },
    {
      name: "8. Payment /api/v1/payment",
      item: [
        req("Cards list", "GET", "/api/v1/payment/cards/list"),
        req("Cards make default", "POST", "/api/v1/payment/cards/make-default", { body: "raw", rawBody: "{}" }),
        req("Cards delete", "POST", "/api/v1/payment/cards/delete/{{cardId}}", { body: "raw", rawBody: "{}" }),
        req("Wallet history", "GET", "/api/v1/payment/wallet/history"),
        req("Withdrawal requests", "GET", "/api/v1/payment/wallet/withdrawal-requests"),
        req("Request withdrawal", "POST", "/api/v1/payment/wallet/request-for-withdrawal", { body: "raw", rawBody: "{}" }),
        req("Transfer from wallet", "POST", "/api/v1/payment/wallet/transfer-money-from-wallet", { body: "raw", rawBody: "{}" }),
        req("Convert points to wallet", "POST", "/api/v1/payment/wallet/convert-point-to-wallet", { body: "raw", rawBody: "{}" }),
        req("Stripe create setup intent", "POST", "/api/v1/payment/stripe/create-setup-intent", { body: "raw", rawBody: "{}" }),
        req("Stripe save card", "POST", "/api/v1/payment/stripe/save-card", { body: "raw", rawBody: "{}" }),
        req("Stripe add money", "POST", "/api/v1/payment/stripe/add-money-to-wallet", { body: "raw", rawBody: "{}" }),
        req("Orange", "GET", "/api/v1/payment/orange"),
        req("MercadoPago", "GET", "/api/v1/payment/mercadopago"),
        req("Bankily authenticate", "GET", "/api/v1/payment/bankily/authenticate"),
        req("Bankily refresh", "GET", "/api/v1/payment/bankily/refresh"),
        req("Bankily payment", "GET", "/api/v1/payment/bankily/payment"),
        req("Bankily status", "GET", "/api/v1/payment/bankily/status"),
        req("Razorpay create order", "POST", "/api/v1/payment/razorpay/create-order", { body: "raw", rawBody: "{}" }),
        req("Razorpay verify", "POST", "/api/v1/payment/razorpay/verify-payment", { body: "raw", rawBody: "{}" }),
        req("Gateway list", "GET", "/api/v1/payment/gateway"),
        req("Gateway for ride", "GET", "/api/v1/payment/gateway-for-ride", { noauth: true }),
        req("Stripe webhooks", "POST", "/api/v1/payment/stripe/listen-webhooks", { noauth: true, body: "raw", rawBody: "{}" }),
        req("OpenPix callback", "POST", "/api/v1/payment/open-pix/callback", { noauth: true, body: "raw", rawBody: "{}" }),
      ],
    },
    {
      name: "9. Driver /api/v1/driver",
      item: [
        req("Documents needed", "GET", "/api/v1/driver/documents/needed", { tokenVar: "driverToken" }),
        req("Upload documents", "POST", "/api/v1/driver/upload/documents", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("Diagnostic", "GET", "/api/v1/driver/diagnostic", { tokenVar: "driverToken" }),
        req("Online offline", "POST", "/api/v1/driver/online-offline", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("Add my route address", "POST", "/api/v1/driver/add-my-route-address", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("Enable my route booking", "POST", "/api/v1/driver/enable-my-route-booking", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("Today earnings", "GET", "/api/v1/driver/today-earnings", { tokenVar: "driverToken" }),
        req("Weekly earnings", "GET", "/api/v1/driver/weekly-earnings", { tokenVar: "driverToken" }),
        req("Earnings report", "GET", "/api/v1/driver/earnings-report/2025-01-01/2025-01-31", { tokenVar: "driverToken" }),
        req("History report", "GET", "/api/v1/driver/history-report", { tokenVar: "driverToken" }),
        req("Update price", "POST", "/api/v1/driver/update-price", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("New earnings", "GET", "/api/v1/driver/new-earnings", { tokenVar: "driverToken" }),
        req("Earnings by date", "POST", "/api/v1/driver/earnings-by-date", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("All earnings", "GET", "/api/v1/driver/all-earnings", { tokenVar: "driverToken" }),
        req("Leaderboard trips", "GET", "/api/v1/driver/leader-board/trips", { tokenVar: "driverToken" }),
        req("Leaderboard earnings", "GET", "/api/v1/driver/leader-board/earnings", { tokenVar: "driverToken" }),
        req("Invoice history", "GET", "/api/v1/driver/invoice-history", { tokenVar: "driverToken" }),
        req("List plans", "GET", "/api/v1/driver/list_of_plans", { tokenVar: "driverToken" }),
        req("Subscribe", "POST", "/api/v1/driver/subscribe", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("New incentives", "GET", "/api/v1/driver/new-incentives", { tokenVar: "driverToken" }),
        req("Week incentives", "GET", "/api/v1/driver/week-incentives", { tokenVar: "driverToken" }),
        req("List bank info", "GET", "/api/v1/driver/list/bankinfo", { tokenVar: "driverToken" }),
        req("Update bank info", "POST", "/api/v1/driver/update/bankinfo", { tokenVar: "driverToken", body: "raw", rawBody: "{}" }),
        req("Loyalty history", "GET", "/api/v1/driver/loyalty/history", { tokenVar: "driverToken" }),
        req("Rewards history", "GET", "/api/v1/driver/rewards/history", { tokenVar: "driverToken" }),
      ],
    },
    {
      name: "10. Owner /api/v1/owner",
      item: [
        req("List fleets", "GET", "/api/v1/owner/list-fleets", { tokenVar: "ownerToken" }),
        req("Fleet documents needed", "GET", "/api/v1/owner/fleet/documents/needed", { tokenVar: "ownerToken" }),
        req("List drivers", "GET", "/api/v1/owner/list-drivers", { tokenVar: "ownerToken" }),
        req("Assign driver", "POST", "/api/v1/owner/assign-driver/{{fleetId}}", { tokenVar: "ownerToken", body: "raw", rawBody: "{}" }),
        req("Add fleet", "POST", "/api/v1/owner/add-fleet", { tokenVar: "ownerToken", body: "raw", rawBody: "{}" }),
        req("Update fleet", "POST", "/api/v1/owner/update-fleet/{{fleetId}}", { tokenVar: "ownerToken", body: "raw", rawBody: "{}" }),
        req("Delete fleet", "POST", "/api/v1/owner/delete-fleet/{{fleetId}}", { tokenVar: "ownerToken", body: "raw", rawBody: "{}" }),
        req("Add drivers", "POST", "/api/v1/owner/add-drivers", { tokenVar: "ownerToken", body: "raw", rawBody: "{}" }),
        req("Delete driver", "GET", "/api/v1/owner/delete-driver/{{driverId}}", { tokenVar: "ownerToken" }),
        req("Dashboard", "POST", "/api/v1/owner/dashboard", { tokenVar: "ownerToken", body: "raw", rawBody: "{}" }),
        req("Fleet dashboard", "POST", "/api/v1/owner/fleet-dashboard", { tokenVar: "ownerToken", body: "raw", rawBody: "{}" }),
        req("Fleet driver dashboard", "POST", "/api/v1/owner/fleet-driver-dashboard", { tokenVar: "ownerToken", body: "raw", rawBody: "{}" }),
      ],
    },
    {
      name: "11. Dispatcher /api/v1/dispatcher",
      item: [
        req("Request ETA", "POST", "/api/v1/dispatcher/request/eta", { tokenVar: "dispatcherToken", body: "raw", rawBody: "{}" }),
        req("List packages", "POST", "/api/v1/dispatcher/request/list_packages", { tokenVar: "dispatcherToken", body: "raw", rawBody: "{}" }),
      ],
    },
    {
      name: "12. Admin /api/v1/admin (JWT adminToken)",
      item: [
        {
          name: "Login",
          item: [
            req("Admin login", "POST", "/api/v1/admin/login", { noauth: true, body: "raw", rawBody: '{"email":"admin@example.com","password":"secret"}' }),
          ],
        },
        {
          name: "Laravel web → JSON (Inertia dashboards)",
          item: [
            req("Dashboard page props", "GET", "/api/v1/admin/dashboard/page", { tokenVar: "adminToken" }),
            req("Dashboard data", "GET", "/api/v1/admin/dashboard/data", { tokenVar: "adminToken" }),
            req("Dashboard today earnings", "GET", "/api/v1/admin/dashboard/today-earnings", { tokenVar: "adminToken" }),
            req("Dashboard overall earnings chart", "GET", "/api/v1/admin/dashboard/overall-earnings", { tokenVar: "adminToken" }),
            req("Dashboard cancel chart", "GET", "/api/v1/admin/dashboard/cancel-chart", { tokenVar: "adminToken" }),
            req("Owner dashboard page props", "GET", "/api/v1/admin/owner-dashboard/page", { tokenVar: "adminToken" }),
            req("Owner dashboard data", "GET", "/api/v1/admin/owner-dashboard/data", { tokenVar: "adminToken" }),
            req("Owner dashboard earnings", "GET", "/api/v1/admin/owner-dashboard/earnings", { tokenVar: "adminToken" }),
            req("Overall menu stub", "GET", "/api/v1/admin/overall-menu", { tokenVar: "adminToken" }),
          ],
        },
        {
          name: "Core",
          item: [
            req("Status", "GET", "/api/v1/admin/status", { tokenVar: "adminToken" }),
            req("Healthcheck", "GET", "/api/v1/admin/healthcheck", { tokenVar: "adminToken" }),
            req("Landing home", "GET", "/api/v1/admin/", { tokenVar: "adminToken" }),
          ],
        },
        {
          name: "Users",
          item: [
            req("List users", "GET", "/api/v1/admin/users?page=1&limit=20", { tokenVar: "adminToken" }),
            req("Create user", "POST", "/api/v1/admin/users", { tokenVar: "adminToken", body: "raw", rawBody: "{}" }),
            req("Get user", "GET", "/api/v1/admin/users/{{adminUserId}}", { tokenVar: "adminToken" }),
            req("Patch user", "PATCH", "/api/v1/admin/users/{{adminUserId}}", { tokenVar: "adminToken", body: "raw", rawBody: "{}" }),
            req("Delete user", "DELETE", "/api/v1/admin/users/{{adminUserId}}", { tokenVar: "adminToken" }),
            req("User wallet", "GET", "/api/v1/admin/users/{{adminUserId}}/wallet", { tokenVar: "adminToken" }),
            req("User wallet history", "GET", "/api/v1/admin/users/{{adminUserId}}/wallet-history", { tokenVar: "adminToken" }),
            req("User requests", "GET", "/api/v1/admin/users/{{adminUserId}}/requests", { tokenVar: "adminToken" }),
          ],
        },
        {
          name: "Drivers",
          item: [
            req("List drivers", "GET", "/api/v1/admin/drivers?page=1&limit=20", { tokenVar: "adminToken" }),
            req("Create driver", "POST", "/api/v1/admin/drivers", { tokenVar: "adminToken", body: "raw", rawBody: "{}" }),
            req("Get driver", "GET", "/api/v1/admin/drivers/{{adminDriverId}}", { tokenVar: "adminToken" }),
            req("Patch driver", "PATCH", "/api/v1/admin/drivers/{{adminDriverId}}", { tokenVar: "adminToken", body: "raw", rawBody: "{}" }),
            req("Delete driver", "DELETE", "/api/v1/admin/drivers/{{adminDriverId}}", { tokenVar: "adminToken" }),
            req("Driver requests", "GET", "/api/v1/admin/drivers/{{adminDriverId}}/requests", { tokenVar: "adminToken" }),
          ],
        },
        {
          name: "Owners",
          item: [
            req("List owners", "GET", "/api/v1/admin/owners?page=1&limit=20", { tokenVar: "adminToken" }),
            req("Create owner", "POST", "/api/v1/admin/owners", { tokenVar: "adminToken", body: "raw", rawBody: "{}" }),
            req("Get owner", "GET", "/api/v1/admin/owners/{{adminOwnerId}}", { tokenVar: "adminToken" }),
            req("Patch owner", "PATCH", "/api/v1/admin/owners/{{adminOwnerId}}", { tokenVar: "adminToken", body: "raw", rawBody: "{}" }),
            req("Delete owner", "DELETE", "/api/v1/admin/owners/{{adminOwnerId}}", { tokenVar: "adminToken" }),
          ],
        },
        {
          name: "Trips",
          item: [
            req("List requests", "GET", "/api/v1/admin/requests?page=1&limit=20&status=ongoing", { tokenVar: "adminToken" }),
            req("Get request", "GET", "/api/v1/admin/requests/{{requestId}}", { tokenVar: "adminToken" }),
            req("Assign driver", "POST", "/api/v1/admin/requests/{{requestId}}/assign-driver", { tokenVar: "adminToken", body: "raw", rawBody: '{"driver_id":"{{adminDriverId}}"}' }),
            req("Cancel request", "POST", "/api/v1/admin/requests/{{requestId}}/cancel", { tokenVar: "adminToken", body: "raw", rawBody: '{"cancel_reason":"Admin"}' }),
          ],
        },
        {
          name: "Promos & locations",
          item: [
            req("List promos", "GET", "/api/v1/admin/promos", { tokenVar: "adminToken" }),
            req("Create promo", "POST", "/api/v1/admin/promos", { tokenVar: "adminToken", body: "raw", rawBody: "{}" }),
            req("Get promo", "GET", "/api/v1/admin/promos/{{promoId}}", { tokenVar: "adminToken" }),
            req("Patch promo", "PATCH", "/api/v1/admin/promos/{{promoId}}", { tokenVar: "adminToken", body: "raw", rawBody: "{}" }),
            req("Delete promo", "DELETE", "/api/v1/admin/promos/{{promoId}}", { tokenVar: "adminToken" }),
            req("List service locations", "GET", "/api/v1/admin/service-locations", { tokenVar: "adminToken" }),
            req("Create service location", "POST", "/api/v1/admin/service-locations", { tokenVar: "adminToken", body: "raw", rawBody: "{}" }),
            req("Get service location", "GET", "/api/v1/admin/service-locations/{{serviceLocationId}}", { tokenVar: "adminToken" }),
            req("Patch service location", "PATCH", "/api/v1/admin/service-locations/{{serviceLocationId}}", { tokenVar: "adminToken", body: "raw", rawBody: "{}" }),
            req("Delete service location", "DELETE", "/api/v1/admin/service-locations/{{serviceLocationId}}", { tokenVar: "adminToken" }),
          ],
        },
      ],
    },
    {
      name: "13. External",
      item: [
        req("Google Routes API", "POST", "https://routes.googleapis.com/directions/v2:computeRoutes", { noauth: true, body: "raw", rawBody: "{}" }),
      ],
    },
  ],
};

const out = path.join(__dirname, "..", "postman", "ApiEndpoints.postman_collection.json");
fs.writeFileSync(out, JSON.stringify(collection, null, 2), "utf8");
console.log("Wrote", out);
