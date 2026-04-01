const mongoose = require("mongoose");

const RentalPackagePriceSchema = new mongoose.Schema(
  {
    zone_type_price_id: { type: String, required: true, index: true },
    package_type_id: { type: Number, required: true, index: true },

    base_distance: Number,
    base_price: Number,
    distance_price_per_km: Number,
    time_price_per_min: Number,
    free_min: Number,
    cancellation_fee: Number,
    service_tax: Number,

    admin_commission: Number,
    admin_commission_type: String,
    admin_commission_from_driver: Number,
    admin_commission_type_from_driver: String,
    admin_commission_from_owner: Number,
    admin_commission_type_from_owner: String,

    agent_commision: Number,
    agent_commision_type: String,
    franchise_commision: Number,
    franchise_commision_type: String,

    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

RentalPackagePriceSchema.index(
  { zone_type_price_id: 1, package_type_id: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.RentalPackagePrice ||
  mongoose.model("RentalPackagePrice", RentalPackagePriceSchema);
