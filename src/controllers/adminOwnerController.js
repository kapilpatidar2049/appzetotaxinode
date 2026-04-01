const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const User = require("../models/User");
const Role = require("../models/Role");
const RoleUser = require("../models/RoleUser");
const Owner = require("../models/Owner");

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

async function listOwners(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const search = (req.query.search || "").trim();

    let filter = {};
    if (search) {
      const rx = new RegExp(search.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      const users = await User.find({
        $or: [{ name: rx }, { mobile: rx }, { email: rx }],
      })
        .select("_id")
        .lean();
      const uid = users.map((u) => u._id);
      filter = {
        $or: [
          { company_name: rx },
          { owner_name: rx },
          { mobile: rx },
          { email: rx },
          ...(uid.length ? [{ user_id: { $in: uid } }] : []),
        ],
      };
    }

    const [items, total] = await Promise.all([
      Owner.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("user_id", "name email mobile country gender active profile_picture")
        .populate("service_location_id", "name")
        .lean(),
      Owner.countDocuments(filter),
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

async function getOwner(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid owner id");
    }
    const owner = await Owner.findById(id)
      .populate("user_id")
      .populate("service_location_id", "name")
      .lean();
    if (!owner) {
      return err(res, 404, "Owner not found");
    }
    return ok(res, { owner });
  } catch (e) {
    next(e);
  }
}

async function createOwner(req, res, next) {
  try {
    const {
      name,
      owner_name,
      company_name,
      country,
      mobile,
      email,
      password,
      service_location_id,
      address,
      city,
      postal_code,
      tax_number,
      bank_name,
      account_no,
      ifsc,
      no_of_vehicles,
      transport_type,
    } = req.body || {};

    const errors = {};
    if (!name) errors.name = "name is required";
    if (!mobile) errors.mobile = "mobile is required";
    if (!password) errors.password = "password is required";
    if (!country || !mongoose.Types.ObjectId.isValid(country)) {
      errors.country = "valid country is required";
    }

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
    const countryId = new mongoose.Types.ObjectId(country);

    const user = await User.create({
      name: String(name).trim(),
      email: email ? String(email).toLowerCase().trim() : undefined,
      mobile: String(mobile).trim(),
      mobile_confirmed: true,
      password: hashed,
      refferal_code: randomReferral(6),
      country: countryId,
      role: "owner",
      active: true,
    });

    await attachRole(user._id, "owner");

    const owner = await Owner.create({
      user_id: user._id,
      owner_name: owner_name || name,
      name: String(name).trim(),
      company_name: company_name || undefined,
      mobile: String(mobile).trim(),
      email: email ? String(email).toLowerCase().trim() : undefined,
      service_location_id:
        service_location_id && mongoose.Types.ObjectId.isValid(service_location_id)
          ? service_location_id
          : undefined,
      address,
      city,
      postal_code,
      tax_number,
      bank_name,
      account_no,
      ifsc,
      no_of_vehicles: no_of_vehicles != null ? Number(no_of_vehicles) : undefined,
      transport_type,
      active: true,
      approve: false,
    });

    const populated = await Owner.findById(owner._id)
      .populate("user_id")
      .populate("service_location_id", "name")
      .lean();

    return res.status(201).json({
      success: true,
      message: "Owner created successfully.",
      owner: populated,
    });
  } catch (e) {
    next(e);
  }
}

async function updateOwner(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid owner id");
    }

    const owner = await Owner.findById(id);
    if (!owner) {
      return err(res, 404, "Owner not found");
    }

    const user = await User.findById(owner.user_id);
    if (!user) {
      return err(res, 404, "Linked user not found");
    }

    const {
      name,
      owner_name,
      company_name,
      country,
      mobile,
      email,
      password,
      service_location_id,
      address,
      city,
      postal_code,
      tax_number,
      bank_name,
      account_no,
      ifsc,
      no_of_vehicles,
      transport_type,
      active,
      approve,
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

    if (name !== undefined) {
      user.name = String(name).trim();
      owner.name = String(name).trim();
    }
    if (owner_name !== undefined) owner.owner_name = owner_name;
    if (company_name !== undefined) owner.company_name = company_name;
    if (country !== undefined) {
      user.country =
        country && mongoose.Types.ObjectId.isValid(country) ? country : null;
    }
    if (mobile !== undefined) {
      user.mobile = String(mobile).trim();
      owner.mobile = String(mobile).trim();
    }
    if (email !== undefined) {
      user.email = email ? String(email).toLowerCase().trim() : undefined;
      owner.email = user.email;
    }
    if (password) user.password = await bcrypt.hash(password, 10);
    if (service_location_id !== undefined) {
      owner.service_location_id =
        service_location_id && mongoose.Types.ObjectId.isValid(service_location_id)
          ? service_location_id
          : null;
    }
    if (address !== undefined) owner.address = address;
    if (city !== undefined) owner.city = city;
    if (postal_code !== undefined) owner.postal_code = postal_code;
    if (tax_number !== undefined) owner.tax_number = tax_number;
    if (bank_name !== undefined) owner.bank_name = bank_name;
    if (account_no !== undefined) owner.account_no = account_no;
    if (ifsc !== undefined) owner.ifsc = ifsc;
    if (no_of_vehicles !== undefined) owner.no_of_vehicles = Number(no_of_vehicles);
    if (transport_type !== undefined) owner.transport_type = transport_type;
    if (active !== undefined) {
      user.active = Boolean(active);
      owner.active = Boolean(active);
    }
    if (approve !== undefined) owner.approve = Boolean(approve);

    await user.save();
    await owner.save();

    const populated = await Owner.findById(owner._id)
      .populate("user_id")
      .populate("service_location_id", "name")
      .lean();

    return ok(res, { owner: populated }, "Owner updated");
  } catch (e) {
    next(e);
  }
}

async function deleteOwner(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return err(res, 400, "Invalid owner id");
    }
    const owner = await Owner.findById(id);
    if (!owner) {
      return err(res, 404, "Owner not found");
    }
    owner.active = false;
    await owner.save();
    const user = await User.findById(owner.user_id);
    if (user) {
      user.active = false;
      user.is_deleted_at = new Date();
      await user.save();
    }
    return ok(res, { id: owner._id }, "Owner deactivated");
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listOwners,
  getOwner,
  createOwner,
  updateOwner,
  deleteOwner,
};
