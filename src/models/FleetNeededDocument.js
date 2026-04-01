const mongoose = require("mongoose");

const FleetNeededDocumentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    doc_type: String,
    has_identify_number: { type: Boolean, default: false },
    has_expiry_date: { type: Boolean, default: false },
    document_name_front: String,
    document_name_back: String,
    active: { type: Boolean, default: true, index: true },
    identify_number_locale_key: String,
    image_type: String,
    is_editable: { type: Boolean, default: true },
    is_required: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.FleetNeededDocument ||
  mongoose.model("FleetNeededDocument", FleetNeededDocumentSchema);
