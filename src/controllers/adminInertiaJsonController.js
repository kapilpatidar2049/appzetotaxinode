/**
 * Admin dashboard JSON endpoints consumed by frontend clients.
 */

const Setting = require("../models/Setting");
const dash = require("../services/adminDashboardMongo");

function qServiceLocation(req) {
  return req.query.service_location_id ?? req.query.service_location ?? "all";
}

async function dashboardData(req, res, next) {
  try {
    const data = await dash.getDashboardData(qServiceLocation(req));
    return res.json(data);
  } catch (e) {
    next(e);
  }
}

async function todayEarnings(req, res, next) {
  try {
    const data = await dash.getTodayEarnings(qServiceLocation(req));
    return res.json(data);
  } catch (e) {
    next(e);
  }
}

async function overallEarnings(req, res, next) {
  try {
    const data = await dash.getOverallEarningsChart(qServiceLocation(req));
    return res.json(data);
  } catch (e) {
    next(e);
  }
}

async function cancelChart(req, res, next) {
  try {
    const data = await dash.getCancelChart(qServiceLocation(req));
    return res.json(data);
  } catch (e) {
    next(e);
  }
}

async function ownersData(req, res, next) {
  try {
    const data = await dash.getOwnersData(qServiceLocation(req));
    return res.json(data);
  } catch (e) {
    next(e);
  }
}

async function ownerEarnings(req, res, next) {
  try {
    const data = await dash.getOwnerEarnings(qServiceLocation(req));
    return res.json(data);
  } catch (e) {
    next(e);
  }
}

/** Dashboard page bootstrap payload. */
async function dashboardPageProps(req, res, next) {
  try {
    const keys = [
      "firebase_api_key",
      "firebase_auth_domain",
      "firebase_database_url",
      "firebase_project_id",
      "firebase_storage_bucket",
      "firebase_messaging_sender_id",
      "firebase_app_id",
    ];
    const settings = await Setting.find({ key: { $in: keys } }).lean();
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    const firebaseConfig = {
      apiKey: map.firebase_api_key ?? "",
      authDomain: map.firebase_auth_domain ?? "",
      databaseURL: map.firebase_database_url ?? "",
      projectId: map.firebase_project_id ?? "",
      storageBucket: map.firebase_storage_bucket ?? "",
      messagingSenderId: map.firebase_messaging_sender_id ?? "",
      appId: map.firebase_app_id ?? "",
    };
    return res.json({
      page: "pages/dashboard/index",
      firebaseConfig,
      message: "Dashboard bootstrap payload.",
    });
  } catch (e) {
    next(e);
  }
}

/** Overall menu bootstrap payload. */
function overallMenu(req, res) {
  const ownerManagement = [
    {
      key: "owner-dashboard",
      label: "Owner Dashboard",
      path: "/owner-dashboard",
    },
    {
      key: "manage-owners",
      label: "Manage Owners",
      path: "/manage-owners",
    },
    {
      key: "owner-wallet",
      label: "Owner Wallet",
      path: "/owner-wallet",
    },
    {
      key: "fleet-management",
      label: "Fleet Management",
      path: "/fleet-management",
    },
    {
      key: "blocked-fleet-drivers",
      label: "Blocked Fleet Drivers",
      path: "/blocked-fleet-drivers",
    },
    {
      key: "fleet-needed-document",
      label: "Fleet Needed Document",
      path: "/fleet-needed-document",
    },
    {
      key: "manage-fleet",
      label: "Manage Fleet",
      path: "/manage-fleet",
    },
    {
      key: "owner-needed-document",
      label: "Owner Needed Document",
      path: "/owner-needed-document",
    },
  ];

  return res.json({
    page: "pages/overall-menu",
    ownerManagement,
    message: "Overall menu bootstrap payload.",
  });
}

/** Owner dashboard bootstrap payload. */
async function ownerDashboardPageProps(req, res, next) {
  try {
    const keys = [
      "firebase_api_key",
      "firebase_auth_domain",
      "firebase_database_url",
      "firebase_project_id",
      "firebase_storage_bucket",
      "firebase_messaging_sender_id",
      "firebase_app_id",
    ];
    const settings = await Setting.find({ key: { $in: keys } }).lean();
    const map = Object.fromEntries(settings.map((s) => [s.key, s.value]));
    const firebaseSettings = {
      firebase_api_key: map.firebase_api_key ?? "",
      firebase_auth_domain: map.firebase_auth_domain ?? "",
      firebase_database_url: map.firebase_database_url ?? "",
      firebase_project_id: map.firebase_project_id ?? "",
      firebase_storage_bucket: map.firebase_storage_bucket ?? "",
      firebase_messaging_sender_id: map.firebase_messaging_sender_id ?? "",
      firebase_app_id: map.firebase_app_id ?? "",
    };
    return res.json({
      page: "pages/owner-dashboard/index",
      firebaseSettings,
      message: "Use /owner-dashboard/data and /owner-dashboard/earnings for chart data.",
    });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  dashboardData,
  todayEarnings,
  overallEarnings,
  cancelChart,
  ownersData,
  ownerEarnings,
  dashboardPageProps,
  ownerDashboardPageProps,
  overallMenu,
};
