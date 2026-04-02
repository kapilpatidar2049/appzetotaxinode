const mongoose = require("mongoose");
const XLSX = require("xlsx");

const User = require("../models/User");
const Driver = require("../models/Driver");
const Owner = require("../models/Owner");
const Fleet = require("../models/Fleet");
const Request = require("../models/Request");
const ServiceLocation = require("../models/ServiceLocation");
const VehicleType = require("../models/VehicleType");
const DriverVehicleType = require("../models/DriverVehicleType");

const FILE_FORMATS = new Set(["csv", "xlsx", "json"]);
const DATE_OPTIONS = new Set([
  "today",
  "yesterday",
  "this_week",
  "this_month",
  "this_year",
  "custom",
]);

function boolFromStatus(status) {
  if (status == null) return undefined;
  const v = String(status).toLowerCase();
  if (["approved", "active", "1", "true", "yes"].includes(v)) return true;
  if (["rejected", "inactive", "0", "false", "no"].includes(v)) return false;
  return undefined;
}

function parseFileFormat(req) {
  const v = String(req.query.file_format || "csv").toLowerCase();
  return FILE_FORMATS.has(v) ? v : "csv";
}

function dateRangeFromOption(req) {
  const now = new Date();
  const option = String(req.query.date_option || "").toLowerCase();
  const fromDateRaw = req.query.from_date;
  const toDateRaw = req.query.to_date;

  if (!option && !fromDateRaw && !toDateRaw) {
    return null;
  }

  const startOfDay = (d) => {
    const x = new Date(d);
    x.setHours(0, 0, 0, 0);
    return x;
  };
  const endOfDay = (d) => {
    const x = new Date(d);
    x.setHours(23, 59, 59, 999);
    return x;
  };

  if (fromDateRaw || toDateRaw || option === "custom") {
    const from = fromDateRaw ? startOfDay(new Date(fromDateRaw)) : null;
    const to = toDateRaw ? endOfDay(new Date(toDateRaw)) : null;
    if ((from && Number.isNaN(from.getTime())) || (to && Number.isNaN(to.getTime()))) {
      return { error: "Invalid from_date or to_date" };
    }
    if (!from && !to) return null;
    const range = {};
    if (from) range.$gte = from;
    if (to) range.$lte = to;
    return range;
  }

  if (!DATE_OPTIONS.has(option)) {
    return { error: "Invalid date_option" };
  }

  let from;
  let to;
  switch (option) {
    case "today":
      from = startOfDay(now);
      to = endOfDay(now);
      break;
    case "yesterday": {
      const y = new Date(now);
      y.setDate(y.getDate() - 1);
      from = startOfDay(y);
      to = endOfDay(y);
      break;
    }
    case "this_week": {
      const d = new Date(now);
      const day = d.getDay();
      const diffToMonday = day === 0 ? -6 : 1 - day;
      d.setDate(d.getDate() + diffToMonday);
      from = startOfDay(d);
      to = endOfDay(now);
      break;
    }
    case "this_month":
      from = startOfDay(new Date(now.getFullYear(), now.getMonth(), 1));
      to = endOfDay(now);
      break;
    case "this_year":
      from = startOfDay(new Date(now.getFullYear(), 0, 1));
      to = endOfDay(now);
      break;
    default:
      return null;
  }
  return { $gte: from, $lte: to };
}

function sendDownload(res, rows, fileName, fileFormat) {
  if (fileFormat === "json") {
    res.setHeader("Content-Type", "application/json; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}.json"`);
    return res.status(200).send(JSON.stringify(rows, null, 2));
  }

  const ws = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Report");

  if (fileFormat === "xlsx") {
    const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", `attachment; filename="${fileName}.xlsx"`);
    return res.status(200).send(buffer);
  }

  const csv = XLSX.utils.sheet_to_csv(ws);
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="${fileName}.csv"`);
  return res.status(200).send(csv);
}

function toId(value) {
  if (!value || !mongoose.Types.ObjectId.isValid(value)) return null;
  return new mongoose.Types.ObjectId(value);
}

async function reportOptions(req, res, next) {
  try {
    const [serviceLocations, drivers, vehicleTypes, fleets] = await Promise.all([
      ServiceLocation.find({ active: true }).select("_id name").sort({ name: 1 }).lean(),
      Driver.find({}).select("_id name mobile").sort({ createdAt: -1 }).limit(500).lean(),
      VehicleType.find({ active: true }).select("_id name transport_type").sort({ order: 1, name: 1 }).lean(),
      Fleet.find({ active: true }).select("_id fleet_id license_number").sort({ createdAt: -1 }).limit(500).lean(),
    ]);

    return res.json({
      success: true,
      data: {
        file_formats: ["csv", "xlsx", "json"],
        date_options: ["today", "yesterday", "this_week", "this_month", "this_year", "custom"],
        approval_status: ["approved", "rejected"],
        user_status: ["active", "inactive"],
        trip_status: ["completed", "cancelled"],
        payment_types: ["cash", "wallet", "card", "upi", "stripe", "paypal"],
        service_locations: serviceLocations.map((x) => ({ id: x._id, name: x.name })),
        drivers: drivers.map((x) => ({ id: x._id, name: x.name || x.mobile || "Driver" })),
        vehicle_types: vehicleTypes.map((x) => ({
          id: x._id,
          name: x.name,
          transport_type: x.transport_type || null,
        })),
        fleets: fleets.map((x) => ({
          id: x._id,
          fleet_id: x.fleet_id || null,
          label: x.fleet_id || x.license_number || String(x._id),
        })),
      },
    });
  } catch (e) {
    next(e);
  }
}

async function downloadUserReport(req, res, next) {
  try {
    const fileFormat = parseFileFormat(req);
    const filter = {};

    const statusBool = boolFromStatus(req.query.status);
    if (typeof statusBool === "boolean") filter.active = statusBool;

    const createdAtRange = dateRangeFromOption(req);
    if (createdAtRange?.error) {
      return res.status(422).json({ success: false, message: createdAtRange.error });
    }
    if (createdAtRange) filter.createdAt = createdAtRange;

    const users = await User.find(filter)
      .select("_id name email mobile active createdAt")
      .sort({ createdAt: -1 })
      .lean();

    const rows = users.map((u) => ({
      user_id: String(u._id),
      name: u.name || "",
      email: u.email || "",
      mobile: u.mobile || "",
      status: u.active ? "active" : "inactive",
      joined_at: u.createdAt ? new Date(u.createdAt).toISOString() : "",
    }));
    return sendDownload(res, rows, "user-report", fileFormat);
  } catch (e) {
    next(e);
  }
}

async function resolveDriverIdsByVehicleType(vehicleTypeId) {
  if (!vehicleTypeId) return null;
  const vId = toId(vehicleTypeId);
  if (!vId) return [];

  const [driverVehicleRows, fleetRows] = await Promise.all([
    DriverVehicleType.find({ vehicle_type_id: vId }).select("driver_id").lean(),
    Fleet.find({ vehicle_type: vId }).select("driver_id").lean(),
  ]);
  const ids = new Set();
  for (const row of driverVehicleRows) {
    if (row.driver_id) ids.add(String(row.driver_id));
  }
  for (const row of fleetRows) {
    if (row.driver_id) ids.add(String(row.driver_id));
  }
  return [...ids].map((x) => new mongoose.Types.ObjectId(x));
}

async function downloadDriverReport(req, res, next) {
  try {
    const fileFormat = parseFileFormat(req);
    const filter = {};

    if (req.query.transport_type) filter.transport_type = String(req.query.transport_type);

    const approvalBool = boolFromStatus(req.query.approval_status);
    if (typeof approvalBool === "boolean") filter.approve = approvalBool;

    const createdAtRange = dateRangeFromOption(req);
    if (createdAtRange?.error) {
      return res.status(422).json({ success: false, message: createdAtRange.error });
    }
    if (createdAtRange) filter.createdAt = createdAtRange;

    if (req.query.vehicle_type) {
      const matchedDriverIds = await resolveDriverIdsByVehicleType(req.query.vehicle_type);
      filter._id = { $in: matchedDriverIds };
    }

    const drivers = await Driver.find(filter)
      .select("_id name email mobile transport_type approve active createdAt fleet_id")
      .sort({ createdAt: -1 })
      .lean();

    const rows = drivers.map((d) => ({
      driver_id: String(d._id),
      name: d.name || "",
      email: d.email || "",
      mobile: d.mobile || "",
      transport_type: d.transport_type || "",
      approval_status: d.approve ? "approved" : "rejected",
      status: d.active ? "active" : "inactive",
      fleet_id: d.fleet_id ? String(d.fleet_id) : "",
      joined_at: d.createdAt ? new Date(d.createdAt).toISOString() : "",
    }));
    return sendDownload(res, rows, "driver-report", fileFormat);
  } catch (e) {
    next(e);
  }
}

async function downloadDriverDutyReport(req, res, next) {
  try {
    const fileFormat = parseFileFormat(req);
    const filter = {};

    if (req.query.driver) {
      const id = toId(req.query.driver);
      if (!id) return res.status(422).json({ success: false, message: "Invalid driver" });
      filter.driver_id = id;
    }
    if (req.query.service_location) {
      const id = toId(req.query.service_location);
      if (!id) {
        return res.status(422).json({ success: false, message: "Invalid service_location" });
      }
      filter.service_location_id = id;
    }

    const createdAtRange = dateRangeFromOption(req);
    if (createdAtRange?.error) {
      return res.status(422).json({ success: false, message: createdAtRange.error });
    }
    if (createdAtRange) filter.createdAt = createdAtRange;

    const requests = await Request.find(filter)
      .select(
        "_id request_number driver_id service_location_id pick_address drop_address is_completed is_cancelled createdAt completed_at cancelled_at"
      )
      .populate("driver_id", "name mobile")
      .populate("service_location_id", "name")
      .sort({ createdAt: -1 })
      .lean();

    const rows = requests.map((r) => ({
      trip_id: String(r._id),
      request_number: r.request_number || "",
      driver_name: r.driver_id?.name || "",
      driver_mobile: r.driver_id?.mobile || "",
      service_location: r.service_location_id?.name || "",
      pick_address: r.pick_address || "",
      drop_address: r.drop_address || "",
      trip_status: r.is_completed ? "completed" : r.is_cancelled ? "cancelled" : "ongoing",
      created_at: r.createdAt ? new Date(r.createdAt).toISOString() : "",
      completed_at: r.completed_at ? new Date(r.completed_at).toISOString() : "",
      cancelled_at: r.cancelled_at ? new Date(r.cancelled_at).toISOString() : "",
    }));
    return sendDownload(res, rows, "driver-duty-report", fileFormat);
  } catch (e) {
    next(e);
  }
}

async function downloadOwnerReport(req, res, next) {
  try {
    const fileFormat = parseFileFormat(req);
    const filter = {};

    if (req.query.service_location) {
      const id = toId(req.query.service_location);
      if (!id) {
        return res.status(422).json({ success: false, message: "Invalid service_location" });
      }
      filter.service_location_id = id;
    }

    const approvalBool = boolFromStatus(req.query.approval_status);
    if (typeof approvalBool === "boolean") filter.approve = approvalBool;

    const createdAtRange = dateRangeFromOption(req);
    if (createdAtRange?.error) {
      return res.status(422).json({ success: false, message: createdAtRange.error });
    }
    if (createdAtRange) filter.createdAt = createdAtRange;

    const owners = await Owner.find(filter)
      .select("_id owner_name name company_name email mobile approve active service_location_id createdAt")
      .populate("service_location_id", "name")
      .sort({ createdAt: -1 })
      .lean();

    const rows = owners.map((o) => ({
      owner_id: String(o._id),
      owner_name: o.owner_name || o.name || "",
      company_name: o.company_name || "",
      email: o.email || "",
      mobile: o.mobile || "",
      service_location: o.service_location_id?.name || "",
      approval_status: o.approve ? "approved" : "rejected",
      status: o.active ? "active" : "inactive",
      created_at: o.createdAt ? new Date(o.createdAt).toISOString() : "",
    }));
    return sendDownload(res, rows, "owner-report", fileFormat);
  } catch (e) {
    next(e);
  }
}

async function downloadFinanceReport(req, res, next) {
  try {
    const fileFormat = parseFileFormat(req);
    const filter = {};

    if (req.query.transport_type) filter.transport_type = String(req.query.transport_type);
    if (req.query.payment_type) filter.payment_opt = String(req.query.payment_type);
    if (req.query.trip_status) {
      const status = String(req.query.trip_status).toLowerCase();
      if (status === "completed") filter.is_completed = true;
      if (status === "cancelled") filter.is_cancelled = true;
    }

    if (req.query.vehicle_type) {
      const vId = toId(req.query.vehicle_type);
      if (!vId) return res.status(422).json({ success: false, message: "Invalid vehicle_type" });
      const fleets = await Fleet.find({ vehicle_type: vId }).select("_id").lean();
      filter.fleet_id = { $in: fleets.map((x) => x._id) };
    }

    const createdAtRange = dateRangeFromOption(req);
    if (createdAtRange?.error) {
      return res.status(422).json({ success: false, message: createdAtRange.error });
    }
    if (createdAtRange) filter.createdAt = createdAtRange;

    const requests = await Request.find(filter)
      .select(
        "_id request_number user_id driver_id owner_id fleet_id transport_type payment_opt total is_completed is_cancelled createdAt completed_at"
      )
      .populate("user_id", "name mobile")
      .populate("driver_id", "name mobile")
      .sort({ createdAt: -1 })
      .lean();

    const rows = requests.map((r) => ({
      trip_id: String(r._id),
      request_number: r.request_number || "",
      user_name: r.user_id?.name || "",
      user_mobile: r.user_id?.mobile || "",
      driver_name: r.driver_id?.name || "",
      driver_mobile: r.driver_id?.mobile || "",
      transport_type: r.transport_type || "",
      payment_type: r.payment_opt || "",
      amount: Number(r.total || 0),
      trip_status: r.is_completed ? "completed" : r.is_cancelled ? "cancelled" : "ongoing",
      created_at: r.createdAt ? new Date(r.createdAt).toISOString() : "",
      completed_at: r.completed_at ? new Date(r.completed_at).toISOString() : "",
    }));
    return sendDownload(res, rows, "finance-report", fileFormat);
  } catch (e) {
    next(e);
  }
}

async function downloadFleetFinanceReport(req, res, next) {
  try {
    const fileFormat = parseFileFormat(req);
    const filter = {};

    if (req.query.fleet_id) {
      const id = toId(req.query.fleet_id);
      if (!id) return res.status(422).json({ success: false, message: "Invalid fleet_id" });
      filter.fleet_id = id;
    }

    if (req.query.trip_status) {
      const status = String(req.query.trip_status).toLowerCase();
      if (status === "completed") filter.is_completed = true;
      if (status === "cancelled") filter.is_cancelled = true;
    }

    const createdAtRange = dateRangeFromOption(req);
    if (createdAtRange?.error) {
      return res.status(422).json({ success: false, message: createdAtRange.error });
    }
    if (createdAtRange) filter.createdAt = createdAtRange;

    const requests = await Request.find(filter)
      .select(
        "_id request_number fleet_id driver_id payment_opt total is_completed is_cancelled createdAt completed_at"
      )
      .populate("driver_id", "name mobile")
      .sort({ createdAt: -1 })
      .lean();

    const fleetIds = [...new Set(requests.map((x) => String(x.fleet_id || "")).filter(Boolean))];
    const fleetDocs = fleetIds.length
      ? await Fleet.find({ _id: { $in: fleetIds.map((x) => new mongoose.Types.ObjectId(x)) } })
          .select("_id fleet_id license_number")
          .lean()
      : [];
    const fleetMap = new Map(fleetDocs.map((x) => [String(x._id), x]));

    const rows = requests.map((r) => {
      const fleet = r.fleet_id ? fleetMap.get(String(r.fleet_id)) : null;
      return {
        trip_id: String(r._id),
        request_number: r.request_number || "",
        fleet_record_id: r.fleet_id ? String(r.fleet_id) : "",
        fleet_code: fleet?.fleet_id || "",
        license_number: fleet?.license_number || "",
        driver_name: r.driver_id?.name || "",
        driver_mobile: r.driver_id?.mobile || "",
        payment_type: r.payment_opt || "",
        amount: Number(r.total || 0),
        trip_status: r.is_completed ? "completed" : r.is_cancelled ? "cancelled" : "ongoing",
        created_at: r.createdAt ? new Date(r.createdAt).toISOString() : "",
        completed_at: r.completed_at ? new Date(r.completed_at).toISOString() : "",
      };
    });
    return sendDownload(res, rows, "fleet-finance-report", fileFormat);
  } catch (e) {
    next(e);
  }
}

module.exports = {
  reportOptions,
  downloadUserReport,
  downloadDriverReport,
  downloadDriverDutyReport,
  downloadOwnerReport,
  downloadFinanceReport,
  downloadFleetFinanceReport,
};
