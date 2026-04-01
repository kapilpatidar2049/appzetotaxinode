const mongoose = require("mongoose");

const MobileOtpSchema = new mongoose.Schema(
  {
    mobile: { type: String, required: true, trim: true, index: true },
    otp: { type: String, required: true },
    country_code: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.MobileOtp || mongoose.model("MobileOtp", MobileOtpSchema);

