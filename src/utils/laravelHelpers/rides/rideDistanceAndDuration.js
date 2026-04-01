const { getMapSettings } = require("../../phpHelpers/settingsDb");
const {
  getDistanceMatrixByOpenstreetMap,
} = require("../../phpHelpers/mapsHttp");
const {
  getDistanceValueFromDistanceMatrix,
  getDurationValueFromDistanceMatrix,
} = require("../../phpHelpers/distanceMatrix");
const { kilometerToMiles } = require("../../phpHelpers/coreSync");

/**
 * Zone unit: 1 = km, 2 = miles (Laravel zone.unit).
 */
function applyUnit(distanceKm, unit) {
  if (Number(unit) === 2) {
    return kilometerToMiles(distanceKm);
  }
  return distanceKm;
}

/**
 * Sum distance/duration for pickup → stops → drop using OSM.
 * @param {object} opts
 * @param {number} opts.pickLat
 * @param {number} opts.pickLng
 * @param {number} opts.dropLat
 * @param {number} opts.dropLng
 * @param {{ latitude: number, longitude: number }[]} [opts.stops]
 * @param {number} [opts.zoneUnit] 1 km, 2 miles
 */
async function calculateDistanceAndDurationOpenStreet(opts) {
  const {
    pickLat,
    pickLng,
    dropLat,
    dropLng,
    stops = [],
    zoneUnit = 1,
  } = opts;

  let dropoffDistanceMeters = 0;
  let dropoffTimeSeconds = 0;
  let distanceInUnit = 0;

  if (!stops.length) {
    const leg = await getDistanceMatrixByOpenstreetMap(
      pickLat,
      pickLng,
      dropLat,
      dropLng
    );
    dropoffDistanceMeters = leg.distance_in_meters;
    dropoffTimeSeconds = leg.duration_in_secs;
    const km = leg.distance_in_km;
    distanceInUnit += applyUnit(km, zoneUnit);
  } else {
    for (let key = 0; key < stops.length; key++) {
      const stop = stops[key];
      let leg;
      if (key === 0) {
        leg = await getDistanceMatrixByOpenstreetMap(
          pickLat,
          pickLng,
          stop.latitude,
          stop.longitude
        );
      } else {
        const prev = stops[key - 1];
        leg = await getDistanceMatrixByOpenstreetMap(
          prev.latitude,
          prev.longitude,
          stop.latitude,
          stop.longitude
        );
      }
      dropoffDistanceMeters += leg.distance_in_meters;
      dropoffTimeSeconds += leg.duration_in_secs;
      distanceInUnit += applyUnit(leg.distance_in_km, zoneUnit);
    }
    const last = stops[stops.length - 1];
    const finalLeg = await getDistanceMatrixByOpenstreetMap(
      last.latitude,
      last.longitude,
      dropLat,
      dropLng
    );
    dropoffDistanceMeters += finalLeg.distance_in_meters;
    dropoffTimeSeconds += finalLeg.duration_in_secs;
    distanceInUnit += applyUnit(finalLeg.distance_in_km, zoneUnit);
  }

  return {
    dropoff_distance_in_meters: dropoffDistanceMeters,
    dropoff_time_in_seconds: dropoffTimeSeconds,
    distance_in_unit: distanceInUnit,
  };
}

/**
 * Google path: uses cached distance_matrix JSON (PHP: DistanceMatrix table).
 * Node: pass `distanceMatrix` object from DB or call `getDistanceMatrix` first.
 */
function extractFromGoogleDistanceMatrix(distanceMatrix) {
  return {
    dropoff_distance_in_meters: getDistanceValueFromDistanceMatrix(distanceMatrix),
    dropoff_time_in_seconds: getDurationValueFromDistanceMatrix(distanceMatrix),
  };
}

/**
 * Main entry — mirrors RideDistanceAndDurationCalculationHelper flow.
 * Map type `open_street_map` → OSM; else expects `distanceMatrix` (first leg) or
 * implement DB cache in your controller.
 */
async function calculateDistanceAndDurationForARide(opts) {
  const mapType = (await getMapSettings("map_type")) || "google_map";

  if (String(mapType) === "open_street_map") {
    return calculateDistanceAndDurationOpenStreet(opts);
  }

  if (opts.distanceMatrix) {
    const ext = extractFromGoogleDistanceMatrix(opts.distanceMatrix);
    const km = ext.dropoff_distance_in_meters / 1000;
    const zoneUnit = opts.zoneType && opts.zoneType.zone ? opts.zoneType.zone.unit : 1;
    return {
      distance_in_unit: applyUnit(km, zoneUnit),
      dropoff_distance_in_meters: ext.dropoff_distance_in_meters,
      dropoff_time_in_seconds: ext.dropoff_time_in_seconds,
    };
  }

  throw new Error(
    "calculateDistanceAndDurationForARide: provide distanceMatrix for Google map or use open_street_map"
  );
}

module.exports = {
  calculateDistanceAndDurationForARide,
  calculateDistanceAndDurationOpenStreet,
  extractFromGoogleDistanceMatrix,
  applyUnit,
};
