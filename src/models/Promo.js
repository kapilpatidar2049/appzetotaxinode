const mongoose = require("mongoose");

const PromoSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    title: String,
    description: String,
    amount: Number,
    percentage: Number,
    min_amount: Number,
    max_discount_amount: Number,
    total_usage_limit: Number,
    per_user_usage_limit: Number,
    start_date: Date,
    expiry_date: Date,
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Promo || mongoose.model("Promo", PromoSchema);

