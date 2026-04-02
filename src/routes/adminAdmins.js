const express = require("express");
const { requireAnyRole } = require("../middleware/roles");
const { validateBody, schemas } = require("../middleware/validation");
const adminAdminsController = require("../controllers/adminAdminsController");

const router = express.Router();

// Only super-admin can create/update/delete other admin-panel users.
router.use(requireAnyRole(["super-admin"]));

router.get("/", adminAdminsController.listAdmins);
router.post("/", validateBody(schemas.adminAdmins.create), adminAdminsController.createAdmin);
router.get("/:id", adminAdminsController.getAdmin);
router.patch("/:id", validateBody(schemas.adminAdmins.update), adminAdminsController.updateAdmin);
router.delete("/:id", adminAdminsController.deleteAdmin);

module.exports = router;

