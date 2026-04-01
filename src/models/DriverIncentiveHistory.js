const mongoose = require("mongoose");

const DriverIncentiveHistorySchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", index: true },
    incentive_id: { type: mongoose.Schema.Types.ObjectId, index: true },
    amount: Number,
    trip_count: Number,
    description: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DriverIncentiveHistory ||
  mongoose.model("DriverIncentiveHistory", DriverIncentiveHistorySchema);

