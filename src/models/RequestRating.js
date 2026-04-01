const mongoose = require("mongoose");

const RequestRatingSchema = new mongoose.Schema(
  {
    request_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Request",
      required: true,
      index: true,
    },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    driver_id: { type: mongoose.Schema.Types.ObjectId, ref: "Driver", index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    feedback: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.RequestRating ||
  mongoose.model("RequestRating", RequestRatingSchema);

