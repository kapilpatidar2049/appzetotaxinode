const express = require("express");
const c = require("../controllers/adminPermissionController");

const router = express.Router();

router.get("/", c.listPermissions);
router.post("/", c.createPermission);
router.get("/:id", c.getPermission);
router.patch("/:id", c.updatePermission);
router.delete("/:id", c.deletePermission);

module.exports = router;
