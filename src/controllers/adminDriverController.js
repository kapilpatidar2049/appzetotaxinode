const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const XLSX = require("xlsx");
const User = require("../models/User");
const Role = require("../models/Role");
const RoleUser = require("../models/RoleUser");
const Driver = require("../models/Driver");
const DriverWallet = require("../models/DriverWallet");
const ServiceLocation = require("../models/ServiceLocation");
const Country = require("../models/Country");
const Request = require("../models/Request");
const RequestRating = require("../models/RequestRating");

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

function randomReferral(len = 6) {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < len; i += 1) {
    s += chars[Math.floor(Math.random() * chars.length)];
  }
  return s;
}

async function attachRole(userId, slug) {
  const role = await Role.findOne({ slug }).lean();
  if (!role) {
    throw new Error(`Role "${slug}" not found in database`);
  }
  await RoleUser.updateOne(
    { role_id: role._id, user_id: userId },
    { $setOnInsert: { role_id: role._id, user_id: userId } },
    { upsert: true }
  );
}

function escapeRegex(s) {
  return String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function resolveServiceLocationId(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return { ok: false, message: "ServiceLocation is empty" };
  if (mongoose.Types.ObjectId.isValid(s)) {
    const doc = await ServiceLocation.findById(s).select("_id").lean();
    if (doc) return { ok: true, id: doc._id };
  }
  const bySlug = await ServiceLocation.findOne({
    slug: new RegExp(`^${escapeRegex(s)}$`, "i"),
  })
    .select("_id")
    .lean();
  if (bySlug) return { ok: true, id: bySlug._id };
  const byName = await ServiceLocation.findOne({
    name: new RegExp(`^${escapeRegex(s)}$`, "i"),
  })
    .select("_id")
    .lean();
  if (byName) return { ok: true, id: byName._id };
  return { ok: false, message: `Service location not found: ${s}` };
}

async function resolveCountryId(raw) {
  const s = String(raw ?? "").trim();
  if (!s) return { ok: false, message: "Country is empty" };
  if (mongoose.Types.ObjectId.isValid(s)) {
    const doc = await Country.findById(s).select("_id").lean();
    if (doc) return { ok: true, id: doc._id };
  }
  if (/^[A-Za-z]{2,3}$/.test(s)) {
    const byCode = await Country.findOne({ code: s.toUpperCase() }).select("_id").lean();
    if (byCode) return { ok: true, id: byCode._id };
  }
  if (/^\d+$/.test(s)) {
    let byDial = await Country.findOne({ dial_code: s }).select("_id").lean();
    if (byDial) return { ok: true, id: byDial._id };
    byDial = await Country.findOne({ dial_code: `+${s}` }).select("_id").lean();
    if (byDial) return { ok: true, id: byDial._id };
  }
  return { ok: false, message: `Country not found: ${s}` };
}

/** Shared by POST /drivers and bulk upload. */
async function createDriverRecord(body) {
  const {
    name,
    service_location_id,
    car_color,
    car_number,
    transport_type,
    country,
    mobile,
    email,
    gender,
    password,
    vehicle_make,
    vehicle_model,
    custom_make,
    custom_model,
    profile_picture,
    owner_id,
  } = body || {};

  const errors = {};
  if (!name) errors.name = "name is required";
  if (!service_location_id || !mongoose.Types.ObjectId.isValid(String(service_location_id))) {
    errors.service_location_id = "valid service_location_id is required";
  }
  if (!car_color) errors.car_color = "car_color is required";
  if (!car_number) errors.car_number = "car_number is required";
  if (!transport_type) errors.transport_type = "transport_type is required";
  if (!country || !mongoose.Types.ObjectId.isValid(String(country))) {
    errors.country = "valid country is required";
  }
  if (!mobile) errors.mobile = "mobile is required";
  if (!gender) errors.gender = "gender is required";
  if (!password) errors.password = "password is required";

  const profilePath = profile_picture || undefined;

  if (email) {
    const exists = await User.findOne({ email: String(email).toLowerCase() }).lean();
    if (exists) errors.email = "Provided email has already been taken";
  }
  const mobExists = await User.findOne({ mobile: String(mobile).trim() }).lean();
  if (mobExists) errors.mobile = "Provided mobile has already been taken";

  if (Object.keys(errors).length) {
    return { ok: false, errors };
  }

  try {
    const hashed = await bcrypt.hash(password, 10);
    const countryId = new mongoose.Types.ObjectId(String(country));
    const slId = new mongoose.Types.ObjectId(String(service_location_id));

    const user = await User.create({
      name: String(name).trim(),
      email: email ? String(email).toLowerCase().trim() : undefined,
      mobile: String(mobile).trim(),
      mobile_confirmed: true,
      password: hashed,
      refferal_code: randomReferral(6),
      country: countryId,
      gender,
      role: "driver",
      active: true,
      profile_picture: profilePath,
    });

    await attachRole(user._id, "driver");

    const ownerOid =
      owner_id && mongoose.Types.ObjectId.isValid(owner_id)
        ? new mongoose.Types.ObjectId(owner_id)
        : undefined;

    const driver = await Driver.create({
      user_id: user._id,
      owner_id: ownerOid,
      service_location_id: slId,
      name: String(name).trim(),
      mobile: String(mobile).trim(),
      email: email ? String(email).toLowerCase().trim() : undefined,
      gender,
      car_color: String(car_color).trim(),
      car_number: String(car_number).trim(),
      transport_type: String(transport_type).trim(),
      custom_make: custom_make || vehicle_make || undefined,
      custom_model: custom_model || vehicle_model || undefined,
      car_make: vehicle_make || custom_make,
      car_model: vehicle_model || custom_model,
      active: true,
      approve: false,
      available: false,
    });

    await DriverWallet.create({
      driver_id: driver._id,
      amount_added: 0,
      amount_balance: 0,
    });

    const populated = await Driver.findById(driver._id)
      .populate("user_id")
      .populate("service_location_id", "name")
      .lean();

    return { ok: true, driver: populated };
  } catch (e) {
    const msg = e && e.message ? e.message : "Create failed";
    if (e && e.code === 11000) {
      return { ok: false, errors: { duplicate: "Email or mobile already exists" } };
    }
    return { ok: false, message: msg };
  }
}

function normKey(k) {
  return String(k || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "");
}

/** Read cell from row with flexible header names (matches sample xlsx). */
function pickCell(row, aliases) {
  const map = {};
  for (const key of Object.keys(row)) {
    map[normKey(key)] = row[key];
  }
  for (const a of aliases) {
    const v = map[normKey(a)];
    if (v !== undefined && v !== null && String(v).trim() !== "") {
      return v;
    }
  }
  return "";
}

function cellStr(v) {
  if (v === undefined || v === null) return "";
  if (typeof v === "number") return String(v);
  return String(v).trim();
}

async function bulkUploadDrivers(req, res, next) {
  try {
    if (!req.file || !req.file.buffer) {
      return err(res, 400, "file is required (multipart field: file)");
    }

    const defaultPassword =
      (req.body && req.body.default_password) ||
      (req.body && req.body.password) ||
      "";
    if (!defaultPassword || String(defaultPassword).length < 6) {
      return err(res, 422, "default_password is required (min 6 characters) in form body");
    }

    const workbook = XLSX.read(req.file.buffer, { type: "buffer" });
    const sheetName = workbook.SheetNames[0];
    if (!sheetName) {
      return err(res, 422, "Excel file has no sheets");
    }
    const rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { defval: "" });
    if (!rows.length) {
      return err(res, 422, "Excel has no data rows");
    }

    const results = [];
    let created = 0;
    let failed = 0;

    for (let i = 0; i < rows.length; i += 1) {
      const row = rows[i];
      const excelRow = i + 2;

      const name = cellStr(pickCell(row, ["Name", "name"]));
      const mobileRaw = pickCell(row, ["Mobile", "mobile", "Phone"]);
      const mobile = cellStr(mobileRaw);
      if (!name && !mobile) {
        results.push({ row: excelRow, status: "skipped", message: "empty row" });
        continue;
      }

      const serviceLocRaw = pickCell(row, ["ServiceLocation", "Service Location", "service_location_id"]);
      const countryRaw = pickCell(row, ["Country", "country"]);
      const slRes = await resolveServiceLocationId(serviceLocRaw);
      if (!slRes.ok) {
        failed += 1;
        results.push({ row: excelRow, status: "failed", message: slRes.message });
        continue;
      }
      const cRes = await resolveCountryId(countryRaw);
      if (!cRes.ok) {
        failed += 1;
        results.push({ row: excelRow, status: "failed", message: cRes.message });
        continue;
      }

      const password =
        cellStr(pickCell(row, ["Password", "password"])) || String(defaultPassword);

      const payload = {
        name,
        service_location_id: slRes.id,
        country: cRes.id,
        mobile,
        email: cellStr(pickCell(row, ["Email", "email"])) || undefined,
        gender: cellStr(pickCell(row, ["Gender", "gender"])),
        transport_type: cellStr(pickCell(row, ["Transport Type", "TransportType", "transport_type"])) || "taxi",
        car_color: cellStr(pickCell(row, ["CarColor", "Car Color", "car_color"])),
        car_number: cellStr(pickCell(row, ["CarNumber", "Car Number", "car_number"])),
        custom_make: cellStr(pickCell(row, ["CustomMake", "Custom Make", "custom_make", "vehicle_make"])) || undefined,
        custom_model: cellStr(pickCell(row, ["CustomModel", "Custom Model", "custom_model", "vehicle_model"])) || undefined,
        password,
        owner_id: cellStr(pickCell(row, ["OwnerId", "owner_id"])) || undefined,
      };

      const vehicleType = cellStr(pickCell(row, ["Vehicle Type", "VehicleType", "vehicle_type"]));
      if (vehicleType && !payload.custom_make) {
        payload.custom_make = vehicleType;
      }

      const rec = await createDriverRecord(payload);
      if (!rec.ok) {
        failed += 1;
        results.push({
          row: excelRow,
          status: "failed",
          errors: rec.errors || { message: rec.message },
        });
        continue;
      }
      created += 1;
      results.push({
        row: excelRow,
        status: "created",
        driver_id: rec.driver._id,
      });
    }

    return ok(
      res,
      {
        created,
        failed,
        skipped: results.filter((r) => r.status === "skipped").length,
        results,
      },
      "Bulk upload finished"
    );
  } catch (e) {
    next(e);
  }
}

async function listDrivers(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const search = (req.query.search || "").trim();
    const includeOwner =
      req.query.include_owner === "1" || req.query.include_owner === "true";
    const driverType = String(req.query.driver_type || "").toLowerCase();
    const approveRaw = req.query.approve;

    const parts = [];
    if (driverType === "normal") {
      parts.push({
        $or: [{ owner_id: null }, { owner_id: { $exists: false } }],
      });
    } else if (driverType === "fleet") {
      parts.push({ owner_id: { $exists: true, $ne: null } });
    } else if (!includeOwner) {
      parts.push({
        $or: [{ owner_id: null }, { owner_id: { $exists: false } }],
      });
    }

    // Optional filter for Admin UI pages: Pending vs Approved drivers.
    // Accepts: true/false, 1/0, approved/pending.
    if (approveRaw !== undefined && approveRaw !== null && String(approveRaw).trim() !== "") {
      const v = String(approveRaw).trim().toLowerCase();
      if (["1", "true", "approved"].includes(v)) parts.push({ approve: true });
      else if (["0", "false", "pending"].includes(v)) parts.push({ approve: false });
    }

    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const userIds = await User.find({
        $or: [{ name: rx }, { mobile: rx }, { email: rx }],
      })
        .select("_id")
        .lean();
      const ids = userIds.map((u) => u._id);
      parts.push({
        $or: [
          { name: rx },
          { mobile: rx },
          { email: rx },
          { car_number: rx },
          ...(ids.length ? [{ user_id: { $in: ids } }] : []),
        ],
      });
    }

    const filter = parts.length ? { $and: parts } : {};

    const [items, total] = await Promise.all([
      Driver.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate(
          "user_id",
          "name email mobile country gender profile_picture active referred_by"
        )
        .populate("service_location_id", "name")
        .lean(),
      Driver.countDocuments(filter),
    ]);

    const results = [];
    for (const d of items) {
      const row = { ...d };
      const u = d.user_id;
      if (u && u.referred_by) {
        const ref = await User.findById(u.referred_by).select("name").lean();
        row.referred_by_name = ref?.name || null;
      } else {
        row.referred_by_name = null;
      }
      if (row.user_id && typeof row.user_id === "object") {
        delete row.user_id.referred_by;
      }
      row.driver_type = row.owner_id ? "fleet" : "normal";
      results.push(row);
    }

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

async function listPendingDrivers(req, res, next) {
  req.query = req.query || {};
  req.query.approve = "false";
  return listDrivers(req, res, next);
}

async function listApprovedDrivers(req, res, next) {
  req.query = req.query || {};
  req.query.approve = "true";
  return listDrivers(req, res, next);
}

async function getDriver(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid driver id");
    }
    const driver = await Driver.findById(id)
      .populate("user_id")
      .populate("owner_id")
      .populate("service_location_id", "name")
      .lean();
    if (!driver) {
      return err(res, 404, "Driver not found");
    }
    return ok(res, { driver });
  } catch (e) {
    next(e);
  }
}

async function createDriver(req, res, next) {
  try {
    const result = await createDriverRecord(req.body || {});
    if (!result.ok) {
      if (result.errors) return err(res, 422, "Validation failed", result.errors);
      return err(res, 500, result.message || "Could not create driver");
    }
    return res.status(201).json({
      success: true,
      message: "Driver created successfully.",
      successMessage: "Driver created successfully.",
      driver: result.driver,
    });
  } catch (e) {
    next(e);
  }
}

async function updateDriver(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid driver id");
    }

    const driver = await Driver.findById(id);
    if (!driver) {
      return err(res, 404, "Driver not found");
    }

    const user = await User.findById(driver.user_id);
    if (!user) {
      return err(res, 404, "Linked user not found");
    }

    const {
      name,
      service_location_id,
      car_color,
      car_number,
      transport_type,
      country,
      mobile,
      email,
      gender,
      password,
      active,
      approve,
      available,
      custom_make,
      custom_model,
      vehicle_make,
      vehicle_model,
      profile_picture,
    } = req.body || {};

    const errors = {};
    if (email !== undefined && email) {
      const exists = await User.findOne({
        email: String(email).toLowerCase(),
        _id: { $ne: user._id },
      }).lean();
      if (exists) errors.email = "Provided email has already been taken";
    }
    if (mobile !== undefined) {
      const exists = await User.findOne({
        mobile: String(mobile).trim(),
        _id: { $ne: user._id },
      }).lean();
      if (exists) errors.mobile = "Provided mobile has already been taken";
    }
    if (Object.keys(errors).length) {
      return err(res, 422, "Validation failed", errors);
    }

    if (name !== undefined) {
      user.name = String(name).trim();
      driver.name = String(name).trim();
    }
    if (country !== undefined) {
      user.country =
        country && mongoose.Types.ObjectId.isValid(country) ? country : null;
    }
    if (mobile !== undefined) {
      user.mobile = String(mobile).trim();
      driver.mobile = String(mobile).trim();
    }
    if (email !== undefined) {
      user.email = email ? String(email).toLowerCase().trim() : undefined;
      driver.email = user.email;
    }
    if (gender !== undefined) {
      user.gender = gender;
      driver.gender = gender;
    }
    if (profile_picture !== undefined) user.profile_picture = profile_picture;
    if (password) user.password = await bcrypt.hash(password, 10);
    if (active !== undefined) {
      user.active = Boolean(active);
      driver.active = Boolean(active);
    }
    if (approve !== undefined) driver.approve = Boolean(approve);
    if (available !== undefined) driver.available = Boolean(available);
    if (service_location_id !== undefined && mongoose.Types.ObjectId.isValid(service_location_id)) {
      driver.service_location_id = service_location_id;
    }
    if (car_color !== undefined) driver.car_color = car_color;
    if (car_number !== undefined) driver.car_number = car_number;
    if (transport_type !== undefined) driver.transport_type = transport_type;
    if (custom_make !== undefined || vehicle_make !== undefined) {
      driver.custom_make = custom_make || vehicle_make;
      driver.car_make = vehicle_make || custom_make || driver.car_make;
    }
    if (custom_model !== undefined || vehicle_model !== undefined) {
      driver.custom_model = custom_model || vehicle_model;
      driver.car_model = vehicle_model || custom_model || driver.car_model;
    }

    await user.save();
    await driver.save();

    const populated = await Driver.findById(driver._id)
      .populate("user_id")
      .populate("service_location_id", "name")
      .lean();

    return ok(res, { driver: populated }, "Driver updated");
  } catch (e) {
    next(e);
  }
}

async function deleteDriver(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid driver id");
    }
    const driver = await Driver.findById(id);
    if (!driver) {
      return err(res, 404, "Driver not found");
    }
    driver.active = false;
    await driver.save();
    const user = await User.findById(driver.user_id);
    if (user) {
      user.active = false;
      user.is_deleted_at = new Date();
      await user.save();
    }
    return ok(res, { id: driver._id }, "Driver deactivated");
  } catch (e) {
    next(e);
  }
}

async function getDriverRequests(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid driver id");
    }
    const { page, limit, skip } = parsePage(req);
    const filter = { driver_id: id };
    const [items, total] = await Promise.all([
      Request.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Request.countDocuments(filter),
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

async function getDriverReviewHistory(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid driver id");
    }
    const { page, limit, skip } = parsePage(req);
    const filter = { driver_id: id };
    const [items, total] = await Promise.all([
      RequestRating.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user_id", "name mobile email")
        .populate("request_id", "request_number is_completed is_cancelled")
        .lean(),
      RequestRating.countDocuments(filter),
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

async function listDeletedDrivers(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const search = (req.query.search || "").trim();
    const userFilter = {
      role: "driver",
      is_deleted_at: { $ne: null }, 
    };
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      userFilter.$or = [{ name: rx }, { mobile: rx }, { email: rx }];
    }

    const [deletedUsers, totalUsers] = await Promise.all([
      User.find(userFilter).sort({ is_deleted_at: -1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      User.countDocuments(userFilter),
    ]);
    const userIds = deletedUsers.map((u) => u._id);
    const drivers = await Driver.find({ user_id: { $in: userIds } })
      .populate("service_location_id", "name")
      .lean();
    const dMap = new Map(drivers.map((d) => [String(d.user_id), d]));

    const results = deletedUsers.map((u) => {
      const driver = dMap.get(String(u._id)) || null;
      return {
        driver_id: driver?._id || null,
        deleted_at: u.is_deleted_at || null,
        user: u,
        driver,
      };
    });

    return ok(res, {
      results,
      paginator: {
        total: totalUsers,
        per_page: limit,
        current_page: page,
        last_page: Math.ceil(totalUsers / limit) || 1,
      },
    });
  } catch (e) {
    next(e);
  }
}

async function getDeletedDriverProfile(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid driver id");
    const driver = await Driver.findById(id)
      .populate("service_location_id", "name")
      .lean();
    if (!driver) return err(res, 404, "Driver not found");
    const user = await User.findOne({
      _id: driver.user_id,
      role: "driver",
      is_deleted_at: { $ne: null },
    }).lean();
    if (!user) return err(res, 404, "Deleted driver profile not found");
    return ok(res, { user, driver });
  } catch (e) {
    next(e);
  }
}

async function restoreDeletedDriver(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid driver id");
    const driver = await Driver.findById(id);
    if (!driver) return err(res, 404, "Driver not found");
    const user = await User.findOne({
      _id: driver.user_id,
      role: "driver",
      is_deleted_at: { $ne: null },
    });
    if (!user) return err(res, 404, "Deleted driver profile not found");

    user.is_deleted_at = null;
    user.active = true;
    driver.active = true;
    await user.save();
    await driver.save();

    return ok(res, { id: driver._id }, "Driver restored");
  } catch (e) {
    next(e);
  }
}

async function deleteDeletedDriverPermanently(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid driver id");
    const driver = await Driver.findById(id).lean();
    if (!driver) return err(res, 404, "Driver not found");
    const user = await User.findOne({
      _id: driver.user_id,
      role: "driver",
      is_deleted_at: { $ne: null },
    }).lean();
    if (!user) return err(res, 404, "Deleted driver profile not found");

    await Driver.deleteOne({ _id: id });
    await DriverWallet.deleteOne({ driver_id: id });
    await User.deleteOne({ _id: driver.user_id });

    return ok(res, { id }, "Deleted driver removed permanently");
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listDrivers,
  listPendingDrivers,
  listApprovedDrivers,
  getDriver,
  createDriver,
  bulkUploadDrivers,
  updateDriver,
  deleteDriver,
  getDriverRequests,
  getDriverReviewHistory,
  listDeletedDrivers,
  getDeletedDriverProfile,
  restoreDeletedDriver,
  deleteDeletedDriverPermanently,
};
