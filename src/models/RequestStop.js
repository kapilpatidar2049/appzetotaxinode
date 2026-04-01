const mongoose = require("mongoose");

const RequestStopSchema = new mongoose.Schema(
  {
    request_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: true,
      index: true,
    },
    stop_order: Number,
    stop_lat: Number,
    stop_lng: Number,
    stop_address: String,
    otp: String,
    is_completed: { type: Boolean, default: false, index: true },
    completed_at: Date,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.RequestStop || mongoose.model("RequestStop", RequestStopSchema);

