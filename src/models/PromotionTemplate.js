const mongoose = require("mongoose");

const PromotionTemplateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    title: String,
    message: String,
    image: String,
    active: { type: Boolean, default: true, index: true },
    starts_at: Date,
    ends_at: Date,
    metadata: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.PromotionTemplate ||
  mongoose.model("PromotionTemplate", PromotionTemplateSchema);

