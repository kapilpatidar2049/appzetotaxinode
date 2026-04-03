const mongoose = require("mongoose");
const Airport = require("../models/Airport");
const ServiceLocation = require("../models/ServiceLocation");

function ok(res, data, message = "success") {
  return res.json({ success: true, message, data });
}

function err(res, status, message, errors) {
  return res.status(status).json({
    success: false,
    message,
    ...(errors ? { errors } : {})
  });
}

function parsePage(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

async function validateServiceLocation(serviceLocationId) {
  if (!serviceLocationId || !mongoose.Types.ObjectId.isValid(serviceLocationId)) return false;
  const exists = await ServiceLocation.findById(serviceLocationId).select("_id").lean();
  return Boolean(exists);
}

function parseCoordinates(value) {
  if (!value) return null;
  if (typeof value === "object") return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function listAirports(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const { service_location_id, active } = req.query;
    const filter = {};
    if (service_location_id && mongoose.Types.ObjectId.isValid(service_location_id)) {
      filter.service_location_id = service_location_id;
    }
    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;

    const [items, total] = await Promise.all([
      Airport.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("service_location_id", "name")
        .lean(),
      Airport.countDocuments(filter)
    ]);

    return ok(res, {
      results: items,
      paginator: {
        total,
        per_page: limit,
        current_page: page,
        last_page: Math.ceil(total / limit) || 1
      }
    });
  } catch (e) {
    next(e);
  }
}

async function getAirport(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Airport.findById(id)
      .populate("service_location_id", "name")
      .lean();
    if (!doc) return err(res, 404, "Airport not found");
    return ok(res, { airport: doc });
  } catch (e) {
    next(e);
  }
}

async function createAirport(req, res, next) {
  try {
    const body = req.body || {};
    const { name, service_location_id } = body;
    const errors = {};
    if (!name) errors.name = "name is required";
    if (!service_location_id) errors.service_location_id = "service_location_id is required";
    if (Object.keys(errors).length) return err(res, 422, "Validation failed", errors);

    const validServiceLocation = await validateServiceLocation(service_location_id);
    if (!validServiceLocation) {
      return err(res, 422, "Validation failed", {
        service_location_id: "Invalid service location"
      });
    }

    const doc = await Airport.create({
      name: String(name).trim(),
      service_location_id,
      coordinates: parseCoordinates(body.coordinates),
      active: body.active !== false
    });

    return res
      .status(201)
      .json({ success: true, message: "Created", airport: doc.toObject() });
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", {
        duplicate: "Airport already exists for this service location + name"
      });
    }
    next(e);
  }
}

async function updateAirport(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Airport.findById(id);
    if (!doc) return err(res, 404, "Airport not found");

    const body = req.body || {};
    if (body.name !== undefined) doc.name = String(body.name).trim();
    if (body.service_location_id !== undefined) {
      const validServiceLocation = await validateServiceLocation(body.service_location_id);
      if (!validServiceLocation) {
        return err(res, 422, "Validation failed", {
          service_location_id: "Invalid service location"
        });
      }
      doc.service_location_id = body.service_location_id;
    }
    if (body.coordinates !== undefined) {
      doc.coordinates = parseCoordinates(body.coordinates);
    }
    if (body.active !== undefined) doc.active = Boolean(body.active);

    await doc.save();
    return ok(res, { airport: doc.toObject() }, "Updated");
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", {
        duplicate: "Airport already exists for this service location + name"
      });
    }
    next(e);
  }
}

async function deleteAirport(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Airport.findByIdAndDelete(id);
    if (!doc) return err(res, 404, "Airport not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listAirports,
  getAirport,
  createAirport,
  updateAirport,
  deleteAirport
};

