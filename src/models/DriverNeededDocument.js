const mongoose = require("mongoose");

const DriverNeededDocumentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    account_type: { type: String, default: "both", index: true },
    active: { type: Boolean, default: true, index: true },
    is_required: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DriverNeededDocument ||
  mongoose.model("DriverNeededDocument", DriverNeededDocumentSchema);

