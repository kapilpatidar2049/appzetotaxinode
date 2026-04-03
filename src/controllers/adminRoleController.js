const mongoose = require("mongoose");
const Role = require("../models/Role");
const RolePermission = require("../models/RolePermission");
const Permission = require("../models/Permission");
const RoleUser = require("../models/RoleUser");

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

function normalizeSlug(s) {
  return String(s || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

async function listRoles(req, res, next) {
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
        { slug: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      ];
    }

    const [items, total] = await Promise.all([
      Role.find(filter).sort({ name: 1 }).skip(skip).limit(limit).lean(),
      Role.countDocuments(filter),
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

async function getRole(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Role.findById(id).lean();
    if (!doc) return err(res, 404, "Role not found");

    const permLinks = await RolePermission.find({ role_id: id })
      .populate("permission_id", "name guard_name module description")
      .lean();

    const permissions = permLinks
      .map((l) => l.permission_id)
      .filter(Boolean)
      .map((p) => ({
        id: p._id,
        name: p.name,
        guard_name: p.guard_name,
        module: p.module,
        description: p.description,
      }));

    return ok(res, { role: doc, permissions });
  } catch (e) {
    next(e);
  }
}

async function createRole(req, res, next) {
  try {
    const body = req.body || {};
    const slug = body.slug != null ? normalizeSlug(body.slug) : normalizeSlug(body.name);
    const name = body.name != null ? String(body.name).trim() : "";
    if (!slug) return err(res, 422, "slug or name is required");
    if (!name) return err(res, 422, "name is required");

    const doc = await Role.create({
      slug,
      name,
      description: body.description != null ? String(body.description).trim() : "",
      module: body.module != null ? String(body.module).trim() : undefined,
      active: body.active !== false && body.active !== "0" && body.active !== 0,
      all: body.all === true || body.all === 1 || body.all === "1",
    });

    return res.status(201).json({ success: true, message: "Created", role: doc.toObject() });
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", { slug: "Role slug already exists" });
    }
    next(e);
  }
}

async function updateRole(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Role.findById(id);
    if (!doc) return err(res, 404, "Role not found");

    const body = req.body || {};
    if (body.slug !== undefined) {
      const slug = normalizeSlug(body.slug);
      if (!slug) return err(res, 422, "Invalid slug");
      doc.slug = slug;
    }
    if (body.name !== undefined) doc.name = String(body.name).trim();
    if (body.description !== undefined) doc.description = body.description == null ? "" : String(body.description).trim();
    if (body.module !== undefined) doc.module = body.module == null ? undefined : String(body.module).trim();
    if (body.active !== undefined) {
      doc.active = body.active === true || body.active === 1 || body.active === "1";
    }
    if (body.all !== undefined) {
      doc.all = body.all === true || body.all === 1 || body.all === "1";
    }

    await doc.save();
    return ok(res, { role: doc.toObject() }, "Updated");
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", { slug: "Role slug already exists" });
    }
    next(e);
  }
}

async function deleteRole(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");

    const usersWithRole = await RoleUser.countDocuments({ role_id: id });
    if (usersWithRole > 0) {
      return err(res, 422, "Role is assigned to users; reassign them before deleting", {
        users_count: usersWithRole,
      });
    }

    await RolePermission.deleteMany({ role_id: id });
    const deleted = await Role.findByIdAndDelete(id);
    if (!deleted) return err(res, 404, "Role not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

async function getRolePermissions(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const role = await Role.findById(id).select("_id slug name").lean();
    if (!role) return err(res, 404, "Role not found");

    const links = await RolePermission.find({ role_id: id })
      .populate("permission_id", "name guard_name module description createdAt updatedAt")
      .lean();

    const permissions = links
      .map((l) => l.permission_id)
      .filter(Boolean)
      .map((p) => ({
        id: p._id,
        name: p.name,
        guard_name: p.guard_name,
        module: p.module,
        description: p.description,
        created_at: p.createdAt,
        updated_at: p.updatedAt,
      }));

    const permission_ids = permissions.map((p) => p.id);

    return ok(res, { role, permission_ids, permissions });
  } catch (e) {
    next(e);
  }
}

/**
 * Replace all permissions for a role.
 * Body: { permission_ids: string[] } OR { permission_names: string[] }
 */
async function assignRolePermissions(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const role = await Role.findById(id);
    if (!role) return err(res, 404, "Role not found");

    const body = req.body || {};
    let permIds = [];

    if (Array.isArray(body.permission_ids) && body.permission_ids.length) {
      const raw = body.permission_ids.map((x) => String(x).trim()).filter(Boolean);
      for (const pid of raw) {
        if (!mongoose.Types.ObjectId.isValid(pid)) {
          return err(res, 422, "Invalid permission id", { permission_ids: pid });
        }
      }
      const found = await Permission.find({ _id: { $in: raw } }).select("_id").lean();
      if (found.length !== raw.length) {
        return err(res, 422, "One or more permission ids do not exist");
      }
      permIds = raw;
    } else if (Array.isArray(body.permission_names) && body.permission_names.length) {
      const names = body.permission_names.map((n) => String(n).trim()).filter(Boolean);
      const perms = await Permission.find({ name: { $in: names } }).select("_id name").lean();
      if (perms.length !== names.length) {
        const have = new Set(perms.map((p) => p.name));
        const missing = names.filter((n) => !have.has(n));
        return err(res, 422, "Unknown permission names", { missing });
      }
      permIds = perms.map((p) => String(p._id));
    } else {
      permIds = [];
    }

    await RolePermission.deleteMany({ role_id: id });
    if (permIds.length) {
      await RolePermission.insertMany(
        permIds.map((permission_id) => ({ role_id: id, permission_id }))
      );
    }

    const populated = await RolePermission.find({ role_id: id })
      .populate("permission_id", "name guard_name module description")
      .lean();

    const permissions = populated
      .map((l) => l.permission_id)
      .filter(Boolean)
      .map((p) => ({
        id: p._id,
        name: p.name,
        guard_name: p.guard_name,
        module: p.module,
        description: p.description,
      }));

    return ok(
      res,
      {
        role: role.toObject(),
        permission_ids: permIds,
        permissions,
      },
      "Permissions updated"
    );
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listRoles,
  getRole,
  createRole,
  updateRole,
  deleteRole,
  getRolePermissions,
  assignRolePermissions,
};
