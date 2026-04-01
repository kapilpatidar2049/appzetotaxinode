const OwnerNeededDocument = require("../models/OwnerNeededDocument");
const { upsertByKey } = require("./utils");

async function runOwnerNeededDocumentSeeder() {
  await upsertByKey(OwnerNeededDocument, "name", [
    { name: "Owner ID Proof", active: true, is_required: true },
    { name: "Business Registration", active: true, is_required: true },
  ]);
}

module.exports = { runOwnerNeededDocumentSeeder };

