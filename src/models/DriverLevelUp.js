const mongoose = require("mongoose");

const DriverLevelUpSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", index: true },
    level_name: String,
    level_no: Number,
    required_trips: Number,
    required_earnings: Number,
    status: { type: String, default: "active", index: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DriverLevelUp || mongoose.model("DriverLevelUp", DriverLevelUpSchema);

