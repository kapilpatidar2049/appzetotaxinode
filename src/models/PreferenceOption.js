const mongoose = require("mongoose");

const PreferenceOptionSchema = new mongoose.Schema(
  {
    /** Display name, e.g. "pet" */
    name: { type: String, required: true, trim: true },
    /** Normalized key for uniqueness (slug) */
    key: { type: String, required: true, trim: true, lowercase: true, index: true },
    /** Public URL path e.g. /uploads/preferences/preference-....png */
    icon: { type: String, default: "" },
    active: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

PreferenceOptionSchema.index({ key: 1 }, { unique: true });

module.exports =
  mongoose.models.PreferenceOption ||
  mongoose.model("PreferenceOption", PreferenceOptionSchema);
