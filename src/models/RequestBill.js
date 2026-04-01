const mongoose = require("mongoose");

const RequestBillSchema = new mongoose.Schema(
  {
    request_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: true,
      index: true,
      unique: true,
    },
    base_price: Number,
    distance_price: Number,
    time_price: Number,
    waiting_charge: Number,
    cancellation_fee: Number,
    promo_discount: Number,
    service_tax: Number,
    admin_commision: Number,
    driver_commision: Number,
    total_amount: Number,
    payable_amount: Number,
    requested_currency: String,
    converted_currency: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.RequestBill || mongoose.model("RequestBill", RequestBillSchema);

