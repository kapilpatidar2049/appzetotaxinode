const mongoose = require("mongoose");

const RolePermissionSchema = new mongoose.Schema(
  {
    role_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Role",
      required: true,
      index: true,
    },
    permission_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Permission",
      required: true,
      index: true,
    },
  },
  { timestamps: true }
);

RolePermissionSchema.index({ role_id: 1, permission_id: 1 }, { unique: true });

module.exports =
  mongoose.models.RolePermission ||
  mongoose.model("RolePermission", RolePermissionSchema);

