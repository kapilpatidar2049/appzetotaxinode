const axios = require("axios");
const fs = require("fs");
const path = require("path");
const { getMapSettings, getSettings } = require("./settingsDb");
const { decodePolyline } = require("./coreSync");

/**
 * Laravel: get_distance_matrix — returns parsed JSON body (axios data object).
 */
async function getDistanceMatrix(pickLat, pickLng, dropLat, dropLng, traffic = false) {
  const key = await getMapSettings("google_map_key");
  if (!key) return null;

  const params = new URLSearchParams({
    units: "imperial",
    origins: `${pickLat},${pickLng}`,
    destinations: `${dropLat},${dropLng}`,
    key: String(key),
  });
  if (traffic) params.set("departure_time", "now");

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`;
  const { data, status } = await axios.get(url, { timeout: 20000 });
  if (status === 200) return data;
  return null;
}

/**
 * OpenStreetMap routing — Laravel getDistanceMatrixByOpenstreetMap
 */
async function getDistanceMatrixByOpenstreetMap(pickLat, pickLng, dropLat, dropLng) {
  const url = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${pickLng},${pickLat};${dropLng},${dropLat}?overview=full&alternatives=true&steps=false`;
  const { data } = await axios.get(url, { timeout: 30000 });
  const route = data && data.routes && data.routes[0];
  if (!route) {
    throw new Error("OSM route not found");
  }

  const distance = route.distance;
  const duration = route.duration;

  return {
    distance_in_meters: distance,
    distance_in_km: Number((distance / 1000).toFixed(1)),
    distance_in_miles: Number((distance / 1609.344).toFixed(1)),
    duration_in_mins: Math.round(duration / 60),
    duration_in_secs: Math.round(duration),
    direction: route.geometry,
  };
}

/**
 * Google Directions — returns plain object (not Express response).
 * First Laravel overload: success + points only.
 */
async function getDirectionsPolylineOnly(pickupLat, pickupLng, dropLat, dropLng) {
  const key = await getMapSettings("google_map_key");
  if (!key) {
    return { success: false, message: "google_map_key not configured" };
  }

  const url = "https://maps.googleapis.com/maps/api/directions/json";
  const { data } = await axios.get(url, {
    params: {
      origin: `${pickupLat},${pickupLng}`,
      destination: `${dropLat},${dropLng}`,
      sensor: false,
      key: String(key),
    },
    timeout: 20000,
  });

  if (data.status !== "OK") {
    const err = data.error_message || data.status;
    return {
      success: false,
      message: `${err} Cannot able to get Polyline from Google Map Api`,
    };
  }

  const points = data.routes[0].overview_polyline.points;
  return { success: true, message: "success", points };
}

/**
 * Laravel get_directions_array — polyline string or error-shaped object.
 */
async function getDirectionsArray(pickupLat, pickupLng, dropLat, dropLng) {
  const key = await getMapSettings("google_map_key");
  if (!key) {
    return { success: false, message: "google_map_key not configured" };
  }

  const url = "https://maps.googleapis.com/maps/api/directions/json";
  const { data } = await axios.get(url, {
    params: {
      origin: `${pickupLat},${pickupLng}`,
      destination: `${dropLat},${dropLng}`,
      sensor: false,
      key: String(key),
    },
    timeout: 20000,
  });

  if (data.status && data.status !== "OK") {
    const err = data.error_message || "Unknown error";
    return {
      success: false,
      message: `${err} Cannot able to get Polyline from Google Map Api`,
    };
  }

  return data.routes[0].overview_polyline.points;
}

/**
 * Second Laravel get_directions overload — uses get_settings for key, returns metrics + points.
 */
async function getDirectionsDetailed(pickupLat, pickupLng, dropLat, dropLng) {
  const key =
    (await getSettings("google_map_key_for_distance_matrix")) ||
    (await getMapSettings("google_map_key_for_distance_matrix")) ||
    (await getMapSettings("google_map_key"));

  if (!key) {
    return { success: false, message: "Map API key not configured" };
  }

  const url = "https://maps.googleapis.com/maps/api/directions/json";
  const { data: directionsData } = await axios.get(url, {
    params: {
      origin: `${pickupLat},${pickupLng}`,
      destination: `${dropLat},${dropLng}`,
      key: String(key),
    },
    timeout: 20000,
  });

  if (directionsData.status !== "OK") {
    const errorMessage = directionsData.error_message || directionsData.status;
    return {
      success: false,
      message: `${errorMessage} Cannot get Polyline from Google Map API`,
    };
  }

  const route = directionsData.routes[0];
  const leg = route.legs[0];
  const distance = leg.distance.value;
  const duration = leg.duration.value;

  return {
    success: true,
    message: "success",
    distance_in_km: Number((distance / 1000).toFixed(1)),
    distance_in_miles: Number((distance / 1609.344).toFixed(1)),
    distance_in_meters: distance,
    duration_in_mins: Math.round(duration / 60),
    duration_in_secs: duration,
    points: route.overview_polyline.points,
  };
}

/**
 * Route polyline as array of [lat, lng] — Laravel get_line_string without MySQL spatial types.
 * Returns GeoJSON-style LineString or null.
 */
async function getLineString(pickupLat, pickupLng, dropLat, dropLng) {
  const mapType = (await getMapSettings("map_type")) || "google_map";

  let polyPoints;

  if (String(mapType) === "google_map") {
    const url = "https://routes.googleapis.com/directions/v2:computeRoutes";
    const apiKey = await getMapSettings("google_map_key_for_distance_matrix");
    if (!apiKey) return null;

    const postData = {
      origin: {
        location: {
          latLng: {
            latitude: Number(pickupLat),
            longitude: Number(pickupLng),
          },
        },
      },
      destination: {
        location: {
          latLng: {
            latitude: Number(dropLat),
            longitude: Number(dropLng),
          },
        },
      },
      travelMode: "DRIVE",
      routingPreference: "TRAFFIC_AWARE",
      computeAlternativeRoutes: false,
      routeModifiers: {
        avoidTolls: false,
        avoidHighways: false,
        avoidFerries: false,
      },
      languageCode: "en-US",
      units: "METRIC",
    };

    const { data, status } = await axios.post(url, postData, {
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        "X-Goog-Api-Key": String(apiKey),
        "X-Goog-FieldMask": "routes.polyline.encodedPolyline",
      },
      validateStatus: () => true,
    });

    if (status !== 200 || !data.routes || !data.routes[0] || !data.routes[0].polyline) {
      return null;
    }

    const encoded = data.routes[0].polyline.encodedPolyline;
    polyPoints = decodePolyline(encoded);
  } else {
    const osmUrl = `https://routing.openstreetmap.de/routed-car/route/v1/driving/${pickupLng},${pickupLat};${dropLng},${dropLat}?overview=simplified&alternatives=false&steps=false`;
    const { data } = await axios.get(osmUrl, { timeout: 30000 });
    if (!data.routes || !data.routes[0] || !data.routes[0].geometry) return null;
    polyPoints = decodePolyline(data.routes[0].geometry);
  }

  if (!polyPoints || polyPoints.length < 2) return null;

  return {
    type: "LineString",
    coordinates: polyPoints.map(([lat, lng]) => [lng, lat]),
  };
}

module.exports = {
  getDistanceMatrix,
  getDistanceMatrixByOpenstreetMap,
  getDirectionsPolylineOnly,
  getDirectionsArray,
  getDirectionsDetailed,
  getLineString,
};
