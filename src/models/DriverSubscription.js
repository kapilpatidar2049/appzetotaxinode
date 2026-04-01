const mongoose = require("mongoose");

const DriverSubscriptionSchema = new mongoose.Schema(
  {
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      index: true,
    },
    subscription_detail_id: { type: mongoose.Schema.Types.ObjectId, index: true },
    active: { type: Boolean, default: true, index: true },
    starts_at: Date,
    ends_at: Date,
    amount: Number,
    currency: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DriverSubscription ||
  mongoose.model("DriverSubscription", DriverSubscriptionSchema);

