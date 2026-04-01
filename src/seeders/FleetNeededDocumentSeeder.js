const FleetNeededDocument = require("../models/FleetNeededDocument");
const { upsertByKey } = require("./utils");

async function runFleetNeededDocumentSeeder() {
  await upsertByKey(FleetNeededDocument, "name", [
    { name: "Fleet Permit", active: true, is_required: true },
    { name: "Fleet Insurance", active: true, is_required: true },
  ]);
}

module.exports = { runFleetNeededDocumentSeeder };

