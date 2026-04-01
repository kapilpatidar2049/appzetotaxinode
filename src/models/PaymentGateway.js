const mongoose = require("mongoose");

const PaymentGatewaySchema = new mongoose.Schema(
  {
    gateway: { type: String, required: true, index: true },
    slug: { type: String, required: true, unique: true, index: true },
    image: String,
    order: { type: Number, default: 0, index: true },
    enabled: { type: Boolean, default: true, index: true },
    for_ride: { type: Boolean, default: true, index: true },
    for_wallet: { type: Boolean, default: true, index: true },
    supported_countries: [String],
    supported_currencies: [String],
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.PaymentGateway ||
  mongoose.model("PaymentGateway", PaymentGatewaySchema);

