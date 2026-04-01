const mongoose = require("mongoose");

const FavouriteLocationSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    pick_lat: { type: Number, required: true },
    pick_lng: { type: Number, required: true },
    drop_lat: Number,
    drop_lng: Number,
    pick_address: { type: String, required: true },
    drop_address: String,
    address_name: { type: String, required: true },
    landmark: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.FavouriteLocation ||
  mongoose.model("FavouriteLocation", FavouriteLocationSchema);

