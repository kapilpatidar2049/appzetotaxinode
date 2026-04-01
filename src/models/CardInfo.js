const mongoose = require("mongoose");

const CardInfoSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", index: true },
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", index: true },
    payment_gateway_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentGateway",
      index: true,
    },
    card_holder_name: String,
    card_last_four: String,
    card_brand: String,
    card_token: String,
    expiry_month: Number,
    expiry_year: Number,
    is_default: { type: Boolean, default: false, index: true },
    is_active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.CardInfo || mongoose.model("CardInfo", CardInfoSchema);

