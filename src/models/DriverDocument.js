const mongoose = require("mongoose");

const DriverDocumentSchema = new mongoose.Schema(
  {
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      index: true,
    },
    driver_needed_document_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "DriverNeededDocument",
      index: true,
    },
    document_name: String,
    document_path: String,
    approve: { type: Boolean, default: false, index: true },
    expired_at: Date,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DriverDocument ||
  mongoose.model("DriverDocument", DriverDocumentSchema);

