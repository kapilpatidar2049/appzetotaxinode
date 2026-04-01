const mongoose = require("mongoose");
const Owner = require("../models/Owner");
const Fleet = require("../models/Fleet");
const OwnerNeededDocument = require("../models/OwnerNeededDocument");
const FleetNeededDocument = require("../models/FleetNeededDocument");
const Driver = require("../models/Driver");
const User = require("../models/User");
const OwnerHiredDriver = require("../models/OwnerHiredDriver");
const Request = require("../models/Request");

function ok(res, data = null, message = "success") {
  return res.json({ success: true, message, data });
}

function fail(res, message = "Internal server error", code = 500) {
  return res.status(code).json({ success: false, message });
}

async function getOwnerByUserId(userId) {
  return Owner.findOne({ user_id: userId }).lean();
}

// FleetController
async function listFleets(req, res) {
  try {
    const owner = await getOwnerByUserId(req.user?.id);
    if (!owner) return fail(res, "Owner not found", 404);
    const oid = owner._id || owner.id;
    const rows = await Fleet.find({ owner_id: oid }).sort({ createdAt: -1 }).lean();
    return ok(res, rows);
  } catch {
    return fail(res);
  }
}

async function neededDocuments(req, res) {
  try {
    const [ownerDocs, fleetDocs] = await Promise.all([
      OwnerNeededDocument.find({ active: true }).sort({ createdAt: 1 }).lean(),
      FleetNeededDocument.find({ active: true }).sort({ createdAt: 1 }).lean(),
    ]);
    return ok(res, { owner_documents: ownerDocs, fleet_documents: fleetDocs });
  } catch {
    return ok(res, []);
  }
}

async function listDrivers(req, res) {
  try {
    const owner = await getOwnerByUserId(req.user?.id);
    if (!owner) return fail(res, "Owner not found", 404);
    const oid = owner._id || owner.id;
    const drivers = await Driver.find({ owner_id: oid }).sort({ createdAt: -1 }).lean();
    const userIds = [...new Set(drivers.map((d) => d.user_id).filter(Boolean))];
    const users = await User.find({ _id: { $in: userIds } }).select("name mobile").lean();
    const umap = new Map(users.map((u) => [String(u._id), u]));
    const rows = drivers.map((d) => ({
      ...d,
      user_name: d.user_id ? umap.get(String(d.user_id))?.name ?? null : null,
      user_mobile: d.user_id ? umap.get(String(d.user_id))?.mobile ?? null : null,
    }));
    return ok(res, rows);
  } catch {
    return fail(res);
  }
}

async function assignDriver(req, res) {
  try {
    const owner = await getOwnerByUserId(req.user?.id);
    if (!owner) return fail(res, "Owner not found", 404);
    const { fleet } = req.params;
    const { driver_id } = req.body || {};
    if (!driver_id) return fail(res, "driver_id is required", 422);

    const oid = owner._id || owner.id;
    const fleetRow = await Fleet.findOne({ _id: fleet, owner_id: oid }).lean();
    if (!fleetRow) return fail(res, "Fleet not found", 404);
    await Driver.updateOne(
      { _id: driver_id },
      { $set: { fleet_id: fleet, owner_id: oid } }
    );
    await OwnerHiredDriver.updateOne(
      { owner_id: oid, driver_id },
      { $setOnInsert: { owner_id: oid, driver_id } },
      { upsert: true }
    );

    return ok(res, null, "Driver assigned successfully");
  } catch {
    return fail(res);
  }
}

async function addFleet(req, res) {
  try {
    const owner = await getOwnerByUserId(req.user?.id);
    if (!owner) return fail(res, "Owner not found", 404);
    const { name } = req.body || {};
    if (!name) return fail(res, "name is required", 422);

    const oid = owner._id || owner.id;
    const fleet = await Fleet.create({
      owner_id: oid,
      fleet_id: name,
      active: true,
    });
    return ok(res, { fleet_id: fleet._id }, "Fleet created");
  } catch {
    return fail(res);
  }
}

async function updateFleet(req, res) {
  try {
    const owner = await getOwnerByUserId(req.user?.id);
    if (!owner) return fail(res, "Owner not found", 404);
    const { fleet } = req.params;
    const { name, active } = req.body || {};
    const oid = owner._id || owner.id;
    const updates = {};
    if (name != null) updates.fleet_id = name;
    if (active != null) updates.active = active;

    const found = await Fleet.findOneAndUpdate(
      { _id: fleet, owner_id: oid },
      { $set: updates },
      { new: true }
    ).lean();
    if (!found) return fail(res, "Fleet not found", 404);
    return ok(res, null, "Fleet updated");
  } catch {
    return fail(res);
  }
}

async function deleteFleet(req, res) {
  try {
    const owner = await getOwnerByUserId(req.user?.id);
    if (!owner) return fail(res, "Owner not found", 404);
    const { fleet } = req.params;
    const oid = owner._id || owner.id;
    await Fleet.deleteOne({ _id: fleet, owner_id: oid });
    return ok(res, null, "Fleet deleted");
  } catch {
    return fail(res);
  }
}

// FleetDriversController
async function addDrivers(req, res) {
  try {
    const owner = await getOwnerByUserId(req.user?.id);
    if (!owner) return fail(res, "Owner not found", 404);
    const { user_id, name, mobile, email, fleet_id } = req.body || {};
    const oid = owner._id || owner.id;

    let finalUserId = user_id;
    if (!finalUserId) {
      if (!mobile) return fail(res, "mobile is required", 422);
      const createdUser = await User.create({
        name: name || "Fleet Driver",
        mobile,
        email: email || null,
        active: true,
      });
      finalUserId = createdUser._id;
    }
    const createDriver = await Driver.create({
      user_id: finalUserId,
      owner_id: oid,
      fleet_id: fleet_id || null,
      name: name || null,
      mobile: mobile || null,
      email: email || null,
      active: true,
      available: false,
      approve: false,
    });
    await OwnerHiredDriver.updateOne(
      { owner_id: oid, driver_id: createDriver._id },
      { $setOnInsert: { owner_id: oid, driver_id: createDriver._id } },
      { upsert: true }
    );
    return ok(res, { driver_id: createDriver._id }, "Driver added");
  } catch {
    return fail(res);
  }
}

async function deleteDriver(req, res) {
  try {
    const owner = await getOwnerByUserId(req.user?.id);
    if (!owner) return fail(res, "Owner not found", 404);
    const { driver } = req.params;
    const oid = owner._id || owner.id;

    await Driver.deleteOne({ _id: driver, owner_id: oid });
    await OwnerHiredDriver.deleteOne({ owner_id: oid, driver_id: driver });

    return ok(res, null, "Driver deleted");
  } catch {
    return fail(res);
  }
}

// OwnerController dashboards
async function ownerDashboard(req, res) {
  try {
    const owner = await getOwnerByUserId(req.user?.id);
    if (!owner) return fail(res, "Owner not found", 404);

    const ownerId = owner._id || owner.id;
    const [fleetCount, driverCount, rideCount] = await Promise.all([
      Fleet.countDocuments({ owner_id: ownerId }),
      Driver.countDocuments({ owner_id: ownerId }),
      Request.countDocuments({ owner_id: ownerId }),
    ]);
    return ok(res, {
      fleets: fleetCount,
      drivers: driverCount,
      total_drivers: driverCount,
      rides: rideCount,
    });
  } catch {
    return fail(res);
  }
}

async function fleetDashboard(req, res) {
  try {
    const owner = await getOwnerByUserId(req.user?.id);
    if (!owner) return fail(res, "Owner not found", 404);
    const { fleet_id } = req.body || {};
    if (!fleet_id) return fail(res, "fleet_id is required", 422);

    const oid = owner._id || owner.id;
    const fleetRow = await Fleet.findOne({ _id: fleet_id, owner_id: oid }).lean();
    if (!fleetRow) return fail(res, "Fleet not found", 404);

    const driverCount = await Driver.countDocuments({ fleet_id, owner_id: oid });
    const rideCount = await Request.countDocuments({ fleet_id, owner_id: oid });

    return ok(res, {
      fleet: fleetRow,
      drivers: driverCount,
      total_drivers: driverCount,
      rides: rideCount,
    });
  } catch {
    return fail(res);
  }
}

async function fleetDriverDashboard(req, res) {
  try {
    const owner = await getOwnerByUserId(req.user?.id);
    if (!owner) return fail(res, "Owner not found", 404);
    const { driver_id } = req.body || {};
    if (!driver_id) return fail(res, "driver_id is required", 422);

    const oid = owner._id || owner.id;
    const driverDoc = await Driver.findOne({ _id: driver_id, owner_id: oid }).lean();
    if (!driverDoc) return fail(res, "Driver not found", 404);

    const userDoc = driverDoc.user_id
      ? await User.findById(driverDoc.user_id).select("name").lean()
      : null;

    const rideCount = await Request.countDocuments({ driver_id });
    const did = mongoose.Types.ObjectId.isValid(String(driver_id))
      ? new mongoose.Types.ObjectId(String(driver_id))
      : driver_id;
    const agg = await Request.aggregate([
      { $match: { driver_id: did, is_completed: true } },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$total", 0] } } } },
    ]);
    const earnings = agg[0]?.total || 0;

    return ok(res, {
      driver: { ...driverDoc, user_name: userDoc?.name ?? null },
      rides: rideCount,
      earnings,
    });
  } catch {
    return fail(res);
  }
}

module.exports = {
  listFleets,
  neededDocuments,
  listDrivers,
  assignDriver,
  addFleet,
  updateFleet,
  deleteFleet,
  addDrivers,
  deleteDriver,
  ownerDashboard,
  fleetDashboard,
  fleetDriverDashboard,
};
