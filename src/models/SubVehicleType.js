const mongoose = require("mongoose");

const SubVehicleTypeSchema = new mongoose.Schema(
  {
    vehicle_type_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "VehicleType",
      required: true,
      index: true,
    },
    name: { type: String, required: true },
    icon: String,
    image: String,
    capacity: Number,
    active: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

SubVehicleTypeSchema.index({ vehicle_type_id: 1, name: 1 }, { unique: true });

module.exports =
  mongoose.models.SubVehicleType ||
  mongoose.model("SubVehicleType", SubVehicleTypeSchema);

