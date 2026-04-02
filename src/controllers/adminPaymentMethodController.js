const mongoose = require("mongoose");
const PaymentMethodConfig = require("../models/PaymentMethodConfig");

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

function normalizeFields(raw) {
  if (raw == null) return [];
  if (!Array.isArray(raw)) return null;
  return raw.map((f) => (f && typeof f === "object" ? { ...f } : {}));
}

async function list(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const filter = {};
    if (req.query.active === "1" || req.query.active === "true") filter.active = true;
    if (req.query.active === "0" || req.query.active === "false") filter.active = false;

    const [items, total] = await Promise.all([
      PaymentMethodConfig.find(filter).sort({ sort_order: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      PaymentMethodConfig.countDocuments(filter),
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

async function getOne(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await PaymentMethodConfig.findById(id).lean();
    if (!doc) return err(res, 404, "Payment method not found");
    return ok(res, { payment_method: doc });
  } catch (e) {
    next(e);
  }
}

async function create(req, res, next) {
  try {
    const body = req.body || {};
    const method = body.method != null ? String(body.method).trim() : "";
    if (!method) return err(res, 422, "method is required");

    const fields = normalizeFields(body.fields);
    if (fields === null) return err(res, 422, "fields must be an array");

    const dup = await PaymentMethodConfig.findOne({
      method: new RegExp(`^${method.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
    }).lean();
    if (dup) return err(res, 422, "Validation failed", { method: "method already exists" });

    const doc = await PaymentMethodConfig.create({
      method,
      fields,
      active: body.active !== false,
      sort_order: body.sort_order != null ? Number(body.sort_order) : 0,
    });

    return res.status(201).json({
      success: true,
      message: "Created",
      data: { payment_method: doc.toObject() },
    });
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", { method: "method already exists" });
    }
    next(e);
  }
}

async function update(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await PaymentMethodConfig.findById(id);
    if (!doc) return err(res, 404, "Payment method not found");

    const body = req.body || {};
    if (body.method !== undefined) {
      const method = String(body.method).trim();
      if (!method) return err(res, 422, "method cannot be empty");
      const clash = await PaymentMethodConfig.findOne({
        _id: { $ne: doc._id },
        method: new RegExp(`^${method.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i"),
      }).lean();
      if (clash) return err(res, 422, "Validation failed", { method: "method already exists" });
      doc.method = method;
    }
    if (body.fields !== undefined) {
      const fields = normalizeFields(body.fields);
      if (fields === null) return err(res, 422, "fields must be an array");
      doc.fields = fields;
    }
    if (body.active !== undefined) doc.active = Boolean(body.active);
    if (body.sort_order !== undefined) doc.sort_order = Number(body.sort_order);

    await doc.save();
    return ok(res, { payment_method: doc.toObject() }, "Updated");
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", { method: "method already exists" });
    }
    next(e);
  }
}

async function remove(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await PaymentMethodConfig.findByIdAndDelete(id).lean();
    if (!doc) return err(res, 404, "Payment method not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

module.exports = {
  list,
  getOne,
  create,
  update,
  remove,
};
