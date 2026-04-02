const mongoose = require("mongoose");
const adminOwnerController = require("./adminOwnerController");
const Owner = require("../models/Owner");
const Fleet = require("../models/Fleet");
const Driver = require("../models/Driver");
const UserWallet = require("../models/UserWallet");
const UserWalletHistory = require("../models/UserWalletHistory");
const OwnerNeededDocument = require("../models/OwnerNeededDocument");
const FleetNeededDocument = require("../models/FleetNeededDocument");
const DriverNeededDocument = require("../models/DriverNeededDocument");
const FleetDocument = require("../models/FleetDocument");
const DriverDocument = require("../models/DriverDocument");
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

function normalizeDocumentFor(value) {
  const v = String(value || "both").toLowerCase();
  if (v === "normal" || v === "fleet" || v === "both") return v;
  return null;
}

const defaultNeededDocOpts = { includeAccountType: true };

/** Driver: persists document_for + account_type. Owner/Fleet: document_for only (includeAccountType: false). */
function mergeNeededDocumentCreateBody(body, opts = defaultNeededDocOpts) {
  const includeAccountType = opts.includeAccountType !== false;
  const { document_for, account_type, ...rest } = body || {};
  const forSource = document_for !== undefined ? document_for : account_type;
  const parsed = normalizeDocumentFor(forSource);
  if (forSource !== undefined && !parsed) {
    return { ok: false, message: "document_for must be normal, fleet, or both" };
  }
  const finalFor = parsed || "both";
  return {
    ok: true,
    payload: includeAccountType
      ? { ...rest, document_for: finalFor, account_type: finalFor }
      : { ...rest, document_for: finalFor },
  };
}

/** Same includeAccountType rule as create. */
function mergeNeededDocumentUpdateBody(body, opts = defaultNeededDocOpts) {
  const includeAccountType = opts.includeAccountType !== false;
  const { document_for, account_type, ...rest } = body || {};
  const updates = { ...rest };
  const forSource = document_for !== undefined ? document_for : account_type;
  if (forSource !== undefined) {
    const parsed = normalizeDocumentFor(forSource);
    if (!parsed) return { ok: false, message: "document_for must be normal, fleet, or both" };
    updates.document_for = parsed;
    if (includeAccountType) updates.account_type = parsed;
  }
  return { ok: true, updates };
}

function normalizeReviewStatus(value) {
  const v = String(value || "").toLowerCase();
  return ["pending", "approved", "rejected"].includes(v) ? v : null;
}

async function dashboard(req, res, next) {
  try {
    const [owners, fleets, blockedDrivers, ownerDocs, fleetDocs] = await Promise.all([
      Owner.countDocuments({}),
      Fleet.countDocuments({}),
      Driver.countDocuments({ active: false }),
      OwnerNeededDocument.countDocuments({}),
      FleetNeededDocument.countDocuments({}),
    ]);
    return ok(res, {
      owners,
      fleets,
      blocked_drivers: blockedDrivers,
      owner_needed_documents: ownerDocs,
      fleet_needed_documents: fleetDocs,
    });
  } catch (e) {
    next(e);
  }
}

async function listOwnerWallets(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const [owners, total] = await Promise.all([
      Owner.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user_id", "name email mobile")
        .lean(),
      Owner.countDocuments({}),
    ]);

    const userIds = owners.map((o) => o.user_id?._id).filter(Boolean);
    const wallets = await UserWallet.find({ user_id: { $in: userIds } }).lean();
    const walletMap = new Map(wallets.map((w) => [String(w.user_id), w]));

    const results = owners.map((o) => ({
      owner_id: o._id,
      owner_name: o.owner_name || o.name || o.user_id?.name || null,
      user: o.user_id || null,
      wallet: walletMap.get(String(o.user_id?._id || "")) || null,
    }));

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

async function getOwnerWallet(req, res, next) {
  try {
    const { owner_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(owner_id)) return err(res, 400, "Invalid owner id");

    const owner = await Owner.findById(owner_id).populate("user_id", "name email mobile").lean();
    if (!owner) return err(res, 404, "Owner not found");

    const [wallet, history] = await Promise.all([
      UserWallet.findOne({ user_id: owner.user_id?._id }).lean(),
      UserWalletHistory.find({ user_id: owner.user_id?._id }).sort({ createdAt: -1 }).limit(100).lean(),
    ]);

    return ok(res, {
      owner,
      wallet: wallet || null,
      history,
    });
  } catch (e) {
    next(e);
  }
}

async function createOwnerWallet(req, res, next) {
  try {
    const { owner_id, currency } = req.body || {};
    if (!owner_id || !mongoose.Types.ObjectId.isValid(owner_id)) {
      return err(res, 422, "Valid owner_id is required");
    }
    const owner = await Owner.findById(owner_id).lean();
    if (!owner) return err(res, 404, "Owner not found");

    const existing = await UserWallet.findOne({ user_id: owner.user_id }).lean();
    if (existing) return err(res, 409, "Wallet already exists for this owner");

    const wallet = await UserWallet.create({
      user_id: owner.user_id,
      amount_added: 0,
      amount_balance: 0,
      currency: currency || null,
    });
    return ok(res, { wallet }, "Owner wallet created");
  } catch (e) {
    next(e);
  }
}

async function updateOwnerWallet(req, res, next) {
  try {
    const { owner_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(owner_id)) return err(res, 400, "Invalid owner id");
    const owner = await Owner.findById(owner_id).lean();
    if (!owner) return err(res, 404, "Owner not found");

    const wallet = await UserWallet.findOne({ user_id: owner.user_id });
    if (!wallet) return err(res, 404, "Owner wallet not found");

    const { currency } = req.body || {};
    if (currency !== undefined) wallet.currency = currency || null;
    await wallet.save();
    return ok(res, { wallet: wallet.toObject() }, "Owner wallet updated");
  } catch (e) {
    next(e);
  }
}

async function adjustOwnerWallet(req, res, next) {
  try {
    const { owner_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(owner_id)) return err(res, 400, "Invalid owner id");

    const owner = await Owner.findById(owner_id).lean();
    if (!owner) return err(res, 404, "Owner not found");

    const { amount, remarks } = req.body || {};
    const num = Number(amount);
    if (!amount || Number.isNaN(num) || !Number.isFinite(num)) {
      return err(res, 422, "Valid amount is required");
    }

    let wallet = await UserWallet.findOne({ user_id: owner.user_id });
    if (!wallet) {
      wallet = await UserWallet.create({
        user_id: owner.user_id,
        amount_added: 0,
        amount_balance: 0,
      });
    }

    wallet.amount_balance = Number(wallet.amount_balance || 0) + num;
    if (num > 0) {
      wallet.amount_added = Number(wallet.amount_added || 0) + num;
    }
    await wallet.save();

    await UserWalletHistory.create({
      user_id: owner.user_id,
      amount: num,
      remarks: remarks || null,
      transaction_alias: "ADMIN_OWNER_ADJUSTMENT",
    });

    return ok(
      res,
      { owner_id, amount: num, balance: wallet.amount_balance },
      "Owner wallet adjusted"
    );
  } catch (e) {
    next(e);
  }
}

async function deleteOwnerWallet(req, res, next) {
  try {
    const { owner_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(owner_id)) return err(res, 400, "Invalid owner id");

    const owner = await Owner.findById(owner_id).lean();
    if (!owner) return err(res, 404, "Owner not found");

    const deleted = await UserWallet.findOneAndDelete({ user_id: owner.user_id }).lean();
    if (!deleted) return err(res, 404, "Owner wallet not found");
    return ok(res, { owner_id }, "Owner wallet deleted");
  } catch (e) {
    next(e);
  }
}

async function listFleets(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const [items, total] = await Promise.all([
      Fleet.find({})
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("owner_id", "name email mobile")
        .populate("driver_id", "name email mobile")
        .lean(),
      Fleet.countDocuments({}),
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

async function getFleet(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid fleet id");
    const fleet = await Fleet.findById(id)
      .populate("owner_id", "name email mobile")
      .populate("driver_id", "name email mobile")
      .lean();
    if (!fleet) return err(res, 404, "Fleet not found");
    return ok(res, { fleet });
  } catch (e) {
    next(e);
  }
}

async function createFleet(req, res, next) {
  try {
    const payload = req.body || {};
    const { owner_id } = payload;
    if (!owner_id || !mongoose.Types.ObjectId.isValid(owner_id)) {
      return err(res, 422, "Valid owner_id is required");
    }
    const fleet = await Fleet.create(payload);
    return ok(res, { fleet }, "Fleet created");
  } catch (e) {
    next(e);
  }
}

async function updateFleet(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid fleet id");
    const fleet = await Fleet.findByIdAndUpdate(id, { $set: req.body || {} }, { new: true }).lean();
    if (!fleet) return err(res, 404, "Fleet not found");
    return ok(res, { fleet }, "Fleet updated");
  } catch (e) {
    next(e);
  }
}

async function deleteFleet(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid fleet id");
    const fleet = await Fleet.findByIdAndDelete(id).lean();
    if (!fleet) return err(res, 404, "Fleet not found");
    return ok(res, { id }, "Fleet deleted");
  } catch (e) {
    next(e);
  }
}

async function listBlockedFleetDrivers(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const filter = { active: false, owner_id: { $exists: true, $ne: null } };
    const [items, total] = await Promise.all([
      Driver.find(filter)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user_id", "name email mobile")
        .lean(),
      Driver.countDocuments(filter),
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

async function getBlockedFleetDriver(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid driver id");
    const driver = await Driver.findOne({ _id: id, owner_id: { $exists: true, $ne: null } })
      .populate("user_id", "name email mobile")
      .lean();
    if (!driver) return err(res, 404, "Driver not found");
    return ok(res, { driver });
  } catch (e) {
    next(e);
  }
}

async function createBlockedFleetDriver(req, res, next) {
  try {
    const { driver_id, reason } = req.body || {};
    if (!driver_id || !mongoose.Types.ObjectId.isValid(driver_id)) {
      return err(res, 422, "Valid driver_id is required");
    }
    const current = await Driver.findById(driver_id).lean();
    if (!current) return err(res, 404, "Driver not found");
    if (!current.owner_id) {
      return err(res, 422, "Only fleet drivers (owner-linked) can be blocked from this module");
    }
    const driver = await Driver.findByIdAndUpdate(
      driver_id,
      { $set: { active: false, reason: reason || "Blocked by admin" } },
      { new: true }
    )
      .populate("user_id", "name email mobile")
      .lean();
    return ok(res, { driver }, "Driver blocked");
  } catch (e) {
    next(e);
  }
}

async function updateBlockedFleetDriver(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid driver id");
    const { reason, active } = req.body || {};
    const updates = {};
    if (reason !== undefined) updates.reason = reason;
    if (active !== undefined) updates.active = Boolean(active);
    const driver = await Driver.findByIdAndUpdate(id, { $set: updates }, { new: true })
      .populate("user_id", "name email mobile")
      .lean();
    if (!driver) return err(res, 404, "Driver not found");
    return ok(res, { driver }, "Blocked fleet driver updated");
  } catch (e) {
    next(e);
  }
}

async function deleteBlockedFleetDriver(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid driver id");
    const driver = await Driver.findByIdAndUpdate(
      id,
      { $set: { active: true, reason: null } },
      { new: true }
    ).lean();
    if (!driver) return err(res, 404, "Driver not found");
    return ok(res, { id }, "Driver unblocked");
  } catch (e) {
    next(e);
  }
}

function buildDocCrud(model, keyName, neededDocOpts = defaultNeededDocOpts) {
  return {
    async list(req, res, next) {
      try {
        const { page, limit, skip } = parsePage(req);
        const [items, total] = await Promise.all([
          model.find({}).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
          model.countDocuments({}),
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
    },

    async get(req, res, next) {
      try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, `Invalid ${keyName} id`);
        const doc = await model.findById(id).lean();
        if (!doc) return err(res, 404, `${keyName} not found`);
        return ok(res, { [keyName]: doc });
      } catch (e) {
        next(e);
      }
    },

    async create(req, res, next) {
      try {
        const r = mergeNeededDocumentCreateBody(req.body, neededDocOpts);
        if (!r.ok) return err(res, 422, r.message);
        if (!r.payload.name) return err(res, 422, "name is required");
        const doc = await model.create(r.payload);
        return ok(res, { [keyName]: doc }, `${keyName} created`);
      } catch (e) {
        next(e);
      }
    },

    async update(req, res, next) {
      try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, `Invalid ${keyName} id`);
        const r = mergeNeededDocumentUpdateBody(req.body || {}, neededDocOpts);
        if (!r.ok) return err(res, 422, r.message);
        const doc = await model.findByIdAndUpdate(id, { $set: r.updates }, { new: true }).lean();
        if (!doc) return err(res, 404, `${keyName} not found`);
        return ok(res, { [keyName]: doc }, `${keyName} updated`);
      } catch (e) {
        next(e);
      }
    },

    async remove(req, res, next) {
      try {
        const { id } = req.params;
        if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, `Invalid ${keyName} id`);
        const doc = await model.findByIdAndDelete(id).lean();
        if (!doc) return err(res, 404, `${keyName} not found`);
        return ok(res, { id }, `${keyName} deleted`);
      } catch (e) {
        next(e);
      }
    },
  };
}

const ownerDocCrud = buildDocCrud(OwnerNeededDocument, "owner_needed_document", {
  includeAccountType: false,
});
const fleetDocCrud = buildDocCrud(FleetNeededDocument, "fleet_needed_document", {
  includeAccountType: false,
});

const driverDocCrud = {
  async list(req, res, next) {
    try {
      const { page, limit, skip } = parsePage(req);
      const documentFor = req.query.document_for ? normalizeDocumentFor(req.query.document_for) : null;
      if (req.query.document_for && !documentFor) {
        return err(res, 422, "document_for must be normal, fleet, or both");
      }
      const filter = documentFor ? { account_type: documentFor } : {};
      const [items, total] = await Promise.all([
        DriverNeededDocument.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
        DriverNeededDocument.countDocuments(filter),
      ]);
      const results = items.map((doc) => ({
        ...doc,
        document_for: normalizeDocumentFor(doc.document_for || doc.account_type) || "both",
      }));
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
  },

  async get(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid driver needed document id");
      const doc = await DriverNeededDocument.findById(id).lean();
      if (!doc) return err(res, 404, "driver_needed_document not found");
      return ok(res, {
        driver_needed_document: {
          ...doc,
          document_for: normalizeDocumentFor(doc.document_for || doc.account_type) || "both",
        },
      });
    } catch (e) {
      next(e);
    }
  },

  async create(req, res, next) {
    try {
      const r = mergeNeededDocumentCreateBody(req.body, { includeAccountType: true });
      if (!r.ok) return err(res, 422, r.message);
      if (!r.payload.name) return err(res, 422, "name is required");
      const doc = await DriverNeededDocument.create(r.payload);
      const finalFor = r.payload.document_for;
      return ok(
        res,
        { driver_needed_document: { ...doc.toObject(), document_for: finalFor } },
        "driver_needed_document created"
      );
    } catch (e) {
      next(e);
    }
  },

  async update(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid driver needed document id");
      const r = mergeNeededDocumentUpdateBody(req.body || {}, { includeAccountType: true });
      if (!r.ok) return err(res, 422, r.message);
      const doc = await DriverNeededDocument.findByIdAndUpdate(
        id,
        { $set: r.updates },
        { new: true }
      ).lean();
      if (!doc) return err(res, 404, "driver_needed_document not found");
      return ok(
        res,
        {
          driver_needed_document: {
            ...doc,
            document_for: normalizeDocumentFor(doc.document_for || doc.account_type) || "both",
          },
        },
        "driver_needed_document updated"
      );
    } catch (e) {
      next(e);
    }
  },

  async remove(req, res, next) {
    try {
      const { id } = req.params;
      if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid driver needed document id");
      const doc = await DriverNeededDocument.findByIdAndDelete(id).lean();
      if (!doc) return err(res, 404, "driver_needed_document not found");
      return ok(res, { id }, "driver_needed_document deleted");
    } catch (e) {
      next(e);
    }
  },
};

async function listFleetDocumentUploads(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const filter = {};
    if (req.query.fleet_id && mongoose.Types.ObjectId.isValid(req.query.fleet_id)) {
      filter.fleet_id = req.query.fleet_id;
    }
    const status = normalizeReviewStatus(req.query.status);
    if (req.query.status && !status) {
      return err(res, 422, "status must be pending, approved, or rejected");
    }
    if (status) filter.status = status;
    const [items, total] = await Promise.all([
      FleetDocument.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("fleet_id")
        .populate("fleet_needed_document_id", "name")
        .lean(),
      FleetDocument.countDocuments(filter),
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

async function reviewFleetDocumentUpload(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid fleet document id");
    const status = normalizeReviewStatus(req.body?.status);
    if (!status || status === "pending") {
      return err(res, 422, "status must be approved or rejected");
    }
    const rejectedReason = req.body?.rejected_reason;
    if (status === "rejected" && !rejectedReason) {
      return err(res, 422, "rejected_reason is required for rejected status");
    }
    const doc = await FleetDocument.findById(id);
    if (!doc) return err(res, 404, "Fleet document upload not found");
    doc.status = status;
    doc.approve = status === "approved";
    doc.rejected_reason = status === "rejected" ? rejectedReason : null;
    doc.reviewed_at = new Date();
    await doc.save();
    return ok(res, { fleet_document: doc.toObject() }, "Fleet document reviewed");
  } catch (e) {
    next(e);
  }
}

async function listDriverDocumentUploads(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const filter = {};
    if (req.query.driver_id && mongoose.Types.ObjectId.isValid(req.query.driver_id)) {
      filter.driver_id = req.query.driver_id;
    }
    const status = normalizeReviewStatus(req.query.status);
    if (req.query.status && !status) {
      return err(res, 422, "status must be pending, approved, or rejected");
    }
    if (status) filter.status = status;
    const [items, total] = await Promise.all([
      DriverDocument.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("driver_id")
        .populate("driver_needed_document_id", "name document_for account_type")
        .lean(),
      DriverDocument.countDocuments(filter),
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

async function reviewDriverDocumentUpload(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid driver document id");
    const status = normalizeReviewStatus(req.body?.status);
    if (!status || status === "pending") {
      return err(res, 422, "status must be approved or rejected");
    }
    const rejectedReason = req.body?.rejected_reason;
    if (status === "rejected" && !rejectedReason) {
      return err(res, 422, "rejected_reason is required for rejected status");
    }
    const doc = await DriverDocument.findById(id);
    if (!doc) return err(res, 404, "Driver document upload not found");
    doc.status = status;
    doc.approve = status === "approved";
    doc.rejected_reason = status === "rejected" ? rejectedReason : null;
    doc.reviewed_at = new Date();
    await doc.save();
    return ok(res, { driver_document: doc.toObject() }, "Driver document reviewed");
  } catch (e) {
    next(e);
  }
}

async function listDriverRatings(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const { driver_id, min_rating, max_rating } = req.query;
    const match = {};
    if (driver_id && mongoose.Types.ObjectId.isValid(driver_id)) {
      match.driver_id = new mongoose.Types.ObjectId(driver_id);
    }
    if (min_rating != null || max_rating != null) {
      match.rating = {};
      if (min_rating != null && !Number.isNaN(Number(min_rating))) {
        match.rating.$gte = Number(min_rating);
      }
      if (max_rating != null && !Number.isNaN(Number(max_rating))) {
        match.rating.$lte = Number(max_rating);
      }
      if (!Object.keys(match.rating).length) delete match.rating;
    }

    const basePipeline = [
      { $match: match },
      {
        $group: {
          _id: "$driver_id",
          total_ratings: { $sum: 1 },
          average_stars: { $avg: "$rating" },
          last_rated_at: { $max: "$createdAt" },
        },
      },
    ];

    const [grouped, totalRows] = await Promise.all([
      RequestRating.aggregate([
        ...basePipeline,
        { $sort: { last_rated_at: -1 } },
        { $skip: skip },
        { $limit: limit },
      ]),
      RequestRating.aggregate([...basePipeline, { $count: "total" }]),
    ]);

    const driverIds = grouped.map((g) => g._id).filter(Boolean);
    const drivers = await Driver.find({ _id: { $in: driverIds } })
      .select("name mobile email owner_id user_id")
      .populate("user_id", "name mobile email")
      .lean();
    const dmap = new Map(drivers.map((d) => [String(d._id), d]));

    const items = grouped.map((g) => {
      const driver = dmap.get(String(g._id)) || null;
      return {
        driver_id: g._id,
        driver,
        total_ratings: g.total_ratings,
        average_stars: Number((g.average_stars || 0).toFixed(2)),
        last_rated_at: g.last_rated_at,
      };
    });
    const total = totalRows[0]?.total || 0;

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

async function getDriverRatingDetails(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid driver id");
    }
    const driverId = new mongoose.Types.ObjectId(id);
    const driver = await Driver.findById(driverId)
      .populate({
        path: "user_id",
        select: "name mobile email",
      })
      .lean();
    if (!driver) return err(res, 404, "Driver not found");

    const statsAgg = await RequestRating.aggregate([
      { $match: { driver_id: driverId } },
      {
        $group: {
          _id: "$driver_id",
          total_ratings: { $sum: 1 },
          average_rating: { $avg: "$rating" },
          rating_1: { $sum: { $cond: [{ $eq: ["$rating", 1] }, 1, 0] } },
          rating_2: { $sum: { $cond: [{ $eq: ["$rating", 2] }, 1, 0] } },
          rating_3: { $sum: { $cond: [{ $eq: ["$rating", 3] }, 1, 0] } },
          rating_4: { $sum: { $cond: [{ $eq: ["$rating", 4] }, 1, 0] } },
          rating_5: { $sum: { $cond: [{ $eq: ["$rating", 5] }, 1, 0] } },
        },
      },
    ]);

    const recentRatings = await RequestRating.find({ driver_id: driverId })
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("user_id", "name mobile email")
      .populate("request_id", "request_number")
      .lean();

    const stats = statsAgg[0] || {
      total_ratings: 0,
      average_rating: 0,
      rating_1: 0,
      rating_2: 0,
      rating_3: 0,
      rating_4: 0,
      rating_5: 0,
    };
    if (stats.average_rating != null) {
      stats.average_rating = Number(stats.average_rating.toFixed(2));
    }

    return ok(res, {
      driver,
      driver_stats: stats,
      ratings: recentRatings.map((r) => ({
        rating_id: r._id,
        request_id: r.request_id?._id || r.request_id || null,
        request_number: r.request_id?.request_number || null,
        rated_by_user: r.user_id || null,
        stars: r.rating,
        review: r.feedback || null,
        rated_at: r.createdAt,
      })),
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  dashboard,
  listManageOwners: adminOwnerController.listOwners,
  getManageOwner: adminOwnerController.getOwner,
  createManageOwner: adminOwnerController.createOwner,
  updateManageOwner: adminOwnerController.updateOwner,
  deleteManageOwner: adminOwnerController.deleteOwner,
  listOwnerWallets,
  getOwnerWallet,
  createOwnerWallet,
  updateOwnerWallet,
  adjustOwnerWallet,
  deleteOwnerWallet,
  listFleets,
  getFleet,
  createFleet,
  updateFleet,
  deleteFleet,
  listBlockedFleetDrivers,
  getBlockedFleetDriver,
  createBlockedFleetDriver,
  updateBlockedFleetDriver,
  deleteBlockedFleetDriver,
  listOwnerNeededDocuments: ownerDocCrud.list,
  getOwnerNeededDocument: ownerDocCrud.get,
  createOwnerNeededDocument: ownerDocCrud.create,
  updateOwnerNeededDocument: ownerDocCrud.update,
  deleteOwnerNeededDocument: ownerDocCrud.remove,
  listFleetNeededDocuments: fleetDocCrud.list,
  getFleetNeededDocument: fleetDocCrud.get,
  createFleetNeededDocument: fleetDocCrud.create,
  updateFleetNeededDocument: fleetDocCrud.update,
  deleteFleetNeededDocument: fleetDocCrud.remove,
  listDriverNeededDocuments: driverDocCrud.list,
  getDriverNeededDocument: driverDocCrud.get,
  createDriverNeededDocument: driverDocCrud.create,
  updateDriverNeededDocument: driverDocCrud.update,
  deleteDriverNeededDocument: driverDocCrud.remove,
  listFleetDocumentUploads,
  reviewFleetDocumentUpload,
  listDriverDocumentUploads,
  reviewDriverDocumentUpload,
  listDriverRatings,
  getDriverRatingDetails,
};
