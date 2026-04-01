const mongoose = require("mongoose");

const PaymentRequestSchema = new mongoose.Schema(
  {
    request_id: { type: mongoose.Schema.Types.ObjectId, ref: "Request", index: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", index: true },
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", index: true },
    payment_gateway_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "PaymentGateway",
      index: true,
    },
    amount: { type: Number, required: true },
    currency: String,
    transaction_id: { type: String, index: true },
    payment_status: {
      type: String,
      enum: ["initiated", "pending", "success", "failed", "cancelled", "refunded"],
      default: "initiated",
      index: true,
    },
    payment_response: mongoose.Schema.Types.Mixed,
    paid_at: Date,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.PaymentRequest ||
  mongoose.model("PaymentRequest", PaymentRequestSchema);

