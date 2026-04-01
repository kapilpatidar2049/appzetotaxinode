const TimeZone = require("../models/TimeZone");

async function runTimeZoneSeeder() {
  const existing = await TimeZone.countDocuments();
  if (existing > 0) return;

  const ids = Intl.supportedValuesOf("timeZone");
  const docs = ids.map((timezone) => ({
    timezone,
    name: timezone.replace(/_/g, " "),
    active: true,
  }));

  await TimeZone.insertMany(docs, { ordered: false });
}

module.exports = { runTimeZoneSeeder };
