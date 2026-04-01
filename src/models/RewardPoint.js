const mongoose = require("mongoose");

const RewardPointSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", index: true },
    points: { type: Number, default: 0 },
    points_used: { type: Number, default: 0 },
    points_balance: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.RewardPoint || mongoose.model("RewardPoint", RewardPointSchema);

