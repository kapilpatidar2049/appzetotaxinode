const mongoose = require("mongoose");
const Country = require("../models/Country");
const ServiceLocation = require("../models/ServiceLocation");
const User = require("../models/User");

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

function normalizeCode(value) {
  return String(value || "").trim().toUpperCase();
}

function toBool(v) {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase();
  if (s === "1" || s === "true") return true;
  if (s === "0" || s === "false") return false;
  return Boolean(v);
}

async function listCountries(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const { search, active } = req.query;
    const filter = {};

    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;

    if (search && String(search).trim()) {
      const q = String(search).trim();
      filter.$or = [
        { name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        { code: new RegExp(`^${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`, "i") },
        { dial_code: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      ];
    }

    const [items, total] = await Promise.all([
      Country.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Country.countDocuments(filter),
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

async function getCountry(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Country.findById(id).lean();
    if (!doc) return err(res, 404, "Country not found");
    return ok(res, { country: doc });
  } catch (e) {
    next(e);
  }
}

async function createCountry(req, res, next) {
  try {
    const body = req.body || {};
    const code = normalizeCode(body.code);
    const name = body.name != null ? String(body.name).trim() : "";
    const errors = {};
    if (!code) errors.code = "code is required";
    if (!name) errors.name = "name is required";
    if (Object.keys(errors).length) return err(res, 422, "Validation failed", errors);

    const doc = await Country.create({
      code,
      name,
      dial_code: body.dial_code != null ? String(body.dial_code).trim() : undefined,
      flag: body.flag != null ? String(body.flag).trim() : undefined,
      currency_name: body.currency_name != null ? String(body.currency_name).trim() : undefined,
      currency_symbol: body.currency_symbol != null ? String(body.currency_symbol).trim() : undefined,
      currency_code: body.currency_code != null ? String(body.currency_code).trim().toUpperCase() : undefined,
      active: toBool(body.active) !== false,
    });

    return res.status(201).json({ success: true, message: "Created", country: doc.toObject() });
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", { code: "Country code already exists" });
    }
    next(e);
  }
}

async function updateCountry(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");

    const body = req.body || {};
    const existing = await Country.findById(id);
    if (!existing) return err(res, 404, "Country not found");

    const patch = {};
    if (body.code !== undefined) patch.code = normalizeCode(body.code);
    if (body.name !== undefined) patch.name = String(body.name).trim();
    if (body.dial_code !== undefined) patch.dial_code = body.dial_code == null ? null : String(body.dial_code).trim();
    if (body.flag !== undefined) patch.flag = body.flag == null ? null : String(body.flag).trim();
    if (body.currency_name !== undefined) {
      patch.currency_name = body.currency_name == null ? null : String(body.currency_name).trim();
    }
    if (body.currency_symbol !== undefined) {
      patch.currency_symbol = body.currency_symbol == null ? null : String(body.currency_symbol).trim();
    }
    if (body.currency_code !== undefined) {
      patch.currency_code =
        body.currency_code == null ? null : String(body.currency_code).trim().toUpperCase();
    }
    if (body.active !== undefined) patch.active = Boolean(toBool(body.active));

    if (patch.name === "") return err(res, 422, "Validation failed", { name: "name cannot be empty" });
    if (patch.code === "") return err(res, 422, "Validation failed", { code: "code cannot be empty" });

    Object.assign(existing, patch);
    await existing.save();

    return ok(res, { country: existing.toObject() }, "Updated");
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", { code: "Country code already exists" });
    }
    next(e);
  }
}

async function deleteCountry(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");

    const [slCount, userCount] = await Promise.all([
      ServiceLocation.countDocuments({ country_id: id }),
      User.countDocuments({ country: id }),
    ]);
    if (slCount > 0 || userCount > 0) {
      return err(res, 422, "Country is in use and cannot be deleted", {
        service_locations: slCount,
        users: userCount,
      });
    }

    const deleted = await Country.findByIdAndDelete(id);
    if (!deleted) return err(res, 404, "Country not found");
    return ok(res, null, "Deleted");
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listCountries,
  getCountry,
  createCountry,
  updateCountry,
  deleteCountry,
};
