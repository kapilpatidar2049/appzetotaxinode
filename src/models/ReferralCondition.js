const mongoose = require("mongoose");

const ReferralConditionSchema = new mongoose.Schema(
  {
    label_referral: { type: String, required: true, index: true },
    referral_type: { type: String, required: true, index: true },
    description: { type: String, default: "" },
    translation_dataset: { type: String, default: "" },
  },
  { timestamps: true }
);

ReferralConditionSchema.index({ label_referral: 1, referral_type: 1 }, { unique: true });

module.exports =
  mongoose.models.ReferralCondition ||
  mongoose.model("ReferralCondition", ReferralConditionSchema);
