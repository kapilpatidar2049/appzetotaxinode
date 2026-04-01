/**
 * Laravel routes/web.php (auth group) — JSON-returning dashboard APIs + Inertia page props as JSON.
 * Mounted at /api/v1/admin so React admin can call with the same JWT as other admin routes.
 *
 * Path suffix mirrors Laravel URL (without leading slash):
 *   Laravel GET /dashboard/data  →  GET /api/v1/admin/dashboard/data
 */

const express = require("express");
const inertiaJson = require("../controllers/adminInertiaJsonController");

const router = express.Router();

router.get("/dashboard/page", inertiaJson.dashboardPageProps);
router.get("/dashboard/data", inertiaJson.dashboardData);
router.get("/dashboard/today-earnings", inertiaJson.todayEarnings);
router.get("/dashboard/overall-earnings", inertiaJson.overallEarnings);
router.get("/dashboard/cancel-chart", inertiaJson.cancelChart);

router.get("/owner-dashboard/page", inertiaJson.ownerDashboardPageProps);
router.get("/owner-dashboard/data", inertiaJson.ownersData);
router.get("/owner-dashboard/earnings", inertiaJson.ownerEarnings);

router.get("/overall-menu", inertiaJson.overallMenu);

module.exports = router;
