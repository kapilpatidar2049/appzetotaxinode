const mongoose = require("mongoose");

const CancellationReasonSchema = new mongoose.Schema(
  {
    reason: { type: String, required: true },
    user_type: { type: String, enum: ["user", "driver", "both"], default: "both", index: true },
    active: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.CancellationReason ||
  mongoose.model("CancellationReason", CancellationReasonSchema);

