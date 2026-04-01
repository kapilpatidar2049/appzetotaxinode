const mongoose = require("mongoose");
const VehicleType = require("../models/VehicleType");
const SubVehicleType = require("../models/SubVehicleType");

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

async function listVehicleTypes(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const active = req.query.active;
    const filter = {};
    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;

    const [items, total] = await Promise.all([
      VehicleType.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      VehicleType.countDocuments(filter),
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

async function getVehicleType(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await VehicleType.findById(id).lean();
    if (!doc) return err(res, 404, "Vehicle type not found");
    return ok(res, { vehicle_type: doc });
  } catch (e) {
    next(e);
  }
}

async function createVehicleType(req, res, next) {
  try {
    const body = req.body || {};
    if (!body.name) return err(res, 422, "name is required");

    const doc = await VehicleType.create({
      name: String(body.name).trim(),
      short_name: body.short_name,
      icon: body.icon,
      image: body.image,
      base_fare: body.base_fare != null ? Number(body.base_fare) : undefined,
      per_km_rate: body.per_km_rate != null ? Number(body.per_km_rate) : undefined,
      per_min_rate: body.per_min_rate != null ? Number(body.per_min_rate) : undefined,
      active: body.active !== false,
      order: body.order != null ? Number(body.order) : 0,
    });

    return res
      .status(201)
      .json({ success: true, message: "Created", vehicle_type: doc.toObject() });
  } catch (e) {
    next(e);
  }
}

async function updateVehicleType(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");

    const doc = await VehicleType.findById(id);
    if (!doc) return err(res, 404, "Vehicle type not found");

    const body = req.body || {};
    if (body.name !== undefined) doc.name = String(body.name).trim();
    if (body.short_name !== undefined) doc.short_name = body.short_name;
    if (body.icon !== undefined) doc.icon = body.icon;
    if (body.image !== undefined) doc.image = body.image;
    if (body.base_fare !== undefined) {
      doc.base_fare = body.base_fare == null ? undefined : Number(body.base_fare);
    }
    if (body.per_km_rate !== undefined) {
      doc.per_km_rate = body.per_km_rate == null ? undefined : Number(body.per_km_rate);
    }
    if (body.per_min_rate !== undefined) {
      doc.per_min_rate = body.per_min_rate == null ? undefined : Number(body.per_min_rate);
    }
    if (body.order !== undefined) {
      doc.order = body.order == null ? 0 : Number(body.order);
    }
    if (body.active !== undefined) doc.active = Boolean(body.active);

    await doc.save();
    return ok(res, { vehicle_type: doc.toObject() }, "Updated");
  } catch (e) {
    next(e);
  }
}

async function deleteVehicleType(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");

    const subCount = await SubVehicleType.countDocuments({ vehicle_type_id: id });
    if (subCount > 0) {
      return err(res, 422, "Cannot delete vehicle type with existing sub types");
    }

    const doc = await VehicleType.findByIdAndDelete(id);
    if (!doc) return err(res, 404, "Vehicle type not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

async function listSubVehicleTypes(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const { vehicle_type_id, active } = req.query;
    const filter = {};
    if (vehicle_type_id && mongoose.Types.ObjectId.isValid(vehicle_type_id)) {
      filter.vehicle_type_id = vehicle_type_id;
    }
    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;

    const [items, total] = await Promise.all([
      SubVehicleType.find(filter)
        .sort({ order: 1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("vehicle_type_id", "name")
        .lean(),
      SubVehicleType.countDocuments(filter),
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

async function getSubVehicleType(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await SubVehicleType.findById(id)
      .populate("vehicle_type_id", "name")
      .lean();
    if (!doc) return err(res, 404, "Sub vehicle type not found");
    return ok(res, { sub_vehicle_type: doc });
  } catch (e) {
    next(e);
  }
}

async function createSubVehicleType(req, res, next) {
  try {
    const body = req.body || {};
    if (!body.name) return err(res, 422, "name is required");
    if (!body.vehicle_type_id) return err(res, 422, "vehicle_type_id is required");
    if (!mongoose.Types.ObjectId.isValid(body.vehicle_type_id)) {
      return err(res, 422, "Invalid vehicle_type_id");
    }

    const vt = await VehicleType.findById(body.vehicle_type_id).select("_id").lean();
    if (!vt) return err(res, 422, "Vehicle type not found");

    const doc = await SubVehicleType.create({
      vehicle_type_id: body.vehicle_type_id,
      name: String(body.name).trim(),
      icon: body.icon,
      image: body.image,
      capacity: body.capacity != null ? Number(body.capacity) : undefined,
      active: body.active !== false,
      order: body.order != null ? Number(body.order) : 0,
    });

    return res
      .status(201)
      .json({ success: true, message: "Created", sub_vehicle_type: doc.toObject() });
  } catch (e) {
    next(e);
  }
}

async function updateSubVehicleType(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");

    const doc = await SubVehicleType.findById(id);
    if (!doc) return err(res, 404, "Sub vehicle type not found");

    const body = req.body || {};
    if (body.name !== undefined) doc.name = String(body.name).trim();
    if (body.icon !== undefined) doc.icon = body.icon;
    if (body.image !== undefined) doc.image = body.image;
    if (body.capacity !== undefined) {
      doc.capacity = body.capacity == null ? undefined : Number(body.capacity);
    }
    if (body.order !== undefined) {
      doc.order = body.order == null ? 0 : Number(body.order);
    }
    if (body.active !== undefined) doc.active = Boolean(body.active);

    if (body.vehicle_type_id !== undefined) {
      if (!mongoose.Types.ObjectId.isValid(body.vehicle_type_id)) {
        return err(res, 422, "Invalid vehicle_type_id");
      }
      const vt = await VehicleType.findById(body.vehicle_type_id).select("_id").lean();
      if (!vt) return err(res, 422, "Vehicle type not found");
      doc.vehicle_type_id = body.vehicle_type_id;
    }

    await doc.save();
    return ok(res, { sub_vehicle_type: doc.toObject() }, "Updated");
  } catch (e) {
    next(e);
  }
}

async function deleteSubVehicleType(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");

    const doc = await SubVehicleType.findByIdAndDelete(id);
    if (!doc) return err(res, 404, "Sub vehicle type not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listVehicleTypes,
  getVehicleType,
  createVehicleType,
  updateVehicleType,
  deleteVehicleType,
  listSubVehicleTypes,
  getSubVehicleType,
  createSubVehicleType,
  updateSubVehicleType,
  deleteSubVehicleType,
};

