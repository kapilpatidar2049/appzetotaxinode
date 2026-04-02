const mongoose = require("mongoose");

/**
 * Admin-defined payout / payment detail forms (e.g. "account details" with dynamic fields).
 * `fields` items are flexible objects from the panel (id, input_field_name, placeholder, input_field_type, …).
 */
const PaymentMethodConfigSchema = new mongoose.Schema(
  {
    method: { type: String, required: true, trim: true, unique: true, index: true },
    fields: {
      type: [mongoose.Schema.Types.Mixed],
      default: [],
    },
    active: { type: Boolean, default: true, index: true },
    sort_order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.PaymentMethodConfig ||
  mongoose.model("PaymentMethodConfig", PaymentMethodConfigSchema);
