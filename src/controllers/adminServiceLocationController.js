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

    const serviceLocationIds = items.map((i) => i._id);
    const zones = serviceLocationIds.length
      ? await Zone.find({ service_location_id: { $in: serviceLocationIds } })
          .select("_id name service_location_id")
          .sort({ name: 1 })
          .lean()
      : [];

    const zoneMap = new Map();
    for (const z of zones) {
      const k = String(z.service_location_id);
      if (!zoneMap.has(k)) zoneMap.set(k, []);
      zoneMap.get(k).push({ id: z._id, name: z.name });
    }

    const results = items.map((item) => ({
      ...item,
      zones: zoneMap.get(String(item._id)) || [],
    }));

    return ok(res, {
      results,
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

    const zones = await Zone.find({ service_location_id: id })
      .select("_id name")
      .sort({ name: 1 })
      .lean();

    return ok(res, {
      service_location: {
        ...doc,
        zones: zones.map((z) => ({ id: z._id, name: z.name })),
      },
    });
  } catch (e) {
    next(e);
  }
}

async function createServiceLocation(req, res, next) {
  try {
    const body = req.body || {};
    const name = body.service_location_name ?? body.name;
    const countryId = body.country ?? body.country_id;
    const currencyCode = body.currency ?? body.currency_code;
    const timezone = body.time_zone ?? body.timezone;

    if (!name) {
      return err(res, 422, "service_location_name is required");
    }
    if (!countryId || !mongoose.Types.ObjectId.isValid(countryId)) {
      return err(res, 422, "valid country is required");
    }
    if (!currencyCode) {
      return err(res, 422, "currency is required");
    }
    if (!timezone) {
      return err(res, 422, "time_zone is required");
    }
    const slug =
      body.slug ||
      String(name)
        .toLowerCase()
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "");

    const exists = await ServiceLocation.findOne({ slug }).lean();
    if (exists) {
      return err(res, 422, "Validation failed", { slug: "Slug already exists" });
    }

    const doc = await ServiceLocation.create({
      name: String(name).trim(),
      slug,
      country_id: countryId,
      timezone,
      currency_code: String(currencyCode).trim(),
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
    const name = body.service_location_name ?? body.name;
    const countryId = body.country ?? body.country_id;
    const currencyCode = body.currency ?? body.currency_code;
    const timezone = body.time_zone ?? body.timezone;

    if (name !== undefined) doc.name = String(name).trim();
    if (body.slug !== undefined) {
      const s = String(body.slug).trim().toLowerCase();
      const clash = await ServiceLocation.findOne({ slug: s, _id: { $ne: doc._id } }).lean();
      if (clash) {
        return err(res, 422, "Validation failed", { slug: "Slug already exists" });
      }
      doc.slug = s;
    }
    if (countryId !== undefined) {
      doc.country_id =
        countryId && mongoose.Types.ObjectId.isValid(countryId)
          ? countryId
          : null;
    }
    if (timezone !== undefined) doc.timezone = timezone;
    if (currencyCode !== undefined) doc.currency_code = String(currencyCode).trim();
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
