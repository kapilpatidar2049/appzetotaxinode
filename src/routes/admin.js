const express = require("express");
const web = require("../controllers/webController");
const config = require("../config");
const { authenticate } = require("../middleware/auth");
const { requireAnyRole } = require("../middleware/roles");
const { registerWebRoutes } = require("./registerWebRoutes");

/**
 * Same surface as `/web` (Laravel `web.php` JSON parity), but requires a valid JWT
 * whose `role` is one of `config.adminPanelRoles` (default: super-admin, admin, dispatcher).
 *
 * React admin: send `Authorization: Bearer <access_token>` from `POST /api/v1/admin/login`.
 *
 * Resource APIs (Mongo): `/users`, `/drivers`, `/owners` — then legacy web parity + 501 catch‑all.
 */
const adminRoutes = express.Router();

adminRoutes.use(authenticate);
adminRoutes.use(requireAnyRole(config.adminPanelRoles));

adminRoutes.use("/users", require("./adminUsers"));
adminRoutes.use("/drivers", require("./adminDrivers"));
adminRoutes.use("/owners", require("./adminOwners"));
adminRoutes.use("/requests", require("./adminRequests"));
adminRoutes.use("/promos", require("./adminPromos"));
adminRoutes.use("/service-locations", require("./adminServiceLocations"));
adminRoutes.use("/banners", require("./adminBanners"));
adminRoutes.use("/zones", require("./adminZones"));
adminRoutes.use("/types", require("./adminVehicleTypes"));
adminRoutes.use("/goods-types", require("./adminGoodsTypes"));
adminRoutes.use("/wallet", require("./adminWallet"));
adminRoutes.use("/owner-management", require("./adminOwnerManagement"));
adminRoutes.use("/driver-subscriptions", require("./adminDriverSubscriptions"));
adminRoutes.use("/rewards", require("./adminRewards"));
adminRoutes.use("/common", require("./adminCommonContent"));
adminRoutes.use("/support-tickets", require("./adminSupportTickets"));

/** Laravel web.php auth JSON + Inertia page props as JSON (dashboard widgets). */
adminRoutes.use(require("./adminInertiaJson"));

registerWebRoutes(adminRoutes);
adminRoutes.use(web.notImplemented);

module.exports = adminRoutes;
