const mongoose = require("mongoose");

const VehicleTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    short_name: String,
    short_description: String,
    description: String,
    icon: String,
    image: String,
    icon_types_for: String,
    transport_type: { type: String, index: true },
    size: String,
    trip_dispatch_type: String,
    maximum_weight_can_carry: Number,
    supported_vehicles: [String],
    base_fare: Number,
    per_km_rate: Number,
    per_min_rate: Number,
    active: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.VehicleType || mongoose.model("VehicleType", VehicleTypeSchema);

