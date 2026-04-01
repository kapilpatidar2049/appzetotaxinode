const mongoose = require("mongoose");

const MobileAppSettingSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    transport_type: { type: String, index: true },
    service_type: { type: String, index: true },
    order_by: { type: String, default: "0" },
    short_description: String,
    description: String,
    mobile_menu_icon: String,
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

MobileAppSettingSchema.index(
  { name: 1, transport_type: 1, service_type: 1 },
  { unique: true }
);

module.exports =
  mongoose.models.MobileAppSetting ||
  mongoose.model("MobileAppSetting", MobileAppSettingSchema);
