const Language = require("../models/Language");
const { upsertByKey } = require("./utils");

async function runDefaultLanguageSeeder() {
  await upsertByKey(Language, "code", [
    { name: "English", code: "en", is_default: true, active: true, order: 1 },
    { name: "Hindi", code: "hi", active: true, order: 2 },
  ]);
}

module.exports = { runDefaultLanguageSeeder };

