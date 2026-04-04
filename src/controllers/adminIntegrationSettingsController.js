const mongoose = require("mongoose");
const ThirdPartySetting = require("../models/ThirdPartySetting");
const PaymentGateway = require("../models/PaymentGateway");

function ok(res, data, message = "success") {
  return res.json({ success: true, message, data });
}

function err(res, status, message, errors) {
  return res.status(status).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}

async function rowsToMap(module) {
  const rows = await ThirdPartySetting.find({ module }).sort({ key: 1 }).lean();
  const settings = {};
  for (const r of rows) {
    settings[r.key] = r.value;
  }
  return { rows, settings };
}

async function upsertModuleFromPayload(module, source) {
  if (!source || typeof source !== "object") return 0;
  const flat = source.settings && typeof source.settings === "object" ? source.settings : source;
  let n = 0;
  for (const [key, value] of Object.entries(flat)) {
    if (!key || String(key).startsWith("$")) continue;
    await ThirdPartySetting.findOneAndUpdate(
      { module, key: String(key) },
      { $set: { module, key: String(key), value } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    n += 1;
  }
  return n;
}

/** SMS provider toggles → human-readable list */
function summarizeSmsGateways(settings) {
  const names = [];
  const map = [
    ["enable_firebase_otp", "Firebase OTP"],
    ["enable_twilio", "Twilio"],
    ["enable_sparrow", "Sparrow"],
    ["enable_msg91", "MSG91"],
    ["enable_sms_ala", "SMS ALA"],
    ["enable_sms_india_hub", "SMS India Hub"],
    ["enable_kudi_sms_api_key", "Kudi SMS"],
  ];
  for (const [k, label] of map) {
    const v = settings[k];
    if (v === "1" || v === 1 || v === true) names.push({ key: k, name: label, active: true });
  }
  return names;
}

async function listPaymentGateways(req, res, next) {
  try {
    const { enabled } = req.query;
    const filter = {};
    if (enabled === "1" || enabled === "true") filter.enabled = true;
    if (enabled === "0" || enabled === "false") filter.enabled = false;

    const items = await PaymentGateway.find(filter).sort({ order: 1, name: 1 }).lean();
    return ok(res, { results: items, total: items.length });
  } catch (e) {
    next(e);
  }
}

async function patchPaymentGateway(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await PaymentGateway.findById(id);
    if (!doc) return err(res, 404, "Payment gateway not found");

    const body = req.body || {};
    if (body.gateway !== undefined) doc.gateway = String(body.gateway).trim();
    if (body.slug !== undefined) doc.slug = String(body.slug).trim().toLowerCase();
    if (body.image !== undefined) doc.image = body.image;
    if (body.order !== undefined) doc.order = Number(body.order) || 0;
    if (body.enabled !== undefined) doc.enabled = Boolean(body.enabled);
    if (body.for_ride !== undefined) doc.for_ride = Boolean(body.for_ride);
    if (body.for_wallet !== undefined) doc.for_wallet = Boolean(body.for_wallet);
    if (Array.isArray(body.supported_countries)) doc.supported_countries = body.supported_countries.map(String);
    if (Array.isArray(body.supported_currencies)) doc.supported_currencies = body.supported_currencies.map(String);

    await doc.save();
    return ok(res, { payment_gateway: doc.toObject() }, "Updated");
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", { slug: "Slug already exists" });
    }
    next(e);
  }
}

async function getPaymentSettings(req, res, next) {
  try {
    const { rows, settings } = await rowsToMap("payment");
    return ok(res, { rows, settings });
  } catch (e) {
    next(e);
  }
}

async function updatePaymentSettings(req, res, next) {
  try {
    const n = await upsertModuleFromPayload("payment", req.body || {});
    const { rows, settings } = await rowsToMap("payment");
    return ok(res, { updated_count: n, rows, settings }, "Updated");
  } catch (e) {
    next(e);
  }
}

async function getSmsSettings(req, res, next) {
  try {
    const { rows, settings } = await rowsToMap("sms");
    const gateways = summarizeSmsGateways(settings);
    return ok(res, { rows, settings, gateways });
  } catch (e) {
    next(e);
  }
}

async function updateSmsSettings(req, res, next) {
  try {
    const n = await upsertModuleFromPayload("sms", req.body || {});
    const { rows, settings } = await rowsToMap("sms");
    const gateways = summarizeSmsGateways(settings);
    return ok(res, { updated_count: n, rows, settings, gateways }, "Updated");
  } catch (e) {
    next(e);
  }
}

async function getFirebaseSettings(req, res, next) {
  try {
    const { rows, settings } = await rowsToMap("firebase");
    return ok(res, { rows, settings });
  } catch (e) {
    next(e);
  }
}

async function updateFirebaseSettings(req, res, next) {
  try {
    const n = await upsertModuleFromPayload("firebase", req.body || {});
    const { rows, settings } = await rowsToMap("firebase");
    return ok(res, { updated_count: n, rows, settings }, "Updated");
  } catch (e) {
    next(e);
  }
}

async function getMapSettings(req, res, next) {
  try {
    const { rows, settings } = await rowsToMap("map");
    return ok(res, { rows, settings });
  } catch (e) {
    next(e);
  }
}

async function updateMapSettings(req, res, next) {
  try {
    const n = await upsertModuleFromPayload("map", req.body || {});
    const { rows, settings } = await rowsToMap("map");
    return ok(res, { updated_count: n, rows, settings }, "Updated");
  } catch (e) {
    next(e);
  }
}

async function getMailSettings(req, res, next) {
  try {
    const { rows, settings } = await rowsToMap("mail_config");
    return ok(res, { rows, settings });
  } catch (e) {
    next(e);
  }
}

async function updateMailSettings(req, res, next) {
  try {
    const n = await upsertModuleFromPayload("mail_config", req.body || {});
    const { rows, settings } = await rowsToMap("mail_config");
    return ok(res, { updated_count: n, rows, settings }, "Updated");
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listPaymentGateways,
  patchPaymentGateway,
  getPaymentSettings,
  updatePaymentSettings,
  getSmsSettings,
  updateSmsSettings,
  getFirebaseSettings,
  updateFirebaseSettings,
  getMapSettings,
  updateMapSettings,
  getMailSettings,
  updateMailSettings,
};
