const mongoose = require("mongoose");

const OwnerSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    owner_name: String,
    name: String,
    surname: String,
    company_name: String,
    mobile: String,
    phone: String,
    email: String,
    password: String,
    address: String,
    city: String,
    postal_code: String,
    expiry_date: Date,
    tax_number: String,
    bank_name: String,
    ifsc: String,
    account_no: String,
    no_of_vehicles: Number,
    service_location_id: mongoose.Schema.Types.ObjectId,
    transport_type: String,
    active: { type: Boolean, default: false, index: true },
    approve: { type: Boolean, default: false, index: true },
  },
  { timestamps: true }
);

module.exports = mongoose.models.Owner || mongoose.model("Owner", OwnerSchema);

