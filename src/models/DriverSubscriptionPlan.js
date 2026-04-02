const mongoose = require("mongoose");

const DriverSubscriptionPlanSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    description: { type: String, default: "" },
    transport_type: { type: String, required: true, index: true },
    vehicle_type_id: { type: String, required: true, index: true },
    subscription_duration: { type: Number, required: true },
    amount: { type: Number, required: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

DriverSubscriptionPlanSchema.index(
  { name: 1, transport_type: 1, vehicle_type_id: 1, subscription_duration: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.DriverSubscriptionPlan ||
  mongoose.model("DriverSubscriptionPlan", DriverSubscriptionPlanSchema);
