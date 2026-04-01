const mongoose = require("mongoose");

const SettingSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    value: mongoose.Schema.Types.Mixed,
    group: { type: String, default: "general", index: true },
    type: { type: String, default: "text" },
    is_public: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Setting || mongoose.model("Setting", SettingSchema);

