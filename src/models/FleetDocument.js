const mongoose = require("mongoose");

const FleetDocumentSchema = new mongoose.Schema(
  {
    fleet_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Fleet",
      required: true,
      index: true,
    },
    fleet_needed_document_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FleetNeededDocument",
      index: true,
    },
    document_name: String,
    document_path: String,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
    approve: { type: Boolean, default: false, index: true },
    rejected_reason: String,
    reviewed_at: Date,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.FleetDocument || mongoose.model("FleetDocument", FleetDocumentSchema);
