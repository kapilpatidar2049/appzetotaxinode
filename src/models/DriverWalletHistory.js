const mongoose = require("mongoose");

const DriverWalletHistorySchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", index: true },
    amount: { type: Number, required: true },
    remarks: String,
    transaction_alias: String,
    request_id: { type: mongoose.Schema.Types.ObjectId, ref: "Request", index: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DriverWalletHistory ||
  mongoose.model("DriverWalletHistory", DriverWalletHistorySchema);

