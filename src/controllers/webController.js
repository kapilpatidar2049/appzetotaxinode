const mongoose = require("mongoose");
const Request = require("../models/Request");
const LandingQuickLink = require("../models/LandingQuickLink");
const Setting = require("../models/Setting");

function json(res, body, status = 200) {
  return res.status(status).json(body);
}

function status(req, res) {
  return json(res, { status: "Application is running" });
}

function healthcheck(req, res) {
  return json(res, { status: "Healthy" });
}

/** Laravel POST /set-locale — session replaced with ack + optional cookie hint */
function setLocale(req, res) {
  const locale = req.body?.locale ?? req.query?.locale;
  return json(res, { status: "success", locale: locale || null });
}

async function landingQuickLinksPayload() {
  return LandingQuickLink.find({ active: true }).sort({ order: 1 }).lean();
}

async function landingHome(req, res, next) {
  try {
    const links = await landingQuickLinksPayload();
    return json(res, {
      page: "landing.index",
      data: { quick_links: links },
      message: "Landing homepage (JSON). In Laravel this renders Blade/Inertia.",
    });
  } catch (e) {
    next(e);
  }
}

async function landingDriver(req, res) {
  return json(res, {
    page: "landing.driver",
    message: "Landing driver page stub",
  });
}

async function landingAboutUs(req, res) {
  return json(res, {
    page: "landing.aboutus",
    message: "Landing about page stub",
  });
}

async function landingUser(req, res) {
  return json(res, {
    page: "landing.user",
    message: "Landing user page stub",
  });
}

async function landingContact(req, res) {
  return json(res, {
    page: "landing.contact",
    message: "Landing contact page stub",
  });
}

async function legalPageFromSetting(res, pageName, settingKey) {
  const doc = await Setting.findOne({ key: settingKey }).lean();
  let content = "";
  if (doc?.value != null) {
    content =
      typeof doc.value === "string"
        ? doc.value
        : doc.value?.body ?? doc.value?.html ?? JSON.stringify(doc.value);
  }
  return json(res, { page: pageName, content });
}

async function landingPrivacy(req, res, next) {
  try {
    return await legalPageFromSetting(res, "landing.privacy", "privacy_policy");
  } catch (e) {
    next(e);
  }
}

async function landingCompliance(req, res, next) {
  try {
    return await legalPageFromSetting(res, "landing.compliance", "compliance_content");
  } catch (e) {
    next(e);
  }
}

async function landingTerms(req, res, next) {
  try {
    return await legalPageFromSetting(res, "landing.terms", "terms_and_conditions");
  } catch (e) {
    next(e);
  }
}

async function landingDmv(req, res, next) {
  try {
    return await legalPageFromSetting(res, "landing.dmv", "dmv_content");
  } catch (e) {
    next(e);
  }
}

function miLoginStub(req, res) {
  return json(res, {
    page: "overrideloginToDashboard",
    message: "Admin override login is not implemented in Node (Laravel mi-login).",
  });
}

async function trackRequest(req, res, next) {
  try {
    const id = req.params.request;
    let q = null;
    if (mongoose.Types.ObjectId.isValid(id)) {
      q = await Request.findById(id).lean();
    }
    if (!q) {
      q = await Request.findOne({ request_number: id }).lean();
    }
    if (!q) {
      return json(res, { message: "Request not found" }, 404);
    }
    return json(res, {
      data: {
        id: q._id,
        request_number: q.request_number,
        pick_lat: q.pick_lat,
        pick_lng: q.pick_lng,
        pick_address: q.pick_address,
        drop_lat: q.drop_lat,
        drop_lng: q.drop_lng,
        drop_address: q.drop_address,
        is_completed: q.is_completed,
        is_cancelled: q.is_cancelled,
        driver_id: q.driver_id,
      },
    });
  } catch (e) {
    next(e);
  }
}

function downloadInvoiceStub(kind) {
  return (req, res) =>
    json(
      res,
      {
        message: `Invoice PDF (${kind}) is not generated in Node yet`,
        requestmodel: req.params.requestmodel,
      },
      501
    );
}

function paymentGatewayStub(name) {
  return (req, res) =>
    json(res, {
      gateway: name,
      query: req.query,
      message:
        "Payment gateway entrypoint stub (Laravel redirects to provider). Implement redirect or API flow in Node.",
    });
}

function staticViewStub(view) {
  return (req, res) =>
    json(res, {
      view,
      message: "Laravel Blade/Inertia view; no HTML in Node API.",
    });
}

function notImplemented(req, res) {
  return json(
    res,
    {
      success: false,
      message:
        "This Laravel web route is not implemented in Node. For admin dashboard JSON (Laravel web.php widgets), use GET /api/v1/admin/dashboard/* with JWT; extend registerWebRoutes / webController for public /web stubs.",
      method: req.method,
      path: req.originalUrl.replace(/^\/web/, "") || "/",
    },
    501
  );
}

module.exports = {
  status,
  healthcheck,
  setLocale,
  landingHome,
  landingDriver,
  landingAboutUs,
  landingUser,
  landingContact,
  landingPrivacy,
  landingCompliance,
  landingTerms,
  landingDmv,
  miLoginStub,
  trackRequest,
  downloadInvoiceStub,
  paymentGatewayStub,
  staticViewStub,
  notImplemented,
};
