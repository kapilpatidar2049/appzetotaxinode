const mongoose = require("mongoose");

const ZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    code: { type: String, trim: true, uppercase: true, index: true },
    service_location_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ServiceLocation",
      required: true,
      index: true,
    },
    coordinates: mongoose.Schema.Types.Mixed,
    languageFields: mongoose.Schema.Types.Mixed,
    distance_price_percentage: { type: Number, default: 0 },
    maximum_distance: { type: Number, default: 0 },
    maximum_outstation_distance: { type: Number, default: 0 },
    peak_zone_duration: { type: Number, default: 0 },
    peak_zone_history_duration: { type: Number, default: 0 },
    peak_zone_radius: { type: Number, default: 0 },
    peak_zone_ride_count: { type: Number, default: 0 },
    unit: String,
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

ZoneSchema.index({ service_location_id: 1, name: 1 }, { unique: true });
ZoneSchema.index({ service_location_id: 1, code: 1 }, { unique: true, sparse: true });

module.exports = mongoose.models.Zone || mongoose.model("Zone", ZoneSchema);
