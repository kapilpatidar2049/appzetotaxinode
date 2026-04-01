const mongoose = require("mongoose");

const DriverVehicleTypeSchema = new mongoose.Schema(
  {
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      index: true,
    },
    vehicle_type_id: { type: mongoose.Schema.Types.ObjectId, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

DriverVehicleTypeSchema.index({ driver_id: 1, vehicle_type_id: 1 }, { unique: true });

module.exports =
  mongoose.models.DriverVehicleType ||
  mongoose.model("DriverVehicleType", DriverVehicleTypeSchema);

