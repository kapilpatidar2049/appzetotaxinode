const ReferralCondition = require("../models/ReferralCondition");
const Setting = require("../models/Setting");
const { upsertByKey, readSeedJson } = require("./utils");

async function runReferralConditionSeeder() {
  const exists = await ReferralCondition.findOne().lean();
  if (exists) return;

  const rows = readSeedJson("data", "referralConditions.json");

  for (const row of rows) {
    const translation_dataset = JSON.stringify({
      en: { locale: "en", description: row.description },
    });
    await ReferralCondition.create({ ...row, translation_dataset });
  }

  const userBanner = rows.find((r) => r.referral_type === "user_banner_text");
  const driverBanner = rows.find((r) => r.referral_type === "driver_banner_text");

  await upsertByKey(Setting, "key", [
    ...(userBanner
      ? [{ key: "referral_condition_user", value: userBanner.description, group: "referral" }]
      : []),
    ...(driverBanner
      ? [{ key: "referral_condition_driver", value: driverBanner.description, group: "referral" }]
      : []),
  ]);
}

module.exports = { runReferralConditionSeeder };
