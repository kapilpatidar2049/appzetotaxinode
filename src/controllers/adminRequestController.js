const mongoose = require("mongoose");
const Request = require("../models/Request");
const RequestMeta = require("../models/RequestMeta");
const RequestBill = require("../models/RequestBill");
const Driver = require("../models/Driver");
const User = require("../models/User");
const ServiceLocation = require("../models/ServiceLocation");
const VehicleType = require("../models/VehicleType");
const Zone = require("../models/Zone");
const SetPrice = require("../models/SetPrice");
const { setRealtimeValue, rtdbNow } = require("../services/firebaseAdmin");

function ok(res, data, message = "success") {
  return res.json({ success: true, message, data });
}

function err(res, status, message) {
  return res.status(status).json({ success: false, message });
}

function parsePage(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

function formatTimeForDisplay(date, timezone) {
  // For now just reuse ISO + substring; frontend can reformat if needed.
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString();
}

function formatDateOnly(date, timezone) {
  if (!date) return null;
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return null;
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

function computeTripStatus(r) {
  if (r.is_cancelled) return "Cancelled";
  if (r.is_completed) return "Completed";
  if (r.is_trip_start) return "On Trip";
  if (r.is_driver_arrived) return "Driver Arrived";
  if (r.driver_id) return "Driver Assigned";
  return "Searching";
}

function computeTripPayment(r, bill) {
  if (!r.is_paid) return "Not Paid";
  return "Paid";
}

function paymentOptionLabel(paymentOpt) {
  switch (String(paymentOpt)) {
    case "1":
    case "cash":
      return "Cash";
    case "2":
    case "wallet":
      return "Wallet";
    case "3":
    case "card":
      return "Card";
    default:
      return "Unknown";
  }
}

async function buildDetailedRequestObjects(items) {
  const requestIds = items.map((r) => r._id);
  const userIds = items.map((r) => r.user_id).filter(Boolean);
  const driverIds = items.map((r) => r.driver_id).filter(Boolean);
  const serviceLocationIds = items.map((r) => r.service_location_id).filter(Boolean);

  const [users, drivers, bills, serviceLocations] = await Promise.all([
    User.find({ _id: { $in: userIds } }).lean(),
    Driver.find({ _id: { $in: driverIds } }).lean(),
    RequestBill.find({ request_id: { $in: requestIds } }).lean(),
    ServiceLocation.find({ _id: { $in: serviceLocationIds } }).lean(),
  ]);

  const userMap = new Map(users.map((u) => [String(u._id), u]));
  const driverMap = new Map(drivers.map((d) => [String(d._id), d]));
  const billMap = new Map(bills.map((b) => [String(b.request_id), b]));
  const slMap = new Map(serviceLocations.map((s) => [String(s._id), s]));

  const zoneIds = [...new Set(items.map((r) => String(r.zone_type_id || "")).filter(Boolean))];
  const zones = zoneIds.length ? await Zone.find({ _id: { $in: zoneIds } }).lean() : [];
  const zoneMap = new Map(zones.map((z) => [String(z._id), z]));

  const setPriceRows = await Promise.all(
    items.map(async (r) => {
      const row = await SetPrice.findOne({
        zone_id: String(r.zone_id || r.zone_type_id || ""),
        transport_type: String(r.transport_type || "").toLowerCase(),
      }).lean();
      return [String(r._id), row];
    })
  );
  const setPriceMap = new Map(setPriceRows);

  const vehicleTypeIds = [
    ...new Set(
      [
        ...items.map((r) => String(r.vehicle_type_id || "")).filter(Boolean),
        ...Array.from(setPriceMap.values())
          .map((x) => (x ? String(x.vehicle_type || "") : ""))
          .filter(Boolean),
      ]
    ),
  ];
  const vehicleTypes = vehicleTypeIds.length
    ? await VehicleType.find({ _id: { $in: vehicleTypeIds } }).lean()
    : [];
  const vehicleTypeMap = new Map(vehicleTypes.map((v) => [String(v._id), v]));

  return items.map((r) => {
    const user = r.user_id ? userMap.get(String(r.user_id)) : null;
    const driver = r.driver_id ? driverMap.get(String(r.driver_id)) : null;
    const bill = billMap.get(String(r._id)) || null;
    const sl = r.service_location_id ? slMap.get(String(r.service_location_id)) : null;
    const zone = r.zone_type_id ? zoneMap.get(String(r.zone_type_id)) : null;
    const setPrice = setPriceMap.get(String(r._id)) || null;
    const vehicleTypeId = String(r.vehicle_type_id || setPrice?.vehicle_type || "");
    const vehicleType = vehicleTypeId ? vehicleTypeMap.get(vehicleTypeId) : null;

    const timezone = r.timezone || sl?.timezone || "UTC";
    const rideFare = bill ? bill.total_amount : null;
    const promoDiscount = bill ? bill.promo_discount || 0 : 0;

    return {
      ...r,
      user_profile: user?.profile_picture || null,
      vehicle_type_name: vehicleType?.name || null,
      vehicle_type_image: vehicleType?.image || vehicleType?.icon || null,
      vehicle_type_id: vehicleType?._id || null,
      user_name: user?.name || null,
      driver_name: driver?.name || null,
      ride_fare: rideFare,
      user_rating: user?.rating || null,
      driver_rating: driver?.rating || null,
      converted_trip_start_time: formatTimeForDisplay(r.trip_start_time, timezone),
      converted_arrived_at: formatTimeForDisplay(r.arrived_at, timezone),
      converted_accepted_at: formatTimeForDisplay(r.accepted_at, timezone),
      converted_completed_at: formatTimeForDisplay(r.completed_at, timezone),
      converted_cancelled_at: formatTimeForDisplay(r.cancelled_at, timezone),
      converted_created_at: formatTimeForDisplay(r.createdAt, timezone),
      converted_updated_at: formatTimeForDisplay(r.updatedAt, timezone),
      converted_return_time: formatTimeForDisplay(r.return_time, timezone),
      converted_trip_start_time_date: formatDateOnly(r.trip_start_time, timezone),
      trip_status: computeTripStatus(r),
      trip_payment: computeTripPayment(r, bill),
      payment_option: paymentOptionLabel(r.payment_opt),
      promo_discount: promoDiscount,
      user_detail: user
        ? {
            ...user,
            country_name: null,
            mobile_number: user.mobile ? `+${user.mobile}` : user.mobile,
            role_name: user.role || "user",
          }
        : null,
      driver_detail: driver
        ? {
            ...driver,
            service_location_name: sl?.name || null,
            profile_picture: null,
            vehicle_type_name: vehicleType?.name || null,
            car_make_name: driver.custom_make || null,
            car_model_name: driver.custom_model || null,
            vehicle_type_image: vehicleType?.image || vehicleType?.icon || null,
            vehicle_type_icon_for: vehicleType?.icon_types_for || null,
            mobile_number: driver.mobile ? `+${driver.mobile}` : driver.mobile,
          }
        : null,
      zone_type: setPrice
        ? {
            ...setPrice,
            zone_name: zone?.name || null,
            vehicle_type_name: vehicleType?.name || null,
            icon: vehicleType?.icon || vehicleType?.image || null,
            zone,
            vehicle_type: vehicleType || null,
          }
        : zone || null,
      request_place: {
        id: null,
        request_id: r._id,
        pick_lat: r.pick_lat,
        pick_lng: r.pick_lng,
        drop_lat: r.drop_lat,
        drop_lng: r.drop_lng,
        request_path: null,
        pick_address: r.pick_address,
        drop_address: r.drop_address,
        pickup_poc_name: null,
        drop_poc_name: null,
        pickup_poc_mobile: null,
        pickup_poc_instruction: null,
        drop_poc_mobile: null,
        drop_poc_instruction: null,
        created_at: r.createdAt,
        updated_at: r.updatedAt,
      },
      service_location_detail: sl
        ? {
            id: sl._id,
            company_key: null,
            name: sl.name,
            translation_dataset: null,
            currency_name: null,
            currency_code: sl.currency_code || null,
            currency_symbol: null,
            currency_pointer: "ltr",
            timezone: sl.timezone || timezone,
            country: sl.country_id || null,
            active: sl.active,
            created_at: sl.createdAt,
            updated_at: sl.updatedAt,
            deleted_at: null,
          }
        : null,
      request_bill: bill,
    };
  });
}

async function listRequests(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const {
      transport_type,
      service_location_id,
      status,
      search,
    } = req.query;

    const filter = {};

    if (transport_type) {
      filter.transport_type = String(transport_type);
    }
    if (service_location_id && mongoose.Types.ObjectId.isValid(service_location_id)) {
      filter.service_location_id = service_location_id;
    }

    if (status === "ongoing") {
      filter.is_completed = false;
      filter.is_cancelled = false;
    } else if (status === "completed") {
      filter.is_completed = true;
    } else if (status === "cancelled") {
      filter.is_cancelled = true;
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const or = [{ request_number: rx }];
      if (mongoose.Types.ObjectId.isValid(q)) {
        or.push({ _id: q });
      }
      const users = await User.find({
        $or: [{ mobile: rx }, { name: rx }],
      })
        .select("_id")
        .lean();
      if (users.length) {
        or.push({ user_id: { $in: users.map((u) => u._id) } });
      }
      filter.$or = or;
    }

    const [items, total] = await Promise.all([
      Request.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Request.countDocuments(filter),
    ]);

    const results = await buildDetailedRequestObjects(items);

    const paginator = {
      current_page: page,
      data: results,
      first_page_url: null,
      from: results.length ? 1 : 0,
      last_page: Math.ceil(total / limit) || 1,
      last_page_url: null,
      links: [],
      next_page_url: null,
      path: req.originalUrl.split("?")[0],
      per_page: limit,
      prev_page_url: null,
      to: results.length,
      total,
    };

    return ok(res, {
      results,
      paginator,
    });
  } catch (e) {
    next(e);
  }
}

async function listRequestsByPreset(req, res, next, preset) {
  try {
    const { page, limit, skip } = parsePage(req);
    const filter = {};
    if (preset === "trip") filter.transport_type = "taxi";
    if (preset === "delivery") filter.transport_type = "delivery";
    if (preset === "ongoing") {
      filter.is_completed = false;
      filter.is_cancelled = false;
    }

    const [items, total] = await Promise.all([
      Request.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Request.countDocuments(filter),
    ]);
    const results = await buildDetailedRequestObjects(items);
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

async function getRequestByPreset(req, res, next, preset) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid request id");
    const requestDoc = await Request.findById(id).lean();
    if (!requestDoc) return err(res, 404, "Request not found");

    if (preset === "trip" && String(requestDoc.transport_type || "").toLowerCase() !== "taxi") {
      return err(res, 404, "Trip request not found");
    }
    if (
      preset === "delivery" &&
      String(requestDoc.transport_type || "").toLowerCase() !== "delivery"
    ) {
      return err(res, 404, "Delivery request not found");
    }
    if (preset === "ongoing" && (requestDoc.is_completed || requestDoc.is_cancelled)) {
      return err(res, 404, "Ongoing request not found");
    }

    const [detailed] = await buildDetailedRequestObjects([requestDoc]);
    return ok(res, detailed);
  } catch (e) {
    next(e);
  }
}

async function listTripRequests(req, res, next) {
  return listRequestsByPreset(req, res, next, "trip");
}

async function getTripRequest(req, res, next) {
  return getRequestByPreset(req, res, next, "trip");
}

async function listDeliveryRequests(req, res, next) {
  return listRequestsByPreset(req, res, next, "delivery");
}

async function getDeliveryRequest(req, res, next) {
  return getRequestByPreset(req, res, next, "delivery");
}

async function listOngoingRequests(req, res, next) {
  return listRequestsByPreset(req, res, next, "ongoing");
}

async function getOngoingRequest(req, res, next) {
  return getRequestByPreset(req, res, next, "ongoing");
}

async function getRequest(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid request id");
    }

    const requestDoc = await Request.findById(id).lean();

    if (!requestDoc) {
      return err(res, 404, "Request not found");
    }

    const [detailed] = await buildDetailedRequestObjects([requestDoc]);
    return ok(res, detailed);
  } catch (e) {
    next(e);
  }
}

async function assignDriver(req, res, next) {
  try {
    const { id } = req.params;
    const { driver_id } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid request id");
    }
    if (!driver_id || !mongoose.Types.ObjectId.isValid(driver_id)) {
      return err(res, 422, "driver_id is required");
    }

    const requestDoc = await Request.findById(id);
    if (!requestDoc) {
      return err(res, 404, "Request not found");
    }

    if (requestDoc.is_cancelled || requestDoc.is_completed) {
      return err(res, 400, "Cannot assign: request ended");
    }
    if (requestDoc.driver_id) {
      return err(res, 400, "Cannot assign: driver already set on request");
    }

    const existingMeta = await RequestMeta.findOne({ request_id: id }).lean();
    if (existingMeta) {
      return err(res, 400, "Cannot assign: request meta already exists");
    }

    const driver = await Driver.findById(driver_id).lean();
    if (!driver) {
      return err(res, 404, "Driver not found");
    }

    await RequestMeta.create({
      request_id: requestDoc._id,
      user_id: requestDoc.user_id,
      driver_id: driver._id,
      active: true,
      assign_method: 1,
      transport_type: requestDoc.transport_type || "taxi",
    });

    requestDoc.accepted_ride_fare =
      requestDoc.accepted_ride_fare ?? requestDoc.offerred_ride_fare;
    requestDoc.is_bid_ride = false;
    await requestDoc.save();

    await setRealtimeValue(`request-meta/${id}`, {
      driver_id: String(driver._id),
      request_id: String(id),
      user_id: String(requestDoc.user_id),
      active: 1,
      transport_type: requestDoc.transport_type || "taxi",
      updated_at: rtdbNow(),
    });

    return ok(res, {
      message: "Driver assigned (meta created). Driver app should pick up from RTDB.",
      request_id: requestDoc._id,
      driver_id: driver._id,
    });
  } catch (e) {
    next(e);
  }
}

async function cancelRequest(req, res, next) {
  try {
    const { id } = req.params;
    const { cancel_reason } = req.body || {};

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid request id");
    }

    const requestDoc = await Request.findById(id);
    if (!requestDoc) {
      return err(res, 404, "Request not found");
    }
    if (requestDoc.is_cancelled) {
      return err(res, 400, "Already cancelled");
    }
    if (requestDoc.is_completed) {
      return err(res, 400, "Cannot cancel completed trip");
    }

    requestDoc.is_cancelled = true;
    requestDoc.cancelled_at = new Date();
    requestDoc.cancel_reason = cancel_reason || "Cancelled by admin";
    requestDoc.cancel_method = 0;
    await requestDoc.save();

    return ok(res, { request: requestDoc.toObject() }, "Request cancelled");
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listRequests,
  listTripRequests,
  getTripRequest,
  listDeliveryRequests,
  getDeliveryRequest,
  listOngoingRequests,
  getOngoingRequest,
  getRequest,
  assignDriver,
  cancelRequest,
};
