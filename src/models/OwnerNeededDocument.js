const mongoose = require("mongoose");

const OwnerNeededDocumentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    doc_type: String,
    has_identify_number: { type: Boolean, default: false },
    has_expiry_date: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },
    identify_number_locale_key: String,
    image_type: String,
    is_editable: { type: Boolean, default: true },
    document_name_front: String,
    document_name_back: String,
    is_required: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.OwnerNeededDocument ||
  mongoose.model("OwnerNeededDocument", OwnerNeededDocumentSchema);
