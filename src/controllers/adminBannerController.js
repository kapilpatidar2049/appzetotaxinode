const mongoose = require("mongoose");
const Banner = require("../models/Banner");
const User = require("../models/User");
const Driver = require("../models/Driver");
const { sendFcmNotification } = require("../services/firebaseAdmin");

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

function parsePage(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

function normalizeLinkFields(body = {}) {
  const payload = {};
  if (body.title !== undefined) payload.title = String(body.title).trim();
  if (body.image !== undefined) payload.image = String(body.image).trim();
  if (body.link_type !== undefined) payload.link_type = String(body.link_type).trim();
  if (body.external_link !== undefined) payload.external_link = body.external_link || null;
  if (body.deep_link_target_page !== undefined) {
    payload.deep_link_target_page = body.deep_link_target_page || null;
  }
  if (body.active !== undefined) payload.active = Boolean(body.active);
  return payload;
}

function validateLinkFields(payload) {
  const errors = {};
  if (!payload.title) errors.title = "title is required";
  if (!payload.image) errors.image = "image is required";
  if (!payload.link_type) errors.link_type = "link_type is required";

  if (payload.link_type && !["external_link", "deep_link"].includes(payload.link_type)) {
    errors.link_type = "link_type must be external_link or deep_link";
  }
  if (payload.link_type === "external_link" && !payload.external_link) {
    errors.external_link = "external_link is required when link_type=external_link";
  }
  if (payload.link_type === "deep_link" && !payload.deep_link_target_page) {
    errors.deep_link_target_page = "deep_link_target_page is required when link_type=deep_link";
  }
  return errors;
}

function applyLinkTypeDefaults(payload) {
  if (payload.link_type === "external_link") {
    payload.deep_link_target_page = null;
  } else if (payload.link_type === "deep_link") {
    payload.external_link = null;
  }
}

async function listBanners(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const active = req.query.active;
    const filter = {};
    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;

    const [items, total] = await Promise.all([
      Banner.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Banner.countDocuments(filter),
    ]);

    return ok(res, {
      results: items,
      paginator: {
        total,
        per_page: limit,
        current_page: page,
        last_page: Math.ceil(total / limit) || 1,
      },
    });
  } catch (e) {
    next(e);
  }
}

async function getBanner(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Banner.findById(id).lean();
    if (!doc) return err(res, 404, "Banner not found");
    return ok(res, { banner: doc });
  } catch (e) {
    next(e);
  }
}

async function createBanner(req, res, next) {
  try {
    const payload = normalizeLinkFields(req.body || {});
    const errors = validateLinkFields(payload);
    if (Object.keys(errors).length) return err(res, 422, "Validation failed", errors);
    applyLinkTypeDefaults(payload);
    if (payload.active === undefined) payload.active = true;

    const doc = await Banner.create(payload);
    return res.status(201).json({ success: true, message: "Created", banner: doc.toObject() });
  } catch (e) {
    next(e);
  }
}

async function updateBanner(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");

    const doc = await Banner.findById(id);
    if (!doc) return err(res, 404, "Banner not found");

    const payload = normalizeLinkFields(req.body || {});
    Object.assign(doc, payload);
    applyLinkTypeDefaults(doc);

    const errors = validateLinkFields(doc);
    if (Object.keys(errors).length) return err(res, 422, "Validation failed", errors);

    await doc.save();
    return ok(res, { banner: doc.toObject() }, "Updated");
  } catch (e) {
    next(e);
  }
}

async function deleteBanner(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Banner.findByIdAndDelete(id);
    if (!doc) return err(res, 404, "Banner not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

async function sendBannerPushNotification(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");

    const banner = await Banner.findById(id).lean();
    if (!banner) return err(res, 404, "Banner not found");

    const body = req.body || {};
    const title = body.title || banner.title || "New banner";
    const messageBody = body.body || "Check out the latest banner";
    const tokensSet = new Set(Array.isArray(body.tokens) ? body.tokens.filter(Boolean) : []);

    if (Array.isArray(body.user_ids) && body.user_ids.length) {
      const validUserIds = body.user_ids.filter((u) => mongoose.Types.ObjectId.isValid(u));
      if (validUserIds.length) {
        const users = await User.find({ _id: { $in: validUserIds } }).select("fcm_token").lean();
        for (const user of users) {
          if (user.fcm_token) tokensSet.add(user.fcm_token);
        }
      }
    }

    if (Array.isArray(body.driver_ids) && body.driver_ids.length) {
      const validDriverIds = body.driver_ids.filter((d) => mongoose.Types.ObjectId.isValid(d));
      if (validDriverIds.length) {
        const drivers = await Driver.find({ _id: { $in: validDriverIds } })
          .select("user_id")
          .populate("user_id", "fcm_token")
          .lean();
        for (const driver of drivers) {
          if (driver.user_id && driver.user_id.fcm_token) {
            tokensSet.add(driver.user_id.fcm_token);
          }
        }
      }
    }

    const tokens = Array.from(tokensSet);
    if (!tokens.length) {
      return err(res, 422, "No push recipients found. Provide tokens/user_ids/driver_ids.");
    }

    const results = await Promise.all(tokens.map((token) => sendFcmNotification(token, title, messageBody)));
    const sent = results.filter(Boolean).length;
    const failed = tokens.length - sent;

    return ok(
      res,
      { banner_id: id, recipients: tokens.length, sent, failed },
      failed ? "Push sent with partial failures" : "Push sent"
    );
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listBanners,
  getBanner,
  createBanner,
  updateBanner,
  deleteBanner,
  sendBannerPushNotification,
};
