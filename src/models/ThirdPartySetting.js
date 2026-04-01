const mongoose = require("mongoose");

const ThirdPartySettingSchema = new mongoose.Schema(
  {
    module: { type: String, required: true, index: true },
    key: { type: String, required: true, index: true },
    value: mongoose.Schema.Types.Mixed,
    encrypted: { type: Boolean, default: false },
    is_active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

ThirdPartySettingSchema.index({ module: 1, key: 1 }, { unique: true });

module.exports =
  mongoose.models.ThirdPartySetting ||
  mongoose.model("ThirdPartySetting", ThirdPartySettingSchema);

