const mongoose = require("mongoose");

const OwnerHiredDriverSchema = new mongoose.Schema(
  {
    owner_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Owner",
      required: true,
      index: true,
    },
    driver_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Driver",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

OwnerHiredDriverSchema.index({ owner_id: 1, driver_id: 1 }, { unique: true });

module.exports =
  mongoose.models.OwnerHiredDriver ||
  mongoose.model("OwnerHiredDriver", OwnerHiredDriverSchema);
