const mongoose = require("mongoose");

const DriverBankInfoSchema = new mongoose.Schema(
  {
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      unique: true,
      index: true,
    },
    account_holder_name: String,
    account_number: String,
    ifsc_code: String,
    bank_name: String,
    branch_name: String,
    routing_number: String,
    iban: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DriverBankInfo ||
  mongoose.model("DriverBankInfo", DriverBankInfoSchema);

