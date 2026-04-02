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

    const serviceLocationId =
      body.service_location_id && mongoose.Types.ObjectId.isValid(body.service_location_id)
        ? body.service_location_id
        : undefined;
    const userId =
      body.user_id && mongoose.Types.ObjectId.isValid(body.user_id) ? body.user_id : undefined;
    const minAmountRaw =
      body.minimum_trip_amount !== undefined ? body.minimum_trip_amount : body.min_amount;
    const maxDiscountRaw =
      body.maximum_discount_amount !== undefined
        ? body.maximum_discount_amount
        : body.max_discount_amount;
    const perUserRaw =
      body.uses_per_user !== undefined ? body.uses_per_user : body.per_user_usage_limit;
    const startDateRaw = body.from !== undefined ? body.from : body.start_date;
    const expiryDateRaw = body.to !== undefined ? body.to : body.expiry_date;
    const percentageRaw =
      body.discount_percentage !== undefined ? body.discount_percentage : body.percentage;

    const doc = await Promo.create({
      code: String(body.code).trim().toUpperCase(),
      title: body.title,
      description: body.description,
      amount: body.amount != null ? Number(body.amount) : undefined,
      percentage: percentageRaw != null ? Number(percentageRaw) : undefined,
      discount_percentage: percentageRaw != null ? Number(percentageRaw) : undefined,
      min_amount: minAmountRaw != null && minAmountRaw !== "" ? Number(minAmountRaw) : undefined,
      minimum_trip_amount:
        minAmountRaw != null && minAmountRaw !== "" ? Number(minAmountRaw) : undefined,
      max_discount_amount: maxDiscountRaw != null ? Number(maxDiscountRaw) : undefined,
      maximum_discount_amount: maxDiscountRaw != null ? Number(maxDiscountRaw) : undefined,
      cumulative_max_discount_amount:
        body.cumulative_max_discount_amount != null
          ? Number(body.cumulative_max_discount_amount)
          : undefined,
      total_usage_limit:
        body.total_usage_limit != null ? Number(body.total_usage_limit) : undefined,
      per_user_usage_limit: perUserRaw != null ? Number(perUserRaw) : undefined,
      uses_per_user: perUserRaw != null ? Number(perUserRaw) : undefined,
      service_location_id: serviceLocationId,
      transport_type: body.transport_type,
      user_id: userId,
      user_sepecified: body.user_sepecified != null ? Boolean(body.user_sepecified) : undefined,
      start_date: startDateRaw ? new Date(startDateRaw) : undefined,
      from: startDateRaw ? new Date(startDateRaw) : undefined,
      expiry_date: expiryDateRaw ? new Date(expiryDateRaw) : undefined,
      to: expiryDateRaw ? new Date(expiryDateRaw) : undefined,
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
      "discount_percentage",
      "min_amount",
      "minimum_trip_amount",
      "max_discount_amount",
      "maximum_discount_amount",
      "cumulative_max_discount_amount",
      "total_usage_limit",
      "per_user_usage_limit",
      "uses_per_user",
      "transport_type",
      "user_sepecified",
      "active",
    ];
    for (const f of fields) {
      if (body[f] !== undefined) {
        if (
          [
            "amount",
            "percentage",
            "discount_percentage",
            "min_amount",
            "minimum_trip_amount",
            "max_discount_amount",
            "maximum_discount_amount",
            "cumulative_max_discount_amount",
            "total_usage_limit",
            "per_user_usage_limit",
            "uses_per_user",
          ].includes(f)
        ) {
          doc[f] = body[f] == null || body[f] === "" ? undefined : Number(body[f]);
        } else if (["user_sepecified", "active"].includes(f)) {
          doc[f] = Boolean(body[f]);
        } else {
          doc[f] = body[f];
        }
      }
    }

    // Accept frontend aliases and keep both canonical + alias fields in sync.
    if (body.discount_percentage !== undefined || body.percentage !== undefined) {
      const value = body.discount_percentage ?? body.percentage;
      const n = value == null || value === "" ? undefined : Number(value);
      doc.percentage = n;
      doc.discount_percentage = n;
    }

    if (body.minimum_trip_amount !== undefined || body.min_amount !== undefined) {
      const value = body.minimum_trip_amount ?? body.min_amount;
      const n = value == null || value === "" ? undefined : Number(value);
      doc.min_amount = n;
      doc.minimum_trip_amount = n;
    }

    if (body.maximum_discount_amount !== undefined || body.max_discount_amount !== undefined) {
      const value = body.maximum_discount_amount ?? body.max_discount_amount;
      const n = value == null || value === "" ? undefined : Number(value);
      doc.max_discount_amount = n;
      doc.maximum_discount_amount = n;
    }

    if (body.uses_per_user !== undefined || body.per_user_usage_limit !== undefined) {
      const value = body.uses_per_user ?? body.per_user_usage_limit;
      const n = value == null || value === "" ? undefined : Number(value);
      doc.per_user_usage_limit = n;
      doc.uses_per_user = n;
    }

    if (body.service_location_id !== undefined) {
      doc.service_location_id =
        body.service_location_id && mongoose.Types.ObjectId.isValid(body.service_location_id)
          ? body.service_location_id
          : undefined;
    }
    if (body.user_id !== undefined) {
      doc.user_id =
        body.user_id && mongoose.Types.ObjectId.isValid(body.user_id) ? body.user_id : undefined;
    }

    if (body.from !== undefined || body.start_date !== undefined) {
      const value = body.from ?? body.start_date;
      const d = value ? new Date(value) : null;
      doc.start_date = d;
      doc.from = d;
    }
    if (body.to !== undefined || body.expiry_date !== undefined) {
      const value = body.to ?? body.expiry_date;
      const d = value ? new Date(value) : null;
      doc.expiry_date = d;
      doc.to = d;
    }

    if (body.start_date !== undefined) {
      doc.start_date = body.start_date ? new Date(body.start_date) : null;
      if (body.from === undefined) doc.from = doc.start_date;
    }
    if (body.expiry_date !== undefined) {
      doc.expiry_date = body.expiry_date ? new Date(body.expiry_date) : null;
      if (body.to === undefined) doc.to = doc.expiry_date;
    }
    if (body.from !== undefined) {
      doc.from = body.from ? new Date(body.from) : null;
      if (body.start_date === undefined) doc.start_date = doc.from;
    }
    if (body.to !== undefined) {
      doc.to = body.to ? new Date(body.to) : null;
      if (body.expiry_date === undefined) doc.expiry_date = doc.to;
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
