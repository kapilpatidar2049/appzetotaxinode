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
    if (!body.name) return err(res, 422, "name is required");
    if (!body.service_location_id) return err(res, 422, "service_location_id is required");

    const validServiceLocation = await validateServiceLocation(body.service_location_id);
    if (!validServiceLocation) {
      return err(res, 422, "Validation failed", { service_location_id: "Invalid service location" });
    }

    const payload = {
      name: String(body.name).trim(),
      service_location_id: body.service_location_id,
      code: body.code ? String(body.code).trim().toUpperCase() : undefined,
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
    if (body.code !== undefined) doc.code = body.code ? String(body.code).trim().toUpperCase() : null;
    if (body.active !== undefined) doc.active = Boolean(body.active);

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
