// Ride-related helpers – distance/duration, no-driver-found, etc.

const { rides, noDriverFound } = require("../utils/laravelHelpers");

module.exports = {
  // Distance / duration helpers
  calculateDistanceAndDurationForARide:
    rides.calculateDistanceAndDurationForARide,
  calculateDistanceAndDurationOpenStreet:
    rides.calculateDistanceAndDurationOpenStreet,
  extractFromGoogleDistanceMatrix: rides.extractFromGoogleDistanceMatrix,

  // No driver found flow (cancel + Firebase + push)
  noDriverFound,
};

