const ThirdPartySetting = require("../models/ThirdPartySetting");
const { readSeedJson } = require("./utils");

async function runThirdPartySettingSeeder() {
  const { payment_settings, invoice_configuration } = readSeedJson("data", "thirdPartySettings.json");
  const rows = [...payment_settings, ...invoice_configuration];

  if (!rows.length) return;

  await ThirdPartySetting.bulkWrite(
    rows.map((r) => ({
      updateOne: {
        filter: { module: r.module, key: r.key },
        update: { $set: { value: r.value, is_active: true } },
        upsert: true,
      },
    }))
  );
}

module.exports = { runThirdPartySettingSeeder };
