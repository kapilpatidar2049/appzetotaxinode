const mongoose = require("mongoose");

const WalletWithdrawalRequestSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", index: true },
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", index: true },
    amount: { type: Number, required: true },
    requested_currency: String,
    notes: String,
    status: {
      type: String,
      enum: ["requested", "approved", "rejected", "processed"],
      default: "requested",
      index: true,
    },
    processed_at: Date,
    rejected_reason: String,
    payment_reference: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.WalletWithdrawalRequest ||
  mongoose.model("WalletWithdrawalRequest", WalletWithdrawalRequestSchema);

