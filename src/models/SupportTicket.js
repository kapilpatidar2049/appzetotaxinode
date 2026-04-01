const mongoose = require("mongoose");

const SupportTicketSchema = new mongoose.Schema(
  {
    ticket_no: { type: String, index: true, unique: true, sparse: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", index: true },
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", index: true },
    support_ticket_title_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SupportTicketTitle",
      index: true,
    },
    subject: String,
    description: String,
    status: {
      type: String,
      enum: ["open", "in_progress", "closed"],
      default: "open",
      index: true,
    },
    closed_at: Date,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.SupportTicket || mongoose.model("SupportTicket", SupportTicketSchema);

