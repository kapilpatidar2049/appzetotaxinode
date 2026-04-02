const mongoose = require("mongoose");

/**
 * Singleton-style document: one row for admin referral + joining bonus configuration.
 */
const ReferralAdminSettingsSchema = new mongoose.Schema(
  {
    user_referral: { type: mongoose.Schema.Types.Mixed, default: {} },
    driver_referral: { type: mongoose.Schema.Types.Mixed, default: {} },
    joining_bonus: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ReferralAdminSettings ||
  mongoose.model("ReferralAdminSettings", ReferralAdminSettingsSchema);
