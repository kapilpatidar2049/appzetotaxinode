const mongoose = require("mongoose");

const DriverRewardSettingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    is_min_ride_complete: { type: Boolean, default: false },
    is_min_ride_amount_complete: { type: Boolean, default: false },
    level: { type: Number, default: 1, index: true },
    reward_type: { type: String, default: "reward-cash", trim: true },
    reward: { type: Number, default: 0 },
    min_ride_amount: { type: Number, default: 0 },
    min_ride_count: { type: Number, default: 0 },
    ride_points: { type: Number, default: 0 },
    amount_points: { type: Number, default: 0 },
    zone_type_id: { type: String, required: true, index: true },
    image: String,
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

DriverRewardSettingSchema.index({ zone_type_id: 1, level: 1 }, { unique: true });

module.exports =
  mongoose.models.DriverRewardSetting ||
  mongoose.model("DriverRewardSetting", DriverRewardSettingSchema);
