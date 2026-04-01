/**
 * Port of Laravel Helpers/helpers.php + zone helpers for Node (Express + Mongo/MySQL).
 * Use camelCase APIs; snake_case aliases match PHP names for drop-in parity.
 */

const coreSync = require("./coreSync");
const distanceMatrix = require("./distanceMatrix");
const currency = require("./currency");
const mapsHttp = require("./mapsHttp");
const settingsDb = require("./settingsDb");
const memoryCache = require("./memoryCache");
const translations = require("./translations");
const laravelStubs = require("./laravelStubs");
const geoDb = require("./geoDb");
const userLocations = require("./userLocations");
const zoneDivision = require("../zoneDivision");
const PointLocation = require("../pointLocation");

/** Laravel-style aliases for map/directions (two overloads in PHP) */
async function getDirections(pickupLat, pickupLng, dropLat, dropLng) {
  return mapsHttp.getDirectionsPolylineOnly(pickupLat, pickupLng, dropLat, dropLng);
}

const all = {
  ...coreSync,
  ...distanceMatrix,
  ...currency,
  ...mapsHttp,
  ...settingsDb,
  ...memoryCache,
  ...translations,
  ...geoDb,
  ...userLocations,
  ...laravelStubs,

  getDirections,
  /** Second PHP overload (distance + duration + points) */
  getDirectionsFull: mapsHttp.getDirectionsDetailed,

  zoneLongitudeArrays: zoneDivision.zoneLongitudeArrays,
  zoneLatitudeArrays: zoneDivision.zoneLatitudeArrays,
  zoneCoordinates: zoneDivision.zoneCoordinates,
  isInPolygon: zoneDivision.isInPolygon,
  numberFormat: zoneDivision.numberFormat,

  zoneDivision,
  PointLocation,
  pointLocationClass: PointLocation,
};

const snakeCaseAliases = {
  starts_with: all.startsWith,
  array_except: all.arrayExcept,
  array_only: all.arrayOnly,
  array_wrap: all.arrayWrap,
  array_has_all: all.arrayHasAll,
  str_random: all.strRandom,
  is_valid_uuid: all.isValidUuid,
  studly_case: all.studlyCase,
  str_is: all.strIs,
  str_limit: all.strLimit,
  is_valid_mobile_number: all.isValidMobileNumber,
  is_valid_email: all.isValidEmail,
  is_valid_city_id: all.isValidCityId,
  is_valid_date: all.isValidDate,
  hash_check: all.hashCheck,
  file_path: all.filePath,
  folder_merge: all.folderMerge,
  limit_value: all.limitValue,
  kilometer_to_miles: all.kilometerToMiles,
  miles_to_km: all.milesToKm,
  distance_between_two_coordinates: all.distanceBetweenTwoCoordinates,
  haversineDistance: all.haversineDistance,
  decode_polyline: all.decodePolyline,
  array_to_object: all.arrayToObject,
  object_to_array: all.objectToArrayFromJsonString,
  structure_for_socket: all.structureForSocket,
  role_middleware: all.roleMiddleware,
  perm_middleware: all.permMiddleware,
  get_relational_custom_filters: all.getRelationalCustomFilters,
  generatePolygonCoordinates: all.generatePolygonCoordinates,
  check_code_format: all.checkCodeFormat,
  model_cache_tag: all.modelCacheTag,
  model_cache_key: all.modelCacheKey,
  is_cache_taggable: all.isCacheTaggable,
  flush_model_cache: all.flushModelCache,
  app_environment: all.appEnvironment,
  app_debug_enabled: all.appDebugEnabled,
  now: all.nowDate,
  to_carbon: all.toCarbon,
  ip: all.ipFromReq,
  hash_generator: all.hashGenerator,
  include_route_files: all.includeRouteFiles,
  get_converted_time: all.getConvertedTime,
  get_converted_date: all.getConvertedDate,
  driver_uuid: all.driverUuid,
  generate_otp: all.generateOtp,

  get_first_element_in_distance_matrix: all.getFirstElementInDistanceMatrix,
  get_duration_text_from_distance_matrix: all.getDurationTextFromDistanceMatrix,
  get_distance_value_from_distance_matrix: all.getDistanceValueFromDistanceMatrix,
  get_duration_value_from_distance_matrix: all.getDurationValueFromDistanceMatrix,
  get_distance_text_from_distance_matrix: all.getDistanceTextFromDistanceMatrix,

  convert_currency_to_usd: all.convertCurrencyToUsd,
  get_and_set_currency_value_using_curreny_layer:
    all.getAndSetCurrencyValueUsingCurrencyLayer,
  get_current_curreny_value: all.getCurrentCurrencyValue,

  get_distance_matrix: all.getDistanceMatrix,
  getDistanceMatrixByOpenstreetMap: all.getDistanceMatrixByOpenstreetMap,
  get_directions_array: all.getDirectionsArray,
  get_line_string: all.getLineString,

  get_map_settings: all.getMapSettings,
  get_payment_settings: all.getPaymentSettings,
  get_firebase_settings: all.getFirebaseSettings,
  get_sms_settings: all.getSmsSettings,
  get_active_sms_settings: all.getActiveSmsSettings,
  get_settings: all.getSettings,
  app_name: all.appName,
  active_languages: all.activeLanguages,
  default_language: all.defaultLanguage,

  custom_trans: all.customTrans,
  custom_remarks_trans: all.customRemarksTrans,
  custom_status_trans: all.customStatusTrans,

  find_peak_zone: all.findPeakZone,
  find_zone: all.findZone,
  find_airport: all.findAirport,

  get_user_locations: all.getUserLocations,
  get_user_location_ids: all.getUserLocationIds,

  zone_longitude_arrays: zoneDivision.zoneLongitudeArrays,
  zone_latitude_arrays: zoneDivision.zoneLatitudeArrays,
  zone_coordinates: zoneDivision.zoneCoordinates,
  is_in_polygon: zoneDivision.isInPolygon,
  number_format: zoneDivision.numberFormat,
};

module.exports = {
  ...all,
  ...snakeCaseAliases,
};
