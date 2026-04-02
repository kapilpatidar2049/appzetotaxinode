const mongoose = require("mongoose");
const config = require("../config");
const User = require("../models/User");
const RoleUser = require("../models/RoleUser");
const AdminDetail = require("../models/AdminDetail");
const ReferralAdminSettings = require("../models/ReferralAdminSettings");

function ok(res, data, message = "success") {
  return res.json({ success: true, message, data });
}

function err(res, status, message, errors) {
  return res.status(status).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}

const DEFAULT_USER_REFERRAL = {
  enable_user_referral_earnings: false,
  referral_commission_amount_for_user: "0",
  enable_referral_condition_by_earning: false,
  enable_referral_condition_by_ride_count: false,
  referral_commission_for_new_driver_from_referer_user: "0",
  referral_commission_for_new_user_from_referer_user: "0",
  referral_condition_driver_earning_amount: "0",
  referral_condition_driver_ride_count: "0",
  referral_condition_user_ride_count: "0",
  referral_condition_user_spent_amount: "0",
  referral_type: "instant",
};

const DEFAULT_JOINING_BONUS = {
  joining_bonus_enabled: "0",
  joining_bonus_amount_for_user: 0,
  joining_bonus_amount_for_driver: 0,
};

function mergeDefaults(base, stored) {
  return { ...base, ...(stored && typeof stored === "object" ? stored : {}) };
}

async function getOrCreateSettingsDoc() {
  let doc = await ReferralAdminSettings.findOne();
  if (!doc) {
    doc = await ReferralAdminSettings.create({
      user_referral: {},
      driver_referral: {},
      joining_bonus: {},
    });
  }
  return doc;
}

const JETSTREAM_DEFAULT = {
  canCreateTeams: false,
  canManageTwoFactorAuthentication: true,
  canUpdatePassword: true,
  canUpdateProfileInformation: true,
  hasEmailVerification: true,
  flash: [],
  hasAccountDeletionFeatures: true,
  hasApiFeatures: true,
  hasTeamFeatures: false,
  hasTermsAndPrivacyPolicyFeature: true,
  managesProfilePhotos: true,
};

async function buildAuthUserForProps(req) {
  const userId = req.user?.id;
  if (!userId || !mongoose.Types.ObjectId.isValid(String(userId))) {
    return {
      id: null,
      name: null,
      email: null,
      mobile: null,
      role_name: req.user?.role || null,
      refferal_code: null,
      referred_by: null,
      timezone: "Asia/Kolkata",
      active: 1,
      email_confirmed: 0,
      mobile_confirmed: 1,
      profile_picture: null,
      country: null,
      roles: [],
      two_factor_enabled: false,
    };
  }

  const u = await User.findById(userId).lean();
  if (!u) {
    return {
      id: String(userId),
      name: req.user?.email || null,
      email: req.user?.email || null,
      mobile: req.user?.mobile || null,
      role_name: req.user?.role || null,
      refferal_code: null,
      referred_by: null,
      timezone: "Asia/Kolkata",
      active: 1,
      email_confirmed: 0,
      mobile_confirmed: 1,
      profile_picture: null,
      country: null,
      roles: [],
      two_factor_enabled: false,
    };
  }

  const adminDetail = await AdminDetail.findOne({ user_id: u._id }).lean();

  const roleLinks = await RoleUser.find({ user_id: u._id }).populate("role_id").lean();
  const roles = roleLinks
    .map((r) => {
      const role = r.role_id;
      if (!role) return null;
      return {
        id: role._id,
        slug: role.slug,
        name: role.name,
        description: role.description || "",
        all: role.all ? 1 : 0,
        locked: 1,
        created_by: null,
        created_at: role.createdAt || null,
        updated_at: role.updatedAt || null,
        pivot: { user_id: u._id, role_id: role._id },
      };
    })
    .filter(Boolean);

  return {
    id: u._id,
    name: u.name,
    company_key: null,
    username: null,
    map_type: u.map_type || null,
    email: u.email || null,
    mobile: u.mobile || null,
    ride_otp: null,
    gender: u.gender || null,
    profile_picture: u.profile_picture || null,
    stripe_customer_id: null,
    is_deleted_at: u.is_deleted_at || null,
    country: u.country || null,
    timezone: u.timezone || "Asia/Kolkata",
    active: u.active ? 1 : 0,
    email_confirmed: u.email_confirmed ? 1 : 0,
    mobile_confirmed: u.mobile_confirmed ? 1 : 0,
    fcm_token: u.fcm_token || null,
    apn_token: null,
    refferal_code: u.refferal_code || null,
    referred_by: u.referred_by || null,
    rating: 0,
    lang: u.lang || null,
    zone_id: null,
    current_lat: u.current_lat ?? null,
    current_lng: u.current_lng ?? null,
    rating_total: 0,
    no_of_ratings: 0,
    login_by: null,
    last_known_ip: null,
    last_login_at: null,
    social_provider: null,
    is_bid_app: 0,
    social_nickname: null,
    social_id: null,
    social_token: null,
    social_token_secret: null,
    social_refresh_token: null,
    social_expires_in: null,
    social_avatar: null,
    social_avatar_original: null,
    created_at: u.createdAt || null,
    updated_at: u.updatedAt || null,
    authorization_code: null,
    deleted_at: null,
    service_location_id: null,
    country_name: null,
    mobile_number: u.mobile || null,
    role_name: req.user?.role || roles[0]?.slug || null,
    converted_deleted_at: null,
    country_detail: null,
    roles,
    two_factor_enabled: false,
    admin: adminDetail
      ? {
          id: adminDetail._id,
          user_id: u._id,
          service_location_id: null,
          first_name: adminDetail.first_name || u.name,
          last_name: adminDetail.last_name || null,
          address: adminDetail.address || null,
          country: adminDetail.country || null,
          state: null,
          city: null,
          active: 1,
          pincode: adminDetail.pincode || null,
          email: adminDetail.email || u.email,
          mobile: adminDetail.mobile || u.mobile,
          created_by: null,
          category_type: null,
          created_at: adminDetail.createdAt || null,
          updated_at: adminDetail.updatedAt || null,
          deleted_at: null,
          profile_picture: u.profile_picture || null,
          service_location_name: null,
          role_name: roles[0]?.name || req.user?.role || null,
          user_status: u.active ? 1 : 0,
          user: {
            id: u._id,
            name: u.name,
            email: u.email,
            mobile: u.mobile,
            refferal_code: u.refferal_code,
            timezone: u.timezone || "Asia/Kolkata",
            roles,
            country_detail: null,
          },
        }
      : null,
  };
}

/** Inertia-style bootstrap for referral admin page (Laravel parity). */
async function getReferralDashboard(req, res, next) {
  try {
    const doc = await getOrCreateSettingsDoc();
    const userReferral = mergeDefaults(DEFAULT_USER_REFERRAL, doc.user_referral);
    const driverReferral = mergeDefaults(DEFAULT_USER_REFERRAL, doc.driver_referral);
    const joiningBonus = mergeDefaults(DEFAULT_JOINING_BONUS, doc.joining_bonus);

    const authUser = await buildAuthUserForProps(req);

    return res.json({
      component: "ReferralDashboard",
      props: {
        app_for: process.env.APP_FOR || config.appFor || "taxi",
        jetstream: JETSTREAM_DEFAULT,
        auth: {
          user: authUser,
        },
        errorBags: [],
        user_referral_settings: userReferral,
        driver_referral_settings: driverReferral,
        joining_bonus_settings: joiningBonus,
      },
      url: "/referral-dashboard",
      version: "",
      clearHistory: false,
      encryptHistory: false,
    });
  } catch (e) {
    next(e);
  }
}

async function getAllSettings(req, res, next) {
  try {
    const doc = await getOrCreateSettingsDoc();
    return ok(res, {
      user_referral: mergeDefaults(DEFAULT_USER_REFERRAL, doc.user_referral),
      driver_referral: mergeDefaults(DEFAULT_USER_REFERRAL, doc.driver_referral),
      joining_bonus: mergeDefaults(DEFAULT_JOINING_BONUS, doc.joining_bonus),
    });
  } catch (e) {
    next(e);
  }
}

async function getUserReferralSettings(req, res, next) {
  try {
    const doc = await getOrCreateSettingsDoc();
    return ok(res, mergeDefaults(DEFAULT_USER_REFERRAL, doc.user_referral));
  } catch (e) {
    next(e);
  }
}

async function updateUserReferralSettings(req, res, next) {
  try {
    const body = req.body || {};
    const doc = await getOrCreateSettingsDoc();
    const merged = mergeDefaults(DEFAULT_USER_REFERRAL, doc.user_referral);
    const nextVal = { ...merged, ...body };
    doc.user_referral = nextVal;
    await doc.save();
    return ok(res, mergeDefaults(DEFAULT_USER_REFERRAL, doc.user_referral), "User referral settings updated");
  } catch (e) {
    next(e);
  }
}

async function getDriverReferralSettings(req, res, next) {
  try {
    const doc = await getOrCreateSettingsDoc();
    return ok(res, mergeDefaults(DEFAULT_USER_REFERRAL, doc.driver_referral));
  } catch (e) {
    next(e);
  }
}

async function updateDriverReferralSettings(req, res, next) {
  try {
    const body = req.body || {};
    const doc = await getOrCreateSettingsDoc();
    const merged = mergeDefaults(DEFAULT_USER_REFERRAL, doc.driver_referral);
    doc.driver_referral = { ...merged, ...body };
    await doc.save();
    return ok(res, mergeDefaults(DEFAULT_USER_REFERRAL, doc.driver_referral), "Driver referral settings updated");
  } catch (e) {
    next(e);
  }
}

async function getJoiningBonusSettings(req, res, next) {
  try {
    const doc = await getOrCreateSettingsDoc();
    return ok(res, mergeDefaults(DEFAULT_JOINING_BONUS, doc.joining_bonus));
  } catch (e) {
    next(e);
  }
}

async function updateJoiningBonusSettings(req, res, next) {
  try {
    const body = req.body || {};
    const doc = await getOrCreateSettingsDoc();
    const merged = mergeDefaults(DEFAULT_JOINING_BONUS, doc.joining_bonus);
    const nextVal = { ...merged, ...body };
    if (body.joining_bonus_amount_for_user != null) {
      nextVal.joining_bonus_amount_for_user = Number(body.joining_bonus_amount_for_user);
    }
    if (body.joining_bonus_amount_for_driver != null) {
      nextVal.joining_bonus_amount_for_driver = Number(body.joining_bonus_amount_for_driver);
    }
    doc.joining_bonus = nextVal;
    await doc.save();
    return ok(res, mergeDefaults(DEFAULT_JOINING_BONUS, doc.joining_bonus), "Joining bonus settings updated");
  } catch (e) {
    next(e);
  }
}

module.exports = {
  getReferralDashboard,
  getAllSettings,
  getUserReferralSettings,
  updateUserReferralSettings,
  getDriverReferralSettings,
  updateDriverReferralSettings,
  getJoiningBonusSettings,
  updateJoiningBonusSettings,
};
