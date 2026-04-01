// Geospatial utilities – distance, polyline, polygon helpers.

const helpers = require("../utils/phpHelpers");

module.exports = {
  // Distances
  kilometerToMiles: helpers.kilometerToMiles,
  milesToKm: helpers.milesToKm,
  distanceBetweenTwoCoordinates: helpers.distanceBetweenTwoCoordinates,
  haversineDistance: helpers.haversineDistance,

  // Polyline
  decodePolyline: helpers.decodePolyline,

  // Zone / polygon helpers (ported from zoneDivision.php + pointLocation.php)
  zoneLongitudeArrays: helpers.zoneLongitudeArrays,
  zoneLatitudeArrays: helpers.zoneLatitudeArrays,
  zoneCoordinates: helpers.zoneCoordinates,
  isInPolygon: helpers.isInPolygon,
  PointLocation: helpers.PointLocation,
};

