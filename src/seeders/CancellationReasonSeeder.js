const CancellationReason = require("../models/CancellationReason");
const { upsertByKey } = require("./utils");

async function runCancellationReasonSeeder() {
  await upsertByKey(CancellationReason, "reason", [
    { reason: "Driver is late", user_type: "user", active: true, order: 1 },
    { reason: "Changed my mind", user_type: "user", active: true, order: 2 },
    { reason: "Rider no-show", user_type: "driver", active: true, order: 3 },
  ]);
}

module.exports = { runCancellationReasonSeeder };

