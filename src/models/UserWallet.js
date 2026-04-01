const mongoose = require("mongoose");

const UserWalletSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
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
  mongoose.models.UserWallet || mongoose.model("UserWallet", UserWalletSchema);

