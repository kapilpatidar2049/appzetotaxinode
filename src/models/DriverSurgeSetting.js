const mongoose = require("mongoose");

const SurgeSlotSchema = new mongoose.Schema(
  {
    index: { type: Number, required: true },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },
    value: { type: Number, required: true },
  },
  { _id: false }
);

const SurgeWeekSchema = new mongoose.Schema(
  {
    Sunday: { type: [SurgeSlotSchema], default: [] },
    Monday: { type: [SurgeSlotSchema], default: [] },
    Tuesday: { type: [SurgeSlotSchema], default: [] },
    Wednesday: { type: [SurgeSlotSchema], default: [] },
    Thursday: { type: [SurgeSlotSchema], default: [] },
    Friday: { type: [SurgeSlotSchema], default: [] },
    Saturday: { type: [SurgeSlotSchema], default: [] },
  },
  { _id: false }
);

const DriverSurgeSettingSchema = new mongoose.Schema(
  {
    zone_type_id: { type: String, required: true, unique: true, index: true },
    surge: { type: SurgeWeekSchema, default: () => ({}) },
    active: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.DriverSurgeSetting ||
  mongoose.model("DriverSurgeSetting", DriverSurgeSettingSchema);
