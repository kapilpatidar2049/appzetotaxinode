const mongoose = require("mongoose");

const FleetSchema = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
    },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarMake",
    },
    model: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarModel",
    },
    license_number: String,
    permission_number: String,
    vehicle_type: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VehicleType",
      index: true,
    },
    fleet_id: String,
    qr_image: String,
    approve: { type: Boolean, default: false, index: true },
    car_color: String,
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      index: true,
    },
    custom_make: String,
    custom_model: String,
    image1: String,
    image2: String,
    image3: String,
    status: String,
    reason: String,
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Fleet || mongoose.model("Fleet", FleetSchema);
