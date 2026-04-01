const mongoose = require("mongoose");

const SupportTicketMessageSchema = new mongoose.Schema(
  {
    support_ticket_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportTicket",
      required: true,
      index: true,
    },
    sender_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    sender_driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", index: true },
    sender_owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", index: true },
    message: { type: String, required: true },
    attachment: String,
    seen: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.SupportTicketMessage ||
  mongoose.model("SupportTicketMessage", SupportTicketMessageSchema);

