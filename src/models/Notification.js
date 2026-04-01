const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", index: true },
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", index: true },
    request_id: { type: mongoose.Schema.Types.ObjectId, ref: "Request", index: true },
    notification_channel_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "NotificationChannel",
      index: true,
    },
    title: String,
    body: String,
    data: mongoose.Schema.Types.Mixed,
    is_read: { type: Boolean, default: false, index: true },
    read_at: Date,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Notification || mongoose.model("Notification", NotificationSchema);

