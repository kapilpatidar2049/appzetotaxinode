const mongoose = require("mongoose");

const DriverRejectedRequestSchema = new mongoose.Schema(
  {
    request_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: true,
      index: true,
    },
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      index: true,
    },
    reason: String,
  },
  { timestamps: true }
);

DriverRejectedRequestSchema.index({ request_id: 1, driver_id: 1 }, { unique: true });

module.exports =
  mongoose.models.DriverRejectedRequest ||
  mongoose.model("DriverRejectedRequest", DriverRejectedRequestSchema);

