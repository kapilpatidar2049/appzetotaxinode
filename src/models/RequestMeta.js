const mongoose = require("mongoose");

const RequestMetaSchema = new mongoose.Schema(
  {
    request_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: true,
      index: true,
    },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", index: true },
    active: { type: Boolean, default: true },
    assign_method: Number,
    transport_type: { type: String, default: "taxi" },
    admin_chat_seen_at: Date,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.RequestMeta || mongoose.model("RequestMeta", RequestMetaSchema);

