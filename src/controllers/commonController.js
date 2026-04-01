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
const Notification = require("../models/Notification");
const NotificationChannel = require("../models/NotificationChannel");
const PromotionTemplate = require("../models/PromotionTemplate");
const VehicleType = require("../models/VehicleType");
const SubVehicleType = require("../models/SubVehicleType");
const LandingQuickLink = require("../models/LandingQuickLink");
const Setting = require("../models/Setting");
const Language = require("../models/Language");
const GoodsType = require("../models/GoodsType");
const User = require("../models/User");

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

async function onBoardingDriver(req, res) {
  try {
    const rows = await OnboardingScreen.find({ active: true, user_type: "driver" })
      .sort({ sn_o: 1 })
      .lean();
    return ok(res, rows);
  } catch {
    return ok(res, []);
  }
}

async function onBoardingOwner(req, res) {
  try {
    const rows = await OnboardingScreen.find({ active: true, user_type: "owner" })
      .sort({ sn_o: 1 })
      .lean();
    return ok(res, rows);
  } catch {
    return ok(res, []);
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

async function driverReferralCondition(req, res) {
  try {
    
      const row = await Setting.findOne({ key: "referral_condition_driver" }).lean();
      return ok(res, row || null);
    
  } catch {
    return ok(res, null);
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

// VehicleTypeController
async function vehicleTypes(req, res) {
  try {
    const { service_location } = req.params;
    
      const exists = await ServiceLocation.findById(service_location).lean();
      if (!exists) return ok(res, []);
      const rows = await VehicleType.find({ active: true }).sort({ order: 1, createdAt: 1 }).lean();
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
  preferences,
  preferencesStore,
  referralProgress,
  referralHistory,
  referralCondition,
  driverReferralCondition,
  mobilePrivacy,
  mobileTerms,
  vehicleTypes,
  subVehicleTypes,
  notifications,
  deleteNotification,
  deleteAllNotification,
  promotionsPopup,
};

