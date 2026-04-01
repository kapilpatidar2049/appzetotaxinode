require("../bootstrapEnv");

const mongoose = require("mongoose");
const config = require("../config");
const { connectMongo, disconnectMongo } = require("../config/mongo");

const Role = require("../models/Role");
const Permission = require("../models/Permission");
const RolePermission = require("../models/RolePermission");
const NotificationChannel = require("../models/NotificationChannel");
const Setting = require("../models/Setting");
const Language = require("../models/Language");
const GoodsType = require("../models/GoodsType");
const CancellationReason = require("../models/CancellationReason");
const DriverNeededDocument = require("../models/DriverNeededDocument");
const OwnerNeededDocument = require("../models/OwnerNeededDocument");
const FleetNeededDocument = require("../models/FleetNeededDocument");

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
  "user.location.update",
  "user.favourite.list",
  "user.favourite.store",
  "user.favourite.delete",
  "user.bank.info",
  "driver.documents.read",
  "driver.documents.upload",
  "driver.earnings.read",
  "driver.subscription.manage",
  "driver.bank.info",
  "request.create",
  "request.cancel.user",
  "request.cancel.driver",
  "request.history.read",
  "request.rating.store",
  "request.chat.send",
  "request.chat.read",
  "payment.cards.manage",
  "payment.wallet.manage",
  "payment.withdrawal.request",
  "payment.gateway.read",
  "common.countries.read",
  "common.goods_types.read",
  "common.cancellation_reasons.read",
  "common.faq.read",
  "common.sos.manage",
  "support.ticket.manage",
  "preference.manage",
  "notification.read",
  "notification.delete",
  "owner.fleet.manage",
  "owner.driver.manage",
  "owner.dashboard.read",
];

const rolePermissions = {
  user: [
    "auth.login.user",
    "auth.register.user",
    "auth.otp.mobile",
    "auth.otp.email",
    "auth.password.reset",
    "user.me",
    "user.profile.update",
    "user.location.update",
    "user.favourite.list",
    "user.favourite.store",
    "user.favourite.delete",
    "user.bank.info",
    "request.create",
    "request.cancel.user",
    "request.history.read",
    "request.rating.store",
    "request.chat.send",
    "request.chat.read",
    "payment.cards.manage",
    "payment.wallet.manage",
    "payment.withdrawal.request",
    "payment.gateway.read",
    "common.countries.read",
    "common.goods_types.read",
    "common.cancellation_reasons.read",
    "common.faq.read",
    "common.sos.manage",
    "support.ticket.manage",
    "preference.manage",
    "notification.read",
    "notification.delete",
  ],
  driver: [
    "auth.login.driver",
    "auth.register.driver",
    "auth.otp.mobile",
    "auth.password.reset",
    "driver.documents.read",
    "driver.documents.upload",
    "driver.earnings.read",
    "driver.subscription.manage",
    "driver.bank.info",
    "request.cancel.driver",
    "request.chat.send",
    "request.chat.read",
    "notification.read",
    "notification.delete",
    "common.countries.read",
    "common.faq.read",
  ],
  owner: [
    "auth.register.owner",
    "owner.fleet.manage",
    "owner.driver.manage",
    "owner.dashboard.read",
    "support.ticket.manage",
    "notification.read",
    "notification.delete",
  ],
};

async function upsertByKey(Model, key, docs) {
  if (!docs.length) return;
  await Model.bulkWrite(
    docs.map((doc) => ({
      updateOne: {
        filter: { [key]: doc[key] },
        update: { $set: doc },
        upsert: true,
      },
    }))
  );
}

async function run() {

  await connectMongo();

  await upsertByKey(Role, "slug", roles);
  await upsertByKey(
    Permission,
    "name",
    permissions.map((name) => ({
      name,
      guard_name: "web",
      module: name.split(".")[0],
    }))
  );

  const roleDocs = await Role.find({ slug: { $in: Object.keys(rolePermissions) } }).lean();
  const permDocs = await Permission.find({ name: { $in: permissions } }).lean();
  const roleMap = new Map(roleDocs.map((r) => [r.slug, r._id]));
  const permMap = new Map(permDocs.map((p) => [p.name, p._id]));

  const rpOps = [];
  for (const [roleSlug, permNames] of Object.entries(rolePermissions)) {
    const roleId = roleMap.get(roleSlug);
    if (!roleId) continue;
    for (const permName of permNames) {
      const permId = permMap.get(permName);
      if (!permId) continue;
      rpOps.push({
        updateOne: {
          filter: { role_id: roleId, permission_id: permId },
          update: { $set: { role_id: roleId, permission_id: permId } },
          upsert: true,
        },
      });
    }
  }
  if (rpOps.length) await RolePermission.bulkWrite(rpOps);

  await upsertByKey(NotificationChannel, "slug", [
    { name: "Push", slug: "push", enabled: true },
    { name: "Email", slug: "email", enabled: true },
    { name: "SMS", slug: "sms", enabled: true },
  ]);

  await upsertByKey(Setting, "key", [
    { key: "privacy_policy", value: "Privacy policy content", group: "legal", is_public: true },
    { key: "terms_and_conditions", value: "Terms content", group: "legal", is_public: true },
    { key: "referral_condition_user", value: "Complete first trip to unlock reward", group: "referral" },
    { key: "referral_condition_driver", value: "Complete 10 trips to unlock reward", group: "referral" },
  ]);

  await upsertByKey(Language, "code", [
    { name: "English", code: "en", is_default: true, active: true, order: 1 },
    { name: "Hindi", code: "hi", active: true, order: 2 },
  ]);

  await upsertByKey(GoodsType, "name", [
    { name: "Documents", active: true },
    { name: "Food", active: true },
    { name: "Parcel", active: true },
  ]);

  await upsertByKey(CancellationReason, "reason", [
    { reason: "Driver is late", user_type: "user", active: true, order: 1 },
    { reason: "Changed my mind", user_type: "user", active: true, order: 2 },
    { reason: "Rider no-show", user_type: "driver", active: true, order: 3 },
  ]);

  await upsertByKey(DriverNeededDocument, "name", [
    { name: "Driving License", account_type: "both", active: true, is_required: true },
    { name: "Vehicle RC", account_type: "both", active: true, is_required: true },
    { name: "Insurance", account_type: "both", active: true, is_required: true },
  ]);

  await upsertByKey(OwnerNeededDocument, "name", [
    { name: "Owner ID Proof", active: true, is_required: true },
    { name: "Business Registration", active: true, is_required: true },
  ]);

  await upsertByKey(FleetNeededDocument, "name", [
    { name: "Fleet Permit", active: true, is_required: true },
    { name: "Fleet Insurance", active: true, is_required: true },
  ]);

  console.log("Endpoint seed completed successfully.");
  await disconnectMongo();
  await mongoose.connection.close();
}

run().catch(async (error) => {
  console.error("Seed failed:", error);
  try {
    await disconnectMongo();
    await mongoose.connection.close();
  } catch {
    // ignore cleanup failure
  }
  process.exit(1);
});

