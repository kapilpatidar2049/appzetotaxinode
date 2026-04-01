const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    email: { type: String, trim: true, lowercase: true, index: true },
    mobile: { type: String, trim: true, index: true },
    last_name: String,
    country: { type: mongoose.Schema.Types.ObjectId, ref: "Country", index: true },
    lang: String,
    password: String,
    gender: String,
    map_type: String,
    current_lat: Number,
    current_lng: Number,
    role: { type: String, default: "user", index: true },
    timezone: String,
    fcm_token: String,
    refferal_code: String,
    promo_code: { type: mongoose.Schema.Types.ObjectId, ref: "Promo", index: true },
    referred_by: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    mobile_confirmed: { type: Boolean, default: false },
    email_confirmed: { type: Boolean, default: false },
    remember_token: String,
    active: { type: Boolean, default: true },
    is_deleted_at: Date,
    /** Public URL or storage path (admin / app profile photo) */
    profile_picture: String,
  },
  { timestamps: true }
);

module.exports = mongoose.models.User || mongoose.model("User", UserSchema);

