const mongoose = require("mongoose");

const ServiceLocationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, index: true },
    slug: { type: String, index: true, unique: true, sparse: true },
    country_id: { type: mongoose.Schema.Types.ObjectId, ref: "Country", index: true },
    timezone: String,
    currency_code: String,
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.ServiceLocation ||
  mongoose.model("ServiceLocation", ServiceLocationSchema);

