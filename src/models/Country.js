const mongoose = require("mongoose");

const CountrySchema = new mongoose.Schema(
  {
    code: { type: String, required: true, uppercase: true },
    name: { type: String, required: true, trim: true },
    dial_code: { type: String, index: true },
    flag: String,
    currency_name: String,
    currency_symbol: String,
    currency_code: String,
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

CountrySchema.index({ code: 1 }, { unique: true });

module.exports = mongoose.models.Country || mongoose.model("Country", CountrySchema);

