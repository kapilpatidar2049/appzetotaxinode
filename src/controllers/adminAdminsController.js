const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const User = require("../models/User");
const Role = require("../models/Role");
const RoleUser = require("../models/RoleUser");
const AdminDetail = require("../models/AdminDetail");

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

async function resolveRoleOrThrow(roleSlug) {
  const role = await Role.findOne({ slug: roleSlug }).lean();
  if (!role) return null;
  return role;
}

async function attachRole(userId, roleSlug) {
  const role = await resolveRoleOrThrow(roleSlug);
  if (!role) {
    throw new Error(`Role "${roleSlug}" not found in database`);
  }
  await RoleUser.updateOne(
    { role_id: role._id, user_id: userId },
    { $setOnInsert: { role_id: role._id, user_id: userId } },
    { upsert: true }
  );
}

async function normalizeAdminDetailPayload(payload) {
  // AdminDetail only has fields we mirror from request payload.
  const p = payload || {};
  return {
    first_name: p.first_name,
    last_name: p.last_name,
    email: p.email,
    mobile: p.mobile,
    address: p.address,
    country: p.country,
    pincode: p.pincode,
    timezone: p.timezone,
    emergency_contact: p.emergency_contact,
    area_name: p.area_name,
  };
}

function isValidAdminRoleSlug(roleSlug) {
  return ["admin", "dispatcher", "super-admin"].includes(roleSlug);
}

async function listAdmins(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const { role, search, active } = req.query;

    const filter = {};
    const roles = ["admin", "dispatcher", "super-admin"];
    if (role) {
      const r = String(role);
      if (!roles.includes(r)) return err(res, 422, "Invalid role");
      filter.role = r;
    } else {
      filter.role = { $in: roles };
    }

    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;

    // Exclude soft-deleted by convention (some controllers use this pattern).
    filter.$or = [{ is_deleted_at: null }, { is_deleted_at: { $exists: false } }];

    if (search) {
      const rx = new RegExp(String(search).replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$and = filter.$and || [];
      filter.$and.push({ $or: [{ name: rx }, { mobile: rx }, { email: rx }] });
    }

    const [items, total] = await Promise.all([
      User.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.countDocuments(filter),
    ]);

    const ids = items.map((u) => u._id);
    const details = ids.length ? await AdminDetail.find({ user_id: { $in: ids } }).lean() : [];
    const detailMap = new Map(details.map((d) => [String(d.user_id), d]));

    const results = items.map((u) => ({
      ...u,
      admin_detail: detailMap.get(String(u._id)) || null,
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

async function getAdmin(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");

    const user = await User.findOne({
      _id: id,
      role: { $in: ["admin", "dispatcher", "super-admin"] },
      $or: [{ is_deleted_at: null }, { is_deleted_at: { $exists: false } }],
    }).lean();

    if (!user) return err(res, 404, "Admin not found");

    const detail = await AdminDetail.findOne({ user_id: user._id }).lean();

    return ok(res, {
      admin: {
        ...user,
        admin_detail: detail || null,
      },
    });
  } catch (e) {
    next(e);
  }
}

async function createAdmin(req, res, next) {
  try {
    const body = req.body || {};
    const roleSlug = String(body.role);

    if (!isValidAdminRoleSlug(roleSlug)) return err(res, 422, "Invalid role");
    if (roleSlug === "super-admin") return err(res, 422, "Use super-admin role only for super-admin self management");

    const firstName = String(body.first_name).trim();
    const lastName = String(body.last_name).trim();

    const emailNorm = String(body.email).toLowerCase().trim();
    const mobileNorm = String(body.mobile).trim();

    const existingEmail = await User.findOne({ email: emailNorm }).lean();
    if (existingEmail) return err(res, 422, "email already exists");

    const existingMobile = await User.findOne({ mobile: mobileNorm }).lean();
    if (existingMobile) return err(res, 422, "mobile already exists");

    const hashed = await bcrypt.hash(String(body.password), 10);

    const created = await User.create({
      name: `${firstName} ${lastName}`,
      email: emailNorm,
      mobile: mobileNorm,
      password: hashed,
      mobile_confirmed: true,
      active: body.active !== false,
      role: roleSlug,
    });

    await AdminDetail.create({
      user_id: created._id,
      ...((await normalizeAdminDetailPayload({ ...body, first_name: firstName, last_name: lastName })) || {}),
    });

    // Keep role links consistent so old role logins don't work after update/delete.
    await RoleUser.deleteMany({ user_id: created._id });
    await attachRole(created._id, roleSlug);

    const detail = await AdminDetail.findOne({ user_id: created._id }).lean();

    return ok(res, {
      admin: {
        ...(created.toObject ? created.toObject() : created),
        admin_detail: detail || null,
      },
    }, "Admin created");
  } catch (e) {
    next(e);
  }
}

async function updateAdmin(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");

    const body = req.body || {};

    const user = await User.findOne({
      _id: id,
      role: { $in: ["admin", "dispatcher", "super-admin"] },
    });
    if (!user) return err(res, 404, "Admin not found");

    const currentRole = user.role;

    const currentDetail = await AdminDetail.findOne({ user_id: user._id }).lean();

    // role update
    let nextRole = body.role !== undefined ? String(body.role) : currentRole;
    if (body.role !== undefined && !isValidAdminRoleSlug(nextRole)) return err(res, 422, "Invalid role");

    // Email/mobile uniqueness
    if (body.email !== undefined) {
      const emailNorm = String(body.email).toLowerCase().trim();
      const exists = await User.findOne({ email: emailNorm, _id: { $ne: user._id } }).lean();
      if (exists) return err(res, 422, "email already exists");
      user.email = emailNorm;
    }
    if (body.mobile !== undefined) {
      const mobileNorm = String(body.mobile).trim();
      const exists = await User.findOne({ mobile: mobileNorm, _id: { $ne: user._id } }).lean();
      if (exists) return err(res, 422, "mobile already exists");
      user.mobile = mobileNorm;
    }

    if (body.password !== undefined) {
      user.password = await bcrypt.hash(String(body.password), 10);
    }

    if (body.active !== undefined) user.active = Boolean(body.active);

    // Update display name if first/last provided
    if (body.first_name !== undefined || body.last_name !== undefined) {
      const first = body.first_name !== undefined ? String(body.first_name).trim() : currentDetail?.first_name || "";
      const last = body.last_name !== undefined ? String(body.last_name).trim() : currentDetail?.last_name || "";
      user.name = `${first} ${last}`.trim();
    }

    // Role links
    if (nextRole !== currentRole) {
      user.role = nextRole;
      await RoleUser.deleteMany({ user_id: user._id });
      await attachRole(user._id, nextRole);
    }

    await user.save();

    const detailUpdates = {};
    if (body.first_name !== undefined) detailUpdates.first_name = String(body.first_name).trim();
    if (body.last_name !== undefined) detailUpdates.last_name = String(body.last_name).trim();
    if (body.email !== undefined) detailUpdates.email = String(body.email).toLowerCase().trim();
    if (body.mobile !== undefined) detailUpdates.mobile = String(body.mobile).trim();
    if (body.address !== undefined) detailUpdates.address = body.address;
    if (body.country !== undefined) detailUpdates.country = body.country;
    if (body.pincode !== undefined) detailUpdates.pincode = body.pincode;
    if (body.timezone !== undefined) detailUpdates.timezone = body.timezone;
    if (body.emergency_contact !== undefined) detailUpdates.emergency_contact = body.emergency_contact;
    if (body.area_name !== undefined) detailUpdates.area_name = body.area_name;

    // Ensure email/mobile are always consistent with the user doc when a partial update happens.
    if (Object.keys(detailUpdates).length) {
      if (detailUpdates.email === undefined) detailUpdates.email = user.email;
      if (detailUpdates.mobile === undefined) detailUpdates.mobile = user.mobile;
    }

    const updatedDetail = await AdminDetail.findOneAndUpdate(
      { user_id: user._id },
      { $set: Object.keys(detailUpdates).length ? detailUpdates : {} },
      { upsert: true, new: true }
    ).lean();

    return ok(res, {
      admin: {
        ...(user.toObject ? user.toObject() : user),
        admin_detail: updatedDetail || null,
      },
    }, "Admin updated");
  } catch (e) {
    next(e);
  }
}

async function deleteAdmin(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");

    const user = await User.findOne({
      _id: id,
      role: { $in: ["admin", "dispatcher", "super-admin"] },
    });
    if (!user) return err(res, 404, "Admin not found");

    user.active = false;
    user.is_deleted_at = new Date();

    // Prevent admin logins by removing role links and changing role.
    user.role = "user";
    user.password = await bcrypt.hash(`${Date.now()}-deleted`, 10);
    await user.save();

    await RoleUser.deleteMany({ user_id: user._id });

    return ok(res, { id: user._id }, "Admin deleted");
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listAdmins,
  getAdmin,
  createAdmin,
  updateAdmin,
  deleteAdmin,
};

