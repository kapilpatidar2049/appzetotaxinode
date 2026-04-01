const mongoose = require("mongoose");
const User = require("../models/User");
const Driver = require("../models/Driver");
const RewardPoint = require("../models/RewardPoint");
const RewardHistory = require("../models/RewardHistory");

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

async function ensureRewardPoint(userId, driverId) {
  const filter = { user_id: userId || undefined, driver_id: driverId || undefined };
  let doc = await RewardPoint.findOne(filter);
  if (!doc) {
    doc = await RewardPoint.create({
      user_id: userId || undefined,
      driver_id: driverId || undefined,
      points: 0,
      points_used: 0,
      points_balance: 0,
    });
  }
  return doc;
}

async function listRewardPoints(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const { type } = req.query; // user | driver | all
    const filter = {};
    if (type === "user") {
      filter.user_id = { $ne: null };
    } else if (type === "driver") {
      filter.driver_id = { $ne: null };
    }

    const [items, total] = await Promise.all([
      RewardPoint.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user_id", "name email mobile")
        .populate("driver_id", "name mobile email")
        .lean(),
      RewardPoint.countDocuments(filter),
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

async function getRewardPoint(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await RewardPoint.findById(id)
      .populate("user_id", "name email mobile")
      .populate("driver_id", "name mobile email")
      .lean();
    if (!doc) return err(res, 404, "Reward point not found");

    const history = await RewardHistory.find({
      $or: [{ user_id: doc.user_id }, { driver_id: doc.driver_id }],
    })
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return ok(res, { reward: doc, history });
  } catch (e) {
    next(e);
  }
}

async function adjustUserReward(req, res, next) {
  try {
    const { user_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(user_id)) return err(res, 400, "Invalid user id");

    const { points, notes } = req.body || {};
    const num = Number(points);
    if (!points || Number.isNaN(num) || !Number.isFinite(num)) {
      return err(res, 422, "Valid points is required");
    }

    const user = await User.findById(user_id).select("_id").lean();
    if (!user) return err(res, 404, "User not found");

    const rp = await ensureRewardPoint(user_id, null);
    rp.points = Number(rp.points || 0) + num;
    rp.points_balance = Number(rp.points_balance || 0) + num;
    if (num < 0) {
      rp.points_used = Number(rp.points_used || 0) + Math.abs(num);
    }
    await rp.save();

    const rh = await RewardHistory.create({
      user_id,
      reward_point_id: rp._id,
      points: num,
      amount: null,
      action: "ADMIN_ADJUSTMENT",
      notes: notes || null,
    });

    return ok(
      res,
      { user_id, reward_point_id: rp._id, points: num, balance: rp.points_balance, history_id: rh._id },
      "User reward adjusted"
    );
  } catch (e) {
    next(e);
  }
}

async function adjustDriverReward(req, res, next) {
  try {
    const { driver_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(driver_id)) return err(res, 400, "Invalid driver id");

    const { points, notes } = req.body || {};
    const num = Number(points);
    if (!points || Number.isNaN(num) || !Number.isFinite(num)) {
      return err(res, 422, "Valid points is required");
    }

    const driver = await Driver.findById(driver_id).select("_id").lean();
    if (!driver) return err(res, 404, "Driver not found");

    const rp = await ensureRewardPoint(null, driver_id);
    rp.points = Number(rp.points || 0) + num;
    rp.points_balance = Number(rp.points_balance || 0) + num;
    if (num < 0) {
      rp.points_used = Number(rp.points_used || 0) + Math.abs(num);
    }
    await rp.save();

    const rh = await RewardHistory.create({
      driver_id,
      reward_point_id: rp._id,
      points: num,
      amount: null,
      action: "ADMIN_ADJUSTMENT",
      notes: notes || null,
    });

    return ok(
      res,
      {
        driver_id,
        reward_point_id: rp._id,
        points: num,
        balance: rp.points_balance,
        history_id: rh._id,
      },
      "Driver reward adjusted"
    );
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listRewardPoints,
  getRewardPoint,
  adjustUserReward,
  adjustDriverReward,
};

