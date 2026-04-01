const mongoose = require("mongoose");

const FaqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
    user_type: { type: String, enum: ["user", "driver", "owner", "all"], default: "all", index: true },
    active: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Faq || mongoose.model("Faq", FaqSchema);

