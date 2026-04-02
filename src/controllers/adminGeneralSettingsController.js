const mongoose = require("mongoose");
const config = require("../config");
const Setting = require("../models/Setting");
const TimeZone = require("../models/TimeZone");
const User = require("../models/User");
const RoleUser = require("../models/RoleUser");
const AdminDetail = require("../models/AdminDetail");

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

const DEFAULT_GENERAL_SETTINGS = {
  logo: null,
  favicon: null,
  loginbg: null,
  owner_loginbg: null,
  nav_color: "#0ab39c",
  sidebar_color: "#405189",
  sidebar_text_color: "#ffffff",
  footer_content1: "2026 \u00a9 Appzeto.",
  footer_content2: "Design & Develop by Appzeto",
  app_name: "Rydence",
  facebook: "https://facebook.com",
  instagram: "https://instagram.com",
  linkedin: "https://linkedin.com",
  twitter: "https://twitter.com",
  currency_code: "INR",
  currency_symbol: "\u20b9",
  contact_us_mobile1: "0000000000",
  contact_us_mobile2: "0000000000",
  contact_us_link: "https://tagxi-landing.ondemandappz.com/",
  default_latitude: "11.21215",
  default_longitude: "76.54545",
  resteruant_payout_type: "daily",
  enable_not_found: "1",
  admin_login: "admin",
  owner_login: "owner-login",
  dispatcher_login: "dispatch",
  user_login: "user-login",
  dispatcher_login_pro: "dispatch-pro",
  show_driver_level_feature: "1",
  driver_register_module: "subscription",
  reward_point_value: "1",
  minimun_reward_point: "1",
  landing_header_bg_color: "#ffffff",
  landing_header_text_color: "#212529",
  landing_header_active_text_color: "#0ab39c",
  landing_footer_bg_color: "#000000",
  landing_footer_text_color: "#f1ffff",
  android_user: "Your Android User App Link",
  android_driver: "Your Android Driver App Link",
  ios_user: "Your IOS User App Link",
  ios_driver: "Your IOS Driver App Link",
  dispatcher_sidebar_color: "#000000",
  dispatcher_sidebar_txt_color: "#000000",
  agent_login: "agent-login",
  franchise_login: "franchise-login",
  contact_booking_number: "9999999999",
};

function toObjectIdIfValid(value) {
  const id = String(value || "");
  return mongoose.Types.ObjectId.isValid(id) ? id : null;
}

async function buildAuthUserForProps(req) {
  const userId = toObjectIdIfValid(req.user?.id);
  if (!userId) {
    return {
      id: req.user?.id ?? null,
      name: req.user?.email ?? null,
      email: req.user?.email ?? null,
      mobile: null,
      role_name: req.user?.role ?? null,
      timezone: "Asia/Kolkata",
      roles: [],
      two_factor_enabled: false,
    };
  }

  const u = await User.findById(userId).lean();
  if (!u) {
    return {
      id: req.user?.id ?? null,
      name: req.user?.email ?? null,
      email: req.user?.email ?? null,
      mobile: null,
      role_name: req.user?.role ?? null,
      timezone: "Asia/Kolkata",
      roles: [],
      two_factor_enabled: false,
    };
  }

  const roleLinks = await RoleUser.find({ user_id: u._id }).populate("role_id").lean();
  const roles = roleLinks
    .map((link) => {
      const role = link.role_id;
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
        pivot: {
          user_id: u._id,
          role_id: role._id,
        },
      };
    })
    .filter(Boolean);

  const adminDetail = await AdminDetail.findOne({ user_id: u._id }).lean();

  const adminPayload = adminDetail
    ? {
        id: adminDetail._id,
        user_id: u._id,
        service_location_id: null,
        first_name: adminDetail.first_name || u.name || null,
        last_name: adminDetail.last_name || null,
        address: adminDetail.address || null,
        country: adminDetail.country || null,
        state: null,
        city: null,
        active: u.active ? 1 : 0,
        pincode: adminDetail.pincode || null,
        email: adminDetail.email || u.email || null,
        mobile: adminDetail.mobile || u.mobile || null,
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
          name: u.name || null,
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
          roles,
          country_detail: null,
        },
      }
    : null;

  return {
    id: u._id,
    name: u.name || null,
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
    admin: adminPayload,
    country_detail: null,
    roles,
    two_factor_enabled: false,
  };
}

async function getSettingsAsFlatObject() {
  const rows = await Setting.find({}).lean();
  const dbSettings = Object.fromEntries(rows.map((row) => [row.key, row.value]));
  return {
    ...DEFAULT_GENERAL_SETTINGS,
    ...dbSettings,
  };
}

async function getTimeZones() {
  const rows = await TimeZone.find({ active: true }).sort({ name: 1 }).lean();
  return rows.map((zone) => ({
    id: zone._id,
    name: zone.name,
    timezone: zone.timezone,
    active: zone.active ? 1 : 0,
    created_at: zone.createdAt || null,
    updated_at: zone.updatedAt || null,
  }));
}

async function buildGeneralSettingsPayload(req) {
  const settings = await getSettingsAsFlatObject();
  const timeZones = await getTimeZones();
  const authUser = await buildAuthUserForProps(req);
  const appFor = process.env.APP_FOR || config.appFor || "taxi";
  const baseUrlRoot = process.env.APP_URL || "";

  return {
    component: "pages/general_settings/index",
    props: {
      app_for: appFor,
      jetstream: JETSTREAM_DEFAULT,
      auth: { user: authUser },
      errorBags: [],
      settings,
      baseUrl: baseUrlRoot ? `${baseUrlRoot.replace(/\/+$/, "")}/login/` : "/login/",
      timeZones,
      dispathcer_addons: [],
    },
    url: "/general-settings",
    version: "",
    clearHistory: false,
    encryptHistory: false,
  };
}

async function getGeneralSettings(req, res, next) {
  try {
    const payload = await buildGeneralSettingsPayload(req);
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
}

async function updateGeneralSettings(req, res, next) {
  try {
    const source = req.body?.settings && typeof req.body.settings === "object" ? req.body.settings : req.body;
    const reserved = new Set([
      "component",
      "props",
      "url",
      "version",
      "clearHistory",
      "encryptHistory",
      "app_for",
      "jetstream",
      "auth",
      "errorBags",
      "baseUrl",
      "timeZones",
      "dispathcer_addons",
    ]);

    const entries = Object.entries(source || {}).filter(
      ([key]) => key && !reserved.has(key)
    );

    for (const [key, value] of entries) {
      await Setting.findOneAndUpdate(
        { key },
        {
          $set: {
            key,
            value,
            group: "general",
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const payload = await buildGeneralSettingsPayload(req);
    return res.json(payload);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getGeneralSettings,
  updateGeneralSettings,
};
