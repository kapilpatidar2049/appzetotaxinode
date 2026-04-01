const mongoose = require("mongoose");

const StateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.State || mongoose.model("State", StateSchema);
