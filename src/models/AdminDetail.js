const mongoose = require("mongoose");

const AdminDetailSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    first_name: String,
    last_name: String,
    address: String,
    country: String,
    pincode: String,
    timezone: String,
    email: String,
    mobile: String,
    emergency_contact: String,
    area_name: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.AdminDetail || mongoose.model("AdminDetail", AdminDetailSchema);

