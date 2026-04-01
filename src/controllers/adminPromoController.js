const mongoose = require("mongoose");
const Promo = require("../models/Promo");

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

async function listPromos(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const active = req.query.active;
    const filter = {};
    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;

    const [items, total] = await Promise.all([
      Promo.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Promo.countDocuments(filter),
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

async function getPromo(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid id");
    }
    const doc = await Promo.findById(id).lean();
    if (!doc) return err(res, 404, "Promo not found");
    return ok(res, { promo: doc });
  } catch (e) {
    next(e);
  }
}

async function createPromo(req, res, next) {
  try {
    const body = req.body || {};
    if (!body.code) {
      return err(res, 422, "code is required");
    }
    const exists = await Promo.findOne({
      code: String(body.code).trim().toUpperCase(),
    }).lean();
    if (exists) {
      return err(res, 422, "Validation failed", { code: "Code already exists" });
    }

    const doc = await Promo.create({
      code: String(body.code).trim().toUpperCase(),
      title: body.title,
      description: body.description,
      amount: body.amount != null ? Number(body.amount) : undefined,
      percentage: body.percentage != null ? Number(body.percentage) : undefined,
      min_amount: body.min_amount != null ? Number(body.min_amount) : undefined,
      max_discount_amount:
        body.max_discount_amount != null ? Number(body.max_discount_amount) : undefined,
      total_usage_limit:
        body.total_usage_limit != null ? Number(body.total_usage_limit) : undefined,
      per_user_usage_limit:
        body.per_user_usage_limit != null ? Number(body.per_user_usage_limit) : undefined,
      start_date: body.start_date ? new Date(body.start_date) : undefined,
      expiry_date: body.expiry_date ? new Date(body.expiry_date) : undefined,
      active: body.active !== false,
    });

    return res.status(201).json({ success: true, message: "Created", promo: doc.toObject() });
  } catch (e) {
    next(e);
  }
}

async function updatePromo(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid id");
    }
    const doc = await Promo.findById(id);
    if (!doc) return err(res, 404, "Promo not found");

    const body = req.body || {};
    if (body.code !== undefined) {
      const c = String(body.code).trim().toUpperCase();
      const clash = await Promo.findOne({ code: c, _id: { $ne: doc._id } }).lean();
      if (clash) {
        return err(res, 422, "Validation failed", { code: "Code already exists" });
      }
      doc.code = c;
    }
    const fields = [
      "title",
      "description",
      "amount",
      "percentage",
      "min_amount",
      "max_discount_amount",
      "total_usage_limit",
      "per_user_usage_limit",
      "active",
    ];
    for (const f of fields) {
      if (body[f] !== undefined) {
        if (
          [
            "amount",
            "percentage",
            "min_amount",
            "max_discount_amount",
            "total_usage_limit",
            "per_user_usage_limit",
          ].includes(f)
        ) {
          doc[f] = body[f] == null ? undefined : Number(body[f]);
        } else if (f === "active") {
          doc[f] = Boolean(body[f]);
        } else {
          doc[f] = body[f];
        }
      }
    }
    if (body.start_date !== undefined) {
      doc.start_date = body.start_date ? new Date(body.start_date) : null;
    }
    if (body.expiry_date !== undefined) {
      doc.expiry_date = body.expiry_date ? new Date(body.expiry_date) : null;
    }

    await doc.save();
    return ok(res, { promo: doc.toObject() }, "Updated");
  } catch (e) {
    next(e);
  }
}

async function deletePromo(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid id");
    }
    const doc = await Promo.findByIdAndDelete(id);
    if (!doc) return err(res, 404, "Promo not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listPromos,
  getPromo,
  createPromo,
  updatePromo,
  deletePromo,
};
