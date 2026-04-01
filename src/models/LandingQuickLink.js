const mongoose = require("mongoose");

const LandingQuickLinkSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, index: true, unique: true, sparse: true },
    url: { type: String, required: true },
    icon: String,
    target: { type: String, default: "_self" },
    active: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.LandingQuickLink ||
  mongoose.model("LandingQuickLink", LandingQuickLinkSchema);

