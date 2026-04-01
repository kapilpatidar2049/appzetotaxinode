const mongoose = require("mongoose");

const CarModelSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    make_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "CarMake",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

CarModelSchema.index({ make_id: 1, name: 1 }, { unique: true });

module.exports = mongoose.models.CarModel || mongoose.model("CarModel", CarModelSchema);
