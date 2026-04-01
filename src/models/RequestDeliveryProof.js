const mongoose = require("mongoose");

const RequestDeliveryProofSchema = new mongoose.Schema(
  {
    request_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: true,
      index: true,
    },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", index: true },
    file_path: String,
    file_type: String,
    notes: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.RequestDeliveryProof ||
  mongoose.model("RequestDeliveryProof", RequestDeliveryProofSchema);

