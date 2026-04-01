const mongoose = require("mongoose");

const MailOtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, trim: true, lowercase: true, index: true },
    otp: { type: String, required: true },
    verified: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.MailOtp || mongoose.model("MailOtp", MailOtpSchema);

