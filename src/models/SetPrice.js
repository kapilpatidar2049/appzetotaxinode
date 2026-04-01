const mongoose = require("mongoose");

const SetPriceSchema = new mongoose.Schema(
  {
    zone_id: { type: String, required: true, index: true },
    transport_type: { type: String, required: true, index: true },
    vehicle_type: { type: String, required: true, index: true },
    app_modules: [String],
    payment_type: [String],
    preference: mongoose.Schema.Types.Mixed,
    preference_prices: [mongoose.Schema.Types.Mixed],

    base_distance: Number,
    base_price: Number,
    price_per_distance: Number,
    price_per_time: Number,
    price_per_seat: Number,
    waiting_charge: Number,
    service_tax: Number,

    outstation_base_distance: Number,
    outstation_base_price: Number,
    outstation_price_per_distance: Number,
    outstation_price_per_time: Number,

    admin_commision: Number,
    admin_commision_type: Number,
    admin_commission_for_owner: Number,
    admin_commission_from_driver: Number,
    admin_commission_type_for_owner: Number,
    admin_commission_type_from_driver: Number,
    admin_get_fee_percentage: Number,
    driver_get_fee_percentage: Number,
    agent_commision: Number,
    agent_commision_type: String,
    franchise_commision: Number,
    franchise_commision_type: String,
    fee_goes_to: String,

    cancellation_fee_for_user: Number,
    cancellation_fee_for_driver: Number,
    shared_cancel_fee: Number,
    shared_price_per_distance: Number,

    free_waiting_time_in_mins_before_trip_start: Number,
    free_waiting_time_in_mins_after_trip_start: Number,
    order_number: Number,

    airport_surge: Number,
    support_airport_fee: Boolean,
    support_outstation: Boolean,
    enable_shared_ride: Number,

    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

SetPriceSchema.index(
  { zone_id: 1, transport_type: 1, vehicle_type: 1 },
  { unique: true }
);

module.exports = mongoose.models.SetPrice || mongoose.model("SetPrice", SetPriceSchema);
