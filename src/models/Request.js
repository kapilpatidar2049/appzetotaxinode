const mongoose = require("mongoose");

const RequestSchema = new mongoose.Schema(
  {
    request_number: { type: String, index: true },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", index: true },
    owner_id: { type: mongoose.Schema.Types.ObjectId, ref: "Owner", index: true },
    fleet_id: { type: mongoose.Schema.Types.ObjectId, index: true },
    service_location_id: { type: mongoose.Schema.Types.ObjectId, index: true },
    pick_lat: Number,
    pick_lng: Number,
    pick_address: String,
    drop_lat: Number,
    drop_lng: Number,
    drop_address: String,
    total_distance: Number,
    total_time: Number,
    accepted_ride_fare: Number,
    offerred_ride_fare: Number,
    payment_opt: String,
    payment_confirmed: { type: Boolean, default: false, index: true },
    payment_confirmed_at: Date,
    ride_otp: String,
    additional_charge: Number,
    driver_tip: Number,
    total: Number,
    cancel_reason: String,
    is_driver_arrived: { type: Boolean, default: false },
    is_driver_started: { type: Boolean, default: false },
    arrived_at: Date,
    trip_start_time: Date,
    completed_at: Date,
    cancelled_at: Date,
    cancelled_by_user: { type: Boolean, default: false },
    cancelled_by_driver: { type: Boolean, default: false },
    is_bid_ride: { type: Boolean, default: false },
    /** Outstation trip flag (Laravel outstation list) */
    is_outstation: { type: Boolean, default: false, index: true },
    is_completed: { type: Boolean, default: false },
    is_cancelled: { type: Boolean, default: false },
    user_rated: { type: Boolean, default: false },
    driver_rated: { type: Boolean, default: false },
    /** 0 = no driver / system (Laravel cancel_method) */
    cancel_method: { type: Number, default: null },
    transport_type: { type: String, default: "taxi" },
    delivery_proof: String,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Request || mongoose.model("Request", RequestSchema);

