const MailTemplate = require("../models/MailTemplate");
const { readSeedJson } = require("./utils");

async function runMailTemplateSeeder() {
  const exists = await MailTemplate.findOne().lean();
  if (exists) return;

  const rows = readSeedJson("data", "mailTemplates.json");
  await MailTemplate.insertMany(rows);
}

module.exports = { runMailTemplateSeeder };
