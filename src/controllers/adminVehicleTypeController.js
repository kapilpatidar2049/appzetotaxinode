const mongoose = require("mongoose");
const VehicleType = require("../models/VehicleType");
const SubVehicleType = require("../models/SubVehicleType");
const RentalPackage = require("../models/RentalPackage");
const SetPrice = require("../models/SetPrice");
const RentalPackagePrice = require("../models/RentalPackagePrice");

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

function toNumber(v) {
  return v == null || v === "" ? undefined : Number(v);
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

    const transportType = body.transport_type ? String(body.transport_type).toLowerCase() : undefined;
    if (transportType && !["taxi", "delivery"].includes(transportType)) {
      return err(res, 422, "transport_type must be taxi or delivery");
    }

    const supportedVehicles = Array.isArray(body.supported_vehicles)
      ? body.supported_vehicles
      : body["supported_vehicles[]"] !== undefined
      ? Array.isArray(body["supported_vehicles[]"])
        ? body["supported_vehicles[]"]
        : [body["supported_vehicles[]"]]
      : undefined;

    const doc = await VehicleType.create({
      name: String(body.name).trim(),
      short_name: body.short_name,
      short_description: body.short_description,
      description: body.description,
      icon: body.icon,
      image: body.image,
      icon_types_for: body.icon_types_for,
      transport_type: transportType,
      size: body.size,
      trip_dispatch_type: body.trip_dispatch_type,
      maximum_weight_can_carry:
        body.maximum_weight_can_carry != null ? Number(body.maximum_weight_can_carry) : undefined,
      supported_vehicles: supportedVehicles,
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
    if (body.short_description !== undefined) doc.short_description = body.short_description;
    if (body.description !== undefined) doc.description = body.description;
    if (body.icon !== undefined) doc.icon = body.icon;
    if (body.image !== undefined) doc.image = body.image;
    if (body.icon_types_for !== undefined) doc.icon_types_for = body.icon_types_for;
    if (body.transport_type !== undefined) {
      const transportType = body.transport_type ? String(body.transport_type).toLowerCase() : "";
      if (transportType && !["taxi", "delivery"].includes(transportType)) {
        return err(res, 422, "transport_type must be taxi or delivery");
      }
      doc.transport_type = transportType || null;
    }
    if (body.size !== undefined) doc.size = body.size;
    if (body.trip_dispatch_type !== undefined) doc.trip_dispatch_type = body.trip_dispatch_type;
    if (body.maximum_weight_can_carry !== undefined) {
      doc.maximum_weight_can_carry =
        body.maximum_weight_can_carry == null ? undefined : Number(body.maximum_weight_can_carry);
    }
    if (body.supported_vehicles !== undefined || body["supported_vehicles[]"] !== undefined) {
      const supportedVehicles = Array.isArray(body.supported_vehicles)
        ? body.supported_vehicles
        : Array.isArray(body["supported_vehicles[]"])
        ? body["supported_vehicles[]"]
        : body["supported_vehicles[]"] != null
        ? [body["supported_vehicles[]"]]
        : [];
      doc.supported_vehicles = supportedVehicles;
    }
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

async function listRentalPackages(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const { active, transport_type } = req.query;
    const filter = {};
    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;
    if (transport_type) filter.transport_type = String(transport_type).toLowerCase();

    const [items, total] = await Promise.all([
      RentalPackage.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      RentalPackage.countDocuments(filter),
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

async function getRentalPackage(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await RentalPackage.findById(id).lean();
    if (!doc) return err(res, 404, "Rental package not found");
    return ok(res, { rental_package: doc });
  } catch (e) {
    next(e);
  }
}

async function createRentalPackage(req, res, next) {
  try {
    const body = req.body || {};
    const transportType = String(body.transport_type || "").toLowerCase();
    if (!body.name) return err(res, 422, "name is required");
    if (!transportType) return err(res, 422, "transport_type is required");
    if (!["taxi", "delivery"].includes(transportType)) {
      return err(res, 422, "transport_type must be taxi or delivery");
    }

    const doc = await RentalPackage.create({
      name: String(body.name).trim(),
      transport_type: transportType,
      short_description:
        body.short_description != null ? String(body.short_description).trim() : "",
      description: body.description != null ? String(body.description).trim() : "",
      active: body.active !== false,
    });

    return res
      .status(201)
      .json({ success: true, message: "Created", rental_package: doc.toObject() });
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", {
        duplicate: "Rental package already exists for this name + transport_type",
      });
    }
    next(e);
  }
}

async function updateRentalPackage(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await RentalPackage.findById(id);
    if (!doc) return err(res, 404, "Rental package not found");

    const body = req.body || {};
    if (body.name !== undefined) doc.name = String(body.name).trim();
    if (body.transport_type !== undefined) {
      const transportType = String(body.transport_type).toLowerCase();
      if (!["taxi", "delivery"].includes(transportType)) {
        return err(res, 422, "transport_type must be taxi or delivery");
      }
      doc.transport_type = transportType;
    }
    if (body.short_description !== undefined) doc.short_description = String(body.short_description);
    if (body.description !== undefined) doc.description = String(body.description);
    if (body.active !== undefined) doc.active = Boolean(body.active);

    await doc.save();
    return ok(res, { rental_package: doc.toObject() }, "Updated");
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", {
        duplicate: "Rental package already exists for this name + transport_type",
      });
    }
    next(e);
  }
}

async function deleteRentalPackage(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await RentalPackage.findByIdAndDelete(id);
    if (!doc) return err(res, 404, "Rental package not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

async function listSetPrices(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const { zone_id, transport_type, vehicle_type, active } = req.query;
    const filter = {};
    if (zone_id) filter.zone_id = String(zone_id);
    if (transport_type) filter.transport_type = String(transport_type).toLowerCase();
    if (vehicle_type) filter.vehicle_type = String(vehicle_type);
    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;

    const [items, total] = await Promise.all([
      SetPrice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      SetPrice.countDocuments(filter),
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

async function getSetPrice(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await SetPrice.findById(id).lean();
    if (!doc) return err(res, 404, "Set price not found");
    return ok(res, { set_price: doc });
  } catch (e) {
    next(e);
  }
}

async function createSetPrice(req, res, next) {
  try {
    const body = req.body || {};
    const transportType = String(body.transport_type || "").toLowerCase();
    if (!body.zone_id) return err(res, 422, "zone_id is required");
    if (!transportType) return err(res, 422, "transport_type is required");
    if (!["taxi", "delivery"].includes(transportType)) {
      return err(res, 422, "transport_type must be taxi or delivery");
    }
    if (!body.vehicle_type) return err(res, 422, "vehicle_type is required");

    const doc = await SetPrice.create({
      zone_id: String(body.zone_id),
      transport_type: transportType,
      vehicle_type: String(body.vehicle_type),
      app_modules: Array.isArray(body.app_modules) ? body.app_modules : [],
      payment_type: Array.isArray(body.payment_type) ? body.payment_type : [],
      preference: body.preference ?? null,
      preference_prices: Array.isArray(body.preference_prices) ? body.preference_prices : [],

      base_distance: toNumber(body.base_distance),
      base_price: toNumber(body.base_price),
      price_per_distance: toNumber(body.price_per_distance),
      price_per_time: toNumber(body.price_per_time),
      price_per_seat: toNumber(body.price_per_seat),
      waiting_charge: toNumber(body.waiting_charge),
      service_tax: toNumber(body.service_tax),

      outstation_base_distance: toNumber(body.outstation_base_distance),
      outstation_base_price: toNumber(body.outstation_base_price),
      outstation_price_per_distance: toNumber(body.outstation_price_per_distance),
      outstation_price_per_time: toNumber(body.outstation_price_per_time),

      admin_commision: toNumber(body.admin_commision),
      admin_commision_type: toNumber(body.admin_commision_type),
      admin_commission_for_owner: toNumber(body.admin_commission_for_owner),
      admin_commission_from_driver: toNumber(body.admin_commission_from_driver),
      admin_commission_type_for_owner: toNumber(body.admin_commission_type_for_owner),
      admin_commission_type_from_driver: toNumber(body.admin_commission_type_from_driver),
      admin_get_fee_percentage: toNumber(body.admin_get_fee_percentage),
      driver_get_fee_percentage: toNumber(body.driver_get_fee_percentage),
      agent_commision: toNumber(body.agent_commision),
      agent_commision_type: body.agent_commision_type != null ? String(body.agent_commision_type) : "",
      franchise_commision: toNumber(body.franchise_commision),
      franchise_commision_type:
        body.franchise_commision_type != null ? String(body.franchise_commision_type) : "",
      fee_goes_to: body.fee_goes_to != null ? String(body.fee_goes_to) : null,

      cancellation_fee_for_user: toNumber(body.cancellation_fee_for_user),
      cancellation_fee_for_driver: toNumber(body.cancellation_fee_for_driver),
      shared_cancel_fee: toNumber(body.shared_cancel_fee),
      shared_price_per_distance: toNumber(body.shared_price_per_distance),

      free_waiting_time_in_mins_before_trip_start: toNumber(
        body.free_waiting_time_in_mins_before_trip_start
      ),
      free_waiting_time_in_mins_after_trip_start: toNumber(
        body.free_waiting_time_in_mins_after_trip_start
      ),
      order_number: toNumber(body.order_number),

      airport_surge: toNumber(body.airport_surge),
      support_airport_fee: Boolean(body.support_airport_fee),
      support_outstation: Boolean(body.support_outstation),
      enable_shared_ride: toNumber(body.enable_shared_ride),
      active: body.active !== false,
    });

    return res.status(201).json({ success: true, message: "Created", set_price: doc.toObject() });
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", {
        duplicate: "Set price already exists for this zone + transport_type + vehicle_type",
      });
    }
    next(e);
  }
}

async function updateSetPrice(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await SetPrice.findById(id);
    if (!doc) return err(res, 404, "Set price not found");

    const body = req.body || {};
    if (body.zone_id !== undefined) doc.zone_id = String(body.zone_id);
    if (body.transport_type !== undefined) {
      const transportType = String(body.transport_type).toLowerCase();
      if (!["taxi", "delivery"].includes(transportType)) {
        return err(res, 422, "transport_type must be taxi or delivery");
      }
      doc.transport_type = transportType;
    }
    if (body.vehicle_type !== undefined) doc.vehicle_type = String(body.vehicle_type);
    if (body.app_modules !== undefined) doc.app_modules = Array.isArray(body.app_modules) ? body.app_modules : [];
    if (body.payment_type !== undefined) doc.payment_type = Array.isArray(body.payment_type) ? body.payment_type : [];
    if (body.preference !== undefined) doc.preference = body.preference;
    if (body.preference_prices !== undefined) {
      doc.preference_prices = Array.isArray(body.preference_prices) ? body.preference_prices : [];
    }

    const numericFields = [
      "base_distance",
      "base_price",
      "price_per_distance",
      "price_per_time",
      "price_per_seat",
      "waiting_charge",
      "service_tax",
      "outstation_base_distance",
      "outstation_base_price",
      "outstation_price_per_distance",
      "outstation_price_per_time",
      "admin_commision",
      "admin_commision_type",
      "admin_commission_for_owner",
      "admin_commission_from_driver",
      "admin_commission_type_for_owner",
      "admin_commission_type_from_driver",
      "admin_get_fee_percentage",
      "driver_get_fee_percentage",
      "agent_commision",
      "franchise_commision",
      "cancellation_fee_for_user",
      "cancellation_fee_for_driver",
      "shared_cancel_fee",
      "shared_price_per_distance",
      "free_waiting_time_in_mins_before_trip_start",
      "free_waiting_time_in_mins_after_trip_start",
      "order_number",
      "airport_surge",
      "enable_shared_ride",
    ];
    for (const key of numericFields) {
      if (body[key] !== undefined) doc[key] = toNumber(body[key]);
    }

    if (body.agent_commision_type !== undefined) doc.agent_commision_type = String(body.agent_commision_type ?? "");
    if (body.franchise_commision_type !== undefined) {
      doc.franchise_commision_type = String(body.franchise_commision_type ?? "");
    }
    if (body.fee_goes_to !== undefined) doc.fee_goes_to = body.fee_goes_to != null ? String(body.fee_goes_to) : null;
    if (body.support_airport_fee !== undefined) doc.support_airport_fee = Boolean(body.support_airport_fee);
    if (body.support_outstation !== undefined) doc.support_outstation = Boolean(body.support_outstation);
    if (body.active !== undefined) doc.active = Boolean(body.active);

    await doc.save();
    return ok(res, { set_price: doc.toObject() }, "Updated");
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", {
        duplicate: "Set price already exists for this zone + transport_type + vehicle_type",
      });
    }
    next(e);
  }
}

async function deleteSetPrice(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await SetPrice.findByIdAndDelete(id);
    if (!doc) return err(res, 404, "Set price not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

async function listRentalPackagePrices(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const { zone_type_price_id, package_type_id, active } = req.query;
    const filter = {};
    if (zone_type_price_id) filter.zone_type_price_id = String(zone_type_price_id);
    if (package_type_id != null && package_type_id !== "") {
      filter.package_type_id = Number(package_type_id);
    }
    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;

    const [items, total] = await Promise.all([
      RentalPackagePrice.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      RentalPackagePrice.countDocuments(filter),
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

async function getRentalPackagePrice(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await RentalPackagePrice.findById(id).lean();
    if (!doc) return err(res, 404, "Rental package price not found");
    return ok(res, { rental_package_price: doc });
  } catch (e) {
    next(e);
  }
}

async function createRentalPackagePrice(req, res, next) {
  try {
    const body = req.body || {};
    if (!body.zone_type_price_id) return err(res, 422, "zone_type_price_id is required");
    if (body.package_type_id == null || body.package_type_id === "") {
      return err(res, 422, "package_type_id is required");
    }

    const doc = await RentalPackagePrice.create({
      zone_type_price_id: String(body.zone_type_price_id),
      package_type_id: Number(body.package_type_id),

      base_distance: toNumber(body.base_distance),
      base_price: toNumber(body.base_price),
      distance_price_per_km: toNumber(body.distance_price_per_km),
      time_price_per_min: toNumber(body.time_price_per_min),
      free_min: toNumber(body.free_min),
      cancellation_fee: toNumber(body.cancellation_fee),
      service_tax: toNumber(body.service_tax),

      admin_commission: toNumber(body.admin_commission),
      admin_commission_type:
        body.admin_commission_type != null ? String(body.admin_commission_type) : null,
      admin_commission_from_driver: toNumber(body.admin_commission_from_driver),
      admin_commission_type_from_driver:
        body.admin_commission_type_from_driver != null
          ? String(body.admin_commission_type_from_driver)
          : null,
      admin_commission_from_owner: toNumber(body.admin_commission_from_owner),
      admin_commission_type_from_owner:
        body.admin_commission_type_from_owner != null
          ? String(body.admin_commission_type_from_owner)
          : null,

      agent_commision: toNumber(body.agent_commision),
      agent_commision_type: body.agent_commision_type != null ? String(body.agent_commision_type) : "",
      franchise_commision: toNumber(body.franchise_commision),
      franchise_commision_type:
        body.franchise_commision_type != null ? String(body.franchise_commision_type) : "",
      active: body.active !== false,
    });

    return res
      .status(201)
      .json({ success: true, message: "Created", rental_package_price: doc.toObject() });
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", {
        duplicate: "Rental package price already exists for this zone_type_price_id + package_type_id",
      });
    }
    next(e);
  }
}

async function updateRentalPackagePrice(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await RentalPackagePrice.findById(id);
    if (!doc) return err(res, 404, "Rental package price not found");

    const body = req.body || {};
    if (body.zone_type_price_id !== undefined) doc.zone_type_price_id = String(body.zone_type_price_id);
    if (body.package_type_id !== undefined && body.package_type_id !== "") {
      doc.package_type_id = Number(body.package_type_id);
    }

    const numericFields = [
      "base_distance",
      "base_price",
      "distance_price_per_km",
      "time_price_per_min",
      "free_min",
      "cancellation_fee",
      "service_tax",
      "admin_commission",
      "admin_commission_from_driver",
      "admin_commission_from_owner",
      "agent_commision",
      "franchise_commision",
    ];
    for (const key of numericFields) {
      if (body[key] !== undefined) doc[key] = toNumber(body[key]);
    }

    if (body.admin_commission_type !== undefined) {
      doc.admin_commission_type =
        body.admin_commission_type == null ? null : String(body.admin_commission_type);
    }
    if (body.admin_commission_type_from_driver !== undefined) {
      doc.admin_commission_type_from_driver =
        body.admin_commission_type_from_driver == null
          ? null
          : String(body.admin_commission_type_from_driver);
    }
    if (body.admin_commission_type_from_owner !== undefined) {
      doc.admin_commission_type_from_owner =
        body.admin_commission_type_from_owner == null
          ? null
          : String(body.admin_commission_type_from_owner);
    }
    if (body.agent_commision_type !== undefined) {
      doc.agent_commision_type =
        body.agent_commision_type == null ? "" : String(body.agent_commision_type);
    }
    if (body.franchise_commision_type !== undefined) {
      doc.franchise_commision_type =
        body.franchise_commision_type == null ? "" : String(body.franchise_commision_type);
    }
    if (body.active !== undefined) doc.active = Boolean(body.active);

    await doc.save();
    return ok(res, { rental_package_price: doc.toObject() }, "Updated");
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", {
        duplicate: "Rental package price already exists for this zone_type_price_id + package_type_id",
      });
    }
    next(e);
  }
}

async function deleteRentalPackagePrice(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await RentalPackagePrice.findByIdAndDelete(id);
    if (!doc) return err(res, 404, "Rental package price not found");
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
  listRentalPackages,
  getRentalPackage,
  createRentalPackage,
  updateRentalPackage,
  deleteRentalPackage,
  listSetPrices,
  getSetPrice,
  createSetPrice,
  updateSetPrice,
  deleteSetPrice,
  listRentalPackagePrices,
  getRentalPackagePrice,
  createRentalPackagePrice,
  updateRentalPackagePrice,
  deleteRentalPackagePrice,
};

