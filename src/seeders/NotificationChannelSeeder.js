const NotificationChannel = require("../models/NotificationChannel");
const { upsertByKey } = require("./utils");

async function runNotificationChannelSeeder() {
  await upsertByKey(NotificationChannel, "slug", [
    { name: "Push", slug: "push", enabled: true },
    { name: "Email", slug: "email", enabled: true },
    { name: "SMS", slug: "sms", enabled: true },
  ]);
}

module.exports = { runNotificationChannelSeeder };

