const mongoose = require("mongoose");

const DriverSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", index: true },
    fleet_id: mongoose.Schema.Types.ObjectId,
    service_location_id: mongoose.Schema.Types.ObjectId,
    name: String,
    mobile: String,
    email: String,
    gender: String,
    car_make: String,
    car_model: String,
    car_color: String,
    car_number: String,
    vehicle_year: String,
    custom_make: String,
    custom_model: String,
    transport_type: String,
    is_subscribed: { type: Boolean, default: false },
    available: { type: Boolean, default: false, index: true },
    active: { type: Boolean, default: false, index: true },
    approve: { type: Boolean, default: false, index: true },
    reason: String,
    price_per_distance: Number,
    my_route_lat: Number,
    my_route_lng: Number,
    my_route_address: String,
    enable_my_route_booking: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Driver || mongoose.model("Driver", DriverSchema);

