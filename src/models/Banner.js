const mongoose = require("mongoose");

const BannerSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: true },
    image: { type: String, required: true },
    link_type: { type: String, enum: ["external_link", "deep_link"], required: true },
    external_link: String,
    deep_link_target_page: String,
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Banner || mongoose.model("Banner", BannerSchema);
