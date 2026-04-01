const mongoose = require("mongoose");
const ServiceLocation = require("../models/ServiceLocation");
const Zone = require("../models/Zone");

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

async function listServiceLocations(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const active = req.query.active;
    const filter = {};
    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;

    const [items, total] = await Promise.all([
      ServiceLocation.find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(limit)
        .populate("country_id", "name code")
        .lean(),
      ServiceLocation.countDocuments(filter),
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

async function getServiceLocation(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid id");
    }
    const doc = await ServiceLocation.findById(id)
      .populate("country_id", "name code dial_code")
      .lean();
    if (!doc) return err(res, 404, "Service location not found");
    return ok(res, { service_location: doc });
  } catch (e) {
    next(e);
  }
}

async function createServiceLocation(req, res, next) {
  try {
    const body = req.body || {};
    if (!body.name) {
      return err(res, 422, "name is required");
    }
    const slug =
      body.slug ||
      String(body.name)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    const exists = await ServiceLocation.findOne({ slug }).lean();
    if (exists) {
      return err(res, 422, "Validation failed", { slug: "Slug already exists" });
    }

    const doc = await ServiceLocation.create({
      name: String(body.name).trim(),
      slug,
      country_id:
        body.country_id && mongoose.Types.ObjectId.isValid(body.country_id)
          ? body.country_id
          : undefined,
      timezone: body.timezone,
      currency_code: body.currency_code,
      active: body.active !== false,
    });

    return res
      .status(201)
      .json({ success: true, message: "Created", service_location: doc.toObject() });
  } catch (e) {
    next(e);
  }
}

async function updateServiceLocation(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid id");
    }
    const doc = await ServiceLocation.findById(id);
    if (!doc) return err(res, 404, "Service location not found");

    const body = req.body || {};
    if (body.name !== undefined) doc.name = String(body.name).trim();
    if (body.slug !== undefined) {
      const s = String(body.slug).trim().toLowerCase();
      const clash = await ServiceLocation.findOne({ slug: s, _id: { $ne: doc._id } }).lean();
      if (clash) {
        return err(res, 422, "Validation failed", { slug: "Slug already exists" });
      }
      doc.slug = s;
    }
    if (body.country_id !== undefined) {
      doc.country_id =
        body.country_id && mongoose.Types.ObjectId.isValid(body.country_id)
          ? body.country_id
          : null;
    }
    if (body.timezone !== undefined) doc.timezone = body.timezone;
    if (body.currency_code !== undefined) doc.currency_code = body.currency_code;
    if (body.active !== undefined) doc.active = Boolean(body.active);

    await doc.save();
    return ok(res, { service_location: doc.toObject() }, "Updated");
  } catch (e) {
    next(e);
  }
}

async function deleteServiceLocation(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid id");
    }
    const zoneCount = await Zone.countDocuments({ service_location_id: id });
    if (zoneCount > 0) {
      return err(res, 422, "Cannot delete service location with existing zones");
    }

    const doc = await ServiceLocation.findByIdAndDelete(id);
    if (!doc) return err(res, 404, "Service location not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listServiceLocations,
  getServiceLocation,
  createServiceLocation,
  updateServiceLocation,
  deleteServiceLocation,
};
