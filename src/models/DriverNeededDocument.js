const mongoose = require("mongoose");

const DriverNeededDocumentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    doc_type: String,
    document_for: {
      type: String,
      enum: ["normal", "fleet", "both"],
      default: "both",
      index: true,
    },
    account_type: { type: String, default: "both", index: true },
    has_identify_number: { type: Boolean, default: false },
    has_expiry_date: { type: Boolean, default: false },
    identify_number_locale_key: String,
    image_type: String,
    is_editable: { type: Boolean, default: true },
    document_name_front: String,
    document_name_back: String,
    active: { type: Boolean, default: true, index: true },
    is_required: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DriverNeededDocument ||
  mongoose.model("DriverNeededDocument", DriverNeededDocumentSchema);

