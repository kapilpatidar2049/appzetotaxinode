const mongoose = require("mongoose");

const ComplaintSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    complaint_title_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "ComplaintTitle",
      required: true,
      index: true,
    },
    request_id: { type: mongoose.Schema.Types.ObjectId, ref: "Request", index: true },
    description: { type: String, required: true },
    status: {
      type: String,
      enum: ["open", "in_progress", "closed"],
      default: "open",
      index: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Complaint || mongoose.model("Complaint", ComplaintSchema);
