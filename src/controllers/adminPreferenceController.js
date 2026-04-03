const mongoose = require("mongoose");
const PreferenceOption = require("../models/PreferenceOption");

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

function slugKey(name) {
  return String(name || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_")
    .replace(/[^a-z0-9_]/g, "");
}

async function listPreferenceOptions(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const { active, search } = req.query;
    const filter = {};
    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;
    if (search && String(search).trim()) {
      const q = String(search).trim();
      filter.$or = [
        { name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        { key: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      ];
    }

    const [items, total] = await Promise.all([
      PreferenceOption.find(filter)
        .sort({ order: 1, name: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      PreferenceOption.countDocuments(filter),
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

async function getPreferenceOption(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await PreferenceOption.findById(id).lean();
    if (!doc) return err(res, 404, "Preference not found");
    return ok(res, { preference: doc });
  } catch (e) {
    next(e);
  }
}

async function createPreferenceOption(req, res, next) {
  try {
    const body = req.body || {};
    const name = body.name != null ? String(body.name).trim() : "";
    if (!name) return err(res, 422, "name is required");
    if (!req.file) return err(res, 422, "icon image is required");

    const key = slugKey(name);
    if (!key) return err(res, 422, "Invalid name for key");

    const iconPath = `/uploads/preferences/${req.file.filename}`;
    const order =
      body.order != null && body.order !== ""
        ? Number(body.order)
        : (await PreferenceOption.countDocuments()) + 1;

    const doc = await PreferenceOption.create({
      name,
      key,
      icon: iconPath,
      active: body.active !== false && body.active !== "0" && body.active !== 0,
      order: Number.isFinite(order) ? order : 0,
    });

    return res
      .status(201)
      .json({ success: true, message: "Created", preference: doc.toObject() });
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", { key: "Preference with this name already exists" });
    }
    next(e);
  }
}

async function updatePreferenceOption(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await PreferenceOption.findById(id);
    if (!doc) return err(res, 404, "Preference not found");

    const body = req.body || {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) return err(res, 422, "name cannot be empty");
      doc.name = name;
      doc.key = slugKey(name);
      if (!doc.key) return err(res, 422, "Invalid name for key");
    }

    if (req.file) {
      doc.icon = `/uploads/preferences/${req.file.filename}`;
    } else if (body.icon !== undefined) {
      doc.icon = body.icon == null ? "" : String(body.icon).trim();
    }

    if (body.active !== undefined) {
      doc.active = body.active === true || body.active === 1 || body.active === "1";
    }

    if (body.order !== undefined) doc.order = body.order == null ? 0 : Number(body.order);

    await doc.save();

    return ok(res, { preference: doc.toObject() }, "Updated");
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", { key: "Preference with this name already exists" });
    }
    next(e);
  }
}

async function updatePreferenceStatus(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await PreferenceOption.findById(id);
    if (!doc) return err(res, 404, "Preference not found");

    const body = req.body || {};
    if (body.active === undefined) {
      return err(res, 422, "active is required (0 or 1)");
    }

    doc.active = body.active === true || body.active === 1 || body.active === "1";
    await doc.save();

    return ok(res, { preference: doc.toObject() }, "Updated");
  } catch (e) {
    next(e);
  }
}

async function deletePreferenceOption(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await PreferenceOption.findByIdAndDelete(id);
    if (!doc) return err(res, 404, "Preference not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listPreferenceOptions,
  getPreferenceOption,
  createPreferenceOption,
  updatePreferenceOption,
  updatePreferenceStatus,
  deletePreferenceOption,
};
