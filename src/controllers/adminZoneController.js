const mongoose = require("mongoose");
const Zone = require("../models/Zone");
const ServiceLocation = require("../models/ServiceLocation");

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

async function validateServiceLocation(serviceLocationId) {
  if (!serviceLocationId || !mongoose.Types.ObjectId.isValid(serviceLocationId)) {
    return false;
  }
  const exists = await ServiceLocation.findById(serviceLocationId).select("_id").lean();
  return Boolean(exists);
}

async function listZones(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const active = req.query.active;
    const { service_location_id } = req.query;
    const filter = {};

    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;
    if (service_location_id && mongoose.Types.ObjectId.isValid(service_location_id)) {
      filter.service_location_id = service_location_id;
    }

    const [items, total] = await Promise.all([
      Zone.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("service_location_id", "name slug")
        .lean(),
      Zone.countDocuments(filter),
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

async function getZone(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");

    const doc = await Zone.findById(id).populate("service_location_id", "name slug").lean();
    if (!doc) return err(res, 404, "Zone not found");
    return ok(res, { zone: doc });
  } catch (e) {
    next(e);
  }
}

async function createZone(req, res, next) {
  try {
    const body = req.body || {};
    const name = body.name || body.languageFields?.en;
    if (!name) return err(res, 422, "name is required (or languageFields.en)");
    if (!body.service_location_id) return err(res, 422, "service_location_id is required");

    const validServiceLocation = await validateServiceLocation(body.service_location_id);
    if (!validServiceLocation) {
      return err(res, 422, "Validation failed", { service_location_id: "Invalid service location" });
    }

    const payload = {
      name: String(name).trim(),
      service_location_id: body.service_location_id,
      code: body.code ? String(body.code).trim().toUpperCase() : undefined,
      coordinates: body.coordinates ?? undefined,
      languageFields: body.languageFields ?? undefined,
      distance_price_percentage:
        body.distance_price_percentage != null ? Number(body.distance_price_percentage) : undefined,
      maximum_distance: body.maximum_distance != null ? Number(body.maximum_distance) : undefined,
      maximum_outstation_distance:
        body.maximum_outstation_distance != null
          ? Number(body.maximum_outstation_distance)
          : undefined,
      peak_zone_duration: body.peak_zone_duration != null ? Number(body.peak_zone_duration) : undefined,
      peak_zone_history_duration:
        body.peak_zone_history_duration != null ? Number(body.peak_zone_history_duration) : undefined,
      peak_zone_radius: body.peak_zone_radius != null ? Number(body.peak_zone_radius) : undefined,
      peak_zone_ride_count:
        body.peak_zone_ride_count != null ? Number(body.peak_zone_ride_count) : undefined,
      unit: body.unit != null ? String(body.unit) : undefined,
      active: body.active !== false,
    };

    const doc = await Zone.create(payload);
    return res.status(201).json({ success: true, message: "Created", zone: doc.toObject() });
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", {
        duplicate: "Zone name/code already exists for this service location",
      });
    }
    next(e);
  }
}

async function updateZone(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");

    const doc = await Zone.findById(id);
    if (!doc) return err(res, 404, "Zone not found");

    const body = req.body || {};
    if (body.name !== undefined) doc.name = String(body.name).trim();
    if (body.languageFields?.en && body.name === undefined) {
      doc.name = String(body.languageFields.en).trim();
    }
    if (body.code !== undefined) doc.code = body.code ? String(body.code).trim().toUpperCase() : null;
    if (body.active !== undefined) doc.active = Boolean(body.active);
    if (body.coordinates !== undefined) doc.coordinates = body.coordinates;
    if (body.languageFields !== undefined) doc.languageFields = body.languageFields;
    if (body.distance_price_percentage !== undefined) {
      doc.distance_price_percentage = Number(body.distance_price_percentage);
    }
    if (body.maximum_distance !== undefined) doc.maximum_distance = Number(body.maximum_distance);
    if (body.maximum_outstation_distance !== undefined) {
      doc.maximum_outstation_distance = Number(body.maximum_outstation_distance);
    }
    if (body.peak_zone_duration !== undefined) doc.peak_zone_duration = Number(body.peak_zone_duration);
    if (body.peak_zone_history_duration !== undefined) {
      doc.peak_zone_history_duration = Number(body.peak_zone_history_duration);
    }
    if (body.peak_zone_radius !== undefined) doc.peak_zone_radius = Number(body.peak_zone_radius);
    if (body.peak_zone_ride_count !== undefined) doc.peak_zone_ride_count = Number(body.peak_zone_ride_count);
    if (body.unit !== undefined) doc.unit = body.unit != null ? String(body.unit) : null;

    if (body.service_location_id !== undefined) {
      const validServiceLocation = await validateServiceLocation(body.service_location_id);
      if (!validServiceLocation) {
        return err(res, 422, "Validation failed", {
          service_location_id: "Invalid service location",
        });
      }
      doc.service_location_id = body.service_location_id;
    }

    await doc.save();
    return ok(res, { zone: doc.toObject() }, "Updated");
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", {
        duplicate: "Zone name/code already exists for this service location",
      });
    }
    next(e);
  }
}

async function deleteZone(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");

    const doc = await Zone.findByIdAndDelete(id);
    if (!doc) return err(res, 404, "Zone not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listZones,
  getZone,
  createZone,
  updateZone,
  deleteZone,
};
