const mongoose = require("mongoose");
const Driver = require("../models/Driver");
const DriverSubscription = require("../models/DriverSubscription");
const DriverSubscriptionPlan = require("../models/DriverSubscriptionPlan");

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

async function listSubscriptions(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const { driver_id, active } = req.query;
    const filter = {};
    if (driver_id && mongoose.Types.ObjectId.isValid(driver_id)) {
      filter.driver_id = driver_id;
    }
    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;

    const [items, total] = await Promise.all([
      DriverSubscription.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("driver_id", "name mobile email owner_id")
        .lean(),
      DriverSubscription.countDocuments(filter),
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

async function getSubscription(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await DriverSubscription.findById(id)
      .populate("driver_id", "name mobile email owner_id")
      .lean();
    if (!doc) return err(res, 404, "Driver subscription not found");
    return ok(res, { driver_subscription: doc });
  } catch (e) {
    next(e);
  }
}

async function createSubscription(req, res, next) {
  try {
    const body = req.body || {};
    if (!body.driver_id || !mongoose.Types.ObjectId.isValid(body.driver_id)) {
      return err(res, 422, "valid driver_id is required");
    }
    const driver = await Driver.findById(body.driver_id).select("_id").lean();
    if (!driver) return err(res, 422, "Driver not found");

    const doc = await DriverSubscription.create({
      driver_id: body.driver_id,
      subscription_detail_id:
        body.subscription_detail_id && mongoose.Types.ObjectId.isValid(body.subscription_detail_id)
          ? body.subscription_detail_id
          : undefined,
      active: body.active !== false,
      starts_at: body.starts_at || undefined,
      ends_at: body.ends_at || undefined,
      amount: body.amount != null ? Number(body.amount) : undefined,
      currency: body.currency || undefined,
    });

    return res
      .status(201)
      .json({ success: true, message: "Created", driver_subscription: doc.toObject() });
  } catch (e) {
    next(e);
  }
}

async function updateSubscription(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await DriverSubscription.findById(id);
    if (!doc) return err(res, 404, "Driver subscription not found");

    const body = req.body || {};
    if (body.driver_id !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(body.driver_id)) {
        return err(res, 422, "Invalid driver_id");
      }
      const driver = await Driver.findById(body.driver_id).select("_id").lean();
      if (!driver) return err(res, 422, "Driver not found");
      doc.driver_id = body.driver_id;
    }
    if (body.subscription_detail_id !== undefined) {
      doc.subscription_detail_id =
        body.subscription_detail_id && mongoose.Types.ObjectId.isValid(body.subscription_detail_id)
          ? body.subscription_detail_id
          : null;
    }
    if (body.active !== undefined) doc.active = Boolean(body.active);
    if (body.starts_at !== undefined) doc.starts_at = body.starts_at || null;
    if (body.ends_at !== undefined) doc.ends_at = body.ends_at || null;
    if (body.amount !== undefined) doc.amount = body.amount == null ? undefined : Number(body.amount);
    if (body.currency !== undefined) doc.currency = body.currency || null;

    await doc.save();
    return ok(res, { driver_subscription: doc.toObject() }, "Updated");
  } catch (e) {
    next(e);
  }
}

async function deleteSubscription(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await DriverSubscription.findByIdAndDelete(id);
    if (!doc) return err(res, 404, "Driver subscription not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

async function listPlans(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const { active, transport_type, vehicle_type_id } = req.query;
    const filter = {};
    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;
    if (transport_type) filter.transport_type = String(transport_type).toLowerCase();
    if (vehicle_type_id) filter.vehicle_type_id = String(vehicle_type_id);

    const [items, total] = await Promise.all([
      DriverSubscriptionPlan.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      DriverSubscriptionPlan.countDocuments(filter),
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

async function getPlan(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await DriverSubscriptionPlan.findById(id).lean();
    if (!doc) return err(res, 404, "Driver subscription plan not found");
    return ok(res, { driver_subscription_plan: doc });
  } catch (e) {
    next(e);
  }
}

async function createPlan(req, res, next) {
  try {
    const body = req.body || {};
    const transportType = String(body.transport_type || "").toLowerCase();
    if (!body.name) return err(res, 422, "name is required");
    if (!transportType) return err(res, 422, "transport_type is required");
    if (!["taxi", "delivery"].includes(transportType)) {
      return err(res, 422, "transport_type must be taxi or delivery");
    }
    if (!body.vehicle_type_id) return err(res, 422, "vehicle_type_id is required");
    if (body.subscription_duration == null) return err(res, 422, "subscription_duration is required");
    if (body.amount == null) return err(res, 422, "amount is required");

    const doc = await DriverSubscriptionPlan.create({
      name: String(body.name).trim(),
      description: body.description != null ? String(body.description).trim() : "",
      transport_type: transportType,
      vehicle_type_id: String(body.vehicle_type_id),
      subscription_duration: Number(body.subscription_duration),
      amount: Number(body.amount),
      active: body.active !== false,
    });

    return res
      .status(201)
      .json({ success: true, message: "Created", driver_subscription_plan: doc.toObject() });
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", {
        duplicate:
          "Plan already exists for this name + transport_type + vehicle_type_id + subscription_duration",
      });
    }
    next(e);
  }
}

async function updatePlan(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await DriverSubscriptionPlan.findById(id);
    if (!doc) return err(res, 404, "Driver subscription plan not found");

    const body = req.body || {};
    if (body.name !== undefined) doc.name = String(body.name).trim();
    if (body.description !== undefined) doc.description = String(body.description || "");
    if (body.transport_type !== undefined) {
      const transportType = String(body.transport_type).toLowerCase();
      if (!["taxi", "delivery"].includes(transportType)) {
        return err(res, 422, "transport_type must be taxi or delivery");
      }
      doc.transport_type = transportType;
    }
    if (body.vehicle_type_id !== undefined) doc.vehicle_type_id = String(body.vehicle_type_id);
    if (body.subscription_duration !== undefined) {
      doc.subscription_duration = Number(body.subscription_duration);
    }
    if (body.amount !== undefined) doc.amount = Number(body.amount);
    if (body.active !== undefined) doc.active = Boolean(body.active);

    await doc.save();
    return ok(res, { driver_subscription_plan: doc.toObject() }, "Updated");
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", {
        duplicate:
          "Plan already exists for this name + transport_type + vehicle_type_id + subscription_duration",
      });
    }
    next(e);
  }
}

async function deletePlan(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await DriverSubscriptionPlan.findByIdAndDelete(id);
    if (!doc) return err(res, 404, "Driver subscription plan not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listSubscriptions,
  getSubscription,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  listPlans,
  getPlan,
  createPlan,
  updatePlan,
  deletePlan,
};
