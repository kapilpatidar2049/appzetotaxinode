const fs = require("fs");
const path = require("path");
const PDFDocument = require("pdfkit");
const mongoose = require("mongoose");
const User = require("../models/User");
const Owner = require("../models/Owner");
const Driver = require("../models/Driver");
const DriverVehicleType = require("../models/DriverVehicleType");
const ServiceLocation = require("../models/ServiceLocation");
const FavouriteLocation = require("../models/FavouriteLocation");
const UserBankInfo = require("../models/UserBankInfo");
const Request = require("../models/Request");
const RequestRating = require("../models/RequestRating");
const Setting = require("../models/Setting");
const Banner = require("../models/Banner");
const Sos = require("../models/Sos");
const UserWallet = require("../models/UserWallet");
const Notification = require("../models/Notification");
const Country = require("../models/Country");

// Helper: load current user from DB by id
async function loadUserById(id) {
  
    return User.findById(id).lean();
  
}

function settingValue(map, key, fallback = null) {
  const v = map.get(key);
  return v == null ? fallback : v;
}

function boolFromSetting(v, fallback = false) {
  if (v == null) return fallback;
  if (typeof v === "boolean") return v;
  const s = String(v).toLowerCase();
  return s === "1" || s === "true" || s === "yes";
}

function ordinal(n) {
  const j = n % 10;
  const k = n % 100;
  if (j === 1 && k !== 11) return `${n}st`;
  if (j === 2 && k !== 12) return `${n}nd`;
  if (j === 3 && k !== 13) return `${n}rd`;
  return `${n}th`;
}

function formatAppDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const day = ordinal(d.getDate());
  const mon = months[d.getMonth()];
  let h = d.getHours();
  const m = String(d.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  h = h % 12 || 12;
  return `${day} ${mon} ${String(h).padStart(2, "0")}:${m} ${ampm}`;
}

// GET /api/v1/user/  (me)
async function me(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await loadUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Ensure referral code exists (similar to Laravel logic)
    if (!user.refferal_code) {
      const newCode = Math.random().toString(36).substring(2, 8).toUpperCase();
      await User.updateOne({ _id: userId }, { $set: { refferal_code: newCode } });
      user.refferal_code = newCode;
    }

    const [
      country,
      wallet,
      notificationsCount,
      completedRideCount,
      ongoingRide,
      favourites,
      sosData,
      banners,
      userRatings,
      settings,
    ] = await Promise.all([
      user.country ? Country.findById(user.country).lean() : null,
      UserWallet.findOne({ user_id: userId }).lean(),
      Notification.countDocuments({ user_id: userId, is_read: false }),
      Request.countDocuments({ user_id: userId, is_completed: true }),
      Request.findOne({ user_id: userId, is_completed: false, is_cancelled: false })
        .sort({ createdAt: -1 })
        .lean(),
      FavouriteLocation.find({ user_id: userId }).sort({ createdAt: -1 }).lean(),
      Sos.find({ user_id: userId, active: true }).sort({ createdAt: -1 }).lean(),
      Banner.find({ active: true }).sort({ createdAt: -1 }).lean(),
      RequestRating.aggregate([
        { $match: { user_id: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, avg: { $avg: "$rating" }, count: { $sum: 1 } } },
      ]),
      Setting.find({}).lean(),
    ]);

    const settingMap = new Map(settings.map((s) => [s.key, s.value]));
    const currencyCode = country?.currency_code || settingValue(settingMap, "currency_code", "INR");
    const currencySymbol = country?.currency_symbol || settingValue(settingMap, "currency_symbol", "₹");
    const referralAmount = settingValue(settingMap, "referral_amount", 30);
    const userRating = userRatings[0]?.avg ? Number(userRatings[0].avg.toFixed(2)) : 0;
    const noOfRatings = userRatings[0]?.count || 0;

    const walletData = wallet
      ? {
          id: wallet._id,
          user_id: wallet.user_id,
          amount_added: Number(wallet.amount_added || 0),
          amount_balance: Number(wallet.amount_balance || 0),
          amount_balance_locked: 0,
          amount_spent: 0,
          referral_bonus_locked: 0,
          unlocked_referral_amount: 0,
          withdrawable_referral_balance: 0,
          currency_symbol: currencySymbol,
          currency_code: currencyCode,
          created_at: formatAppDate(wallet.createdAt),
          updated_at: formatAppDate(wallet.updatedAt),
        }
      : null;

    const bannerData = banners.map((b) => ({
      image: b.image,
      image_url: b.external_link || null,
      active: b.active ? 1 : 0,
    }));

    return res.json({
      success: true,
      data: {
        id: user._id || user.id,
        name: user.name,
        gender: user.gender || null,
        last_name: user.last_name || null,
        username: null,
        email: user.email,
        mobile: user.mobile,
        profile_picture:
          user.profile_picture || "https://zepido.com/assets/images/Male_default_image.png",
        active: user.active ? 1 : 0,
        email_confirmed: user.email_confirmed ? 1 : 0,
        mobile_confirmed: user.mobile_confirmed ? 1 : 0,
        last_known_ip: null,
        last_login_at: null,
        rating: userRating,
        no_of_ratings: noOfRatings,
        refferal_code: user.refferal_code,
        currency_code: currencyCode,
        currency_symbol: currencySymbol,
        currency_pointer: settingValue(settingMap, "currency_pointer", "ltr"),
        country_code: country?.code || null,
        show_rental_ride: boolFromSetting(settingValue(settingMap, "show_rental_ride", "1"), true),
        is_delivery_app: boolFromSetting(settingValue(settingMap, "is_delivery_app", "0"), false),
        fcm_token: user.fcm_token || null,
        show_ride_later_feature: boolFromSetting(
          settingValue(settingMap, "show_ride_later_feature", "1"),
          true
        ),
        zone_id: settingValue(settingMap, "zone_id", null),
        authorization_code: null,
        enable_support_ticket_feature: String(
          settingValue(settingMap, "enable_support_ticket_feature", "0")
        ),
        android_app: settingValue(settingMap, "android_user_app_link", null),
        ios_app: settingValue(settingMap, "ios_user_app_link", null),
        enable_modules_for_applications: String(
          settingValue(settingMap, "enable_modules_for_applications", "both")
        ),
        contact_us_mobile1: settingValue(settingMap, "contact_us_mobile1", null),
        contact_us_mobile2: settingValue(settingMap, "contact_us_mobile2", null),
        contact_us_link: settingValue(settingMap, "contact_us_link", null),
        show_wallet_money_transfer_feature_on_mobile_app: String(
          settingValue(settingMap, "show_wallet_money_transfer_feature_on_mobile_app", "1")
        ),
        show_bank_info_feature_on_mobile_app: String(
          settingValue(settingMap, "show_bank_info_feature_on_mobile_app", "1")
        ),
        show_wallet_feature_on_mobile_app: String(
          settingValue(settingMap, "show_wallet_feature_on_mobile_app", "1")
        ),
        show_only_total_amount: String(settingValue(settingMap, "show_only_total_amount", "1")),
        contact_booking_number: settingValue(settingMap, "contact_booking_number", null),
        distance_unit: settingValue(settingMap, "distance_unit", "km"),
        show_outstation_ride_feature: String(
          settingValue(settingMap, "show_outstation_ride_feature", "1")
        ),
        show_taxi_outstation_ride_feature: String(
          settingValue(settingMap, "show_taxi_outstation_ride_feature", "0")
        ),
        show_delivery_outstation_ride_feature: String(
          settingValue(settingMap, "show_delivery_outstation_ride_feature", "0")
        ),
        enable_outstation_round_trip_feature: String(
          settingValue(settingMap, "enable_outstation_round_trip_feature", "0")
        ),
        notifications_count: notificationsCount,
        show_taxi_rental_ride: boolFromSetting(
          settingValue(settingMap, "show_taxi_rental_ride", "1"),
          true
        ),
        show_delivery_rental_ride: boolFromSetting(
          settingValue(settingMap, "show_delivery_rental_ride", "1"),
          true
        ),
        show_card_payment_feature: boolFromSetting(
          settingValue(settingMap, "show_card_payment_feature", "1"),
          true
        ),
        referral_comission_string: `Refer a friend and earn${currencySymbol}${referralAmount}`,
        user_can_make_a_ride_after_x_miniutes: String(
          settingValue(settingMap, "user_can_make_a_ride_after_x_miniutes", "30")
        ),
        maximum_time_for_find_drivers_for_regular_ride: Number(
          settingValue(settingMap, "maximum_time_for_find_drivers_for_regular_ride", 300)
        ),
        maximum_time_for_find_drivers_for_bitting_ride: String(
          settingValue(settingMap, "maximum_time_for_find_drivers_for_bitting_ride", "30")
        ),
        enable_pet_preference_for_user: String(
          settingValue(settingMap, "enable_pet_preference_for_user", "0")
        ),
        enable_luggage_preference_for_user: String(
          settingValue(settingMap, "enable_luggage_preference_for_user", "1")
        ),
        bidding_amount_increase_or_decrease: String(
          settingValue(settingMap, "bidding_amount_increase_or_decrease", "10")
        ),
        show_ride_without_destination: String(
          settingValue(settingMap, "show_ride_without_destination", "1")
        ),
        enable_country_restrict_on_map: String(
          settingValue(settingMap, "enable_country_restrict_on_map", "0")
        ),
        enable_map_appearance_change_on_mobile_app: String(
          settingValue(settingMap, "enable_map_appearance_change_on_mobile_app", "0")
        ),
        enable_multiple_ride_feature: String(
          settingValue(settingMap, "enable_multiple_ride_feature", "1")
        ),
        conversation_id: "",
        map_type: user.map_type || "google_map",
        has_ongoing_ride: Boolean(ongoingRide),
        completed_ride_count: completedRideCount,
        sos: { data: sosData || [] },
        bannerImage: { data: bannerData },
        wallet: { data: walletData },
        onTripRequest: ongoingRide || null,
        metaRequest: null,
        favouriteLocations: { data: favourites || [] },
        laterMetaRequest: null,
      },
    });
  } catch (err) {
    console.error("Error in user.me:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

// POST /api/v1/user/update-my-lang
async function updateMyLanguage(req, res) {
  try {
    const userId = req.user && req.user.id;
    const { lang } = req.body || {};

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!lang) {
      return res
        .status(422)
        .json({ success: false, message: "lang is required" });
    }

    
      await User.updateOne({ _id: userId }, { $set: { lang } });
    

    return res.json({ success: true, message: "success" });
  } catch (err) {
    console.error("Error in user.updateMyLanguage:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

// POST /api/v1/user/update-location
async function updateLocation(req, res) {
  try {
    const userId = req.user && req.user.id;
    const { lat, lng } = req.body || {};

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (lat == null || lng == null) {
      return res.status(422).json({
        success: false,
        message: "lat and lng are required",
      });
    }

    
      await User.updateOne({ _id: userId }, { $set: { current_lat: lat, current_lng: lng } });
    

    return res.json({ success: true, message: "success" });
  } catch (err) {
    console.error("Error in user.updateLocation:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

// POST /api/v1/user/profile
async function updateProfile(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const { name, email, last_name, mobile, gender, fcm_token, country, map_type } =
      req.body || {};

    const updates = {};

    if (name != null) updates.name = name;
    if (last_name != null) updates.last_name = last_name;
    if (gender != null) updates.gender = gender;
    if (fcm_token != null) updates.fcm_token = fcm_token;
    if (map_type != null) updates.map_type = map_type;

    // Simple email/mobile updates with uniqueness checks (user role only)
    if (mobile) {
      
        const existing = await User.findOne({ mobile, _id: { $ne: userId } }).lean();
        if (existing) {
          return res.status(422).json({
            success: false,
            message: "Provided mobile has already been taken",
          });
        }
      
      updates.mobile = mobile;
    }

    if (email) {
      
        const existing = await User.findOne({ email, _id: { $ne: userId } }).lean();
        if (existing) {
          return res.status(422).json({
            success: false,
            message: "Provided email has already been taken",
          });
        }
      
      updates.email = email;
    }

    if (country != null) {
      updates.country = country;
    }

    if (Object.keys(updates).length === 0) {
      return res.json({ success: true, message: "nothing to update" });
    }

    
      await User.updateOne({ _id: userId }, { $set: updates });
    

    const updated = await loadUserById(userId);

    return res.json({
      success: true,
      message: "success",
      data: {
        id: updated.id,
        name: updated.name,
        email: updated.email,
        mobile: updated.mobile,
        gender: updated.gender,
        country: updated.country,
        map_type: updated.map_type,
      },
    });
  } catch (err) {
    console.error("Error in user.updateProfile:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

// POST /api/v1/user/driver-profile
async function updateDriverProfile(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      name,
      email,
      last_name,
      mobile,
      gender,
      country,
      map_type,
      fcm_token,
      service_location_id,
      car_make,
      car_model,
      car_color,
      car_number,
      vehicle_year,
      custom_make,
      custom_model,
      transport_type,
      vehicle_type,
      sub_vehicle_type,
      company_name,
      address,
      postal_code,
      city,
      tax_number,
      no_of_vehicles,
    } = req.body || {};

    const user = await User.findById(userId).lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const owner = await Owner.findOne({ user_id: userId }).lean();
    const isOwner = Boolean(owner);

    if (mobile) {
      const mobileExists = await User.findOne({ mobile, _id: { $ne: userId } }).lean();
      if (mobileExists) {
        return res.status(422).json({
          success: false,
          message: "Provided mobile has already been taken",
        });
      }
    }
    if (email) {
      const emailExists = await User.findOne({ email, _id: { $ne: userId } }).lean();
      if (emailExists) {
        return res.status(422).json({
          success: false,
          message: "Provided email has already been taken",
        });
      }
    }

    const userUpdates = {};
    if (name != null) userUpdates.name = name;
    if (last_name != null) userUpdates.last_name = last_name;
    if (email != null) userUpdates.email = email;
    if (mobile != null) userUpdates.mobile = mobile;
    if (gender != null) userUpdates.gender = gender;
    if (map_type != null) userUpdates.map_type = map_type;
    if (fcm_token != null) userUpdates.fcm_token = fcm_token;
    if (country != null) userUpdates.country = country;

    if (service_location_id != null) {
      const sl = await ServiceLocation.findById(service_location_id).select("timezone").lean();
      if (sl) userUpdates.timezone = sl.timezone || null;
    }

    if (Object.keys(userUpdates).length) {
      await User.updateOne({ _id: userId }, { $set: userUpdates });
    }

    if (!isOwner) {
      const driver = await Driver.findOne({ user_id: userId }).lean();
      if (!driver) {
        return res.status(404).json({ success: false, message: "Driver profile not found" });
      }

      const driverUpdates = {};
      if (car_make != null) driverUpdates.car_make = car_make;
      if (car_model != null) driverUpdates.car_model = car_model;
      if (car_color != null) driverUpdates.car_color = car_color;
      if (car_number != null) driverUpdates.car_number = car_number;
      if (vehicle_year != null) driverUpdates.vehicle_year = vehicle_year;
      if (custom_make != null) driverUpdates.custom_make = custom_make;
      if (custom_model != null) driverUpdates.custom_model = custom_model;
      if (transport_type != null) driverUpdates.transport_type = transport_type;
      if (mobile != null) driverUpdates.mobile = mobile;
      if (email != null) driverUpdates.email = email;
      if (name != null) driverUpdates.name = name;
      if (gender != null) driverUpdates.gender = gender;
      if (service_location_id != null) {
        const sid = String(service_location_id);
        driverUpdates.service_location_id = mongoose.Types.ObjectId.isValid(sid)
          ? new mongoose.Types.ObjectId(sid)
          : service_location_id;
      }
      driverUpdates.reason = null;

      const driverOid = driver._id;

      if (vehicle_type != null) {
        await DriverVehicleType.deleteMany({ driver_id: driverOid });
        const vt = String(vehicle_type);
        if (mongoose.Types.ObjectId.isValid(vt)) {
          await DriverVehicleType.create({
            driver_id: driverOid,
            vehicle_type_id: new mongoose.Types.ObjectId(vt),
          });
        }
        driverUpdates.is_subscribed = false;
      }

      if (
        vehicle_type == null &&
        Array.isArray(sub_vehicle_type) &&
        sub_vehicle_type.length > 0
      ) {
        await DriverVehicleType.deleteMany({ driver_id: driverOid });
        const unique = [...new Set(sub_vehicle_type.map((x) => String(x)))];
        for (const sid of unique) {
          if (mongoose.Types.ObjectId.isValid(sid)) {
            await DriverVehicleType.create({
              driver_id: driverOid,
              vehicle_type_id: new mongoose.Types.ObjectId(sid),
            });
          }
        }
      }

      if (Object.keys(driverUpdates).length) {
        await Driver.updateOne({ _id: driverOid }, { $set: driverUpdates });
      }

      const updated = await Driver.findById(driverOid).lean();
      return res.json({
        success: true,
        message: "success",
        data: updated || null,
      });
    }

    const ownerUpdates = {};
    if (name != null) ownerUpdates.owner_name = name;
    if (service_location_id != null) {
      const sid = String(service_location_id);
      ownerUpdates.service_location_id = mongoose.Types.ObjectId.isValid(sid)
        ? new mongoose.Types.ObjectId(sid)
        : service_location_id;
    }
    if (company_name != null) ownerUpdates.company_name = company_name;
    if (address != null) ownerUpdates.address = address;
    if (postal_code != null) ownerUpdates.postal_code = postal_code;
    if (city != null) ownerUpdates.city = city;
    if (tax_number != null) ownerUpdates.tax_number = tax_number;
    if (no_of_vehicles != null) ownerUpdates.no_of_vehicles = no_of_vehicles;
    if (email != null) ownerUpdates.email = email;
    if (transport_type != null) ownerUpdates.transport_type = transport_type;

    if (Object.keys(ownerUpdates).length) {
      await Owner.updateOne({ _id: owner._id }, { $set: ownerUpdates });
    }

    const updatedOwner = await Owner.findById(owner._id).lean();
    return res.json({
      success: true,
      message: "success",
      data: updatedOwner || null,
    });
  } catch (err) {
    console.error("Error in user.updateDriverProfile:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// Favourite locations helpers

// POST /api/v1/user/add-favourite-location
async function addFavouriteLocation(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      pick_lat,
      pick_lng,
      drop_lat,
      drop_lng,
      pick_address,
      drop_address,
      address_name,
      landmark,
    } = req.body || {};

    if (!pick_lat || !pick_lng || !pick_address || !address_name) {
      return res.status(422).json({
        success: false,
        message: "pick_lat, pick_lng, pick_address and address_name are required",
      });
    }

    const count = await FavouriteLocation.countDocuments({ user_id: userId });
    if (count >= 4) {
      return res.status(422).json({
        success: false,
        message: "You have reached your limits",
      });
    }

    
      await FavouriteLocation.create({
        user_id: userId,
        pick_lat,
        pick_lng,
        drop_lat: drop_lat || null,
        drop_lng: drop_lng || null,
        pick_address,
        drop_address: drop_address || null,
        address_name,
        landmark: landmark || null,
      });
    

    return res.json({
      success: true,
      message: "address added successfully",
    });
  } catch (err) {
    console.error("Error in user.addFavouriteLocation:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

// GET /api/v1/user/list-favourite-location
async function favouriteLocationList(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const locations = await FavouriteLocation.find({ user_id: userId })
      .sort({ createdAt: -1 })
      .lean();

    return res.json({
      success: true,
      message: "address listed successfully",
      data: locations,
    });
  } catch (err) {
    console.error("Error in user.favouriteLocationList:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

// GET /api/v1/user/delete-favourite-location/:id
async function deleteFavouriteLocation(req, res) {
  try {
    const userId = req.user && req.user.id;
    const { favourite_location } = req.params;

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    
      await FavouriteLocation.deleteOne({ _id: favourite_location, user_id: userId });
    

    return res.json({
      success: true,
      message: "favorite location deleted successfully",
    });
  } catch (err) {
    console.error("Error in user.deleteFavouriteLocation:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

// Bank info

// POST /api/v1/user/update-bank-info
async function updateBankInfo(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const {
      account_name,
      account_no,
      bank_code,
      bank_name,
      ifsc_code,
      other_details,
    } = req.body || {};

    const payload = {
      account_holder_name: account_name || null,
      account_number: account_no || null,
      routing_number: bank_code || null,
      bank_name: bank_name || null,
      ifsc_code: ifsc_code || null,
      other_details: other_details || null,
    };

    
      await UserBankInfo.findOneAndUpdate(
        { user_id: userId },
        { $set: payload },
        { upsert: true, new: true }
      );
    

    return res.json({
      success: true,
      message: "bank info updated successfully",
    });
  } catch (err) {
    console.error("Error in user.updateBankInfo:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

// GET /api/v1/user/get-bank-info
async function getBankInfo(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const bankInfo = await UserBankInfo.findOne({ user_id: userId }).lean();

    return res.json({
      success: true,
      message: "bank info listed successfully",
      data: bankInfo,
    });
  } catch (err) {
    console.error("Error in user.getBankInfo:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

// POST /api/v1/user/delete-user-account
async function userDeleteAccount(req, res) {
  try {
    const userId = req.user && req.user.id;
    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const user = await loadUserById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user.is_deleted_at) {
      return res.status(422).json({
        success: false,
        message: "Your Account Delete operation is Processing",
      });
    }

    
      await User.updateOne({ _id: userId }, { $set: { is_deleted_at: new Date(), active: false } });
    

    return res.json({
      success: true,
      message: "success",
    });
  } catch (err) {
    console.error("Error in user.userDeleteAccount:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
}

// GET /api/v1/user/download-invoice/:requestId
async function downloadInvoice(req, res) {
  try {
    const userId = req.user && req.user.id;
    const { requestId } = req.params;
    const { invoice_type } = req.query || {};

    if (!userId) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    if (!requestId) {
      return res
        .status(422)
        .json({ success: false, message: "requestId is required" });
    }

    // Basic ownership/visibility check: ensure the request belongs to the user (or at least exists)
    let requestRow = null;
    
      requestRow = await Request.findOne({ _id: requestId, user_id: userId }).lean();
    

    if (!requestRow) {
      return res
        .status(404)
        .json({ success: false, message: "Request not found" });
    }

    // Very minimal invoice data; for full parity we'd join additional tables.
    const invoiceData = {
      id: requestRow._id || requestRow.id,
      booking_id: requestRow.request_number || requestRow._id || requestRow.id,
      user_id: requestRow.user_id,
      driver_id: requestRow.driver_id,
      total: requestRow.total || requestRow.total_amount || 0,
      created_at: requestRow.created_at,
      completed_at: requestRow.completed_at,
    };

    const projectRoot = path.join(__dirname, "..", "..", "..");
    const invoicesDir = path.join(projectRoot, "storage", "invoices");

    if (!fs.existsSync(invoicesDir)) {
      fs.mkdirSync(invoicesDir, { recursive: true });
    }

    const type =
      invoice_type === "driver"
        ? "driver_invoice"
        : "invoice";
    const fileName = `${type}_${requestId}.pdf`;
    const filePath = path.join(invoicesDir, fileName);

    // Generate a very simple PDF invoice
    await new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: "A4", margin: 50 });
        const stream = fs.createWriteStream(filePath);

        stream.on("finish", resolve);
        stream.on("error", reject);

        doc.pipe(stream);

        doc.fontSize(20).text("Trip Invoice", { align: "center" });
        doc.moveDown();
        doc.fontSize(12).text(`Invoice ID: ${invoiceData.id}`);
        doc.text(`Booking ID: ${invoiceData.booking_id}`);
        doc.text(`User ID: ${invoiceData.user_id}`);
        if (invoiceData.driver_id) {
          doc.text(`Driver ID: ${invoiceData.driver_id}`);
        }
        doc.text(`Total: ${invoiceData.total}`);
        doc.text(`Created at: ${invoiceData.created_at}`);
        if (invoiceData.completed_at) {
          doc.text(`Completed at: ${invoiceData.completed_at}`);
        }

        doc.end();
      } catch (err) {
        reject(err);
      }
    });

    const baseUrl =
      process.env.ASSET_URL ||
      process.env.APP_URL ||
      "";

    const invoiceUrl = `${baseUrl.replace(/\/$/, "")}/storage/invoices/${fileName}`;

    return res.json({
      success: true,
      message: "Invoice Downloaded Successfully",
      invoice_url: invoiceUrl,
    });
  } catch (err) {
    console.error("Error in user.downloadInvoice:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to generate invoice",
    });
  }
}

module.exports = {
  me,
  updateMyLanguage,
  updateLocation,
  updateProfile,
  updateDriverProfile,
  addFavouriteLocation,
  favouriteLocationList,
  deleteFavouriteLocation,
  updateBankInfo,
  getBankInfo,
  userDeleteAccount,
   downloadInvoice,
};

