const web = require("../controllers/webController");

/**
 * Laravel `routes/web.php`–style JSON handlers (same paths as `/web`, relative to mount).
 * Used by `web.js` (public) and `admin.js` (JWT + admin roles).
 */
function registerWebRoutes(router) {
  router.get("/status", web.status);
  router.get("/healthcheck", web.healthcheck);
  router.post("/set-locale", web.setLocale);

  router.get("/track/request/:request", web.trackRequest);
  router.get(
    "/download-user-invoice/:requestmodel",
    web.downloadInvoiceStub("user")
  );
  router.get(
    "/download-driver-invoice/:requestmodel",
    web.downloadInvoiceStub("driver")
  );

  router.get("/", web.landingHome);
  router.get("/driver", web.landingDriver);
  router.get("/aboutus", web.landingAboutUs);
  router.get("/user", web.landingUser);
  router.get("/contact", web.landingContact);
  router.get("/privacy", web.landingPrivacy);
  router.get("/compliance", web.landingCompliance);
  router.get("/terms", web.landingTerms);
  router.get("/dmv", web.landingDmv);

  router.get("/mi-login", web.miLoginStub);

  router.get("/paypal", web.paymentGatewayStub("paypal"));
  router.post("/paypal/payment", web.paymentGatewayStub("paypal"));
  router.get("/paypal/payment/success", web.paymentGatewayStub("paypal"));
  router.get("/paypal/payment/cancel", web.paymentGatewayStub("paypal"));

  router.get("/stripe", web.paymentGatewayStub("stripe"));
  router.post("/stripe-checkout", web.paymentGatewayStub("stripe"));
  router.get("/stripe-checkout-success", web.paymentGatewayStub("stripe"));
  router.get("/stripe-checkout-error", web.paymentGatewayStub("stripe"));

  router.get("/flutterwave", web.paymentGatewayStub("flutterwave"));
  router.get(
    "/flutterwave/payment/success",
    web.paymentGatewayStub("flutterwave")
  );

  router.get("/cashfree", web.paymentGatewayStub("cashfree"));
  router.post("/cashfree/payments/store", web.paymentGatewayStub("cashfree"));
  router.all("/cashfree/payments/success", web.paymentGatewayStub("cashfree"));

  router.get("/paystack", web.paymentGatewayStub("paystack"));
  router.get("/paystack/payment/success", web.paymentGatewayStub("paystack"));

  router.get("/khalti", web.paymentGatewayStub("khalti"));
  router.post("/khalti/checkout", web.paymentGatewayStub("khalti"));

  router.get("/razorpay", web.paymentGatewayStub("razorpay"));
  router.get("/payment-success", web.paymentGatewayStub("razorpay"));

  router.get("/mercadopago", web.paymentGatewayStub("mercadopago"));
  router.get(
    "/mercadopago/payment/success",
    web.paymentGatewayStub("mercadopago")
  );
  router.all("/webhook/mercadopago", web.paymentGatewayStub("mercadopago"));

  router.get("/open-pix", web.paymentGatewayStub("openpix"));

  router.get("/paytech", web.paymentGatewayStub("paytech"));
  router.post("/paytech/initiate", web.paymentGatewayStub("paytech"));
  router.get("/paytech/payment/success", web.paymentGatewayStub("paytech"));

  router.get("/flexpaie", web.paymentGatewayStub("flexpaie"));
  router.post("/flexpaie/pay", web.paymentGatewayStub("flexpaie"));
  router.get("/flexpaie/payment/success", web.paymentGatewayStub("flexpaie"));

  router.get("/ccavenue", web.paymentGatewayStub("ccavenue"));
  router.post("/ccavenue/checkout", web.paymentGatewayStub("ccavenue"));
  router.get("/ccavenue/payment/success", web.paymentGatewayStub("ccavenue"));
  router.get("/ccavenue/payment/failure", web.paymentGatewayStub("ccavenue"));

  router.get("/payphone", web.paymentGatewayStub("payphone"));
  router.get("/payphone/payment-success", web.paymentGatewayStub("payphone"));

  router.get("/myfatoora", web.paymentGatewayStub("myfatoora"));
  router.post("/myfatoora-checkout", web.paymentGatewayStub("myfatoora"));
  router.get(
    "/myfatoora-checkout-success",
    web.paymentGatewayStub("myfatoora")
  );

  router.get("/easypaisa", web.paymentGatewayStub("easypaisa"));
  router.get("/easypaisa/payment-success", web.paymentGatewayStub("easypaisa"));

  router.get("/paymongo", web.paymentGatewayStub("paymongo"));
  router.post("/paymongo-checkout", web.paymentGatewayStub("paymongo"));
  router.get("/paymongo-checkout-success", web.paymentGatewayStub("paymongo"));

  router.get("/fedapay", web.paymentGatewayStub("fedapay"));
  router.post("/fedapay-checkout", web.paymentGatewayStub("fedapay"));
  router.get("/fedapay-checkout-success", web.paymentGatewayStub("fedapay"));

  router.get("/success", web.staticViewStub("success"));
  router.get("/failure", web.staticViewStub("failure"));
  router.get("/pending", web.staticViewStub("pending"));
}

module.exports = { registerWebRoutes };
