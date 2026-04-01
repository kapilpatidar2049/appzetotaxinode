const mongoose = require("mongoose");

const OnboardingScreenSchema = new mongoose.Schema(
  {
    sn_o: { type: Number, required: true, unique: true, index: true },
    /** Laravel on_boardings.user_type: user | driver | owner */
    user_type: { type: String, default: "user", index: true },
    screen: { type: String, required: true, index: true },
    order: { type: Number, default: 0 },
    title: { type: String, default: "" },
    onboarding_image: String,
    description: { type: String, default: "" },
    active: { type: Boolean, default: true },
    translation_dataset: { type: String, default: "" },
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.OnboardingScreen ||
  mongoose.model("OnboardingScreen", OnboardingScreenSchema);
