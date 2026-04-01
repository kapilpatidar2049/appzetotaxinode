const mongoose = require("mongoose");
const User = require("../models/User");
const Driver = require("../models/Driver");
const Owner = require("../models/Owner");
const UserWallet = require("../models/UserWallet");
const DriverWallet = require("../models/DriverWallet");
const UserWalletHistory = require("../models/UserWalletHistory");
const DriverWalletHistory = require("../models/DriverWalletHistory");
const WalletWithdrawalRequest = require("../models/WalletWithdrawalRequest");

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

async function ensureUserWallet(userId) {
  let wallet = await UserWallet.findOne({ user_id: userId });
  if (!wallet) {
    wallet = await UserWallet.create({ user_id: userId, amount_added: 0, amount_balance: 0 });
  }
  return wallet;
}

async function ensureDriverWallet(driverId) {
  let wallet = await DriverWallet.findOne({ driver_id: driverId });
  if (!wallet) {
    wallet = await DriverWallet.create({ driver_id: driverId, amount_added: 0, amount_balance: 0 });
  }
  return wallet;
}

// User wallet list + details
async function listUserWallets(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const [items, total] = await Promise.all([
      UserWallet.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user_id", "name email mobile")
        .lean(),
      UserWallet.countDocuments({}),
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

async function getUserWallet(req, res, next) {
  try {
    const { user_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(user_id)) return err(res, 400, "Invalid user id");

    const [user, wallet, history] = await Promise.all([
      User.findById(user_id).select("name email mobile").lean(),
      UserWallet.findOne({ user_id }).lean(),
      UserWalletHistory.find({ user_id }).sort({ createdAt: -1 }).limit(100).lean(),
    ]);

    if (!user) return err(res, 404, "User not found");

    return ok(res, {
      user,
      wallet: wallet || null,
      history,
    });
  } catch (e) {
    next(e);
  }
}

// Admin credit/debit user wallet
async function adjustUserWallet(req, res, next) {
  try {
    const { user_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(user_id)) return err(res, 400, "Invalid user id");

    const { amount, remarks } = req.body || {};
    const num = Number(amount);
    if (!amount || Number.isNaN(num) || !Number.isFinite(num)) {
      return err(res, 422, "Valid amount is required");
    }

    const user = await User.findById(user_id).select("_id").lean();
    if (!user) return err(res, 404, "User not found");

    const wallet = await ensureUserWallet(user_id);
    wallet.amount_balance = Number(wallet.amount_balance || 0) + num;
    if (num > 0) {
      wallet.amount_added = Number(wallet.amount_added || 0) + num;
    }
    await wallet.save();

    await UserWalletHistory.create({
      user_id,
      amount: num,
      remarks: remarks || null,
      transaction_alias: "ADMIN_ADJUSTMENT",
    });

    return ok(
      res,
      { user_id, amount: num, balance: wallet.amount_balance },
      "User wallet adjusted"
    );
  } catch (e) {
    next(e);
  }
}

// Driver wallet list + details
async function listDriverWallets(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const [items, total] = await Promise.all([
      DriverWallet.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("driver_id", "name mobile email")
        .lean(),
      DriverWallet.countDocuments({}),
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

async function getDriverWallet(req, res, next) {
  try {
    const { driver_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(driver_id)) return err(res, 400, "Invalid driver id");

    const [driver, wallet, history] = await Promise.all([
      Driver.findById(driver_id).select("name mobile email").lean(),
      DriverWallet.findOne({ driver_id }).lean(),
      DriverWalletHistory.find({ driver_id }).sort({ createdAt: -1 }).limit(100).lean(),
    ]);

    if (!driver) return err(res, 404, "Driver not found");

    return ok(res, {
      driver,
      wallet: wallet || null,
      history,
    });
  } catch (e) {
    next(e);
  }
}

// Admin credit/debit driver wallet
async function adjustDriverWallet(req, res, next) {
  try {
    const { driver_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(driver_id)) return err(res, 400, "Invalid driver id");

    const { amount, remarks } = req.body || {};
    const num = Number(amount);
    if (!amount || Number.isNaN(num) || !Number.isFinite(num)) {
      return err(res, 422, "Valid amount is required");
    }

    const driver = await Driver.findById(driver_id).select("_id").lean();
    if (!driver) return err(res, 404, "Driver not found");

    const wallet = await ensureDriverWallet(driver_id);
    wallet.amount_balance = Number(wallet.amount_balance || 0) + num;
    if (num > 0) {
      wallet.amount_added = Number(wallet.amount_added || 0) + num;
    }
    await wallet.save();

    await DriverWalletHistory.create({
      driver_id,
      amount: num,
      remarks: remarks || null,
      transaction_alias: "ADMIN_ADJUSTMENT",
    });

    return ok(
      res,
      { driver_id, amount: num, balance: wallet.amount_balance },
      "Driver wallet adjusted"
    );
  } catch (e) {
    next(e);
  }
}

// Withdrawal requests list + status update
async function listWithdrawals(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      WalletWithdrawalRequest.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user_id", "name email mobile")
        .populate("driver_id", "name mobile email")
        .populate("owner_id", "name mobile email")
        .lean(),
      WalletWithdrawalRequest.countDocuments(filter),
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

async function getWithdrawal(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");

    const doc = await WalletWithdrawalRequest.findById(id)
      .populate("user_id", "name email mobile")
      .populate("driver_id", "name mobile email")
      .populate("owner_id", "name mobile email")
      .lean();
    if (!doc) return err(res, 404, "Withdrawal request not found");
    return ok(res, { withdrawal: doc });
  } catch (e) {
    next(e);
  }
}

async function updateWithdrawalStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status, rejected_reason, payment_reference } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    if (!status) return err(res, 422, "status is required");
    const allowed = ["requested", "approved", "rejected", "processed"];
    if (!allowed.includes(status)) {
      return err(res, 422, "Invalid status");
    }

    const doc = await WalletWithdrawalRequest.findById(id);
    if (!doc) return err(res, 404, "Withdrawal request not found");

    doc.status = status;
    if (status === "rejected") {
      doc.rejected_reason = rejected_reason || null;
    }
    if (status === "processed") {
      doc.processed_at = doc.processed_at || new Date();
      doc.payment_reference = payment_reference || doc.payment_reference || null;
    }

    await doc.save();
    return ok(res, { withdrawal: doc.toObject() }, "Updated");
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listUserWallets,
  getUserWallet,
  adjustUserWallet,
  listDriverWallets,
  getDriverWallet,
  adjustDriverWallet,
  listWithdrawals,
  getWithdrawal,
  updateWithdrawalStatus,
};

