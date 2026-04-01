const mongoose = require("mongoose");

const CarMakeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
    vehicle_make_for: {
      type: String,
      enum: ["taxi", "motor_bike", "truck"],
      required: true,
      index: true,
    },
    transport_type: {
      type: String,
      enum: ["taxi", "delivery", "both"],
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.CarMake || mongoose.model("CarMake", CarMakeSchema);
