const Country = require("../models/Country");
const OnboardingScreen = require("../models/OnboardingScreen");
const MobileAppSetting = require("../models/MobileAppSetting");
const ServiceLocation = require("../models/ServiceLocation");
const CancellationReason = require("../models/CancellationReason");
const Faq = require("../models/Faq");
const Sos = require("../models/Sos");
const SupportTicket = require("../models/SupportTicket");
const SupportTicketMessage = require("../models/SupportTicketMessage");
const SupportTicketTitle = require("../models/SupportTicketTitle");
const Preference = require("../models/Preference");
const Referral = require("../models/Referral");
const ReferralCondition = require("../models/ReferralCondition");
const ReferralAdminSettings = require("../models/ReferralAdminSettings");
const Notification = require("../models/Notification");
const NotificationChannel = require("../models/NotificationChannel");
const PromotionTemplate = require("../models/PromotionTemplate");
const VehicleType = require("../models/VehicleType");
const SubVehicleType = require("../models/SubVehicleType");
const Zone = require("../models/Zone");
const SetPrice = require("../models/SetPrice");
const LandingQuickLink = require("../models/LandingQuickLink");
const Setting = require("../models/Setting");
const Language = require("../models/Language");
const GoodsType = require("../models/GoodsType");
const User = require("../models/User");
const ComplaintTitle = require("../models/ComplaintTitle");
const Complaint = require("../models/Complaint");
const RequestModel = require("../models/Request");
const Driver = require("../models/Driver");
const Owner = require("../models/Owner");
const CarMake = require("../models/CarMake");
const CarModel = require("../models/CarModel");
const mongoose = require("mongoose");

function ok(res, data = null, message = "success") {
  return res.json({ success: true, message, data });
}

function fail(res, message = "Internal server error", code = 500) {
  return res.status(code).json({ success: false, message });
}

// CountryController
async function countries(req, res) {
  try {
    
      const rows = await Country.find({ active: true }).sort({ name: 1 }).lean();
      return ok(res, rows);
    
  } catch {
    return fail(res);
  }
}

async function onBoarding(req, res) {
  try {
    const rows = await OnboardingScreen.find({ active: true, user_type: "user" })
      .sort({ sn_o: 1 })
      .lean();
    return ok(res, rows);
  } catch {
    return ok(res, []);
  }
}

function mapOnboardingPublicRow(row, defaultScreen) {
  const translation = row.translation_dataset;
  const translation_dataset =
    typeof translation === "string"
      ? translation
      : translation != null
        ? JSON.stringify(translation)
        : "";
  return {
    order: row.order != null ? row.order : row.sn_o,
    id: row.sn_o,
    screen: row.screen || defaultScreen,
    title: row.title ?? "",
    onboarding_image: row.onboarding_image ?? "",
    description: row.description ?? "",
    active: row.active ? 1 : 0,
    translation_dataset,
  };
}

function resJsonOnboarding(data) {
  return { success: true, data: { onboarding: { data } } };
}

async function onBoardingDriver(req, res) {
  try {
    const rows = await OnboardingScreen.find({
      active: true,
      $or: [{ user_type: "driver" }, { screen: "driver" }],
    })
      .sort({ order: 1, sn_o: 1 })
      .lean();
    return res.json(resJsonOnboarding(rows.map((row) => mapOnboardingPublicRow(row, "driver"))));
  } catch {
    return res.json(resJsonOnboarding([]));
  }
}

async function onBoardingOwner(req, res) {
  try {
    const rows = await OnboardingScreen.find({
      active: true,
      $or: [{ user_type: "owner" }, { screen: "owner" }],
    })
      .sort({ order: 1, sn_o: 1 })
      .lean();
    return res.json(resJsonOnboarding(rows.map((row) => mapOnboardingPublicRow(row, "owner"))));
  } catch {
    return res.json(resJsonOnboarding([]));
  }
}

// CarMakeAndModelController
async function modules(req, res) {
  try {
    
      const [quickLinks, languages] = await Promise.all([
        LandingQuickLink.find({ active: true }).sort({ order: 1 }).lean(),
        Language.find({ active: true }).sort({ order: 1 }).lean(),
      ]);
      return ok(res, { quick_links: quickLinks, languages });
    
  } catch {
    return ok(res, []);
  }
}

async function testApi(req, res) {
  return ok(res, { ping: "pong" });
}

async function rideModules(req, res) {
  try {
    const rows = await MobileAppSetting.find({ active: true }).sort({ order_by: 1, createdAt: 1 }).lean();
    return ok(res, rows);
  } catch {
    return ok(res, []);
  }
}

// GoodsTypesController / CancellationReasons / FAQ / SOS
async function goodsTypes(req, res) {
  try {
    
      const rows = await GoodsType.find({ active: true }).sort({ createdAt: 1 }).lean();
      return ok(res, rows);
    
  } catch {
    return fail(res);
  }
}

async function cancellationReasons(req, res) {
  try {
    
      const rows = await CancellationReason.find({ active: true }).sort({ order: 1, createdAt: 1 }).lean();
      return ok(res, rows);
    
  } catch {
    return fail(res);
  }
}

async function faqList(req, res) {
  try {
    
      const rows = await Faq.find({ active: true }).sort({ order: 1, createdAt: -1 }).lean();
      return ok(res, rows);
    
  } catch {
    return fail(res);
  }
}

async function sosList(req, res) {
  try {
    const userId = req.user?.id;
    
      const rows = await Sos.find({ user_id: userId }).sort({ createdAt: -1 }).lean();
      return ok(res, rows);
    
  } catch {
    return fail(res);
  }
}

async function sosStore(req, res) {
  try {
    const userId = req.user?.id;
    const { title, contact_name, contact_number } = req.body || {};
    if (!title || !contact_number) {
      return fail(res, "title and contact_number are required", 422);
    }
    
      await Sos.create({
        user_id: userId,
        name: contact_name || title,
        number: contact_number,
        type: "contact",
      });
    
    return ok(res, null, "SOS contact added");
  } catch {
    return fail(res);
  }
}

async function sosDelete(req, res) {
  try {
    const userId = req.user?.id;
    const { sos } = req.params;
    
      await Sos.deleteOne({ _id: sos, user_id: userId });
    
    return ok(res, null, "SOS deleted");
  } catch {
    return fail(res);
  }
}

// SupportTicketController
async function ticketTitles(req, res) {
  try {
    
      const rows = await SupportTicketTitle.find({ active: true }).sort({ order: 1, createdAt: 1 }).lean();
      return ok(res, rows);
    
  } catch {
    return ok(res, []);
  }
}

async function makeTicket(req, res) {
  try {
    const userId = req.user?.id;
    const { title_id, message } = req.body || {};
    if (!title_id || !message) return fail(res, "title_id and message are required", 422);
    
      const ticket = await SupportTicket.create({
        user_id: userId,
        support_ticket_title_id: title_id,
        description: message,
        status: "open",
      });
      await SupportTicketMessage.create({
        support_ticket_id: ticket._id,
        sender_user_id: userId,
        message,
      });
      return ok(res, { ticket_id: ticket._id }, "Ticket created");
    
  } catch {
    return fail(res);
  }
}

async function replyMessage(req, res) {
  try {
    const userId = req.user?.id;
    const { supportTicket } = req.params;
    const { message } = req.body || {};
    if (!message) return fail(res, "message is required", 422);
    
      await SupportTicketMessage.create({
        support_ticket_id: supportTicket,
        sender_user_id: userId,
        message,
      });
    
    return ok(res, null, "Reply sent");
  } catch {
    return fail(res);
  }
}

async function viewTicket(req, res) {
  try {
    const { supportTicket } = req.params;
    
      const ticket = await SupportTicket.findById(supportTicket).lean();
      if (!ticket) return fail(res, "Ticket not found", 404);
      const messages = await SupportTicketMessage.find({ support_ticket_id: supportTicket })
        .sort({ createdAt: 1 })
        .lean();
      return ok(res, { ticket, messages });
  } catch {
    return fail(res);
  }
}

async function ticketList(req, res) {
  try {
    const userId = req.user?.id;
    
      const rows = await SupportTicket.find({ user_id: userId }).sort({ createdAt: -1 }).lean();
      return ok(res, rows);
    
  } catch {
    return fail(res);
  }
}

async function assertRequestAccessibleForComplaint(req, requestId) {
  const userId = req.user?.id;
  const role = req.user?.role || "user";
  if (!mongoose.Types.ObjectId.isValid(requestId)) {
    return "Invalid request_id";
  }
  const trip = await RequestModel.findById(requestId).lean();
  if (!trip) {
    return "Request not found";
  }
  if (role === "user") {
    if (String(trip.user_id) !== String(userId)) return "Forbidden";
    return null;
  }
  if (role === "driver") {
    const driver = await Driver.findOne({ user_id: userId }).lean();
    if (!driver) return "Driver profile not found";
    if (String(trip.driver_id) !== String(driver._id)) return "Forbidden";
    return null;
  }
  if (role === "owner") {
    const owner = await Owner.findOne({ user_id: userId }).lean();
    if (!owner) return "Owner profile not found";
    if (!trip.owner_id || String(trip.owner_id) !== String(owner._id)) return "Forbidden";
    return null;
  }
  if (String(trip.user_id) === String(userId)) return null;
  return "Forbidden";
}

// ComplaintController (mobile: common/complaint-titles, common/make-complaint)
async function complaintTitles(req, res) {
  try {
    const rows = await ComplaintTitle.find({ active: true }).sort({ order: 1, createdAt: 1 }).lean();
    return ok(res, rows);
  } catch {
    return ok(res, []);
  }
}

async function makeComplaint(req, res) {
  try {
    const userId = req.user?.id;
    const body = req.body || {};
    const titleId = body.complaint_title_id || body.title_id;
    const text = String(body.complaint_text || body.description || body.message || "").trim();
    if (!titleId) return fail(res, "complaint_title_id or title_id is required", 422);
    if (!text) return fail(res, "complaint_text, description, or message is required", 422);

    const title = await ComplaintTitle.findOne({ _id: titleId, active: true }).lean();
    if (!title) return fail(res, "Invalid complaint title", 422);

    let requestId = body.request_id;
    if (requestId != null && String(requestId).trim() === "") requestId = null;
    if (requestId) {
      const errMsg = await assertRequestAccessibleForComplaint(req, requestId);
      if (errMsg) {
        const code = errMsg === "Request not found" ? 404 : errMsg === "Forbidden" ? 403 : 422;
        return fail(res, errMsg, code);
      }
    }

    const doc = await Complaint.create({
      user_id: userId,
      complaint_title_id: titleId,
      request_id: requestId || undefined,
      description: text,
      status: "open",
    });
    return ok(res, { complaint_id: doc._id }, "Complaint submitted");
  } catch {
    return fail(res);
  }
}

// PreferenceController
async function preferences(req, res) {
  try {
    const userId = req.user?.id;
    
      const rows = await Preference.find({ user_id: userId }).sort({ createdAt: 1 }).lean();
      return ok(res, rows);
    
  } catch {
    return ok(res, []);
  }
}

async function preferencesStore(req, res) {
  try {
    const userId = req.user?.id;
    const { key, value } = req.body || {};
    if (!key) return fail(res, "key is required", 422);
    
      await Preference.findOneAndUpdate(
        { user_id: userId, key },
        { $set: { value: value || null } },
        { upsert: true, new: true }
      );
    
    return ok(res);
  } catch {
    return fail(res);
  }
}

// ReferralController
async function referralProgress(req, res) {
  try {
    const userId = req.user?.id;
    
      const total = await Referral.countDocuments({
        $or: [{ referrer_user_id: userId }, { referrer_driver_id: userId }],
      });
      return ok(res, { total_referrals: total });
    
  } catch {
    return fail(res);
  }
}

async function referralHistory(req, res) {
  try {
    const userId = req.user?.id;
    
      const refs = await Referral.find({
        $or: [{ referrer_user_id: userId }, { referrer_driver_id: userId }],
      })
        .sort({ createdAt: -1 })
        .lean();
      const referredIds = refs
        .map((r) => r.referred_user_id || r.referred_driver_id)
        .filter(Boolean);
      const users = await User.find({ _id: { $in: referredIds } })
        .select({ name: 1, mobile: 1, createdAt: 1 })
        .lean();
      return ok(res, users);
    
  } catch {
    return fail(res);
  }
}

async function referralCondition(req, res) {
  try {
    
      const row = await Setting.findOne({ key: "referral_condition_user" }).lean();
      return ok(res, row || null);
    
  } catch {
    return ok(res, null);
  }
}

const DEFAULT_DRIVER_REFERRAL_PLACEHOLDERS = {
  referral_commission_amount_for_user: "0",
  referral_commission_for_new_driver_from_referer_user: "0",
  referral_commission_for_new_user_from_referer_user: "0",
  referral_condition_driver_earning_amount: "0",
  referral_condition_driver_ride_count: "0",
  referral_condition_user_ride_count: "0",
  referral_condition_user_spent_amount: "0",
  referral_type: "instant",
};

const DRIVER_REFERRAL_SHORT_TO_CONDITION = {
  instant: "instant_referrer_driver",
  instant_and_new: "instant_referrer_driver_and_new_driver",
  conditional_ride_count: "conditional_for_referrer_driver_ride_count",
  conditional_earning: "conditional_for_referrer_driver_earnings",
  dual_conditional_ride_count:
    "dual_conditional_for_referrer_driver_and_new_driver_or_new_user_ride_count",
  dual_conditional_earning:
    "dual_conditional_for_referrer_driver_and_new_driver_or_new_user_earnings",
};

function mergeDriverReferralForPlaceholders(stored) {
  return {
    ...DEFAULT_DRIVER_REFERRAL_PLACEHOLDERS,
    ...(stored && typeof stored === "object" ? stored : {}),
  };
}

function applyDriverReferralDescriptionVars(text, settings) {
  if (text == null) return "";
  let s = String(text);
  const m = {
    "{referred_driver_amount}": String(settings.referral_commission_amount_for_user ?? "0"),
    "{new_driver_amount}": String(settings.referral_commission_for_new_driver_from_referer_user ?? "0"),
    "{new_user_amount}": String(settings.referral_commission_for_new_user_from_referer_user ?? "0"),
    "{user_ride_count}": String(settings.referral_condition_user_ride_count ?? "0"),
    "{driver_ride_count}": String(settings.referral_condition_driver_ride_count ?? "0"),
    "{user_spent_amount}": String(settings.referral_condition_user_spent_amount ?? "0"),
    "{driver_earning_amount}": String(settings.referral_condition_driver_earning_amount ?? "0"),
  };
  for (const [k, v] of Object.entries(m)) {
    s = s.split(k).join(v);
  }
  return s;
}

async function findDriverReferralContentCondition(adminReferralType) {
  const short = String(adminReferralType || "instant").trim() || "instant";
  let row = await ReferralCondition.findOne({
    label_referral: "driver",
    referral_type: short,
  }).lean();
  if (row) return row;
  const mapped = DRIVER_REFERRAL_SHORT_TO_CONDITION[short];
  if (mapped) {
    row = await ReferralCondition.findOne({
      label_referral: "driver",
      referral_type: mapped,
    }).lean();
    if (row) return row;
  }
  return ReferralCondition.findOne({
    label_referral: "driver",
    referral_type: "instant_referrer_driver",
  }).lean();
}

function mapDriverReferralConditionPayload(row, settings) {
  if (!row) return null;
  const description = applyDriverReferralDescriptionVars(row.description, settings);
  const translation_dataset = JSON.stringify({
    en: { locale: "en", description },
  });
  return {
    id: String(row._id),
    referral_type: row.referral_type,
    description,
    label_referral: row.label_referral,
    translation_dataset,
  };
}

async function driverReferralCondition(req, res) {
  try {
    const doc = await ReferralAdminSettings.findOne().lean();
    const merged = mergeDriverReferralForPlaceholders(doc?.driver_referral);
    const [contentRow, bannerRow] = await Promise.all([
      findDriverReferralContentCondition(merged.referral_type),
      ReferralCondition.findOne({
        label_referral: "driver",
        referral_type: "driver_banner_text",
      }).lean(),
    ]);
    const referral_content = { data: mapDriverReferralConditionPayload(contentRow, merged) };
    const driver_banner = { data: mapDriverReferralConditionPayload(bannerRow, merged) };
    return res.json({
      success: true,
      message: "referrals_description",
      data: { referral_content, driver_banner },
    });
  } catch {
    return res.json({
      success: true,
      message: "referrals_description",
      data: {
        referral_content: { data: null },
        driver_banner: { data: null },
      },
    });
  }
}

// LandingQuickLinkController
async function mobilePrivacy(req, res) {
  try {
    
      const row = await Setting.findOne({ key: "privacy_policy" }).lean();
      return ok(res, { content: row?.value || "" });
    
  } catch {
    return ok(res, { content: "" });
  }
}

async function mobileTerms(req, res) {
  try {
    
      const row = await Setting.findOne({ key: "terms_and_conditions" }).lean();
      return ok(res, { content: row?.value || "" });
    
  } catch {
    return ok(res, { content: "" });
  }
}

function mapVehicleTypeQueryToMakeFor(v) {
  const key = String(v || "").toLowerCase().trim();
  const map = {
    taxi: "taxi",
    car: "taxi",
    delivery: "taxi",
    bike: "motor_bike",
    motor_bike: "motor_bike",
    truck: "truck",
  };
  if (map[key]) return map[key];
  if (["taxi", "motor_bike", "truck"].includes(key)) return key;
  return null;
}

/** Flutter path `GET /types/service?transport_type=...&service_location=...` (alias for `/types/:id`). */
async function vehicleTypesServicePath(req, res) {
  try {
    const q = req.query || {};
    const serviceLocation =
      q.service_location || q.service_location_id || q.service || q.servicelocation;
    if (!serviceLocation || !mongoose.Types.ObjectId.isValid(String(serviceLocation))) {
      return fail(
        res,
        "service_location (or service_location_id) query with a valid id is required",
        422
      );
    }
    req.params = { ...req.params, service_location: String(serviceLocation) };
    return vehicleTypes(req, res);
  } catch {
    return fail(res);
  }
}

// CarMakeAndModelController (mobile registration)
async function carMakes(req, res) {
  try {
    const transportTypeRaw = req.query.transport_type;
    const vehicleTypeRaw = req.query.vehicle_type;
    const transportType = transportTypeRaw ? String(transportTypeRaw).toLowerCase() : null;
    const filter = {};
    if (transportType) {
      if (!["taxi", "delivery", "both"].includes(transportType)) {
        return fail(res, "transport_type must be taxi, delivery, or both", 422);
      }
      filter.$or = [{ transport_type: transportType }, { transport_type: "both" }];
    }
    if (vehicleTypeRaw) {
      const makeFor = mapVehicleTypeQueryToMakeFor(vehicleTypeRaw);
      if (makeFor) filter.vehicle_make_for = makeFor;
    }
    const rows = await CarMake.find(filter).sort({ name: 1 }).lean();
    return ok(res, rows);
  } catch {
    return fail(res);
  }
}

async function carModelsByMake(req, res) {
  try {
    const { make } = req.params;
    const exists = await CarMake.findById(make).lean();
    if (!exists) return ok(res, []);
    const rows = await CarModel.find({ make_id: make }).sort({ name: 1 }).lean();
    return ok(res, rows);
  } catch {
    return fail(res);
  }
}

// VehicleTypeController
async function vehicleTypes(req, res) {
  try {
    const { service_location } = req.params;
    const transportTypeRaw = req.query.transport_type ?? req.body?.transport_type;

    const exists = await ServiceLocation.findById(service_location).lean();
    if (!exists) return ok(res, []);

    const transportType = transportTypeRaw ? String(transportTypeRaw).toLowerCase() : null;
    if (transportType && !["taxi", "delivery"].includes(transportType)) {
      return fail(res, "transport_type must be taxi or delivery", 422);
    }

    const zones = await Zone.find({ service_location_id: service_location, active: true })
      .select("_id")
      .lean();
    const zoneIds = zones.map((z) => String(z._id));
    if (!zoneIds.length) return ok(res, []);

    const setPriceFilter = {
      zone_id: { $in: zoneIds },
      active: true,
      ...(transportType ? { transport_type: transportType } : {}),
    };
    const setPriceVehicleTypes = await SetPrice.distinct("vehicle_type", setPriceFilter);
    if (!setPriceVehicleTypes.length) return ok(res, []);

    const objectIds = setPriceVehicleTypes
      .filter((v) => mongoose.Types.ObjectId.isValid(String(v)))
      .map((v) => new mongoose.Types.ObjectId(String(v)));
    const names = setPriceVehicleTypes
      .map((v) => String(v).trim())
      .filter((v) => v.length > 0);

    const orConditions = [];
    if (objectIds.length) orConditions.push({ _id: { $in: objectIds } });
    if (names.length) orConditions.push({ name: { $in: names } });
    if (!orConditions.length) return ok(res, []);

    const rows = await VehicleType.find({
      active: true,
      ...(transportType ? { transport_type: transportType } : {}),
      $or: orConditions,
    })
      .sort({ order: 1, createdAt: 1 })
      .lean();

    return ok(res, rows);
  } catch {
    return fail(res);
  }
}

async function subVehicleTypes(req, res) {
  try {
    const { service_location } = req.params;
    
      const exists = await ServiceLocation.findById(service_location).lean();
      if (!exists) return ok(res, []);
      const rows = await SubVehicleType.find({ active: true }).sort({ order: 1, createdAt: 1 }).lean();
      return ok(res, rows);
    
  } catch {
    return fail(res);
  }
}

// ShowNotificationController
async function notifications(req, res) {
  try {
    const userId = req.user?.id;
    
      const rows = await Notification.find({ user_id: userId })
        .sort({ createdAt: -1 })
        .limit(100)
        .populate("notification_channel_id")
        .lean();
      return ok(res, rows);
    
  } catch {
    return fail(res);
  }
}

async function deleteNotification(req, res) {
  try {
    const userId = req.user?.id;
    const { notification } = req.params;
    
      await Notification.deleteOne({ _id: notification, user_id: userId });
    
    return ok(res);
  } catch {
    return fail(res);
  }
}

async function deleteAllNotification(req, res) {
  try {
    const userId = req.user?.id;
    
      await Notification.deleteMany({ user_id: userId });
    
    return ok(res);
  } catch {
    return fail(res);
  }
}

// PromotionTemplateController
async function promotionsPopup(req, res) {
  try {
    
      const row = await PromotionTemplate.findOne({ active: true }).sort({ createdAt: -1 }).lean();
      return ok(res, row || null);
    
  } catch {
    return ok(res, null);
  }
}

module.exports = {
  countries,
  onBoarding,
  onBoardingDriver,
  onBoardingOwner,
  modules,
  testApi,
  rideModules,
  goodsTypes,
  cancellationReasons,
  faqList,
  sosList,
  sosStore,
  sosDelete,
  ticketTitles,
  makeTicket,
  replyMessage,
  viewTicket,
  ticketList,
  complaintTitles,
  makeComplaint,
  preferences,
  preferencesStore,
  referralProgress,
  referralHistory,
  referralCondition,
  driverReferralCondition,
  mobilePrivacy,
  mobileTerms,
  vehicleTypesServicePath,
  vehicleTypes,
  subVehicleTypes,
  carMakes,
  carModelsByMake,
  notifications,
  deleteNotification,
  deleteAllNotification,
  promotionsPopup,
};

