const mongoose = require("mongoose");

const NotificationChannelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    enabled: { type: Boolean, default: true, index: true },
    config: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.NotificationChannel ||
  mongoose.model("NotificationChannel", NotificationChannelSchema);

