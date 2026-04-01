const mongoose = require("mongoose");

const RoleUserSchema = new mongoose.Schema(
  {
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      index: true,
    },
    user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

RoleUserSchema.index({ role_id: 1, user_id: 1 }, { unique: true });

module.exports =
  mongoose.models.RoleUser || mongoose.model("RoleUser", RoleUserSchema);

