const mongoose = require("mongoose");

const AirportSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    service_location_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceLocation",
      required: true,
      index: true
    },
    coordinates: mongoose.Schema.Types.Mixed,
    active: { type: Boolean, default: true, index: true }
  },
  { timestamps: true }
);

AirportSchema.index({ service_location_id: 1, name: 1 }, { unique: true });

module.exports =
  mongoose.models.Airport || mongoose.model("Airport", AirportSchema);

