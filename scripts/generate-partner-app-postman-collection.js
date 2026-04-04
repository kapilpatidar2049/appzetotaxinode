/**
 * Partner app (driver + owner) — Flutter ApiEndpoints mirror for Postman v2.1.
 * Run: npm run postman:partner
 * Output: postman/partner-app.postman_collection.json
 */
const fs = require("fs");
const path = require("path");

const B = "{{baseUrl}}";

function req(name, method, pathSuffix, opts = {}) {
  const {
    auth = "bearer",
    tokenVar = "accessToken",
    noauth = false,
    body = null,
    rawBody = "{}",
    formdata = null,
    desc = null,
    absoluteUrl = false,
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
    r.request.header = [{ key: "Content-Type", value: "application/json" }];
    r.request.body = { mode: "raw", raw: rawBody };
  }
  if (body === "formdata" && formdata) r.request.body = { mode: "formdata", formdata };
  return r;
}

const J = (o) => JSON.stringify(o, null, 2);

const collection = {
  info: {
    name: "Partner app — Driver & Owner (Flutter ApiEndpoints)",
    description:
      "Saari **implemented** `/api/v1` endpoints jo driver/owner partner apps use karti hain (Flutter `ApiEndpoints` list ke saath align).\n\n" +
      "**Tokens:** `accessToken` = driver JWT (`POST .../driver/login` → `access_token`). Owner flows ke liye `ownerToken` (`POST .../owner/register` ya owner login agar alag flow ho).\n" +
      "User profile routes (`/user/*`) driver JWT se bhi chal sakti hain jab token mein role driver ho.\n\n" +
      "**Complaints:** `GET /common/complaint-titles` + `POST /common/make-complaint` — titles MongoDB `complainttitles` collection se; pehle titles insert karein (admin ya direct DB).\n\n" +
      "**External (maps):** Google / OSM URLs app mein direct call hoti hain; neeche reference folder me placeholders diye gaye hain.\n\n" +
      "Regenerate: `npm run postman:partner`.",
    schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
  },
  variable: [
    { key: "baseUrl", value: "http://localhost:5000" },
    { key: "accessToken", value: "" },
    { key: "ownerToken", value: "" },
    { key: "requestId", value: "" },
    { key: "fleetId", value: "" },
    { key: "driverId", value: "" },
    { key: "cardId", value: "" },
    { key: "notificationId", value: "" },
    { key: "supportTicketId", value: "" },
    { key: "sosId", value: "" },
    { key: "favouriteLocationId", value: "" },
    { key: "serviceLocationId", value: "" },
    { key: "historyId", value: "" },
    { key: "mobilePage", value: "privacy" },
    { key: "car_make_id", value: "" },
    { key: "complaintTitleId", value: "" },
    { key: "googleRoutesKey", value: "" },
    { key: "googleMapKey", value: "" },
  ],
  item: [
    {
      name: "0. Auth",
      item: [
        req("Driver login", "POST", "/api/v1/driver/login", {
          noauth: true,
          body: "raw",
          rawBody: J({
            mobile: "9999999999",
            password: "your_password",
            device_token: "optional_fcm_token",
          }),
        }),
        req("Owner login (same URL, role owner)", "POST", "/api/v1/driver/login", {
          noauth: true,
          body: "raw",
          rawBody: J({
            mobile: "8888888888",
            password: "owner_password",
            device_token: "",
            role: "owner",
          }),
          desc: "Backend `loginDriver` uses body.role === \"owner\" for owner JWT. Set ownerToken = access_token.",
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
          rawBody: J({ email: "driver@example.com" }),
        }),
        req("Validate email OTP", "POST", "/api/v1/validate-email-otp", {
          noauth: true,
          body: "raw",
          rawBody: J({ email: "driver@example.com", otp: "123456" }),
        }),
        req("Logout", "POST", "/api/v1/logout", { body: "raw", rawBody: "{}" }),
        req("Driver validate mobile (register)", "POST", "/api/v1/driver/validate-mobile", {
          noauth: true,
          body: "raw",
          rawBody: J({ mobile: "9999999999", email: "" }),
        }),
        req("Driver validate mobile for login", "POST", "/api/v1/driver/validate-mobile-for-login", {
          noauth: true,
          body: "raw",
          rawBody: J({ mobile: "9999999999" }),
        }),
        req("Driver register", "POST", "/api/v1/driver/register", {
          noauth: true,
          body: "raw",
          rawBody: J({
            name: "Test Driver",
            mobile: "9999999999",
            password: "Secret123",
            email: "",
            country: "",
            device_token: "",
          }),
        }),
        req("Driver update password", "POST", "/api/v1/driver/update-password", {
          noauth: true,
          body: "raw",
          rawBody: J({ mobile: "9999999999", password: "NewSecret123" }),
        }),
        req("Owner register", "POST", "/api/v1/owner/register", {
          noauth: true,
          body: "raw",
          rawBody: J({
            name: "Fleet Owner",
            mobile: "8888888888",
            email: "owner@example.com",
            password: "Secret123",
            country: "",
            device_token: "",
          }),
        }),
        req("Update driver referral", "POST", "/api/v1/update/driver/referral", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: J({ referral_code: "REF123" }),
        }),
        req("Get referral", "GET", "/api/v1/get/referral"),
      ],
    },
    {
      name: "1. Translation & locale",
      item: [
        req("Translation list", "GET", "/api/v1/translation/list", { noauth: true }),
        req("Translation get (sheets)", "GET", "/api/v1/translation/get", { noauth: true }),
        req("Translation user get", "GET", "/api/v1/translation-user/get", { noauth: true }),
        req("Update my language", "POST", "/api/v1/user/update-my-lang", {
          body: "raw",
          rawBody: J({ lang: "en" }),
        }),
      ],
    },
    {
      name: "2. Countries & onboarding",
      item: [
        req("Countries", "GET", "/api/v1/countries", { noauth: true }),
        req("Onboarding driver", "GET", "/api/v1/on-boarding-driver", { noauth: true }),
        req("Onboarding owner", "GET", "/api/v1/on-boarding-owner", { noauth: true }),
        req("Common modules", "GET", "/api/v1/common/modules", { noauth: true }),
      ],
    },
    {
      name: "3. Service location & vehicle types",
      item: [
        req("Service locations (auth)", "GET", "/api/v1/servicelocation"),
        req("Vehicle types by service location id", "GET", "/api/v1/types/{{serviceLocationId}}", {
          noauth: true,
        }),
        req(
          "Vehicle types Flutter path /types/service",
          "GET",
          "/api/v1/types/service?service_location={{serviceLocationId}}&transport_type=taxi",
          { noauth: true, desc: "Optional: drop transport_type for all types." }
        ),
        req("Sub vehicle types", "GET", "/api/v1/types/sub-vehicle/{{serviceLocationId}}", {
          noauth: true,
        }),
        req("Car makes", "GET", "/api/v1/common/car/makes", {
          noauth: true,
          desc: "Optional query: transport_type=taxi|delivery|both&vehicle_type=bike|taxi|truck...",
        }),
        req("Car models by make", "GET", "/api/v1/common/car/models/{{car_make_id}}", {
          noauth: true,
        }),
      ],
    },
    {
      name: "4. User profile & account",
      item: [
        req("User details (me)", "GET", "/api/v1/user/"),
        req("Driver / vehicle profile update", "POST", "/api/v1/user/driver-profile", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: J({
            car_make: "Toyota",
            car_model: "Innova",
            car_color: "White",
            car_number: "KA01AB1234",
            vehicle_year: "2020",
          }),
        }),
        req("Update location", "POST", "/api/v1/user/update-location", {
          body: "raw",
          rawBody: J({ lat: 12.97, lng: 77.59, address: "Bengaluru" }),
        }),
        req("Delete account", "POST", "/api/v1/user/delete-user-account", { body: "raw", rawBody: "{}" }),
        req("Download invoice (user)", "GET", "/api/v1/user/download-invoice/{{requestId}}"),
      ],
    },
    {
      name: "5. Driver — status, docs, route, diagnostic",
      item: [
        req("Online / offline", "POST", "/api/v1/driver/online-offline", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: "{}",
        }),
        req("Update live location (Mongo + Firebase drivers/)", "POST", "/api/v1/driver/update-location", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: J({ lat: 12.9716, lng: 77.5946, bearing: 0, heading: 0 }),
          desc: "Requires FIREBASE_DATABASE_URL + credentials on server. Optional: bearing, heading.",
        }),
        req("Update price per distance", "POST", "/api/v1/driver/update-price", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: J({ price_per_distance: 12.5 }),
        }),
        req("Diagnostic", "GET", "/api/v1/driver/diagnostic", { tokenVar: "accessToken" }),
        req("Documents needed", "GET", "/api/v1/driver/documents/needed", { tokenVar: "accessToken" }),
        req("Upload document", "POST", "/api/v1/driver/upload/documents", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: J({
            needed_document_id: "REPLACE_WITH_ID_FROM_documents_needed",
            document_image: "https://example.com/doc.jpg",
            document_name: "license",
          }),
          desc: "needed_document_id: Mongo id from documents/needed list.",
        }),
        req("Add my route address", "POST", "/api/v1/driver/add-my-route-address", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: J({
            my_route_lat: 12.97,
            my_route_lng: 77.59,
            my_route_address: "Home route",
          }),
        }),
        req("Enable my route booking", "POST", "/api/v1/driver/enable-my-route-booking", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: J({ enable_my_route_booking: true }),
        }),
        req("QR code (payload for client QR)", "GET", "/api/v1/driver/qr-code", { tokenVar: "accessToken" }),
        req(
          "Trip fare summary (optional request_id)",
          "GET",
          "/api/v1/driver/trip-fare-summary?request_id={{requestId}}",
          { tokenVar: "accessToken", desc: "request_id query optional — remove query for current ongoing trip." }
        ),
      ],
    },
    {
      name: "6. Earnings & reports",
      item: [
        req("New earnings (today + wallet)", "GET", "/api/v1/driver/new-earnings", {
          tokenVar: "accessToken",
        }),
        req("Earnings by date", "POST", "/api/v1/driver/earnings-by-date", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: J({ from_date: "2025-01-01", to_date: "2025-01-31" }),
        }),
        req("Earnings report range", "GET", "/api/v1/driver/earnings-report/2025-01-01/2025-01-31", {
          tokenVar: "accessToken",
        }),
        req("Leaderboard trips", "GET", "/api/v1/driver/leader-board/trips", { tokenVar: "accessToken" }),
        req("Leaderboard earnings", "GET", "/api/v1/driver/leader-board/earnings", {
          tokenVar: "accessToken",
        }),
      ],
    },
    {
      name: "7. Subscription & incentives & loyalty",
      item: [
        req("Subscription plans", "GET", "/api/v1/driver/list_of_plans", { tokenVar: "accessToken" }),
        req("Subscribe", "POST", "/api/v1/driver/subscribe", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: J({ subscription_detail_id: "{{mongoPlanId}}" }),
        }),
        req("Today incentives", "GET", "/api/v1/driver/new-incentives", { tokenVar: "accessToken" }),
        req("Weekly incentives", "GET", "/api/v1/driver/week-incentives", { tokenVar: "accessToken" }),
        req("Loyalty history", "GET", "/api/v1/driver/loyalty/history", { tokenVar: "accessToken" }),
        req("Rewards history", "GET", "/api/v1/driver/rewards/history", { tokenVar: "accessToken" }),
      ],
    },
    {
      name: "8. Bank info (driver)",
      item: [
        req("List bank info", "GET", "/api/v1/driver/list/bankinfo", { tokenVar: "accessToken" }),
        req("Update bank info", "POST", "/api/v1/driver/update/bankinfo", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: J({
            account_name: "John Doe",
            account_no: "1234567890",
            bank_name: "HDFC",
            bank_code: "HDFC0001234",
            ifsc_code: "HDFC0001234",
          }),
        }),
      ],
    },
    {
      name: "9. Request — ETA, packages, instant, ride flow",
      item: [
        req("ETA", "POST", "/api/v1/request/eta", {
          body: "raw",
          rawBody: J({
            pick_lat: 12.97,
            pick_lng: 77.59,
            drop_lat: 12.93,
            drop_lng: 77.62,
            vehicle_type: "",
          }),
        }),
        req("Rental / list packages", "POST", "/api/v1/request/list-packages", {
          body: "raw",
          rawBody: "{}",
        }),
        req("Create instant ride (driver)", "POST", "/api/v1/request/create-instant-ride", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: J({
            pick_lat: 12.97,
            pick_lng: 77.59,
            drop_lat: 12.93,
            drop_lng: 77.62,
            vehicle_type: "",
          }),
        }),
        req("Goods types", "GET", "/api/v1/common/goods-types"),
        req("Create delivery instant ride", "POST", "/api/v1/request/create-delivery-instant-ride", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: "{}",
        }),
        req("Respond request", "POST", "/api/v1/request/respond", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: J({ request_id: "{{requestId}}", is_accept: 1 }),
          desc: "is_accept: 1 accept, 0 reject (backend compares Number(is_accept)===1).",
        }),
        req("Ride arrived", "POST", "/api/v1/request/arrived", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: J({ request_id: "{{requestId}}" }),
        }),
        req("Ride started", "POST", "/api/v1/request/started", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: J({ request_id: "{{requestId}}" }),
        }),
        req("Ride end", "POST", "/api/v1/request/end", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: J({ request_id: "{{requestId}}", total_amount: 250 }),
        }),
        req("Payment received (driver)", "POST", "/api/v1/request/payment-confirm", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: J({ request_id: "{{requestId}}" }),
        }),
        req("Add review / rating", "POST", "/api/v1/request/rating", {
          body: "raw",
          rawBody: J({ request_id: "{{requestId}}", rating: 5, feedback: "Great ride" }),
        }),
        req("Cancellation reasons", "GET", "/api/v1/common/cancallation/reasons"),
        req("Cancel by driver", "POST", "/api/v1/request/cancel/by-driver", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: J({ request_id: "{{requestId}}", reason: "Rider no-show" }),
        }),
        req("Upload proof", "POST", "/api/v1/request/upload-proof", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: J({ request_id: "{{requestId}}", proof_image: "https://example.com/p.jpg" }),
        }),
        req("Stop complete", "POST", "/api/v1/request/stop-complete", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: J({ request_id: "{{requestId}}" }),
        }),
        req("Additional charge", "POST", "/api/v1/request/additional-charge", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: J({ request_id: "{{requestId}}", additional_charge: 50 }),
        }),
        req("Stop OTP verify", "POST", "/api/v1/request/stop-otp-verify", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: J({ request_id: "{{requestId}}", otp: "1234" }),
        }),
        req("Ready to pickup (outstation)", "POST", "/api/v1/request/ready-to-pickup", {
          tokenVar: "accessToken",
          body: "raw",
          rawBody: J({ request_id: "{{requestId}}" }),
        }),
        req("Trip history", "GET", "/api/v1/request/history"),
        req("Trip history by id", "GET", "/api/v1/request/history/{{historyId}}"),
        req("Download invoice (request)", "GET", "/api/v1/request/invoice/{{requestId}}"),
        req("Chat history", "GET", "/api/v1/request/chat-history/{{requestId}}"),
        req("Send chat", "POST", "/api/v1/request/send", {
          body: "raw",
          rawBody: J({
            request_id: "{{requestId}}",
            receiver_id: "OTHER_PARTY_USER_MONGO_ID",
            message: "Hello",
          }),
        }),
        req("Chats seen", "POST", "/api/v1/request/seen", {
          body: "raw",
          rawBody: J({ request_id: "{{requestId}}" }),
        }),
      ],
    },
    {
      name: "10. Admin chat (in-app support)",
      item: [
        req("Admin chat history", "GET", "/api/v1/request/user-chat-history"),
        req("Send admin message (same as chat send)", "POST", "/api/v1/request/user-send-message", {
          body: "raw",
          rawBody: J({
            request_id: "{{requestId}}",
            receiver_id: "ADMIN_OR_USER_MONGO_ID",
            message: "Need help with trip",
          }),
        }),
        req("Admin message seen / notification count", "POST", "/api/v1/request/update-notification-count", {
          body: "raw",
          rawBody: J({ request_id: "{{requestId}}" }),
        }),
      ],
    },
    {
      name: "11. Withdraw & wallet & cards",
      item: [
        req("Withdrawal requests list", "GET", "/api/v1/payment/wallet/withdrawal-requests"),
        req("Request withdrawal", "POST", "/api/v1/payment/wallet/request-for-withdrawal", {
          body: "raw",
          rawBody: J({ requested_amount: 500, requested_currency: "INR" }),
        }),
        req("Wallet history", "GET", "/api/v1/payment/wallet/history"),
        req("Transfer money from wallet", "POST", "/api/v1/payment/wallet/transfer-money-from-wallet", {
          body: "raw",
          rawBody: J({ amount: 100 }),
        }),
        req("Convert reward points to wallet", "POST", "/api/v1/payment/wallet/convert-point-to-wallet", {
          body: "raw",
          rawBody: J({ points: 100, amount: 50 }),
        }),
        req("Saved cards list", "GET", "/api/v1/payment/cards/list"),
        req("Stripe create setup intent", "POST", "/api/v1/payment/stripe/create-setup-intent", {
          body: "raw",
          rawBody: "{}",
        }),
        req("Stripe save card", "POST", "/api/v1/payment/stripe/save-card", {
          body: "raw",
          rawBody: J({ payment_method_id: "pm_xxx" }),
        }),
        req("Stripe add money to wallet", "POST", "/api/v1/payment/stripe/add-money-to-wallet", {
          body: "raw",
          rawBody: J({ amount: 200, payment_method_id: "pm_xxx" }),
        }),
        req("Delete card", "POST", "/api/v1/payment/cards/delete/{{cardId}}", { body: "raw", rawBody: "{}" }),
        req("Razorpay create order", "POST", "/api/v1/payment/razorpay/create-order", {
          body: "raw",
          rawBody: J({ amount: 50000, currency: "INR" }),
        }),
        req("Razorpay verify payment", "POST", "/api/v1/payment/razorpay/verify-payment", {
          body: "raw",
          rawBody: J({
            razorpay_order_id: "",
            razorpay_payment_id: "",
            razorpay_signature: "",
          }),
        }),
        req("Payment gateways list", "GET", "/api/v1/payment/gateway"),
        req("Payment gateways for ride (public)", "GET", "/api/v1/payment/gateway-for-ride", {
          noauth: true,
        }),
      ],
    },
    {
      name: "12. SOS",
      item: [
        req("SOS list (lat/lng path)", "GET", "/api/v1/common/sos/list/12.97/77.59"),
        req("Add SOS contact", "POST", "/api/v1/common/sos/store", {
          body: "raw",
          rawBody: J({
            title: "Home",
            contact_name: "Emergency contact",
            contact_number: "+919999999999",
          }),
        }),
        req("Delete SOS contact", "POST", "/api/v1/common/sos/delete/{{sosId}}", {
          body: "raw",
          rawBody: "{}",
        }),
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
        req("Promotions popup", "GET", "/api/v1/promotions/popup", { noauth: true }),
      ],
    },
    {
      name: "14. FAQ, tickets, preferences, referral, legal",
      item: [
        req("FAQ list", "GET", "/api/v1/common/faq/list"),
        req("Ticket titles", "GET", "/api/v1/common/ticket-titles"),
        req("Make ticket", "POST", "/api/v1/common/make-ticket", {
          body: "raw",
          rawBody: J({
            title_id: "REPLACE_TITLE_ID_FROM_ticket_titles",
            message: "Issue description text",
          }),
        }),
        req("Reply ticket", "POST", "/api/v1/common/reply-message/{{supportTicketId}}", {
          body: "raw",
          rawBody: J({ message: "Follow up" }),
        }),
        req("View ticket", "GET", "/api/v1/common/view-ticket/{{supportTicketId}}"),
        req("Ticket list", "GET", "/api/v1/common/list"),
        req("Complaint titles", "GET", "/api/v1/common/complaint-titles"),
        req("Make complaint", "POST", "/api/v1/common/make-complaint", {
          body: "raw",
          rawBody: J({
            complaint_title_id: "{{complaintTitleId}}",
            description: "Issue details",
            request_id: "{{requestId}}",
          }),
          desc: "`title_id` bhi chal sakta hai `complaint_title_id` ki jagah. Text ke liye `complaint_text` / `message` bhi. `request_id` optional — trip se link ke liye.",
        }),
        req("Get preferences", "GET", "/api/v1/common/preferences"),
        req("Update preferences", "POST", "/api/v1/common/preferences/store", {
          body: "raw",
          rawBody: J({ key: "notifications_enabled", value: "1" }),
        }),
        req("Referral history", "GET", "/api/v1/common/referral/history"),
        req("Driver referral condition", "GET", "/api/v1/common/referral/driver-referral-condition"),
        req("Mobile privacy HTML", "GET", "/api/v1/common/mobile/privacy", { noauth: true }),
        req("Mobile terms HTML", "GET", "/api/v1/common/mobile/terms", { noauth: true }),
        req("Mobile page (privacy|terms|…)", "GET", "/api/v1/common/mobile/{{mobilePage}}", {
          noauth: true,
        }),
      ],
    },
    {
      name: "15. Owner",
      item: [
        req("List drivers", "GET", "/api/v1/owner/list-drivers", { tokenVar: "ownerToken" }),
        req("Add drivers", "POST", "/api/v1/owner/add-drivers", {
          tokenVar: "ownerToken",
          body: "raw",
          rawBody: J({
            user_id: "",
            name: "Fleet Driver",
            mobile: "7777777777",
            email: "",
            fleet_id: "{{fleetId}}",
          }),
        }),
        req("Delete driver", "GET", "/api/v1/owner/delete-driver/{{driverId}}", { tokenVar: "ownerToken" }),
        req("Add fleet", "POST", "/api/v1/owner/add-fleet", {
          tokenVar: "ownerToken",
          body: "raw",
          rawBody: J({ name: "Fleet A" }),
        }),
        req("List fleets", "GET", "/api/v1/owner/list-fleets", { tokenVar: "ownerToken" }),
        req("Assign driver to fleet", "POST", "/api/v1/owner/assign-driver/{{fleetId}}", {
          tokenVar: "ownerToken",
          body: "raw",
          rawBody: J({ driver_id: "{{driverId}}" }),
        }),
        req("Update fleet", "POST", "/api/v1/owner/update-fleet/{{fleetId}}", {
          tokenVar: "ownerToken",
          body: "raw",
          rawBody: J({ name: "Fleet renamed" }),
        }),
        req("Delete fleet", "POST", "/api/v1/owner/delete-fleet/{{fleetId}}", {
          tokenVar: "ownerToken",
          body: "raw",
          rawBody: "{}",
        }),
        req("Fleet documents needed", "GET", "/api/v1/owner/fleet/documents/needed", {
          tokenVar: "ownerToken",
          desc: "Flutter query fleet_id — backend returns owner+fleet needed docs bundle.",
        }),
        req("List fleet documents", "GET", "/api/v1/owner/fleet/{{fleetId}}/documents", {
          tokenVar: "ownerToken",
        }),
        req("Upload fleet document", "POST", "/api/v1/owner/fleet/{{fleetId}}/documents", {
          tokenVar: "ownerToken",
          body: "raw",
          rawBody: J({
            fleet_needed_document_id: "{{mongoFleetNeededDocId}}",
            document_name: "RC",
            document_path: "https://example.com/rc.jpg",
          }),
        }),
        req("List driver documents (owner)", "GET", "/api/v1/owner/drivers/{{driverId}}/documents", {
          tokenVar: "ownerToken",
        }),
        req("Upload driver document (owner)", "POST", "/api/v1/owner/drivers/{{driverId}}/documents", {
          tokenVar: "ownerToken",
          body: "raw",
          rawBody: J({
            driver_needed_document_id: "{{mongoDriverNeededDocId}}",
            document_name: "License",
            document_path: "https://example.com/lic.jpg",
          }),
        }),
        req("Owner dashboard", "POST", "/api/v1/owner/dashboard", {
          tokenVar: "ownerToken",
          body: "raw",
          rawBody: "{}",
        }),
        req("Fleet dashboard", "POST", "/api/v1/owner/fleet-dashboard", {
          tokenVar: "ownerToken",
          body: "raw",
          rawBody: J({ fleet_id: "{{fleetId}}" }),
        }),
        req("Fleet driver dashboard", "POST", "/api/v1/owner/fleet-driver-dashboard", {
          tokenVar: "ownerToken",
          body: "raw",
          rawBody: J({ fleet_id: "{{fleetId}}", driver_id: "{{driverId}}" }),
        }),
      ],
    },
    {
      name: "16. External maps (app-side; keys required)",
      item: [
        req("Google Routes computeRoutes", "POST", "https://routes.googleapis.com/directions/v2:computeRoutes", {
          absoluteUrl: true,
          noauth: true,
          body: "raw",
          rawBody: J({
            origin: { location: { latLng: { latitude: 12.97, longitude: 77.59 } } },
            destination: { location: { latLng: { latitude: 12.93, longitude: 77.62 } } },
            travelMode: "DRIVE",
          }),
          desc: "Headers: X-Goog-Api-Key: {{googleRoutesKey}}, X-Goog-FieldMask: routes.polyline",
        }),
        req(
          "Google Geocode latlng",
          "GET",
          "https://maps.googleapis.com/maps/api/geocode/json?latlng=12.97,77.59&key={{googleMapKey}}",
          { absoluteUrl: true, noauth: true }
        ),
        req(
          "OSRM routed-car polyline",
          "GET",
          "https://routing.openstreetmap.de/routed-car/route/v1/driving/77.59,12.97;77.62,12.93?overview=false&geometries=polyline&steps=true",
          { absoluteUrl: true, noauth: true }
        ),
        req(
          "Nominatim reverse",
          "GET",
          "https://nominatim.openstreetmap.org/reverse?lat=12.97&lon=77.59&format=json",
          { absoluteUrl: true, noauth: true, desc: "Respect OSM usage policy (User-Agent)." }
        ),
      ],
    },
  ],
};

const out = path.join(__dirname, "..", "postman", "partner-app.postman_collection.json");
fs.writeFileSync(out, JSON.stringify(collection, null, 2), "utf8");
console.log("Wrote", out);
