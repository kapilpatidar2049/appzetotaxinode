const Driver = require("../models/Driver");
const DriverDocument = require("../models/DriverDocument");
const DriverNeededDocument = require("../models/DriverNeededDocument");
const DriverWallet = require("../models/DriverWallet");
const DriverWalletHistory = require("../models/DriverWalletHistory");
const DriverSubscription = require("../models/DriverSubscription");
const DriverSubscriptionPlan = require("../models/DriverSubscriptionPlan");
const DriverIncentiveHistory = require("../models/DriverIncentiveHistory");
const DriverLevelUp = require("../models/DriverLevelUp");
const RewardHistory = require("../models/RewardHistory");
const RewardPoint = require("../models/RewardPoint");
const DriverBankInfo = require("../models/DriverBankInfo");
const DriverVehicleType = require("../models/DriverVehicleType");
const Request = require("../models/Request");
const User = require("../models/User");

function ok(res, data = null, message = "success") {
  return res.json({ success: true, message, data });
}

function fail(res, message = "Internal server error", code = 500) {
  return res.status(code).json({ success: false, message });
}

async function getDriverByUserId(userId) {
  
    return Driver.findOne({ user_id: userId }).lean();
  
}

async function getDriverWalletSnapshot(driverId) {
  const wallet = await DriverWallet.findOne({ driver_id: driverId }).lean();
  const lastTransactions = await DriverWalletHistory.find({ driver_id: driverId })
    .sort({ createdAt: -1 })
    .limit(5)
    .lean();
  return {
    wallet:
      wallet || {
        amount_added: 0,
        amount_balance: 0,
      },
    last_transactions: lastTransactions,
  };
}

// DriverDocumentController equivalents
async function documentsNeeded(req, res) {
  try {
    
      const rows = await DriverNeededDocument.find({ active: true }).sort({ createdAt: 1 }).lean();
      return ok(res, rows);
    
  } catch {
    return fail(res);
  }
}

async function uploadDocuments(req, res) {
  try {
    const userId = req.user?.id;
    const driver = await getDriverByUserId(userId);
    if (!driver) return fail(res, "Driver not found", 404);

    const { needed_document_id, document_image, document_name } = req.body || {};
    if (!needed_document_id) return fail(res, "needed_document_id is required", 422);

    
      await DriverDocument.create({
        driver_id: driver._id || driver.id,
        driver_needed_document_id: needed_document_id,
        document_name: document_name || null,
        document_path: document_image || null,
      });
    

    return ok(res, null, "Document uploaded successfully");
  } catch {
    return fail(res);
  }
}

async function diagnostics(req, res) {
  try {
    const userId = req.user?.id;
    const driver = await getDriverByUserId(userId);
    if (!driver) return fail(res, "Driver not found", 404);

    const documents = await DriverDocument.find({ driver_id: driver._id || driver.id })
      .sort({ createdAt: -1 })
      .lean();

    const vehicleTypes = await DriverVehicleType.find({ driver_id: driver._id || driver.id }).lean();
    const rewardPoint = await RewardPoint.findOne({ driver_id: driver._id || driver.id }).lean();
    const walletSnapshot = await getDriverWalletSnapshot(driver._id || driver.id);
    return ok(res, {
      driver,
      documents,
      vehicle_types: vehicleTypes,
      reward_point: rewardPoint,
      ...walletSnapshot,
    });
  } catch {
    return fail(res);
  }
}

async function listBankInfo(req, res) {
  try {
    const userId = req.user?.id;
    const driver = await getDriverByUserId(userId);
    if (!driver) return fail(res, "Driver not found", 404);
    
      const row = await DriverBankInfo.findOne({ driver_id: driver._id || driver.id }).lean();
      return ok(res, row || null, "bank info listed successfully");
    
  } catch {
    return fail(res);
  }
}

async function updateBankInfo(req, res) {
  try {
    const userId = req.user?.id;
    const driver = await getDriverByUserId(userId);
    if (!driver) return fail(res, "Driver not found", 404);

    const { account_name, account_no, bank_name, bank_code, ifsc_code } = req.body || {};

    
      await DriverBankInfo.findOneAndUpdate(
        { driver_id: driver._id || driver.id },
        {
          $set: {
            account_holder_name: account_name || null,
            account_number: account_no || null,
            bank_name: bank_name || null,
            routing_number: bank_code || null,
            ifsc_code: ifsc_code || null,
          },
        },
        { upsert: true, new: true }
      );
    
    return ok(res, null, "bank info updated successfully");
  } catch {
    return fail(res);
  }
}

// OnlineOfflineController equivalents
async function toggleOnlineOffline(req, res) {
  try {
    const userId = req.user?.id;
    const driver = await getDriverByUserId(userId);
    if (!driver) return fail(res, "Driver not found", 404);
    const next = driver.available ? 0 : 1;
    
      await Driver.updateOne({ _id: driver._id || driver.id }, { $set: { available: Boolean(next) } });
    
    return ok(res, { available: Boolean(next) });
  } catch {
    return fail(res);
  }
}

async function addMyRouteAddress(req, res) {
  try {
    const userId = req.user?.id;
    const driver = await getDriverByUserId(userId);
    if (!driver) return fail(res, "Driver not found", 404);
    const { my_route_lat, my_route_lng, my_route_address } = req.body || {};
    if (!my_route_lat || !my_route_lng) {
      return fail(res, "my_route_lat and my_route_lng are required", 422);
    }
    
      await Driver.updateOne(
        { _id: driver._id || driver.id },
        { $set: { my_route_lat, my_route_lng, my_route_address: my_route_address || null } }
      );
    
    return ok(res);
  } catch {
    return fail(res);
  }
}

async function enableMyRouteBooking(req, res) {
  try {
    const userId = req.user?.id;
    const driver = await getDriverByUserId(userId);
    if (!driver) return fail(res, "Driver not found", 404);
    const { enable_my_route_booking } = req.body || {};
    
      await Driver.updateOne(
        { _id: driver._id || driver.id },
        { $set: { enable_my_route_booking: Boolean(enable_my_route_booking) } }
      );
    
    return ok(res);
  } catch {
    return fail(res);
  }
}

// EarningsController equivalents
async function todayEarnings(req, res) {
  try {
    const userId = req.user?.id;
    const driver = await getDriverByUserId(userId);
    if (!driver) return fail(res, "Driver not found", 404);
    
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const rows = await Request.aggregate([
        {
          $match: {
            driver_id: driver._id || driver.id,
            is_completed: true,
            completed_at: { $gte: start, $lte: end },
          },
        },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$total", 0] } } } },
      ]);
      return ok(res, rows[0] || { total: 0 });
    
  } catch {
    return fail(res);
  }
}

async function weeklyEarnings(req, res) {
  try {
    const userId = req.user?.id;
    const driver = await getDriverByUserId(userId);
    if (!driver) return fail(res, "Driver not found", 404);
    
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const rows = await Request.aggregate([
        {
          $match: {
            driver_id: driver._id || driver.id,
            is_completed: true,
            completed_at: { $gte: since },
          },
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$completed_at" } },
            total: { $sum: { $ifNull: ["$total", 0] } },
          },
        },
        { $sort: { _id: -1 } },
      ]);
      return ok(
        res,
        rows.map((r) => ({ day: r._id, total: r.total }))
      );
  } catch {
    return fail(res);
  }
}

async function earningsReport(req, res) {
  try {
    const userId = req.user?.id;
    const driver = await getDriverByUserId(userId);
    if (!driver) return fail(res, "Driver not found", 404);
    const { from_date, to_date } = req.params;
    
      const from = new Date(from_date);
      const to = new Date(to_date);
      to.setHours(23, 59, 59, 999);
      const rows = await Request.find({
        driver_id: driver._id || driver.id,
        is_completed: true,
        completed_at: { $gte: from, $lte: to },
      })
        .sort({ completed_at: -1 })
        .lean();
      return ok(res, rows);
    
  } catch {
    return fail(res);
  }
}

async function historyReport(req, res) {
  try {
    const userId = req.user?.id;
    const driver = await getDriverByUserId(userId);
    if (!driver) return fail(res, "Driver not found", 404);
    const rows = await Request.find({ driver_id: driver._id || driver.id })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();
    return ok(res, rows);
  } catch {
    return fail(res);
  }
}

async function updatePrice(req, res) {
  try {
    const userId = req.user?.id;
    const driver = await getDriverByUserId(userId);
    if (!driver) return fail(res, "Driver not found", 404);
    const { price_per_distance } = req.body || {};
    if (price_per_distance == null) return fail(res, "price_per_distance is required", 422);
    
      await Driver.updateOne(
        { _id: driver._id || driver.id },
        { $set: { price_per_distance: Number(price_per_distance) } }
      );
    
    return ok(res);
  } catch {
    return fail(res);
  }
}

async function newEarnings(req, res) {
  
  try {
    const userId = req.user?.id;
    const driver = await getDriverByUserId(userId);
    if (!driver) return fail(res, "Driver not found", 404);
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const rows = await Request.aggregate([
      {
        $match: {
          driver_id: driver._id || driver.id,
          is_completed: true,
          completed_at: { $gte: start, $lte: end },
        },
      },
      { $group: { _id: null, total: { $sum: { $ifNull: ["$total", 0] } } } },
    ]);
    const walletSnapshot = await getDriverWalletSnapshot(driver._id || driver.id);
    return ok(res, { today_earnings: rows[0]?.total || 0, ...walletSnapshot });
  } catch {
    return fail(res);
  }
}

async function earningsByDate(req, res) {
  try {
    const userId = req.user?.id;
    const driver = await getDriverByUserId(userId);
    if (!driver) return fail(res, "Driver not found", 404);
    const { from_date, to_date } = req.body || {};
    if (!from_date || !to_date) return fail(res, "from_date and to_date are required", 422);
    
      const from = new Date(from_date);
      const to = new Date(to_date);
      to.setHours(23, 59, 59, 999);
      const rows = await Request.find({
        driver_id: driver._id || driver.id,
        is_completed: true,
        completed_at: { $gte: from, $lte: to },
      })
        .sort({ completed_at: -1 })
        .lean();
      return ok(res, rows);
    
  } catch {
    return fail(res);
  }
}

async function allEarnings(req, res) {
  try {
    const userId = req.user?.id;
    const driver = await getDriverByUserId(userId);
    if (!driver) return fail(res, "Driver not found", 404);
    
      const rows = await Request.aggregate([
        { $match: { driver_id: driver._id || driver.id, is_completed: true } },
        { $group: { _id: null, total: { $sum: { $ifNull: ["$total", 0] } } } },
      ]);
      return ok(res, rows[0] || { total: 0 });
    
  } catch {
    return fail(res);
  }
}

async function leaderBoardTrips(req, res) {
  try {
    
      const rows = await Request.aggregate([
        { $match: { is_completed: true } },
        { $group: { _id: "$driver_id", trips: { $sum: 1 } } },
        { $sort: { trips: -1 } },
        { $limit: 20 },
      ]);
      const driverIds = rows.map((r) => r._id);
      const drivers = await Driver.find({ _id: { $in: driverIds } }).lean();
      const users = await User.find({ _id: { $in: drivers.map((d) => d.user_id).filter(Boolean) } }).lean();
      const userMap = new Map(users.map((u) => [String(u._id), u]));
      const driverMap = new Map(drivers.map((d) => [String(d._id), d]));
      return ok(
        res,
        rows.map((r) => {
          const driver = driverMap.get(String(r._id));
          const user = driver ? userMap.get(String(driver.user_id)) : null;
          return { driver_id: r._id, name: user?.name || null, trips: r.trips };
        })
      );
  } catch {
    return fail(res);
  }
}

async function leaderBoardEarnings(req, res) {
  try {
    
      const rows = await Request.aggregate([
        { $match: { is_completed: true } },
        { $group: { _id: "$driver_id", earnings: { $sum: { $ifNull: ["$total", 0] } } } },
        { $sort: { earnings: -1 } },
        { $limit: 20 },
      ]);
      const driverIds = rows.map((r) => r._id);
      const drivers = await Driver.find({ _id: { $in: driverIds } }).lean();
      const users = await User.find({ _id: { $in: drivers.map((d) => d.user_id).filter(Boolean) } }).lean();
      const userMap = new Map(users.map((u) => [String(u._id), u]));
      const driverMap = new Map(drivers.map((d) => [String(d._id), d]));
      return ok(
        res,
        rows.map((r) => {
          const driver = driverMap.get(String(r._id));
          const user = driver ? userMap.get(String(driver.user_id)) : null;
          return { driver_id: r._id, name: user?.name || null, earnings: r.earnings };
        })
      );
  } catch {
    return fail(res);
  }
}

async function invoiceHistory(req, res) {
  try {
    const userId = req.user?.id;
    const driver = await getDriverByUserId(userId);
    if (!driver) return fail(res, "Driver not found", 404);
    const rows = await Request.find({ driver_id: driver._id || driver.id, is_completed: true })
      .sort({ completed_at: -1 })
      .limit(100)
      .select({ request_number: 1, total: 1, completed_at: 1 })
      .lean();
    return ok(res, rows);
  } catch {
    return fail(res);
  }
}

// SubscriptionController equivalents
async function listOfPlans(req, res) {
  try {
    const rows = await DriverSubscriptionPlan.find({ active: true })
      .sort({ createdAt: -1 })
      .lean();
    return ok(res, rows);
  } catch {
    return fail(res);
  }
}

async function subscribe(req, res) {
  try {
    const userId = req.user?.id;
    const driver = await getDriverByUserId(userId);
    if (!driver) return fail(res, "Driver not found", 404);
    const { subscription_detail_id } = req.body || {};
    if (!subscription_detail_id) return fail(res, "subscription_detail_id is required", 422);
    if (!mongoose.Types.ObjectId.isValid(subscription_detail_id)) {
      return fail(res, "Invalid subscription_detail_id", 422);
    }
    const plan = await DriverSubscriptionPlan.findById(subscription_detail_id).lean();
    if (!plan || !plan.active) return fail(res, "Subscription plan not found", 404);

    
      await DriverSubscription.create({
        driver_id: driver._id || driver.id,
        subscription_detail_id,
        active: true,
        starts_at: new Date(),
        ends_at: new Date(
          Date.now() + Number(plan.subscription_duration || 0) * 24 * 60 * 60 * 1000
        ),
        amount: Number(plan.amount || 0),
      });
      await Driver.updateOne(
        { _id: driver._id || driver.id },
        { $set: { is_subscribed: true, subscription_detail_id } }
      );
    

    return ok(res, null, "Subscribed successfully");
  } catch {
    return fail(res);
  }
}

// IncentiveController equivalents
async function newIncentives(req, res) {
  try {
    const userId = req.user?.id;
    
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);
      const rows = await DriverIncentiveHistory.find({
        user_id: userId,
        createdAt: { $gte: start, $lte: end },
      })
        .sort({ createdAt: -1 })
        .lean();
      return ok(res, rows);
    
  } catch {
    return fail(res);
  }
}

async function weekIncentives(req, res) {
  try {
    const userId = req.user?.id;
    
      const since = new Date();
      since.setDate(since.getDate() - 7);
      const rows = await DriverIncentiveHistory.find({
        user_id: userId,
        createdAt: { $gte: since },
      })
        .sort({ createdAt: -1 })
        .lean();
      return ok(res, rows);
    
  } catch {
    return fail(res);
  }
}

// DriverLevelController equivalents
async function loyaltyHistory(req, res) {
  try {
    const userId = req.user?.id;
    const rows = await DriverLevelUp.find({ user_id: userId }).sort({ createdAt: -1 }).lean();
    return ok(res, rows);
  } catch {
    return fail(res);
  }
}

async function rewardsHistory(req, res) {
  try {
    const userId = req.user?.id;
    
      const driver = await getDriverByUserId(userId);
      const rows = await RewardHistory.find({ user_id: userId }).sort({ createdAt: -1 }).lean();
      const rewardPoint = driver
        ? await RewardPoint.findOne({ driver_id: driver._id || driver.id }).lean()
        : null;
      return ok(res, { history: rows, balance: rewardPoint || { points_balance: 0 } });
    
  } catch {
    return fail(res);
  }
}

module.exports = {
  documentsNeeded,
  uploadDocuments,
  diagnostics,
  toggleOnlineOffline,
  addMyRouteAddress,
  enableMyRouteBooking,
  todayEarnings,
  weeklyEarnings,
  earningsReport,
  historyReport,
  updatePrice,
  newEarnings,
  earningsByDate,
  allEarnings,
  leaderBoardTrips,
  leaderBoardEarnings,
  invoiceHistory,
  listOfPlans,
  subscribe,
  newIncentives,
  weekIncentives,
  listBankInfo,
  updateBankInfo,
  loyaltyHistory,
  rewardsHistory,
};

