const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Role = require("../models/Role");
const RoleUser = require("../models/RoleUser");
const AdminDetail = require("../models/AdminDetail");

async function runAdminSeeder() {
  const superAdmin = await Role.findOne({ slug: "super-admin" }).lean();
  if (!superAdmin) {
    console.warn("AdminSeeder: super-admin role missing; run RolesAndPermissionsSeeder first.");
    return;
  }

  const existingLink = await RoleUser.findOne({ role_id: superAdmin._id }).lean();
  if (existingLink) return;

  const email = "admin@admin.com";
  const passwordPlain = "123456789";
  const mobile = "9999999999";
  const name = "admin";

  const user = await User.create({
    name,
    email,
    mobile,
    password: bcrypt.hashSync(passwordPlain, 10),
    mobile_confirmed: true,
    active: true,
  });

  await RoleUser.create({ user_id: user._id, role_id: superAdmin._id });

  await AdminDetail.create({
    user_id: user._id,
    first_name: name,
    email,
    mobile,
  });
}

module.exports = { runAdminSeeder };
