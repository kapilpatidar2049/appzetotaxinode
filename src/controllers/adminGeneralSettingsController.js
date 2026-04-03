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

const DEFAULT_CUSTOMIZE_SETTINGS = {
  enable_luggage_preference_for_user: "1",
  enable_shipment_load_feature: "1",
  enable_shipment_unload_feature: "1",
  enable_digital_signature: "1",
  how_many_times_a_driver_can_enable_the_my_route_booking_per_day: "1",
  enable_my_route_booking_feature: "0",
  enable_web_booking_feature: "1",
  enable_sub_vehicle_feature: "1",
  enable_vase_map: "1",
  enable_modules_for_applications: "both",
  default_currency_code_for_mobile_app: "INR",
  default_country_code_for_mobile_app: "IN",
  enable_country_restrict_on_map: "0",
  show_wallet_feature_on_mobile_app: "1",
  show_bank_info_feature_on_mobile_app: "1",
  show_wallet_feature_on_mobile_app_driver: "1",
  show_instant_ride_feature_on_mobile_app: "1",
  show_outstation_ride_feature: "0",
  show_delivery_outstation_ride_feature: "0",
  enable_outstation_round_trip_feature: "0",
  show_owner_module_feature_on_mobile_app: "1",
  show_wallet_money_transfer_feature_on_mobile_app_for_owner: "1",
  show_wallet_feature_on_mobile_app_owner: "1",
  show_wallet_money_transfer_feature_on_mobile_app: "1",
  show_wallet_money_transfer_feature_on_mobile_app_for_driver: "1",
  enable_pet_preference_for_user: "0",
  enable_document_auto_approval: "0",
  show_rental_ride_feature: "1",
  show_delivery_rental_ride_feature: "1",
  show_taxi_rental_ride_feature: "1",
  show_card_payment_feature: "1",
  show_ride_otp_feature: "1",
  show_ride_later_feature: "1",
  show_ride_without_destination: "1",
  show_incentive_feature_for_driver: "1",
  show_driver_level_feature: "0",
  enable_landing_site: "1",
  enable_additional_charge_feature: "0",
  enable_driver_profile_disapprove_on_update: "0",
  show_delivery_ride_pick_otp_feature: "1",
  show_delivery_ride_drop_otp_feature: "0",
  enable_support_ticket_feature: "0",
  enable_map_appearance_change_on_mobile_app: "0",
  enable_eta_total_update: "1",
  enable_driver_leaderboard_feature: "1",
  enable_multiple_ride_feature: "1",
  enable_second_ride_for_driver: "1",
  distance_for_second_ride: "2",
  enable_maximum_distance_feature: "0",
  enable_fixed_fare: "1",
  enable_user_sign_in_email_otp: "1",
  enable_user_sign_in_email_password: "0",
  enable_user_sign_in_mobile_otp: "1",
  enable_user_sign_in_mobile_password: "0",
  enable_driver_sign_in_email_otp: "1",
  enable_driver_sign_in_email_password: "0",
  enable_driver_sign_in_mobile_otp: "1",
  enable_driver_sign_in_mobile_password: "1",
  enable_owner_sign_in_email_otp: "1",
  enable_owner_sign_in_email_password: "1",
  enable_owner_sign_in_mobile_otp: "1",
  enable_owner_sign_in_mobile_password: "1",
  enable_user_email_login: "1",
  enable_user_mobile_login: "1",
  enable_driver_email_login: "1",
  enable_driver_mobile_login: "1",
  enable_owner_mobile_login: "1",
  enable_owner_email_login: "1",
  show_only_total_amount: "1",
};

const DEFAULT_TRANSPORT_RIDE_SETTINGS = {
  trip_dispatch_type: "1",
  driver_search_radius: "3",
  can_round_the_bill_values: "1",
  minimum_trip_distane: "25",
  maximum_time_for_find_drivers_for_bitting_ride: "30",
  maximum_time_for_accept_reject_bidding_ride: "5",
  user_can_make_a_ride_after_x_miniutes: "30",
  user_can_cancel_a_order_in_x_Seconds: "60",
  minimum_time_for_search_drivers_for_schedule_ride: "30",
  minimum_time_for_starting_trip_drivers_for_schedule_ride: "30",
  maximum_time_for_find_drivers_for_regular_ride: "5",
  trip_accept_reject_duration_for_driver: "30",
  bidding_low_percentage: "50",
  bidding_high_percentage: "10",
  bidding_amount_increase_or_decrease: "10",
  user_bidding_low_percentage: "50",
  user_bidding_high_percentage: "10",
  user_bidding_amount_increase_or_decrease: "10",
  bidding_ride_maximum_distance: "10",
};

const DEFAULT_BID_RIDE_SETTINGS = {
  trip_dispatch_type: "1",
  driver_search_radius: "3",
  can_round_the_bill_values: "1",
  minimum_trip_distane: "25",
  maximum_time_for_find_drivers_for_bitting_ride: "30",
  maximum_time_for_accept_reject_bidding_ride: "5",
  user_can_make_a_ride_after_x_miniutes: "30",
  user_can_cancel_a_order_in_x_Seconds: "60",
  minimum_time_for_search_drivers_for_schedule_ride: "30",
  minimum_time_for_starting_trip_drivers_for_schedule_ride: "30",
  maximum_time_for_find_drivers_for_regular_ride: "5",
  trip_accept_reject_duration_for_driver: "30",
  bidding_low_percentage: "50",
  bidding_high_percentage: "10",
  bidding_amount_increase_or_decrease: "10",
  user_bidding_low_percentage: "50",
  user_bidding_high_percentage: "10",
  user_bidding_amount_increase_or_decrease: "10",
  bidding_ride_maximum_distance: "10",
};

const DEFAULT_WALLET_SETTINGS = {
  driver_wallet_minimum_amount_to_get_an_order: "-10000",
  minimum_wallet_amount_for_transfer: "500",
  owner_wallet_minimum_amount_to_get_an_order: "-10000",
  minimum_amount_added_to_wallet: "50",
  joining_bonus_enabled: "0",
  joining_bonus_amount_for_user: "0",
  joining_bonus_amount_for_driver: "0",
};

const DEFAULT_TIP_SETTINGS = {
  enable_driver_tips_feature: "1",
  minimum_tip_amount: "10",
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

async function getCustomizeSettings(req, res, next) {
  try {
    const keys = Object.keys(DEFAULT_CUSTOMIZE_SETTINGS);
    const rows = await Setting.find({ key: { $in: keys } }).lean();
    const fromDb = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return res.json({
      success: true,
      message: "success",
      settings: {
        ...DEFAULT_CUSTOMIZE_SETTINGS,
        ...fromDb,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function updateCustomizeSettings(req, res, next) {
  try {
    const source =
      req.body?.settings && typeof req.body.settings === "object" ? req.body.settings : req.body || {};
    const allowedKeys = new Set(Object.keys(DEFAULT_CUSTOMIZE_SETTINGS));
    const entries = Object.entries(source).filter(([key]) => allowedKeys.has(key));

    for (const [key, value] of entries) {
      await Setting.findOneAndUpdate(
        { key },
        {
          $set: {
            key,
            value: value == null ? DEFAULT_CUSTOMIZE_SETTINGS[key] : String(value),
            group: "customize_settings",
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const keys = Object.keys(DEFAULT_CUSTOMIZE_SETTINGS);
    const rows = await Setting.find({ key: { $in: keys } }).lean();
    const fromDb = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return res.json({
      success: true,
      message: "Updated",
      settings: {
        ...DEFAULT_CUSTOMIZE_SETTINGS,
        ...fromDb,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getTransportRideSettings(req, res, next) {
  try {
    const keys = Object.keys(DEFAULT_TRANSPORT_RIDE_SETTINGS);
    const rows = await Setting.find({ key: { $in: keys } }).lean();
    const fromDb = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return res.json({
      success: true,
      message: "success",
      settings: {
        ...DEFAULT_TRANSPORT_RIDE_SETTINGS,
        ...fromDb,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function updateTransportRideSettings(req, res, next) {
  try {
    const source =
      req.body?.settings && typeof req.body.settings === "object" ? req.body.settings : req.body || {};
    const allowedKeys = new Set(Object.keys(DEFAULT_TRANSPORT_RIDE_SETTINGS));
    const entries = Object.entries(source).filter(([key]) => allowedKeys.has(key));

    for (const [key, value] of entries) {
      await Setting.findOneAndUpdate(
        { key },
        {
          $set: {
            key,
            value: value == null ? DEFAULT_TRANSPORT_RIDE_SETTINGS[key] : String(value),
            group: "transport_ride_settings",
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const keys = Object.keys(DEFAULT_TRANSPORT_RIDE_SETTINGS);
    const rows = await Setting.find({ key: { $in: keys } }).lean();
    const fromDb = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return res.json({
      success: true,
      message: "Updated",
      settings: {
        ...DEFAULT_TRANSPORT_RIDE_SETTINGS,
        ...fromDb,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getBidRideSettings(req, res, next) {
  try {
    const keys = Object.keys(DEFAULT_BID_RIDE_SETTINGS);
    const rows = await Setting.find({ key: { $in: keys } }).lean();
    const fromDb = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return res.json({
      success: true,
      message: "success",
      settings: {
        ...DEFAULT_BID_RIDE_SETTINGS,
        ...fromDb,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function updateBidRideSettings(req, res, next) {
  try {
    const source =
      req.body?.settings && typeof req.body.settings === "object" ? req.body.settings : req.body || {};
    const allowedKeys = new Set(Object.keys(DEFAULT_BID_RIDE_SETTINGS));
    const entries = Object.entries(source).filter(([key]) => allowedKeys.has(key));

    for (const [key, value] of entries) {
      await Setting.findOneAndUpdate(
        { key },
        {
          $set: {
            key,
            value: value == null ? DEFAULT_BID_RIDE_SETTINGS[key] : String(value),
            group: "bid_ride_settings",
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    const keys = Object.keys(DEFAULT_BID_RIDE_SETTINGS);
    const rows = await Setting.find({ key: { $in: keys } }).lean();
    const fromDb = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return res.json({
      success: true,
      message: "Updated",
      settings: {
        ...DEFAULT_BID_RIDE_SETTINGS,
        ...fromDb,
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function getWalletSettings(req, res, next) {
  try {
    const keys = Object.keys(DEFAULT_WALLET_SETTINGS);
    const rows = await Setting.find({ key: { $in: keys } }).lean();
    const byKey = new Map(rows.map((row) => [row.key, row]));
    const nowIso = new Date().toISOString();

    const resolveRow = (key) => {
      const row = byKey.get(key);
      return {
        id: row?._id || null,
        name: key,
        field: "text",
        category: "Wallet",
        value: row?.value ?? DEFAULT_WALLET_SETTINGS[key],
        option_value: null,
        group_name: null,
        created_at: row?.createdAt || nowIso,
        updated_at: row?.updatedAt || nowIso,
      };
    };

    return res.json({
      success: true,
      message: "success",
      settings: {
        driver_wallet: resolveRow("driver_wallet_minimum_amount_to_get_an_order"),
        minimum_wallet: resolveRow("minimum_wallet_amount_for_transfer"),
        owner_wallet: resolveRow("owner_wallet_minimum_amount_to_get_an_order"),
        minimum_wallet_add: resolveRow("minimum_amount_added_to_wallet"),
        joining_bonus_enabled: resolveRow("joining_bonus_enabled"),
        joining_bonus_amount_for_user: resolveRow("joining_bonus_amount_for_user"),
        joining_bonus_amount_for_driver: resolveRow("joining_bonus_amount_for_driver"),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function updateWalletSettings(req, res, next) {
  try {
    const source =
      req.body?.settings && typeof req.body.settings === "object" ? req.body.settings : req.body || {};

    const aliasToKey = {
      driver_wallet: "driver_wallet_minimum_amount_to_get_an_order",
      minimum_wallet: "minimum_wallet_amount_for_transfer",
      owner_wallet: "owner_wallet_minimum_amount_to_get_an_order",
      minimum_wallet_add: "minimum_amount_added_to_wallet",
      joining_bonus_enabled: "joining_bonus_enabled",
      joining_bonus_amount_for_user: "joining_bonus_amount_for_user",
      joining_bonus_amount_for_driver: "joining_bonus_amount_for_driver",
    };

    const updates = {};
    for (const [k, v] of Object.entries(source)) {
      if (DEFAULT_WALLET_SETTINGS[k] !== undefined) {
        updates[k] = String(v);
      } else if (aliasToKey[k] && v && typeof v === "object" && v.value !== undefined) {
        updates[aliasToKey[k]] = String(v.value);
      } else if (aliasToKey[k] && v !== undefined && typeof v !== "object") {
        updates[aliasToKey[k]] = String(v);
      } else if (aliasToKey[k] && v && typeof v === "object" && v.name && v.value !== undefined) {
        updates[String(v.name)] = String(v.value);
      }
    }

    for (const [key, value] of Object.entries(updates)) {
      if (DEFAULT_WALLET_SETTINGS[key] === undefined) continue;
      await Setting.findOneAndUpdate(
        { key },
        {
          $set: {
            key,
            value,
            group: "wallet_settings",
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    return await getWalletSettings(req, res, next);
  } catch (error) {
    return next(error);
  }
}

async function getTipSettings(req, res, next) {
  try {
    const keys = Object.keys(DEFAULT_TIP_SETTINGS);
    const rows = await Setting.find({ key: { $in: keys } }).lean();
    const byKey = new Map(rows.map((row) => [row.key, row]));
    const nowIso = new Date().toISOString();

    const resolveRow = (key) => {
      const row = byKey.get(key);
      return {
        id: row?._id || null,
        name: key,
        field: "text",
        category: "tip_settings",
        value: row?.value ?? DEFAULT_TIP_SETTINGS[key],
        option_value: null,
        group_name: null,
        created_at: row?.createdAt || nowIso,
        updated_at: row?.updatedAt || nowIso,
      };
    };

    const flat = { ...DEFAULT_TIP_SETTINGS };
    for (const row of rows) {
      flat[row.key] = row.value;
    }

    return res.json({
      success: true,
      message: "success",
      enable_driver_tips_feature: resolveRow("enable_driver_tips_feature"),
      minimum_tip_add: {
        id: byKey.get("minimum_tip_amount")?._id || null,
        name: "minimum_tip_amount",
        field: "text",
        category: "tip_settings",
        value: byKey.get("minimum_tip_amount")?.value ?? DEFAULT_TIP_SETTINGS.minimum_tip_amount,
        option_value: null,
        group_name: null,
        created_at: byKey.get("minimum_tip_amount")?.createdAt || nowIso,
        updated_at: byKey.get("minimum_tip_amount")?.updatedAt || nowIso,
      },
      settings: {
        enable_driver_tips_feature: String(flat.enable_driver_tips_feature),
        minimum_tip_amount: String(flat.minimum_tip_amount),
      },
    });
  } catch (error) {
    return next(error);
  }
}

async function updateTipSettings(req, res, next) {
  try {
    const source =
      req.body?.settings && typeof req.body.settings === "object" ? req.body.settings : req.body || {};

    const aliasToKey = {
      minimum_tip_add: "minimum_tip_amount",
    };

    const updates = {};
    for (const [k, v] of Object.entries(source)) {
      if (DEFAULT_TIP_SETTINGS[k] !== undefined) {
        updates[k] = String(v);
      } else if (aliasToKey[k] && v && typeof v === "object" && v.value !== undefined) {
        updates[aliasToKey[k]] = String(v.value);
      } else if (aliasToKey[k] && v !== undefined && typeof v !== "object") {
        updates[aliasToKey[k]] = String(v);
      } else if (aliasToKey[k] && v && typeof v === "object" && v.name && v.value !== undefined) {
        updates[String(v.name)] = String(v.value);
      }
    }

    for (const [key, value] of Object.entries(updates)) {
      if (DEFAULT_TIP_SETTINGS[key] === undefined) continue;
      await Setting.findOneAndUpdate(
        { key },
        {
          $set: {
            key,
            value,
            group: "tip_settings",
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );
    }

    return await getTipSettings(req, res, next);
  } catch (error) {
    return next(error);
  }
}

module.exports = {
  getGeneralSettings,
  updateGeneralSettings,
  getCustomizeSettings,
  updateCustomizeSettings,
  getTransportRideSettings,
  updateTransportRideSettings,
  getBidRideSettings,
  updateBidRideSettings,
  getWalletSettings,
  updateWalletSettings,
  getTipSettings,
  updateTipSettings,
};
