const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const XLSX = require("xlsx");
const User = require("../models/User");
const Country = require("../models/Country");
const Role = require("../models/Role");
const RoleUser = require("../models/RoleUser");
const UserWallet = require("../models/UserWallet");
const UserWalletHistory = require("../models/UserWalletHistory");
const Request = require("../models/Request");
const RequestRating = require("../models/RequestRating");
const RequestBill = require("../models/RequestBill");
const RequestMeta = require("../models/RequestMeta");

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

/** Normalize spreadsheet column keys: "Name" -> "name", "Country Code" -> "country_code" */
function normalizeSheetRow(row) {
  const o = {};
  for (const [k, v] of Object.entries(row)) {
    const key = String(k).trim().toLowerCase().replace(/\s+/g, "_");
    if (v === null || v === undefined) {
      o[key] = "";
    } else if (typeof v === "number" && key === "mobile") {
      o[key] = String(v);
    } else {
      o[key] = typeof v === "string" ? v.trim() : v;
    }
  }
  return o;
}

/**
 * Country cell: Mongo ObjectId, 2-letter ISO code (e.g. IN), dial code digits (e.g. 91), or country name (exact, case-insensitive).
 */
async function resolveCountryId(raw) {
  if (raw === null || raw === undefined || raw === "") return undefined;
  const s = String(raw).trim();
  if (!s) return undefined;

  if (mongoose.Types.ObjectId.isValid(s) && String(new mongoose.Types.ObjectId(s)) === s) {
    const c = await Country.findById(s).select("_id").lean();
    return c ? c._id : null;
  }

  if (s.length === 2) {
    const c = await Country.findOne({ code: s.toUpperCase() }).select("_id").lean();
    return c ? c._id : null;
  }

  const digits = s.replace(/\D/g, "");
  if (digits.length >= 1 && digits.length <= 4) {
    const c = await Country.findOne({
      $or: [{ dial_code: digits }, { dial_code: `+${digits}` }],
    })
      .select("_id")
      .lean();
    if (c) return c._id;
  }

  const esc = s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const c = await Country.findOne({ name: new RegExp(`^${esc}$`, "i") }).select("_id").lean();
  return c ? c._id : null;
}

async function listUsers(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const search = (req.query.search || "").trim();

    const filter = {
      role: "user",
      $or: [{ is_deleted_at: null }, { is_deleted_at: { $exists: false } }],
    };

    if (search) {
      filter.$and = [
        {
          $or: [
            { name: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
            { mobile: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
            { email: new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
          ],
        },
      ];
    }

    const [items, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("country", "name code dial_code flag")
        .lean(),
      User.countDocuments(filter),
    ]);

    const ids = items.map((u) => u.referred_by).filter(Boolean);
    const refUsers =
      ids.length > 0
        ? await User.find({ _id: { $in: ids } })
            .select("name")
            .lean()
        : [];
    const refMap = Object.fromEntries(refUsers.map((r) => [String(r._id), r.name]));

    const results = items.map((u) => ({
      ...u,
      referred_by_name: u.referred_by ? refMap[String(u.referred_by)] || null : null,
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

async function getUser(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid user id");
    }
    const user = await User.findOne({
      _id: id,
      role: "user",
    })
      .populate("country", "name code dial_code flag")
      .lean();
    if (!user) {
      return err(res, 404, "User not found");
    }
    let referred_by_name = null;
    if (user.referred_by) {
      const ref = await User.findById(user.referred_by).select("name").lean();
      referred_by_name = ref?.name || null;
    }
    return ok(res, { user: { ...user, referred_by_name } });
  } catch (e) {
    next(e);
  }
}

async function createUser(req, res, next) {
  try {
    const {
      name,
      country,
      mobile,
      email,
      gender,
      password,
      profile_picture,
      active = true,
    } = req.body || {};

    const errors = {};
    if (!name) errors.name = "name is required";
    if (!mobile) errors.mobile = "mobile is required";
    if (!password) errors.password = "password is required";

    if (email) {
      const exists = await User.findOne({ email: String(email).toLowerCase() }).lean();
      if (exists) errors.email = "Provided email has already been taken";
    }
    const mobExists = await User.findOne({ mobile: String(mobile).trim() }).lean();
    if (mobExists) errors.mobile = "Provided mobile has already been taken";

    if (Object.keys(errors).length) {
      return err(res, 422, "Validation failed", errors);
    }

    const hashed = await bcrypt.hash(password, 10);
    const countryId = country && mongoose.Types.ObjectId.isValid(country) ? country : undefined;

    const doc = await User.create({
      name: String(name).trim(),
      country: countryId,
      mobile: String(mobile).trim(),
      email: email ? String(email).toLowerCase().trim() : undefined,
      gender: gender || undefined,
      password: hashed,
      role: "user",
      active: Boolean(active),
      refferal_code: randomReferral(6),
      mobile_confirmed: true,
      profile_picture: profile_picture || undefined,
    });

    await attachRole(doc._id, "user");
    await UserWallet.create({ user_id: doc._id, amount_added: 0, amount_balance: 0 });

    const user = await User.findById(doc._id).populate("country", "name code dial_code flag").lean();
    return res.status(201).json({
      success: true,
      message: "user created successfully.",
      successMessage: "user created successfully.",
      user,
    });
  } catch (e) {
    next(e);
  }
}

/**
 * POST multipart: field `file` (.xlsx / .xls / .csv), optional `default_password`.
 * Sheet columns (header row): Name, Email, Mobile, Gender, Country, Password (optional).
 * Matches sample_upload.xlsx — first sheet or sheet named "Users List".
 * Country: MongoDB ObjectId, 2-letter code (e.g. IN), dial code (e.g. 91), or exact country name.
 */
async function bulkUploadUsers(req, res, next) {
  try {
    if (!req.file?.buffer?.length) {
      return err(res, 400, "Spreadsheet file is required (multipart field: file)");
    }

    const defaultPassword = String(req.body?.default_password ?? "").trim();

    const workbook = XLSX.read(req.file.buffer, { type: "buffer", cellDates: true });
    const sheetName = workbook.SheetNames.includes("Users List")
      ? "Users List"
      : workbook.SheetNames[0];
    if (!sheetName) {
      return err(res, 422, "Workbook has no sheets");
    }

    const ws = workbook.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json(ws, { defval: "", raw: false });
    if (!rows.length) {
      return err(res, 422, "No data rows in spreadsheet (header row required)");
    }

    const created = [];
    const failed = [];
    const seenMobile = new Set();
    const seenEmail = new Set();

    for (let i = 0; i < rows.length; i += 1) {
      const rowIndex = i + 2;
      const r = normalizeSheetRow(rows[i]);

      const name = r.name || r.full_name || "";
      const email = r.email ? String(r.email).toLowerCase().trim() : "";
      let mobile = r.mobile != null && r.mobile !== "" ? String(r.mobile).trim() : "";
      const gender = r.gender ? String(r.gender).trim() : "";
      const countryRaw = r.country;
      const rowPassword = r.password ? String(r.password).trim() : "";

      const password = rowPassword || defaultPassword;

      if (!name) {
        failed.push({ row: rowIndex, reason: "name is required", mobile: mobile || null, email: email || null });
        continue;
      }
      if (!mobile) {
        failed.push({ row: rowIndex, reason: "mobile is required", email: email || null });
        continue;
      }
      if (!password) {
        failed.push({
          row: rowIndex,
          reason: "password is required (column Password or form field default_password)",
          mobile,
          email: email || null,
        });
        continue;
      }

      if (seenMobile.has(mobile)) {
        failed.push({ row: rowIndex, reason: "duplicate mobile in file", mobile, email: email || null });
        continue;
      }
      if (email && seenEmail.has(email)) {
        failed.push({ row: rowIndex, reason: "duplicate email in file", mobile, email });
        continue;
      }
      seenMobile.add(mobile);
      if (email) seenEmail.add(email);

      if (email) {
        const existsEmail = await User.findOne({ email }).lean();
        if (existsEmail) {
          failed.push({ row: rowIndex, reason: "email already registered", mobile, email });
          continue;
        }
      }
      const existsMobile = await User.findOne({ mobile }).lean();
      if (existsMobile) {
        failed.push({ row: rowIndex, reason: "mobile already registered", mobile, email: email || null });
        continue;
      }

      let countryId;
      if (countryRaw !== undefined && countryRaw !== null && String(countryRaw).trim() !== "") {
        const resolved = await resolveCountryId(countryRaw);
        if (resolved === null) {
          failed.push({
            row: rowIndex,
            reason: `country could not be resolved (${String(countryRaw).trim()}). Use MongoDB id, 2-letter code, dial code, or exact country name.`,
            mobile,
            email: email || null,
          });
          continue;
        }
        countryId = resolved;
      }

      try {
        const hashed = await bcrypt.hash(password, 10);
        const doc = await User.create({
          name: String(name).trim(),
          country: countryId,
          mobile,
          email: email || undefined,
          gender: gender || undefined,
          password: hashed,
          role: "user",
          active: true,
          refferal_code: randomReferral(6),
          mobile_confirmed: true,
        });

        await attachRole(doc._id, "user");
        await UserWallet.create({ user_id: doc._id, amount_added: 0, amount_balance: 0 });

        created.push({
          row: rowIndex,
          user_id: doc._id,
          name: doc.name,
          email: doc.email || null,
          mobile: doc.mobile,
        });
      } catch (rowErr) {
        failed.push({
          row: rowIndex,
          reason: rowErr.message || "create failed",
          mobile,
          email: email || null,
        });
      }
    }

    return ok(res, {
      sheet: sheetName,
      created_count: created.length,
      failed_count: failed.length,
      created,
      failed,
    });
  } catch (e) {
    next(e);
  }
}

async function updateUser(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid user id");
    }

    const user = await User.findOne({ _id: id, role: "user" });
    if (!user) {
      return err(res, 404, "User not found");
    }

    const {
      name,
      country,
      mobile,
      email,
      gender,
      password,
      profile_picture,
      active,
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

    if (name !== undefined) user.name = String(name).trim();
    if (country !== undefined) {
      user.country = country && mongoose.Types.ObjectId.isValid(country) ? country : null;
    }
    if (mobile !== undefined) user.mobile = String(mobile).trim();
    if (email !== undefined) user.email = email ? String(email).toLowerCase().trim() : undefined;
    if (gender !== undefined) user.gender = gender;
    if (profile_picture !== undefined) user.profile_picture = profile_picture;
    if (active !== undefined) user.active = Boolean(active);
    if (password) {
      user.password = await bcrypt.hash(password, 10);
    }
    if (!user.refferal_code) {
      user.refferal_code = randomReferral(6);
    }

    await user.save();
    const u = await User.findById(user._id).populate("country", "name code dial_code flag").lean();
    return res.status(201).json({
      success: true,
      message: "User updated successfully.",
      successMessage: "User updated successfully.",
      user: u,
    });
  } catch (e) {
    next(e);
  }
}

async function deleteUser(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid user id");
    }
    const user = await User.findOne({ _id: id, role: "user" });
    if (!user) {
      return err(res, 404, "User not found");
    }
    user.is_deleted_at = new Date();
    user.active = false;
    await user.save();
    return ok(res, { id: user._id }, "User deleted");
  } catch (e) {
    next(e);
  }
}

async function getWallet(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid user id");
    }
    const wallet = await UserWallet.findOne({ user_id: id }).lean();
    return ok(res, { wallet: wallet || null });
  } catch (e) {
    next(e);
  }
}

async function getWalletHistory(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid user id");
    }
    const { page, limit, skip } = parsePage(req);
    const [items, total] = await Promise.all([
      UserWalletHistory.find({ user_id: id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      UserWalletHistory.countDocuments({ user_id: id }),
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

async function getRequests(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid user id");
    }
    const { page, limit, skip } = parsePage(req);
    const filter = { user_id: id };
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

async function listDeleteRequests(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const search = (req.query.search || "").trim();
    const filter = {
      role: "user",
      is_deleted_at: { $ne: null },
    };

    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ name: rx }, { mobile: rx }, { email: rx }];
    }

    const [items, total] = await Promise.all([
      User.find(filter)
        .sort({ is_deleted_at: -1, createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("country", "name code dial_code flag")
        .lean(),
      User.countDocuments(filter),
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

async function getDeletedUserProfile(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid user id");
    }
    const user = await User.findOne({
      _id: id,
      role: "user",
      is_deleted_at: { $ne: null },
    })
      .populate("country", "name code dial_code flag")
      .lean();
    if (!user) {
      return err(res, 404, "Deleted user not found");
    }
    let referred_by_name = null;
    if (user.referred_by) {
      const ref = await User.findById(user.referred_by).select("name").lean();
      referred_by_name = ref?.name || null;
    }
    return ok(res, { user: { ...user, referred_by_name } });
  } catch (e) {
    next(e);
  }
}

async function restoreDeletedUser(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid user id");
    }
    const user = await User.findOne({
      _id: id,
      role: "user",
      is_deleted_at: { $ne: null },
    });
    if (!user) {
      return err(res, 404, "Deleted user not found");
    }
    user.is_deleted_at = null;
    user.active = true;
    await user.save();
    return ok(res, { id: user._id }, "User restored");
  } catch (e) {
    next(e);
  }
}

async function deletePermanentlyFromDeleted(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid user id");
    }
    const user = await User.findOne({
      _id: id,
      role: "user",
      is_deleted_at: { $ne: null },
    });
    if (!user) {
      return err(res, 404, "Deleted user not found");
    }
    await User.deleteOne({ _id: id });
    await UserWallet.deleteOne({ user_id: id });
    await UserWalletHistory.deleteMany({ user_id: id });
    return ok(res, { id }, "Deleted user removed permanently");
  } catch (e) {
    next(e);
  }
}

async function getReviewHistory(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid user id");
    }
    const { page, limit, skip } = parsePage(req);
    const filter = { user_id: id };
    const [items, total] = await Promise.all([
      RequestRating.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("driver_id", "name mobile email owner_id")
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

async function getRequestDetail(req, res, next) {
  try {
    const { id, request_id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid user id");
    }
    if (!mongoose.Types.ObjectId.isValid(request_id)) {
      return err(res, 400, "Invalid request id");
    }

    const requestDoc = await Request.findOne({ _id: request_id, user_id: id })
      .populate("user_id", "name email mobile")
      .populate({
        path: "driver_id",
        select: "name mobile email user_id car_number",
        populate: { path: "user_id", select: "name mobile email fcm_token" },
      })
      .populate("owner_id")
      .lean();
    if (!requestDoc) {
      return err(res, 404, "Request not found for this user");
    }

    const [bill, meta, review] = await Promise.all([
      RequestBill.findOne({ request_id }).lean(),
      RequestMeta.find({ request_id }).sort({ createdAt: -1 }).lean(),
      RequestRating.findOne({ request_id, user_id: id }).lean(),
    ]);

    return ok(res, {
      request: requestDoc,
      bill: bill || null,
      request_meta: meta || [],
      review: review || null,
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listUsers,
  getUser,
  createUser,
  bulkUploadUsers,
  updateUser,
  deleteUser,
  getWallet,
  getWalletHistory,
  getRequests,
  listDeleteRequests,
  getDeletedUserProfile,
  restoreDeletedUser,
  deletePermanentlyFromDeleted,
  getReviewHistory,
  getRequestDetail,
};
