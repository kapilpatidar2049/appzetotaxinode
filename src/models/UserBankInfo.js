const mongoose = require("mongoose");

const UserBankInfoSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
      unique: true,
    },
    account_name: String,
    account_no: String,
    bank_code: String,
    bank_name: String,
    ifsc_code: String,
    other_details: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.UserBankInfo || mongoose.model("UserBankInfo", UserBankInfoSchema);

