const express = require("express");
const c = require("../controllers/adminRoleController");

const router = express.Router();

router.get("/", c.listRoles);
router.post("/", c.createRole);
router.get("/:id/permissions", c.getRolePermissions);
router.put("/:id/permissions", c.assignRolePermissions);
router.get("/:id", c.getRole);
router.patch("/:id", c.updateRole);
router.delete("/:id", c.deleteRole);

module.exports = router;
