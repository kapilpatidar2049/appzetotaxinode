const mongoose = require("mongoose");

const TimeZoneSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    timezone: { type: String, required: true, unique: true, index: true },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.TimeZone || mongoose.model("TimeZone", TimeZoneSchema);
