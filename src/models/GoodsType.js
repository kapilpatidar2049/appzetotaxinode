const mongoose = require("mongoose");

const GoodsTypeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: String,
    image: String,
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.GoodsType || mongoose.model("GoodsType", GoodsTypeSchema);

