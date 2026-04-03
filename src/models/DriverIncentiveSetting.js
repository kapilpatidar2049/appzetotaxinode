const mongoose = require("mongoose");

const IncentiveRuleSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true },
    ride_count: { type: Number, required: true },
    amount: { type: Number, required: true },
    zone_type_id: { type: String, required: true },
  },
  { _id: false }
);

const DriverIncentiveSettingSchema = new mongoose.Schema(
  {
    zone_type_id: { type: String, required: true, index: true, unique: true },
    Daily: { type: [IncentiveRuleSchema], default: [] },
    Weekly: { type: [IncentiveRuleSchema], default: [] },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DriverIncentiveSetting ||
  mongoose.model("DriverIncentiveSetting", DriverIncentiveSettingSchema);
