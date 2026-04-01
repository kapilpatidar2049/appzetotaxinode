const mongoose = require("mongoose");

const SosSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", index: true },
    request_id: { type: mongoose.Schema.Types.ObjectId, ref: "Request", index: true },
    name: String,
    number: String,
    type: { type: String, enum: ["contact", "event"], default: "contact", index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Sos || mongoose.model("Sos", SosSchema);

