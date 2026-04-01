const Role = require("../models/Role");
const Permission = require("../models/Permission");
const RolePermission = require("../models/RolePermission");
const { upsertByKey } = require("./utils");

const roles = [
  { slug: "user", name: "User" },
  { slug: "driver", name: "Driver" },
  { slug: "owner", name: "Owner" },
  { slug: "dispatcher", name: "Dispatcher" },
  { slug: "admin", name: "Admin" },
  { slug: "super-admin", name: "Super Admin", all: true },
];

const permissions = [
  "auth.login.user",
  "auth.login.driver",
  "auth.register.user",
  "auth.register.driver",
  "auth.register.owner",
  "auth.otp.mobile",
  "auth.otp.email",
  "auth.password.reset",
  "user.me",
  "user.profile.update",
  "driver.documents.read",
  "driver.documents.upload",
  "driver.earnings.read",
  "request.create",
  "request.history.read",
  "payment.cards.manage",
  "payment.wallet.manage",
  "common.faq.read",
  "support.ticket.manage",
  "owner.fleet.manage",
];

const rolePermissions = {
  user: ["auth.login.user", "auth.register.user", "user.me", "user.profile.update", "request.create", "request.history.read", "payment.cards.manage", "payment.wallet.manage", "common.faq.read", "support.ticket.manage"],
  driver: ["auth.login.driver", "auth.register.driver", "driver.documents.read", "driver.documents.upload", "driver.earnings.read", "request.history.read", "common.faq.read"],
  owner: ["auth.register.owner", "owner.fleet.manage", "support.ticket.manage"],
};

async function runRolesAndPermissionsSeeder() {
  await upsertByKey(Role, "slug", roles);
  await upsertByKey(
    Permission,
    "name",
    permissions.map((name) => ({ name, guard_name: "web", module: name.split(".")[0] }))
  );

  const roleDocs = await Role.find({ slug: { $in: Object.keys(rolePermissions) } }).lean();
  const permDocs = await Permission.find({ name: { $in: permissions } }).lean();
  const roleMap = new Map(roleDocs.map((r) => [r.slug, r._id]));
  const permMap = new Map(permDocs.map((p) => [p.name, p._id]));

  const ops = [];
  for (const [roleSlug, permNames] of Object.entries(rolePermissions)) {
    const roleId = roleMap.get(roleSlug);
    if (!roleId) continue;
    for (const permName of permNames) {
      const permissionId = permMap.get(permName);
      if (!permissionId) continue;
      ops.push({
        updateOne: {
          filter: { role_id: roleId, permission_id: permissionId },
          update: { $set: { role_id: roleId, permission_id: permissionId } },
          upsert: true,
        },
      });
    }
  }
  if (ops.length) await RolePermission.bulkWrite(ops);
}

module.exports = { runRolesAndPermissionsSeeder };

