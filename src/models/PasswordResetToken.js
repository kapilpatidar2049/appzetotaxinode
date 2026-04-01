const mongoose = require("mongoose");

const PasswordResetTokenSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, index: true, unique: true },
    token: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.PasswordResetToken ||
  mongoose.model("PasswordResetToken", PasswordResetTokenSchema);

