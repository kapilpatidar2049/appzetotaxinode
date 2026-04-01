const mongoose = require("mongoose");

const CitySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    state_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "State",
      required: true,
      index: true,
    },
    display_order: { type: Number, default: 0, index: true },
    alias: String,
  },
  { timestamps: true }
);

CitySchema.index({ state_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.models.City || mongoose.model("City", CitySchema);
