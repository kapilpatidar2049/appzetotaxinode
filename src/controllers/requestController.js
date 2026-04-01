const config = require("../config");
const GoodsType = require("../models/GoodsType");
const ServiceLocation = require("../models/ServiceLocation");
const RecentSearch = require("../models/RecentSearch");
const Promo = require("../models/Promo");
const User = require("../models/User");
const Request = require("../models/Request");
const DriverRejectedRequest = require("../models/DriverRejectedRequest");
const RequestStop = require("../models/RequestStop");
const RequestRating = require("../models/RequestRating");
const RequestMeta = require("../models/RequestMeta");
const RequestBill = require("../models/RequestBill");
const RequestDeliveryProof = require("../models/RequestDeliveryProof");
const Chat = require("../models/Chat");
const VehicleType = require("../models/VehicleType");
const SubVehicleType = require("../models/SubVehicleType");

function ok(res, data = null, message = "success") {
  return res.json({ success: true, message, data });
}

function fail(res, message = "Internal server error", code = 500) {
  return res.status(code).json({ success: false, message });
}

async function getRequestByIdForUser(requestId, userId) {
  
    return Request.findOne({ _id: requestId, user_id: userId }).lean();
  
}

async function getRequestById(requestId) {
  
    return Request.findById(requestId).lean();
  
}

// ETA / PACKAGES
async function listPackages(req, res) {
  try {
    
      const rows = await GoodsType.find({ active: true }).select({ name: 1, description: 1, active: 1 }).lean();
      return ok(res, rows);
    
  } catch (e) {
    return fail(res);
  }
}

async function eta(req, res) {
  try {
    const { pick_lat, pick_lng, drop_lat, drop_lng } = req.body || {};
    if (!pick_lat || !pick_lng || !drop_lat || !drop_lng) {
      return fail(
        res,
        "pick_lat, pick_lng, drop_lat, drop_lng are required",
        422
      );
    }

    // Placeholder calculation; replace with real distance matrix integration.
    const distanceKm = Number(
      (
        Math.sqrt(
          Math.pow(drop_lat - pick_lat, 2) + Math.pow(drop_lng - pick_lng, 2)
        ) * 111
      ).toFixed(2)
    );
    const etaMinutes = Math.max(1, Math.round((distanceKm / 30) * 60));

    return ok(res, {
      distance_km: distanceKm,
      eta_minutes: etaMinutes,
    });
  } catch (e) {
    return fail(res);
  }
}

async function updateEtaAmount(req, res) {
  try {
    const { request_id, total } = req.body || {};
    if (!request_id || total == null) {
      return fail(res, "request_id and total are required", 422);
    }
    await Request.updateOne({ _id: request_id }, { $set: { total: Number(total) } });
    return ok(res);
  } catch (e) {
    return fail(res);
  }
}

async function serviceVerify(req, res) {
  try {
    const { service_location_id } = req.body || {};
    if (!service_location_id) return fail(res, "service_location_id is required", 422);
    
      const row = await ServiceLocation.findById(service_location_id)
        .select({ name: 1, active: 1 })
        .lean();
      if (!row) return fail(res, "Service location not found", 404);
      return ok(res, row);
  } catch (e) {
    return fail(res);
  }
}

async function recentSearches(req, res) {
  try {
    const userId = req.user?.id;
    
      const rows = await RecentSearch.find({ user_id: userId })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean();
      return ok(res, rows);
    
  } catch (e) {
    return fail(res);
  }
}

async function getDirections(req, res) {
  try {
    // Kept simple until map integration is ported.
    return ok(res, { polyline: null, provider: "pending-map-integration" });
  } catch (e) {
    return fail(res);
  }
}

async function changeDropLocation(req, res) {
  try {
    const userId = req.user?.id;
    const { request_id, drop_lat, drop_lng, drop_address } = req.body || {};
    if (!request_id || !drop_lat || !drop_lng) {
      return fail(res, "request_id, drop_lat and drop_lng are required", 422);
    }
    const reqRow = await getRequestByIdForUser(request_id, userId);
    if (!reqRow) return fail(res, "Request not found", 404);

    
      await Request.updateOne(
        { _id: request_id },
        {
          $set: {
            drop_lat,
            drop_lng,
            drop_address: drop_address || reqRow.drop_address || null,
          },
        }
      );
    

    return ok(res);
  } catch (e) {
    return fail(res);
  }
}

// PROMOCODE
async function promoList(req, res) {
  try {
    
      const rows = await Promo.find({ active: true }).sort({ createdAt: -1 }).lean();
      return ok(res, rows);
    
  } catch (e) {
    return fail(res);
  }
}

async function promoRedeem(req, res) {
  try {
    const userId = req.user?.id;
    const { promo_code } = req.body || {};
    if (!promo_code) return fail(res, "promo_code is required", 422);
    let promo;
    
      promo = await Promo.findOne({ code: promo_code, active: true })
        .select({ code: 1, amount: 1, percentage: 1 })
        .lean();
      if (!promo) return fail(res, "Invalid promo code", 422);
      await User.updateOne({ _id: userId }, { $set: { promo_code: promo._id } });
    
    return ok(res, promo, "Promo code redeemed");
  } catch (e) {
    return fail(res);
  }
}

async function promoClear(req, res) {
  try {
    const userId = req.user?.id;
    
      await User.updateOne({ _id: userId }, { $set: { promo_code: null } });
    
    return ok(res, null, "Promo code cleared");
  } catch (e) {
    return fail(res);
  }
}

// CREATE REQUESTS
async function createRequest(req, res) {
  try {
    const userId = req.user?.id;
    const {
      pick_lat,
      pick_lng,
      pick_address,
      drop_lat,
      drop_lng,
      drop_address,
      payment_opt,
      vehicle_type,
    } = req.body || {};

    if (!pick_lat || !pick_lng || !pick_address) {
      return fail(res, "pickup details are required", 422);
    }

    
      const created = await Request.create({
        user_id: userId,
        pick_lat,
        pick_lng,
        pick_address,
        drop_lat: drop_lat || null,
        drop_lng: drop_lng || null,
        drop_address: drop_address || null,
        payment_opt: payment_opt || null,
        vehicle_type: vehicle_type || null,
        transport_type: "taxi",
      });
      await RequestMeta.create({
        request_id: created._id,
        user_id: userId,
        active: true,
        transport_type: "taxi",
      });
      return ok(res, { request_id: created._id }, "Request created");
    
  } catch (e) {
    return fail(res);
  }
}

async function createDeliveryRequest(req, res) {
  return createRequest(req, res);
}

async function respondForBid(req, res) {
  try {
    const { request_id, accepted_ride_fare } = req.body || {};
    if (!request_id || !accepted_ride_fare) {
      return fail(res, "request_id and accepted_ride_fare are required", 422);
    }
    
      await Request.updateOne(
        { _id: request_id },
        { $set: { accepted_ride_fare, is_bid_ride: true } }
      );
    
    return ok(res);
  } catch (e) {
    return fail(res);
  }
}

// USER CANCEL + PAYMENT
async function cancelByUser(req, res) {
  try {
    const userId = req.user?.id;
    const { request_id, cancel_reason } = req.body || {};
    if (!request_id) return fail(res, "request_id is required", 422);
    const row = await getRequestByIdForUser(request_id, userId);
    if (!row) return fail(res, "Request not found", 404);
    
      await Request.updateOne(
        { _id: request_id },
        {
          $set: {
            is_cancelled: true,
            cancelled_by_user: true,
            cancel_reason: cancel_reason || null,
            cancelled_at: new Date(),
          },
        }
      );
    
    return ok(res, null, "Request cancelled successfully");
  } catch (e) {
    return fail(res);
  }
}

async function userPaymentMethod(req, res) {
  try {
    const { request_id, payment_opt } = req.body || {};
    if (!request_id || !payment_opt) return fail(res, "request_id and payment_opt are required", 422);
    
      await Request.updateOne({ _id: request_id }, { $set: { payment_opt } });
    
    return ok(res);
  } catch (e) {
    return fail(res);
  }
}

async function userPaymentConfirm(req, res) {
  try {
    const { request_id } = req.body || {};
    if (!request_id) return fail(res, "request_id is required", 422);
    
      await Request.updateOne(
        { _id: request_id },
        { $set: { payment_confirmed: true, payment_confirmed_at: new Date() } }
      );
    
    return ok(res);
  } catch (e) {
    return fail(res);
  }
}

async function driverTip(req, res) {
  try {
    const { request_id, tip_amount } = req.body || {};
    if (!request_id || tip_amount == null) return fail(res, "request_id and tip_amount are required", 422);
    
      await Request.updateOne({ _id: request_id }, { $set: { driver_tip: tip_amount } });
    
    return ok(res);
  } catch (e) {
    return fail(res);
  }
}

// DRIVER FLOW
async function createInstantRide(req, res) {
  return createRequest(req, res);
}

async function createDeliveryInstantRide(req, res) {
  return createDeliveryRequest(req, res);
}

async function respondRequest(req, res) {
  try {
    const { request_id, is_accept } = req.body || {};
    const driverId = req.user?.id;
    if (!request_id || typeof is_accept === "undefined") {
      return fail(res, "request_id and is_accept are required", 422);
    }
    if (Number(is_accept) === 1) {
      
        await Request.updateOne(
          { _id: request_id },
          { $set: { driver_id: driverId, is_driver_started: false } }
        );
        await RequestMeta.findOneAndUpdate(
          { request_id },
          { $set: { driver_id: driverId, active: true } },
          { upsert: true, new: true }
        );
      
      return ok(res, null, "Request accepted");
    }
    
      await DriverRejectedRequest.create({ request_id, driver_id: driverId });
    
    return ok(res, null, "Request rejected");
  } catch (e) {
    return fail(res);
  }
}

async function arrivedRequest(req, res) {
  try {
    const { request_id } = req.body || {};
    if (!request_id) return fail(res, "request_id is required", 422);
    
      await Request.updateOne(
        { _id: request_id },
        { $set: { is_driver_arrived: true, arrived_at: new Date() } }
      );
    
    return ok(res);
  } catch (e) {
    return fail(res);
  }
}

async function tripStart(req, res) {
  try {
    const { request_id } = req.body || {};
    if (!request_id) return fail(res, "request_id is required", 422);
    
      await Request.updateOne(
        { _id: request_id },
        { $set: { is_driver_started: true, trip_start_time: new Date() } }
      );
    
    return ok(res);
  } catch (e) {
    return fail(res);
  }
}

async function cancelByDriver(req, res) {
  try {
    const { request_id, cancel_reason } = req.body || {};
    if (!request_id) return fail(res, "request_id is required", 422);
    
      await Request.updateOne(
        { _id: request_id },
        {
          $set: {
            is_cancelled: true,
            cancelled_by_driver: true,
            cancel_reason: cancel_reason || null,
            cancelled_at: new Date(),
          },
        }
      );
    
    return ok(res, null, "Request cancelled successfully");
  } catch (e) {
    return fail(res);
  }
}

async function endRequest(req, res) {
  try {
    const { request_id, total_amount } = req.body || {};
    if (!request_id) return fail(res, "request_id is required", 422);
    
      const $set = { is_completed: true, completed_at: new Date() };
      if (total_amount != null) $set.total = total_amount;
      await Request.updateOne({ _id: request_id }, { $set });
      const total = Number(total_amount || 0);
      await RequestBill.findOneAndUpdate(
        { request_id },
        {
          $set: {
            total_amount: total,
            payable_amount: total,
          },
        },
        { upsert: true, new: true }
      );
    
    return ok(res, null, "Trip ended");
  } catch (e) {
    return fail(res);
  }
}

async function tripMeterRideUpdate(req, res) {
  try {
    const { request_id, distance_travelled } = req.body || {};
    if (!request_id || distance_travelled == null) return fail(res, "request_id and distance_travelled are required", 422);
    
      await Request.updateOne({ _id: request_id }, { $set: { total_distance: distance_travelled } });
    
    return ok(res);
  } catch (e) {
    return fail(res);
  }
}

async function uploadProof(req, res) {
  try {
    const { request_id, proof_image } = req.body || {};
    if (!request_id) return fail(res, "request_id is required", 422);
    
      await Request.updateOne({ _id: request_id }, { $set: { delivery_proof: proof_image || null } });
      const reqRow = await Request.findById(request_id).select({ driver_id: 1 }).lean();
      await RequestDeliveryProof.findOneAndUpdate(
        { request_id },
        {
          $set: {
            driver_id: reqRow?.driver_id || null,
            file_path: proof_image || null,
            file_type: "image",
          },
        },
        { upsert: true, new: true }
      );
    
    return ok(res, null, "Proof uploaded");
  } catch (e) {
    return fail(res);
  }
}

async function paymentConfirm(req, res) {
  return userPaymentConfirm(req, res);
}

async function paymentMethod(req, res) {
  return userPaymentMethod(req, res);
}

async function readyToPickup(req, res) {
  try {
    const { request_id } = req.body || {};
    if (!request_id) return fail(res, "request_id is required", 422);
    
      await Request.updateOne({ _id: request_id }, { $set: { ready_to_pickup: true } });
    
    return ok(res);
  } catch (e) {
    return fail(res);
  }
}

async function tripEndByStop(req, res) {
  try {
    const { request_id, stop_id } = req.body || {};
    if (!request_id || !stop_id) return fail(res, "request_id and stop_id are required", 422);
    
      await RequestStop.updateOne(
        { _id: stop_id, request_id },
        { $set: { is_completed: true, completed_at: new Date() } }
      );
    
    return ok(res);
  } catch (e) {
    return fail(res);
  }
}

async function stopOtpVerify(req, res) {
  try {
    const { request_id, otp } = req.body || {};
    if (!request_id || !otp) return fail(res, "request_id and otp are required", 422);
    const row = await Request.findById(request_id).select({ ride_otp: 1 }).lean();
    if (!row) return fail(res, "Request not found", 404);
    if (String(row.ride_otp || "") !== String(otp)) return fail(res, "Invalid OTP", 422);
    return ok(res);
  } catch (e) {
    return fail(res);
  }
}

async function additionalChargeUpdate(req, res) {
  try {
    const { request_id, additional_charge } = req.body || {};
    if (!request_id || additional_charge == null) return fail(res, "request_id and additional_charge are required", 422);
    
      await Request.updateOne({ _id: request_id }, { $set: { additional_charge } });
    
    return ok(res);
  } catch (e) {
    return fail(res);
  }
}

// HISTORY, INVOICE, RATING
async function history(req, res) {
  try {
    const userId = req.user?.id;
    const rows = await Request.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return ok(res, rows);
  } catch (e) {
    return fail(res);
  }
}

async function historyById(req, res) {
  try {
    const userId = req.user?.id;
    const { id } = req.params;
    const row = await Request.findOne({ _id: id, user_id: userId }).lean();
    if (!row) return fail(res, "Request not found", 404);
    return ok(res, row);
  } catch (e) {
    return fail(res);
  }
}

async function invoice(req, res) {
  try {
    const userId = req.user?.id;
    const { requestmodel } = req.params;
    const row = await Request.findOne({ _id: requestmodel, user_id: userId }).lean();
    if (!row) return fail(res, "Request not found", 404);
    return ok(res, row);
  } catch (e) {
    return fail(res);
  }
}

async function rateRequest(req, res) {
  try {
    const userId = req.user?.id;
    const { request_id, rating, feedback } = req.body || {};
    if (!request_id || !rating) return fail(res, "request_id and rating are required", 422);

    
      await RequestRating.findOneAndUpdate(
        { request_id, user_id: userId },
        { $set: { rating, feedback: feedback || null } },
        { upsert: true, new: true }
      );
    
    return ok(res, null, "Rating submitted");
  } catch (e) {
    return fail(res);
  }
}

// CHAT
async function chatHistory(req, res) {
  try {
    const { request: requestId } = req.params;
    const rows = await Chat.find({ request_id: requestId }).sort({ createdAt: 1 }).lean();
    return ok(res, rows);
  } catch (e) {
    return fail(res);
  }
}

async function chatSeen(req, res) {
  try {
    const { request_id } = req.body || {};
    const userId = req.user?.id;
    if (!request_id) return fail(res, "request_id is required", 422);
    
      await Chat.updateMany(
        { request_id, receiver_id: userId },
        { $set: { is_seen: true, seen_at: new Date() } }
      );
    
    return ok(res);
  } catch (e) {
    return fail(res);
  }
}

async function chatSend(req, res) {
  try {
    const senderId = req.user?.id;
    const { request_id, receiver_id, message } = req.body || {};
    if (!request_id || !receiver_id || !message) {
      return fail(res, "request_id, receiver_id and message are required", 422);
    }
    
      const created = await Chat.create({
        request_id,
        sender_id: senderId,
        receiver_id,
        message,
        is_seen: false,
      });
      return ok(res, { id: created._id }, "Message sent");
    
  } catch (e) {
    return fail(res);
  }
}

async function userChatHistory(req, res) {
  try {
    const userId = req.user?.id;
    const rows = await Chat.aggregate([
      { $match: { $or: [{ sender_id: userId }, { receiver_id: userId }] } },
      { $group: { _id: "$request_id", last_chat_time: { $max: "$createdAt" } } },
      { $sort: { last_chat_time: -1 } },
      { $project: { _id: 0, request_id: "$_id", last_chat_time: 1 } },
    ]);
    return ok(res, rows);
  } catch (e) {
    return fail(res);
  }
}

async function userSendMessage(req, res) {
  return chatSend(req, res);
}

async function updateNotificationCount(req, res) {
  try {
    const userId = req.user?.id;
    const { request_id } = req.body || {};
    if (request_id) {
      await Chat.updateMany(
        { request_id, receiver_id: userId },
        { $set: { is_seen: true, seen_at: new Date() } }
      );
    }
    const unread_count = await Chat.countDocuments({ receiver_id: userId, is_seen: false });
    return ok(res, { unread_count });
  } catch (e) {
    return fail(res);
  }
}

async function vehiclePricingOptions(req, res) {
  try {
    const types = await VehicleType.find({ active: true }).sort({ order: 1, name: 1 }).lean();
    const subRows = await SubVehicleType.find({ active: true }).sort({ order: 1, name: 1 }).lean();
    const subByVt = new Map();
    for (const s of subRows) {
      const k = String(s.vehicle_type_id);
      if (!subByVt.has(k)) subByVt.set(k, []);
      subByVt.get(k).push(s);
    }
    const data = types.map((t) => ({
      ...t,
      sub_vehicle_types: subByVt.get(String(t._id)) || [],
    }));
    return ok(res, data);
  } catch (e) {
    return fail(res);
  }
}

async function outstationRides(req, res) {
  try {
    const userId = req.user?.id;
    const rows = await Request.find({ user_id: userId, is_outstation: true })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();
    return ok(res, rows);
  } catch (e) {
    return fail(res);
  }
}

module.exports = {
  listPackages,
  promoList,
  promoRedeem,
  promoClear,
  createRequest,
  createDeliveryRequest,
  changeDropLocation,
  cancelByUser,
  respondForBid,
  userPaymentMethod,
  userPaymentConfirm,
  driverTip,
  eta,
  updateEtaAmount,
  serviceVerify,
  recentSearches,
  getDirections,
  createInstantRide,
  createDeliveryInstantRide,
  respondRequest,
  arrivedRequest,
  tripStart,
  cancelByDriver,
  endRequest,
  tripMeterRideUpdate,
  uploadProof,
  paymentConfirm,
  paymentMethod,
  readyToPickup,
  tripEndByStop,
  stopOtpVerify,
  additionalChargeUpdate,
  history,
  historyById,
  invoice,
  rateRequest,
  chatHistory,
  chatSend,
  chatSeen,
  userChatHistory,
  userSendMessage,
  updateNotificationCount,
  vehiclePricingOptions,
  outstationRides,
};

