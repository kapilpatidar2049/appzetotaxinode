const mongoose = require("mongoose");

const RoleSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, index: true },
    name: { type: String, required: true },
    description: String,
    active: { type: Boolean, default: true },
    all: { type: Boolean, default: false },
    module: String,
  },
  { timestamps: true }
);

module.exports = mongoose.models.Role || mongoose.model("Role", RoleSchema);

