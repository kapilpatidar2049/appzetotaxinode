const mongoose = require("mongoose");

const RentalPackageSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, index: true },
    transport_type: { type: String, required: true, index: true },
    short_description: { type: String, default: "" },
    description: { type: String, default: "" },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

RentalPackageSchema.index({ name: 1, transport_type: 1 }, { unique: true });

module.exports =
  mongoose.models.RentalPackage || mongoose.model("RentalPackage", RentalPackageSchema);
