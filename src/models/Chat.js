const mongoose = require("mongoose");

const ChatSchema = new mongoose.Schema(
  {
    request_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: true,
      index: true,
    },
    sender_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    receiver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    message: { type: String, required: true },
    is_seen: { type: Boolean, default: false, index: true },
    seen_at: Date,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Chat || mongoose.model("Chat", ChatSchema);

