/**
 * User app (rider) — Flutter ApiEndpoints mirror for Postman v2.1.
 * Run: npm run postman:user
 * Output: postman/user-app.postman_collection.json
 */
const fs = require("fs");
const path = require("path");

const B = "{{baseUrl}}";

function req(name, method, pathSuffix, opts = {}) {
  const {
    auth = "bearer",
    tokenVar = "userAccessToken",
    noauth = false,
    body = null,
    rawBody = "{}",
    formdata = null,
    desc = null,
    absoluteUrl = false,
    extraHeaders = null,
  } = opts;
  const url = absoluteUrl ? pathSuffix : `${B}${pathSuffix}`;
  const r = { name, request: { method, url } };
  if (desc) r.request.description = desc;
  if (noauth) r.request.auth = { type: "noauth" };
  else if (auth === "bearer") {
    r.request.auth = {
      type: "bearer",
      bearer: [{ key: "token", value: `{{${tokenVar}}}`, type: "string" }],
    };
  }
  if (body === "raw") {
    const h = [{ key: "Content-Type", value: "application/json" }];
    if (extraHeaders && Array.isArray(extraHeaders)) h.push(...extraHeaders);
    r.request.header = h;
    r.request.body = { mode: "raw", raw: rawBody };
  } else if (extraHeaders && Array.isArray(extraHeaders)) {
    r.request.header = extraHeaders;
  }
  if (body === "formdata" && formdata) r.request.body = { mode: "formdata", formdata };
  return r;
}

const J = (o) => JSON.stringify(o, null, 2);

const collection = {
  info: {
    name: "User app — Rider (Flutter ApiEndpoints)",
    description:
      "Saari **user/rider** app endpoints jo Flutter `ApiEndpoints` list se aati hain (`/api/v1/...`).\n\n" +
      "**Token:** `userAccessToken` = `POST /api/v1/user/login` (ya register flow) ke response se `access_token`.\n\n" +
      "**Methods:** Backend ke hisaab se set kiye gaye (e.g. `list-recent-searches` = **POST**, `delete-favourite-location` = **GET** + id path mein).\n\n" +
      "**Maps:** Google Routes URL app direct call karti hai — neeche optional placeholder.\n\n" +
      "Regenerate: `npm run postman:user`.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5000" },
    { key: "userAccessToken", value: "" },
    { key: "requestId", value: "" },
    { key: "notificationId", value: "" },
    { key: "supportTicketId", value: "" },
    { key: "sosId", value: "" },
    { key: "favouriteLocationId", value: "" },
    { key: "cardId", value: "" },
    { key: "complaintTitleId", value: "" },
    { key: "mobilePage", value: "privacy" },
    { key: "googleRoutesKey", value: "" },
  ],
  item: [
    {
      name: "0. Public & config",
      item: [
        req("Translation list", "GET", "/api/v1/translation/list", { noauth: true }),
        req("Countries", "GET", "/api/v1/countries", { noauth: true }),
        req("Onboarding", "GET", "/api/v1/on-boarding", { noauth: true }),
        req("Common modules", "GET", "/api/v1/common/modules", { noauth: true }),
        req("Ride modules", "GET", "/api/v1/common/ride_modules", { noauth: true }),
        req("Promotions popup", "GET", "/api/v1/promotions/popup", { noauth: true }),
      ],
    },
    {
      name: "1. Auth (no token)",
      item: [
        req("Validate mobile for login", "POST", "/api/v1/user/validate-mobile-for-login", {
          noauth: true,
          body: "raw",
          rawBody: J({ mobile: "9999999999" }),
        }),
        req("User login", "POST", "/api/v1/user/login", {
          noauth: true,
          body: "raw",
          rawBody: J({
            mobile: "9999999999",
            password: "your_password",
            device_token: "",
          }),
          desc: "Response se `access_token` ko collection variable `userAccessToken` mein daalein.",
        }),
        req("Send mobile OTP", "POST", "/api/v1/mobile-otp", {
          noauth: true,
          body: "raw",
          rawBody: J({ mobile: "9999999999", country_code: "+91" }),
        }),
        req("Validate OTP", "POST", "/api/v1/validate-otp", {
          noauth: true,
          body: "raw",
          rawBody: J({ mobile: "9999999999", otp: "123456" }),
        }),
        req("Send email OTP", "POST", "/api/v1/send-mail-otp", {
          noauth: true,
          body: "raw",
          rawBody: J({ email: "user@example.com" }),
        }),
        req("Validate email OTP", "POST", "/api/v1/validate-email-otp", {
          noauth: true,
          body: "raw",
          rawBody: J({ email: "user@example.com", otp: "123456" }),
        }),
        req("Register user", "POST", "/api/v1/user/register", {
          noauth: true,
          body: "raw",
          rawBody: J({}),
          desc: "Body apne registration schema ke mutabiq bharein.",
        }),
        req("Update password", "POST", "/api/v1/user/update-password", {
          noauth: true,
          body: "raw",
          rawBody: J({ mobile: "9999999999", password: "new_password" }),
          desc: "Exact fields validation middleware se verify karein.",
        }),
      ],
    },
    {
      name: "2. Session",
      item: [
        req("Logout", "POST", "/api/v1/logout", { body: "raw", rawBody: "{}" }),
        req("Update referral", "POST", "/api/v1/update/user/referral", {
          body: "raw",
          rawBody: J({ referral_code: "REFCODE" }),
        }),
      ],
    },
    {
      name: "3. User profile & account",
      item: [
        req("User details (me)", "GET", "/api/v1/user/"),
        req("Update profile", "POST", "/api/v1/user/profile", {
          body: "raw",
          rawBody: J({ name: "Rider Name" }),
        }),
        req("Update language", "POST", "/api/v1/user/update-my-lang", {
          body: "raw",
          rawBody: J({ lang: "en" }),
        }),
        req("Update location", "POST", "/api/v1/user/update-location", {
          body: "raw",
          rawBody: J({ lat: 12.97, lng: 77.59, address: "Bangalore" }),
        }),
        req("Delete account", "POST", "/api/v1/user/delete-user-account", { body: "raw", rawBody: "{}" }),
        req("Add favourite location", "POST", "/api/v1/user/add-favourite-location", {
          body: "raw",
          rawBody: J({
            address: "Home",
            lat: 12.97,
            lng: 77.59,
            landmark: "",
          }),
        }),
        req("Remove favourite location", "GET", "/api/v1/user/delete-favourite-location/{{favouriteLocationId}}", {
          desc: "Backend: **GET** with Mongo id path param (Flutter string check karein).",
        }),
        req("Download invoice (user)", "GET", "/api/v1/user/download-invoice/{{requestId}}"),
      ],
    },
    {
      name: "4. Service location",
      item: [req("Service locations", "GET", "/api/v1/servicelocation")],
    },
    {
      name: "5. Home & discovery",
      item: [
        req("Recent searches", "POST", "/api/v1/request/list-recent-searches", {
          body: "raw",
          rawBody: J({}),
          desc: "Backend par **POST** hai; body app ke mutabiq.",
        }),
      ],
    },
    {
      name: "6. Booking & trip",
      item: [
        req("ETA", "POST", "/api/v1/request/eta", {
          body: "raw",
          rawBody: J({ pick_lat: 12.97, pick_lng: 77.59, drop_lat: 12.93, drop_lng: 77.62 }),
        }),
        req("Rental — list packages", "POST", "/api/v1/request/list-packages", {
          body: "raw",
          rawBody: J({}),
        }),
        req("Vehicle pricing options", "GET", "/api/v1/request/vehicle-pricing-options"),
        req("Create request", "POST", "/api/v1/request/create", {
          body: "raw",
          rawBody: J({}),
          desc: "Full booking payload — app se copy karein.",
        }),
        req("Cancel request", "POST", "/api/v1/request/cancel", {
          body: "raw",
          rawBody: J({ request_id: "{{requestId}}", reason: "" }),
        }),
        req("Delivery create", "POST", "/api/v1/request/delivery/create", { body: "raw", rawBody: J({}) }),
        req("Update ETA amount", "POST", "/api/v1/request/eta/update-amount", { body: "raw", rawBody: J({}) }),
        req("Respond for bid", "POST", "/api/v1/request/respond-for-bid", { body: "raw", rawBody: J({}) }),
        req("Change drop location", "POST", "/api/v1/request/change-drop-location", { body: "raw", rawBody: J({}) }),
        req("Change payment method", "POST", "/api/v1/request/user/payment-method", {
          body: "raw",
          rawBody: J({ request_id: "{{requestId}}", payment_opt: "cash" }),
        }),
        req("Service verify", "POST", "/api/v1/request/serviceVerify", { body: "raw", rawBody: J({}) }),
        req("Driver tip", "POST", "/api/v1/request/user/driver-tip", { body: "raw", rawBody: J({}) }),
        req("User review / rating", "POST", "/api/v1/request/rating", { body: "raw", rawBody: J({}) }),
      ],
    },
    {
      name: "7. History & invoice",
      item: [
        req("Trip history", "GET", "/api/v1/request/history"),
        req("Download invoice (request)", "GET", "/api/v1/request/invoice/{{requestId}}"),
        req("Outstation rides", "GET", "/api/v1/request/outstation_rides"),
      ],
    },
    {
      name: "8. Promo",
      item: [
        req("Promo code list", "GET", "/api/v1/request/promocode-list"),
        req("Promo redeem", "POST", "/api/v1/request/promocode-redeem", { body: "raw", rawBody: J({}) }),
        req("Promo clear", "POST", "/api/v1/request/promocode-clear", { body: "raw", rawBody: J({}) }),
      ],
    },
    {
      name: "9. Chat (driver) & admin support",
      item: [
        req("Chat history", "GET", "/api/v1/request/chat-history/{{requestId}}"),
        req("Send chat message", "POST", "/api/v1/request/send", { body: "raw", rawBody: J({}) }),
        req("Chat message seen", "POST", "/api/v1/request/seen", { body: "raw", rawBody: J({}) }),
        req("Admin chat history", "GET", "/api/v1/request/user-chat-history"),
        req("Send admin message", "POST", "/api/v1/request/user-send-message", { body: "raw", rawBody: J({}) }),
        req("Admin message seen / notification count", "POST", "/api/v1/request/update-notification-count", {
          body: "raw",
          rawBody: "{}",
        }),
      ],
    },
    {
      name: "10. Common — goods, cancel, FAQ, complaint, SOS",
      item: [
        req("Goods types", "GET", "/api/v1/common/goods-types"),
        req("Cancellation reasons", "GET", "/api/v1/common/cancallation/reasons"),
        req("FAQ list", "GET", "/api/v1/common/faq/list"),
        req("Complaint titles", "GET", "/api/v1/common/complaint-titles"),
        req("Make complaint", "POST", "/api/v1/common/make-complaint", {
          body: "raw",
          rawBody: J({
            complaint_title_id: "{{complaintTitleId}}",
            description: "Details",
            request_id: "{{requestId}}",
          }),
          desc: "`title_id` / `message` / `complaint_text` bhi supported.",
        }),
        req("Add SOS contact", "POST", "/api/v1/common/sos/store", {
          body: "raw",
          rawBody: J({
            name: "Emergency",
            number: "+919999999999",
          }),
        }),
        req("Delete SOS contact", "POST", "/api/v1/common/sos/delete/{{sosId}}", { body: "raw", rawBody: "{}" }),
      ],
    },
    {
      name: "11. Support tickets",
      item: [
        req("Ticket titles", "GET", "/api/v1/common/ticket-titles"),
        req("Make ticket", "POST", "/api/v1/common/make-ticket", {
          body: "raw",
          rawBody: J({
            title_id: "REPLACE_WITH_MONGO_ID",
            message: "Support message",
          }),
        }),
        req("Reply ticket", "POST", "/api/v1/common/reply-message/{{supportTicketId}}", {
          body: "raw",
          rawBody: J({ message: "Reply text" }),
        }),
        req("View ticket", "GET", "/api/v1/common/view-ticket/{{supportTicketId}}"),
        req("Ticket list", "GET", "/api/v1/common/list"),
      ],
    },
    {
      name: "12. Referral & legal (mobile HTML)",
      item: [
        req("Referral condition", "GET", "/api/v1/common/referral/referral-condition"),
        req("Referral history", "GET", "/api/v1/common/referral/history"),
        req("Mobile privacy HTML", "GET", "/api/v1/common/mobile/privacy", { noauth: true }),
        req("Mobile terms HTML", "GET", "/api/v1/common/mobile/terms", { noauth: true }),
        req("Mobile page (privacy|terms|…)", "GET", "/api/v1/common/mobile/{{mobilePage}}", { noauth: true }),
      ],
    },
    {
      name: "13. Notifications",
      item: [
        req("Get notifications", "GET", "/api/v1/notifications/get-notification"),
        req("Delete notification", "POST", "/api/v1/notifications/delete-notification/{{notificationId}}", {
          body: "raw",
          rawBody: "{}",
        }),
        req("Clear all notifications", "POST", "/api/v1/notifications/delete-all-notification", {
          body: "raw",
          rawBody: "{}",
        }),
      ],
    },
    {
      name: "14. Wallet & payments",
      item: [
        req("Wallet history", "GET", "/api/v1/payment/wallet/history"),
        req("Transfer money from wallet", "POST", "/api/v1/payment/wallet/transfer-money-from-wallet", {
          body: "raw",
          rawBody: J({}),
        }),
        req("Stripe create setup intent", "POST", "/api/v1/payment/stripe/create-setup-intent", {
          body: "raw",
          rawBody: "{}",
        }),
        req("Stripe save card", "POST", "/api/v1/payment/stripe/save-card", { body: "raw", rawBody: J({}) }),
        req("Saved cards list", "GET", "/api/v1/payment/cards/list"),
        req("Delete card", "POST", "/api/v1/payment/cards/delete/{{cardId}}", { body: "raw", rawBody: "{}" }),
        req("Stripe add money to wallet", "POST", "/api/v1/payment/stripe/add-money-to-wallet", {
          body: "raw",
          rawBody: J({}),
        }),
        req("Razorpay create order", "POST", "/api/v1/payment/razorpay/create-order", {
          body: "raw",
          rawBody: J({}),
        }),
        req("Razorpay verify payment", "POST", "/api/v1/payment/razorpay/verify-payment", {
          body: "raw",
          rawBody: J({}),
        }),
      ],
    },
    {
      name: "15. External maps (app direct)",
      item: [
        req(
          "Google Routes — computeRoutes",
          "POST",
          "https://routes.googleapis.com/directions/v2:computeRoutes",
          {
            absoluteUrl: true,
            noauth: true,
            body: "raw",
            extraHeaders: [
              { key: "X-Goog-Api-Key", value: "{{googleRoutesKey}}", type: "text" },
              { key: "X-Goog-FieldMask", value: "routes.polyline", type: "text" },
            ],
            rawBody: J({
              origin: { location: { latLng: { latitude: 12.97, longitude: 77.59 } } },
              destination: { location: { latLng: { latitude: 12.93, longitude: 77.62 } } },
              travelMode: "DRIVE",
            }),
            desc: "Ye **Google** URL hai — Node backend par route nahi. `googleRoutesKey` mein Routes API key daalein.",
          }
        ),
      ],
    },
  ],
};

const out = path.join(__dirname, "..", "postman", "user-app.postman_collection.json");
fs.writeFileSync(out, JSON.stringify(collection, null, 2), "utf8");
console.log("Wrote", out);
