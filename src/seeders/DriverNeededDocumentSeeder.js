const DriverNeededDocument = require("../models/DriverNeededDocument");
const { upsertByKey } = require("./utils");

async function runDriverNeededDocumentSeeder() {
  await upsertByKey(DriverNeededDocument, "name", [
    { name: "Driving License", account_type: "both", active: true, is_required: true },
    { name: "Vehicle RC", account_type: "both", active: true, is_required: true },
    { name: "Insurance", account_type: "both", active: true, is_required: true },
  ]);
}

module.exports = { runDriverNeededDocumentSeeder };

