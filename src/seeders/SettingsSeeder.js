require("../bootstrapEnv");

// const { default: mongoose } = require("mongoose");
const Setting = require("../models/Setting");
const {connectMongo} = require("../config/mongo");
const { upsertByKey } = require("./utils");

async function runSettingsSeeder() {
  console.log("Seeder started...");
  await upsertByKey(Setting, "key", [
    { key: "privacy_policy", value: "Privacy policy content", group: "legal", is_public: true },
    { key: "terms_and_conditions", value: "Terms content", group: "legal", is_public: true },
    { key: "referral_condition_user", value: "Complete first trip to unlock reward", group: "referral" },
    { key: "referral_condition_driver", value: "Complete 10 trips to unlock reward", group: "referral" },
  ]);
  console.log("Seeder Ended...");
}

if (require.main === module) {
  (async () => {
    try {
      console.log("Connecting DB...");

      await connectMongo(); // ✅ THIS WAS MISSING

      await runSettingsSeeder();

      console.log("Seeder completed...");
      process.exit();
    } catch (err) {
      console.error("Seeder error:", err);
      process.exit(1);
    }
  })();
}

module.exports = { runSettingsSeeder };

