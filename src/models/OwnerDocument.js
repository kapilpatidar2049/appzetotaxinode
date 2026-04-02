const mongoose = require("mongoose");

const OwnerDocumentSchema = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
      index: true,
    },
    owner_needed_document_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "OwnerNeededDocument",
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
  mongoose.models.OwnerDocument || mongoose.model("OwnerDocument", OwnerDocumentSchema);

