const mongoose = require("mongoose");

const DriverNeededDocumentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    document_for: {
      type: String,
      enum: ["normal", "fleet", "both"],
      default: "both",
      index: true,
    },
    account_type: { type: String, default: "both", index: true },
    active: { type: Boolean, default: true, index: true },
    is_required: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DriverNeededDocument ||
  mongoose.model("DriverNeededDocument", DriverNeededDocumentSchema);

