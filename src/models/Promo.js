const mongoose = require("mongoose");

const PromoSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, index: true },
    title: String,
    description: String,
    amount: Number,
    percentage: Number,
    discount_percentage: Number,
    min_amount: Number,
    minimum_trip_amount: Number,
    max_discount_amount: Number,
    maximum_discount_amount: Number,
    cumulative_max_discount_amount: Number,
    total_usage_limit: Number,
    per_user_usage_limit: Number,
    uses_per_user: Number,
    service_location_id: { type: mongoose.Schema.Types.ObjectId, index: true },
    transport_type: { type: String, index: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, index: true },
    user_sepecified: { type: Boolean, default: false, index: true },
    start_date: Date,
    from: Date,
    expiry_date: Date,
    to: Date,
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Promo || mongoose.model("Promo", PromoSchema);

