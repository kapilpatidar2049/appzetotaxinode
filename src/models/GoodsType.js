const mongoose = require("mongoose");

const GoodsTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    languageFields: mongoose.Schema.Types.Mixed,
    goods_types_for: { type: String, default: "both", index: true },
    description: String,
    image: String,
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.GoodsType || mongoose.model("GoodsType", GoodsTypeSchema);

