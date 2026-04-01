const fs = require("fs");
const path = require("path");

async function upsertByKey(Model, key, docs) {
  if (!docs || !docs.length) return;
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

/** Read JSON from `src/seeders/...` paths; strips UTF-8 BOM (e.g. PowerShell redirects). */
function readSeedJson(...segments) {
  const full = path.join(__dirname, ...segments);
  const raw = fs.readFileSync(full, "utf8").replace(/^\uFEFF/, "");
  return JSON.parse(raw);
}

module.exports = { upsertByKey, readSeedJson };

