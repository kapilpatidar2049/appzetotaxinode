const mongoose = require("mongoose");
const Permission = require("../models/Permission");
const RolePermission = require("../models/RolePermission");

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
  const limit = Math.min(200, Math.max(1, parseInt(req.query.limit, 10) || 50));
  return { page, limit, skip: (page - 1) * limit };
}

async function listPermissions(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const { search, module, guard_name } = req.query;
    const filter = {};
    if (search && String(search).trim()) {
      const q = String(search).trim();
      filter.$or = [
        { name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        { description: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      ];
    }
    if (module) filter.module = String(module).trim();
    if (guard_name) filter.guard_name = String(guard_name).trim();

    const [items, total] = await Promise.all([
      Permission.find(filter).sort({ module: 1, name: 1 }).skip(skip).limit(limit).lean(),
      Permission.countDocuments(filter),
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

async function getPermission(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Permission.findById(id).lean();
    if (!doc) return err(res, 404, "Permission not found");
    return ok(res, { permission: doc });
  } catch (e) {
    next(e);
  }
}

async function createPermission(req, res, next) {
  try {
    const body = req.body || {};
    const name = body.name != null ? String(body.name).trim() : "";
    if (!name) return err(res, 422, "name is required");

    const doc = await Permission.create({
      name,
      guard_name: body.guard_name != null ? String(body.guard_name).trim() : "web",
      module:
        body.module != null
          ? String(body.module).trim()
          : name.includes(".")
            ? name.split(".")[0]
            : undefined,
      description: body.description != null ? String(body.description).trim() : "",
    });

    return res.status(201).json({ success: true, message: "Created", permission: doc.toObject() });
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", { name: "Permission name already exists" });
    }
    next(e);
  }
}

async function updatePermission(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Permission.findById(id);
    if (!doc) return err(res, 404, "Permission not found");

    const body = req.body || {};
    if (body.name !== undefined) doc.name = String(body.name).trim();
    if (body.guard_name !== undefined) doc.guard_name = String(body.guard_name || "web").trim();
    if (body.module !== undefined) doc.module = body.module == null ? undefined : String(body.module).trim();
    if (body.description !== undefined) doc.description = body.description == null ? "" : String(body.description).trim();

    await doc.save();
    return ok(res, { permission: doc.toObject() }, "Updated");
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", { name: "Permission name already exists" });
    }
    next(e);
  }
}

async function deletePermission(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    await RolePermission.deleteMany({ permission_id: id });
    const deleted = await Permission.findByIdAndDelete(id);
    if (!deleted) return err(res, 404, "Permission not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listPermissions,
  getPermission,
  createPermission,
  updatePermission,
  deletePermission,
};
