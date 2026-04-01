const mongoose = require("mongoose");
const Request = require("../models/Request");
const RequestMeta = require("../models/RequestMeta");
const RequestBill = require("../models/RequestBill");
const Driver = require("../models/Driver");
const User = require("../models/User");
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
        .populate("user_id", "name email mobile")
        .populate({
          path: "driver_id",
          select: "name mobile email user_id car_number",
          populate: { path: "user_id", select: "name mobile" },
        })
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

async function getRequest(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid request id");
    }

    const requestDoc = await Request.findById(id)
      .populate("user_id")
      .populate({
        path: "driver_id",
        populate: { path: "user_id", select: "name email mobile fcm_token" },
      })
      .populate("owner_id")
      .lean();

    if (!requestDoc) {
      return err(res, 404, "Request not found");
    }

    const [bill, meta] = await Promise.all([
      RequestBill.findOne({ request_id: id }).lean(),
      RequestMeta.find({ request_id: id }).sort({ createdAt: -1 }).lean(),
    ]);

    return ok(res, {
      request: requestDoc,
      bill: bill || null,
      request_meta: meta,
    });
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
  getRequest,
  assignDriver,
  cancelRequest,
};
