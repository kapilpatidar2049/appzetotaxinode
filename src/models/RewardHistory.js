const mongoose = require("mongoose");

const RewardHistorySchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", index: true },
    reward_point_id: { type: mongoose.Schema.Types.ObjectId, ref: "RewardPoint" },
    points: Number,
    amount: Number,
    action: String,
    notes: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.RewardHistory || mongoose.model("RewardHistory", RewardHistorySchema);

