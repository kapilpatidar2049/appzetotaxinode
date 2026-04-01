const mongoose = require("mongoose");

const UserWalletHistorySchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    amount: { type: Number, required: true },
    remarks: String,
    transaction_alias: String,
    card_info_id: { type: mongoose.Schema.Types.ObjectId, ref: "CardInfo" },
    request_id: { type: mongoose.Schema.Types.ObjectId, ref: "Request", index: true },
    payment_request_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentRequest",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.UserWalletHistory ||
  mongoose.model("UserWalletHistory", UserWalletHistorySchema);

