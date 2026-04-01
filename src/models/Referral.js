const mongoose = require("mongoose");

const ReferralSchema = new mongoose.Schema(
  {
    referrer_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    referrer_driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", index: true },
    referred_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    referred_driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", index: true },
    referral_code: { type: String, index: true },
    reward_amount: Number,
    reward_points: Number,
    status: {
      type: String,
      enum: ["pending", "qualified", "rewarded", "rejected"],
      default: "pending",
      index: true,
    },
    rewarded_at: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Referral || mongoose.model("Referral", ReferralSchema);

