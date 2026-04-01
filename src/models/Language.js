const mongoose = require("mongoose");

const LanguageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, index: true },
    native_name: String,
    direction: { type: String, enum: ["ltr", "rtl"], default: "ltr" },
    is_default: { type: Boolean, default: false, index: true },
    active: { type: Boolean, default: true, index: true },
    order: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Language || mongoose.model("Language", LanguageSchema);

