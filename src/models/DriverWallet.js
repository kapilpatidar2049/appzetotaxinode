const mongoose = require("mongoose");

const DriverWalletSchema = new mongoose.Schema(
  {
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      unique: true,
      index: true,
    },
    amount_added: { type: Number, default: 0 },
    amount_balance: { type: Number, default: 0 },
    currency: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DriverWallet || mongoose.model("DriverWallet", DriverWalletSchema);

