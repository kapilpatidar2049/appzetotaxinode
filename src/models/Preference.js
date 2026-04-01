const mongoose = require("mongoose");

const PreferenceSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", index: true },
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", index: true },
    key: { type: String, required: true, index: true },
    value: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

PreferenceSchema.index(
  { user_id: 1, driver_id: 1, owner_id: 1, key: 1 },
  { unique: true, sparse: true }
);

module.exports =
  mongoose.models.Preference || mongoose.model("Preference", PreferenceSchema);

