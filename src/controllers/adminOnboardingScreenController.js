const mongoose = require("mongoose");
const OnboardingScreen = require("../models/OnboardingScreen");

const USER_TYPES = new Set(["user", "driver", "owner"]);

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

function normalizeUserType(raw) {
  const s = String(raw || "user").trim().toLowerCase();
  return USER_TYPES.has(s) ? s : null;
}

async function nextSnO() {
  const last = await OnboardingScreen.findOne().sort({ sn_o: -1 }).select("sn_o").lean();
  return last && last.sn_o != null ? Number(last.sn_o) + 1 : 1;
}

async function listOnboardingScreens(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const filter = {};
    const ut = normalizeUserType(req.query.user_type);
    if (req.query.user_type != null && String(req.query.user_type).trim() !== "") {
      if (!ut) return err(res, 400, "Invalid user_type", { user_type: "Must be user, driver, or owner" });
      filter.user_type = ut;
    }
    const active = req.query.active;
    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;
    const screenQ = req.query.screen;
    if (screenQ && String(screenQ).trim()) {
      filter.screen = String(screenQ).trim();
    }

    const [items, total] = await Promise.all([
      OnboardingScreen.find(filter).sort({ order: 1, sn_o: 1 }).skip(skip).limit(limit).lean(),
      OnboardingScreen.countDocuments(filter),
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

async function getOnboardingScreen(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await OnboardingScreen.findById(id).lean();
    if (!doc) return err(res, 404, "Onboarding screen not found");
    return ok(res, { onboarding_screen: doc });
  } catch (e) {
    next(e);
  }
}

async function createOnboardingScreen(req, res, next) {
  try {
    const body = req.body || {};
    const screen = body.screen != null ? String(body.screen).trim() : "";
    if (!screen) return err(res, 422, "Validation failed", { screen: "screen is required" });

    const userType = normalizeUserType(body.user_type);
    if (body.user_type != null && String(body.user_type).trim() !== "" && !userType) {
      return err(res, 422, "Validation failed", { user_type: "Must be user, driver, or owner" });
    }

    let sn_o;
    if (body.sn_o !== undefined && body.sn_o !== null && String(body.sn_o).trim() !== "") {
      sn_o = Number(body.sn_o);
      if (!Number.isFinite(sn_o) || sn_o < 0) {
        return err(res, 422, "Validation failed", { sn_o: "Must be a non-negative number" });
      }
      const taken = await OnboardingScreen.findOne({ sn_o }).lean();
      if (taken) return err(res, 422, "Validation failed", { sn_o: "sn_o already in use" });
    } else {
      sn_o = await nextSnO();
    }

    const orderRaw = body.order !== undefined ? Number(body.order) : NaN;
    const order = Number.isFinite(orderRaw) ? orderRaw : sn_o;

    const doc = await OnboardingScreen.create({
      sn_o,
      user_type: userType || "user",
      screen,
      order,
      title: body.title != null ? String(body.title) : "",
      onboarding_image: body.onboarding_image != null ? String(body.onboarding_image) : undefined,
      description: body.description != null ? String(body.description) : "",
      active: body.active === undefined ? true : Boolean(body.active),
      translation_dataset:
        body.translation_dataset != null ? String(body.translation_dataset) : "",
    });

    return res.status(201).json({
      success: true,
      message: "Created",
      data: { onboarding_screen: doc.toObject() },
    });
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", { sn_o: "Duplicate sn_o" });
    }
    next(e);
  }
}

async function updateOnboardingScreen(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");

    const doc = await OnboardingScreen.findById(id);
    if (!doc) return err(res, 404, "Onboarding screen not found");

    const body = req.body || {};

    if (body.screen !== undefined) {
      const screen = String(body.screen).trim();
      if (!screen) return err(res, 422, "Validation failed", { screen: "screen cannot be empty" });
      doc.screen = screen;
    }

    if (body.user_type !== undefined) {
      const ut = normalizeUserType(body.user_type);
      if (!ut) return err(res, 422, "Validation failed", { user_type: "Must be user, driver, or owner" });
      doc.user_type = ut;
    }

    if (body.sn_o !== undefined) {
      const sn_o = Number(body.sn_o);
      if (!Number.isFinite(sn_o) || sn_o < 0) {
        return err(res, 422, "Validation failed", { sn_o: "Must be a non-negative number" });
      }
      const taken = await OnboardingScreen.findOne({ sn_o, _id: { $ne: doc._id } }).lean();
      if (taken) return err(res, 422, "Validation failed", { sn_o: "sn_o already in use" });
      doc.sn_o = sn_o;
    }

    if (body.order !== undefined) {
      const order = Number(body.order);
      doc.order = Number.isFinite(order) ? order : doc.order;
    }

    if (body.title !== undefined) doc.title = String(body.title);
    if (body.description !== undefined) doc.description = String(body.description);
    if (body.onboarding_image !== undefined) doc.onboarding_image = String(body.onboarding_image);
    if (body.active !== undefined) doc.active = Boolean(body.active);
    if (body.translation_dataset !== undefined) doc.translation_dataset = String(body.translation_dataset);

    await doc.save();
    return ok(res, { onboarding_screen: doc.toObject() }, "Updated");
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", { sn_o: "Duplicate sn_o" });
    }
    next(e);
  }
}

async function deleteOnboardingScreen(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await OnboardingScreen.findByIdAndDelete(id);
    if (!doc) return err(res, 404, "Onboarding screen not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listOnboardingScreens,
  getOnboardingScreen,
  createOnboardingScreen,
  updateOnboardingScreen,
  deleteOnboardingScreen,
};
