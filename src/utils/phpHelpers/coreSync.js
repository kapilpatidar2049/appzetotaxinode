const crypto = require("crypto");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

// --- String / array (Laravel-style) ---

function startsWith(haystack, needles) {
  if (Array.isArray(needles)) {
    return needles.some((n) => String(haystack).startsWith(n));
  }
  return String(haystack).startsWith(needles);
}

function studlyCase(value) {
  return String(value || "")
    .split(/[-_\s]+/)
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join("");
}

function strIs(pattern, value) {
  const p = String(pattern);
  const v = String(value);
  const parts = p.split("*").map((s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const re = new RegExp(`^${parts.join(".*")}$`, "i");
  return re.test(v);
}

function strLimit(value, limit = 100, end = "...") {
  const s = String(value);
  if (s.length <= limit) return s;
  return s.slice(0, Math.max(0, limit - end.length)) + end;
}

function arrayExcept(obj, keys) {
  const omit = new Set(Array.isArray(keys) ? keys : [keys]);
  return Object.fromEntries(Object.entries(obj).filter(([k]) => !omit.has(k)));
}

function arrayOnly(obj, keys) {
  const pick = new Set(Array.isArray(keys) ? keys : [keys]);
  return Object.fromEntries(Object.entries(obj).filter(([k]) => pick.has(k)));
}

function arrayWrap(value) {
  if (Array.isArray(value)) return value;
  if (value === null || value === undefined) return [];
  return [value];
}

function arrayHasAll(search, haystack) {
  if (!Array.isArray(search) || search.length === 0) return false;
  const set = new Set(haystack);
  return search.every((v) => set.has(v));
}

function uuid() {
  return crypto.randomUUID();
}

function isValidUuid(value) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
    String(value)
  );
}

function strRandom(length = 16) {
  return crypto
    .randomBytes(Math.ceil(length / 2))
    .toString("hex")
    .slice(0, length);
}

/** Laravel generate_otp — numeric OTP */
function generateOtp(length = 6) {
  const len = Math.min(9, Math.max(4, length == null ? 6 : length));
  const max = 10 ** len;
  const n = crypto.randomInt(0, max);
  return String(n).padStart(len, "0");
}

function isValidMobileNumber(mobile) {
  return /^[0-9]+$/.test(String(mobile));
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());
}

/** Mongo-friendly city id check */
function isValidCityId(cityId) {
  return mongoose.Types.ObjectId.isValid(String(cityId));
}

/** @returns {boolean|Date} */
function isValidDate(date, returnDate = true) {
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return false;
  return returnDate ? d : true;
}

async function hashCheck(plain, hashedValue) {
  return bcrypt.compare(String(plain), String(hashedValue));
}

function filePath(basePath, filename, folder = null) {
  const base = String(basePath).replace(/\/+$/, "");
  if (folder) {
    return `${base}/${String(folder).replace(/^\/+|\/+$/g, "")}/${filename}`;
  }
  return `${base}/${filename}`;
}

function folderMerge(...folders) {
  return folders.reduce((result, folder) => {
    if (!folder) return result;
    return result + String(folder).replace(/^\/+|\/+$/g, "") + "/";
  }, "");
}

function limitValue(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function kilometerToMiles(km) {
  return km * 0.621371;
}

function milesToKm(miles) {
  return miles * 1.60934;
}

function distanceBetweenTwoCoordinates(lat1, lon1, lat2, lon2, unit = "K") {
  const lat1Num = Number(lat1);
  const lon1Num = Number(lon1);
  const lat2Num = Number(lat2);
  const lon2Num = Number(lon2);

  if (lat1Num === lat2Num && lon1Num === lon2Num) {
    return 0;
  }

  const theta = lon1Num - lon2Num;
  let dist =
    Math.sin(deg2rad(lat1Num)) * Math.sin(deg2rad(lat2Num)) +
    Math.cos(deg2rad(lat1Num)) *
      Math.cos(deg2rad(lat2Num)) *
      Math.cos(deg2rad(theta));

  dist = Math.acos(dist);
  dist = rad2deg(dist);
  const miles = dist * 60 * 1.1515;
  const u = String(unit || "K").toUpperCase();

  if (u === "K") {
    return miles * 1.609344;
  }
  if (u === "M") {
    return miles * 0.8684;
  }
  return miles;
}

function deg2rad(deg) {
  return (deg * Math.PI) / 180.0;
}

function rad2deg(rad) {
  return (rad * 180.0) / Math.PI;
}

function haversineDistance(point1, point2) {
  const [lat1, lng1] = point1.map(Number);
  const [lat2, lng2] = point2.map(Number);

  const earthRadius = 6371000;
  const latDelta = deg2rad(lat2 - lat1);
  const lngDelta = deg2rad(lng2 - lng1);

  const a =
    Math.sin(latDelta / 2) ** 2 +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(lngDelta / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return earthRadius * c;
}

function decodePolyline(polyline) {
  if (!polyline || typeof polyline !== "string") return [];

  const points = [];
  let index = 0;
  const len = polyline.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b;
    let shift = 0;
    let result = 0;

    do {
      b = polyline.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlat = (result & 1) ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;

    do {
      b = polyline.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);

    const dlng = (result & 1) ? ~(result >> 1) : result >> 1;
    lng += dlng;

    points.push([lat / 1e5, lng / 1e5]);
  }

  return points;
}

function arrayToObject(array, recursive = true) {
  if (!recursive) {
    return Object.assign({}, array);
  }
  return JSON.parse(JSON.stringify(array));
}

/** Laravel object_to_array — parses JSON string to object/value */
function objectToArrayFromJsonString(string) {
  if (typeof string !== "string") return null;
  try {
    const contents = Buffer.from(string, "utf8").toString("utf8");
    return JSON.parse(contents);
  } catch {
    return null;
  }
}

function structureForSocket(id, userType, message, event) {
  return {
    id,
    user_type: userType,
    message,
    event,
  };
}

function roleMiddleware(roles, requireAll = false, middlewareName = "role") {
  const string = `${middlewareName}:${arrayWrap(roles).join("|")}`;
  return requireAll ? `${string},true` : string;
}

function permMiddleware(permissions, requireAll = false, middlewareName = "permission") {
  const string = `${middlewareName}:${arrayWrap(permissions).join("|")}`;
  return requireAll ? `${string},true` : string;
}

function getRelationalCustomFilters(value, relationalName, columnName, where = "where") {
  return {
    value,
    relational_name: relationalName,
    column_name: columnName,
    operator: where,
  };
}

function generatePolygonCoordinates(centerLat, centerLon, radius, numPoints) {
  const coordinates = [];
  for (let i = 0; i < numPoints; i++) {
    const angle = deg2rad(i * (360 / numPoints));
    const x = centerLon + (radius / 111.32) * Math.cos(angle);
    const y = centerLat + (radius / 111.32) * Math.sin(angle);
    coordinates.push({ latitude: y, longitude: x });
  }
  return coordinates;
}

function checkCodeFormat(code) {
  const ok = /^([a-f0-9]{8})-(([a-f0-9]{4})-){3}([a-f0-9]{12})$/i.test(String(code));
  if (!ok) {
    return { success: false, message: "Invalid Purchase Code" };
  }
  return { success: true };
}

function modelCacheTag(model, additionalTag = null) {
  const collectionName =
    model && model.collection && model.collection.name
      ? model.collection.name
      : "model";
  const tag = `model_${collectionName}`;
  if (additionalTag && typeof additionalTag === "string") {
    return [tag, additionalTag];
  }
  return tag;
}

function modelCacheKey(model) {
  const id = model && model._id != null ? model._id : model && model.id;
  const collectionName =
    model && model.collection && model.collection.name
      ? model.collection.name
      : "model";
  return `model_${collectionName}_${id}`;
}

function isCacheTaggable(closure) {
  return closure ? closure() : false;
}

function flushModelCache() {
  return false;
}

function appEnvironment(nodeEnv, ...args) {
  const env = process.env.NODE_ENV || "development";
  if (args.length === 0) return env;
  return args.includes(env);
}

function appDebugEnabled() {
  return process.env.NODE_ENV === "development" || process.env.APP_DEBUG === "true";
}

function nowDate(tz = undefined) {
  return tz ? new Date(new Date().toLocaleString("en-US", { timeZone: tz })) : new Date();
}

function toCarbon(time) {
  return new Date(time);
}

function ipFromReq(req) {
  if (!req || !req.headers) return "";
  const xff = req.headers["x-forwarded-for"];
  if (typeof xff === "string" && xff.length) return xff.split(",")[0].trim();
  return req.socket && req.socket.remoteAddress ? req.socket.remoteAddress : "";
}

/** Laravel hash_generator — returns random token string or factory */
function hashGenerator(length, prefix, suffix, extension) {
  if (arguments.length === 0) {
    return {
      make: (l, p, s, e) => hashGenerator(l, p, s, e),
    };
  }
  const h = strRandom(length || 16);
  return `${prefix || ""}${h}${suffix || ""}${extension || ""}`;
}

/** No-op: Laravel-only route loader */
function includeRouteFiles() {
  /* Express uses require() / router modules instead */
}

/** Laravel get_converted_time — approximate Carbon format */
function getConvertedTime(time, timezone) {
  const d = new Date(time);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return d.toLocaleString("en-GB", {
      timeZone: timezone || "UTC",
      day: "numeric",
      month: "short",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  } catch {
    return d.toISOString();
  }
}

/** Laravel get_converted_date */
function getConvertedDate(time, timezone) {
  const d = new Date(time);
  if (Number.isNaN(d.getTime())) return "";
  try {
    return d.toLocaleDateString("en-GB", {
      timeZone: timezone || "UTC",
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  } catch {
    return d.toISOString().slice(0, 10);
  }
}

/** Unique short id for driver (Laravel driver_uuid) — add DB uniqueness when schema has field */
function driverUuid() {
  return strRandom(10);
}

module.exports = {
  startsWith,
  studlyCase,
  strIs,
  strLimit,
  arrayExcept,
  arrayOnly,
  arrayWrap,
  arrayHasAll,
  uuid,
  isValidUuid,
  strRandom,
  generateOtp,
  isValidMobileNumber,
  isValidEmail,
  isValidCityId,
  isValidDate,
  hashCheck,
  filePath,
  folderMerge,
  limitValue,
  kilometerToMiles,
  milesToKm,
  distanceBetweenTwoCoordinates,
  deg2rad,
  rad2deg,
  haversineDistance,
  decodePolyline,
  arrayToObject,
  objectToArrayFromJsonString,
  structureForSocket,
  roleMiddleware,
  permMiddleware,
  getRelationalCustomFilters,
  generatePolygonCoordinates,
  checkCodeFormat,
  modelCacheTag,
  modelCacheKey,
  isCacheTaggable,
  flushModelCache,
  appEnvironment,
  appDebugEnabled,
  nowDate,
  toCarbon,
  ipFromReq,
  hashGenerator,
  includeRouteFiles,
  getConvertedTime,
  getConvertedDate,
  driverUuid,
};
