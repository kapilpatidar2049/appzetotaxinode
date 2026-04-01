const mongoose = require("mongoose");

const RecentSearchSchema = new mongoose.Schema(
  {
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    pick_lat: Number,
    pick_lng: Number,
    pick_address: String,
    drop_lat: Number,
    drop_lng: Number,
    drop_address: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.RecentSearch || mongoose.model("RecentSearch", RecentSearchSchema);

