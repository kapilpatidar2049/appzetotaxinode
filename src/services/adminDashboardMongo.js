/**
 * Mongo aggregations for Laravel DashBoardController / OwnerDashBoardController
 * JSON endpoints (formerly hit from Inertia app via same-origin GET).
 */

const mongoose = require("mongoose");
const Request = require("../models/Request");
const RequestBill = require("../models/RequestBill");
const Driver = require("../models/Driver");
const User = require("../models/User");
const Owner = require("../models/Owner");
const Fleet = require("../models/Fleet");
const ServiceLocation = require("../models/ServiceLocation");
const Setting = require("../models/Setting");

function slMatch(service_location_id) {
  if (!service_location_id || service_location_id === "all") return {};
  if (!mongoose.Types.ObjectId.isValid(service_location_id)) return {};
  return { service_location_id: new mongoose.Types.ObjectId(service_location_id) };
}

async function getCurrencySymbol(service_location_id) {
  let sym = "₹";
  const doc = await Setting.findOne({ key: "currency_symbol" }).lean();
  if (doc?.value != null) {
    sym = typeof doc.value === "string" ? doc.value : doc.value?.symbol || sym;
  }
  if (service_location_id && service_location_id !== "all" && mongoose.Types.ObjectId.isValid(service_location_id)) {
    const loc = await ServiceLocation.findById(service_location_id).lean();
    if (loc?.currency_code) sym = loc.currency_code;
  }
  return sym;
}

async function tripCountsForDay(day, extra = {}) {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);
  const base = { createdAt: { $gte: start, $lte: end }, ...extra };
  const [completed, scheduled, cancelled] = await Promise.all([
    Request.countDocuments({ ...base, is_completed: true }),
    Request.countDocuments({
      ...base,
      is_completed: false,
      is_cancelled: false,
    }),
    Request.countDocuments({ ...base, is_cancelled: true }),
  ]);
  return { completed, scheduled, cancelled };
}

async function lifetimeTripCounts(extra = {}) {
  const completed = await Request.countDocuments({ ...extra, is_completed: true });
  const scheduled = await Request.countDocuments({
    ...extra,
    is_completed: false,
    is_cancelled: false,
  });
  const cancelled = await Request.countDocuments({ ...extra, is_cancelled: true });
  return { completed, scheduled, cancelled };
}

async function earningsAggregate(match) {
  const pipeline = [
    { $match: { is_completed: true, ...match } },
    {
      $lookup: {
        from: "requestbills",
        localField: "_id",
        foreignField: "request_id",
        as: "b",
      },
    },
    { $unwind: "$b" },
    {
      $group: {
        _id: null,
        card: {
          $sum: {
            $cond: [{ $eq: [{ $toString: "$payment_opt" }, "0"] }, "$b.total_amount", 0],
          },
        },
        cash: {
          $sum: {
            $cond: [{ $eq: [{ $toString: "$payment_opt" }, "1"] }, "$b.total_amount", 0],
          },
        },
        wallet: {
          $sum: {
            $cond: [{ $eq: [{ $toString: "$payment_opt" }, "2"] }, "$b.total_amount", 0],
          },
        },
        total: { $sum: { $ifNull: ["$b.total_amount", 0] } },
        admin_commision: { $sum: { $ifNull: ["$b.admin_commision", 0] } },
        driver_commision: { $sum: { $ifNull: ["$b.driver_commision", 0] } },
      },
    },
  ];
  const rows = await Request.aggregate(pipeline);
  const z = rows[0] || {};
  return {
    card: Number(z.card || 0),
    cash: Number(z.cash || 0),
    wallet: Number(z.wallet || 0),
    total: Number(z.total || 0),
    admin_commision: Number(z.admin_commision || 0),
    driver_commision: Number(z.driver_commision || 0),
  };
}

async function earningsForTripStartDay(day, extra = {}) {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(day);
  end.setHours(23, 59, 59, 999);
  return earningsAggregate({
    ...extra,
    trip_start_time: { $gte: start, $lte: end },
  });
}

async function getDashboardData(service_location_id) {
  const sl = slMatch(service_location_id);
  const driverBase = {
    $or: [{ owner_id: null }, { owner_id: { $exists: false } }],
    ...sl,
  };
  const dAgg = await Driver.aggregate([
    { $match: driverBase },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        approved: { $sum: { $cond: ["$approve", 1, 0] } },
        declined: { $sum: { $cond: ["$approve", 0, 1] } },
      },
    },
  ]);
  const d = dAgg[0] || { total: 0, approved: 0, declined: 0 };
  const approvePct = d.total ? Math.round((d.approved / d.total) * 100) : 0;
  const declinePct = d.total ? Math.round((d.declined / d.total) * 100) : 0;
  const totalUsers = await User.countDocuments({ role: "user" });
  const currencySymbol = await getCurrencySymbol(service_location_id);
  return {
    totalDrivers: {
      approved: d.approved,
      declined: d.declined,
      approve_percentage: approvePct,
      decline_percentage: declinePct,
      total: d.total,
    },
    totalUsers,
    currencySymbol,
  };
}

async function getTodayEarnings(service_location_id) {
  const sl = slMatch(service_location_id);
  const today = new Date();
  const [todayTrips, overallTripsAll, todayEarningData, overallEarningData] =
    await Promise.all([
      tripCountsForDay(today, sl),
      lifetimeTripCounts(sl),
      earningsForTripStartDay(today, sl),
      earningsAggregate(sl),
    ]);

  return {
    today: {
      completed: todayTrips.completed,
      scheduled: todayTrips.scheduled,
      cancelled: todayTrips.cancelled,
      earnings: todayEarningData,
    },
    overall: {
      completed: overallTripsAll.completed,
      scheduled: overallTripsAll.scheduled,
      cancelled: overallTripsAll.cancelled,
      earnings: overallEarningData,
    },
  };
}

async function getOverallEarningsChart(service_location_id) {
  const sl = slMatch(service_location_id);
  const now = new Date();
  const months = [];
  const values = [];
  let cursor = new Date(now.getFullYear(), 0, 1);
  while (cursor <= now) {
    const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
    months.push(cursor.toLocaleString("en-US", { month: "short" }));
    const sum = await RequestBill.aggregate([
      {
        $lookup: {
          from: "requests",
          localField: "request_id",
          foreignField: "_id",
          as: "r",
        },
      },
      { $unwind: "$r" },
      {
        $match: {
          "r.is_completed": true,
          "r.trip_start_time": { $gte: from, $lte: to },
          ...Object.keys(sl).length ? { "r.service_location_id": sl.service_location_id } : {},
        },
      },
      { $group: { _id: null, t: { $sum: "$total_amount" } } },
    ]);
    values.push(Number(sum[0]?.t || 0));
    cursor.setMonth(cursor.getMonth() + 1);
  }
  return { earnings: { months, values } };
}

async function getCancelChart(service_location_id) {
  const sl = slMatch(service_location_id);
  const now = new Date();
  const y = [];
  const a = [];
  const u = [];
  const d = [];
  let cursor = new Date(now.getFullYear(), 0, 1);
  while (cursor <= now) {
    const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
    y.push(cursor.toLocaleString("en-US", { month: "short" }));
    const base = { is_cancelled: true, createdAt: { $gte: from, $lte: to }, ...sl };
    const [ca, cu, cd] = await Promise.all([
      Request.countDocuments({ ...base, cancel_method: 0 }),
      Request.countDocuments({ ...base, cancel_method: 1 }),
      Request.countDocuments({ ...base, cancel_method: 2 }),
    ]);
    a.push(ca);
    u.push(cu);
    d.push(cd);
    cursor.setMonth(cursor.getMonth() + 1);
  }
  const startY = new Date(now.getFullYear(), 0, 1);
  const tripQuery = { createdAt: { $gte: startY }, ...sl };
  const [auto_cancelled, user_cancelled, driver_cancelled, dispatcher_cancelled, total_cancelled] =
    await Promise.all([
      Request.countDocuments({
        ...tripQuery,
        is_cancelled: true,
        cancel_method: 0,
      }),
      Request.countDocuments({
        ...tripQuery,
        is_cancelled: true,
        cancel_method: 1,
      }),
      Request.countDocuments({
        ...tripQuery,
        is_cancelled: true,
        cancel_method: 2,
      }),
      Request.countDocuments({
        ...tripQuery,
        is_cancelled: true,
        cancel_method: 3,
      }),
      Request.countDocuments({ ...tripQuery, is_cancelled: true, is_completed: false }),
    ]);
  return {
    y,
    a,
    u,
    d,
    data: {
      auto_cancelled,
      user_cancelled,
      driver_cancelled,
      dispatcher_cancelled,
      total_cancelled,
    },
  };
}

async function approveBlock(Model, extra = {}) {
  const agg = await Model.aggregate([
    { $match: extra },
    {
      $group: {
        _id: null,
        total: { $sum: 1 },
        approved: { $sum: { $cond: ["$approve", 1, 0] } },
        declined: { $sum: { $cond: ["$approve", 0, 1] } },
      },
    },
  ]);
  const r = agg[0] || { total: 0, approved: 0, declined: 0 };
  const approvePct = r.total ? Math.round((r.approved / r.total) * 100) : 0;
  const declinePct = r.total ? Math.round((r.declined / r.total) * 100) : 0;
  return {
    approved: r.approved,
    declined: r.declined,
    approve_percentage: approvePct,
    decline_percentage: declinePct,
    total: r.total,
  };
}

async function getOwnersData(service_location_id) {
  const sl = slMatch(service_location_id);
  const total_owners = await approveBlock(Owner, Object.keys(sl).length ? sl : {});
  let fleetQuery = {};
  if (Object.keys(sl).length) {
    const userIds = await Owner.find(sl).distinct("user_id");
    fleetQuery = { owner_id: { $in: userIds } };
  }
  const total_fleets = await approveBlock(Fleet, fleetQuery);
  const total_drivers = await approveBlock(Driver, {
    owner_id: { $ne: null },
    ...sl,
  });
  return {
    total_drivers,
    total_fleets,
    total_owners,
  };
}

async function getOwnerEarnings(service_location_id) {
  const sl = slMatch(service_location_id);
  const ownerExtra = { owner_id: { $ne: null }, ...sl };
  const today = new Date();
  const [todayEarnings, overallEarnings, todayTrips] = await Promise.all([
    earningsForTripStartDay(today, ownerExtra),
    earningsAggregate(ownerExtra),
    tripCountsForDay(today, ownerExtra),
  ]);

  const earningsData = { earnings: { months: [], values: [] } };
  const now = new Date();
  let cursor = new Date(now.getFullYear(), 0, 1);
  while (cursor <= now) {
    const from = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
    const to = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0, 23, 59, 59, 999);
    earningsData.earnings.months.push(cursor.toLocaleString("en-US", { month: "long" }));
    const monthSum = await RequestBill.aggregate([
      {
        $lookup: {
          from: "requests",
          localField: "request_id",
          foreignField: "_id",
          as: "r",
        },
      },
      { $unwind: "$r" },
      {
        $match: {
          "r.is_completed": true,
          "r.owner_id": { $ne: null },
          "r.trip_start_time": { $gte: from, $lte: to },
          ...Object.keys(sl).length ? { "r.service_location_id": sl.service_location_id } : {},
        },
      },
      { $group: { _id: null, t: { $sum: "$total_amount" } } },
    ]);
    earningsData.earnings.values.push(Number(monthSum[0]?.t || 0));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  const currency_code =
    (await Setting.findOne({ key: "currency_code" }).lean())?.value || "USD";
  const currency_symbol = await getCurrencySymbol(service_location_id);

  return {
    earningsData,
    currency_code: typeof currency_code === "string" ? currency_code : String(currency_code),
    currencySymbol: currency_symbol,
    todayTrips: {
      today_completed: todayTrips.completed,
      today_scheduled: todayTrips.scheduled,
      today_cancelled: todayTrips.cancelled,
    },
    fleetsEarnings: [],
    todayEarnings,
    overallEarnings,
    fleetDriverEarnings: [],
    _note:
      "fleetsEarnings and fleetDriverEarnings are empty in Node until fleet/request joins are fully ported.",
  };
}

module.exports = {
  slMatch,
  getDashboardData,
  getTodayEarnings,
  getOverallEarningsChart,
  getCancelChart,
  getOwnersData,
  getOwnerEarnings,
};
