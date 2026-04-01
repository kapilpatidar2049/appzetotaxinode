const mongoose = require("mongoose");

const PermissionSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, index: true },
    guard_name: { type: String, default: "web" },
    module: { type: String, index: true },
    description: String,
  },
  { timestamps: true }
);

module.exports =
  mongoose.models.Permission || mongoose.model("Permission", PermissionSchema);

