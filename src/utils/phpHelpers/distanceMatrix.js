/**
 * Google Distance Matrix API response helpers (Laravel helpers.php parity).
 */

function getFirstElementInDistanceMatrix(distanceMatrix) {
  if (!distanceMatrix || distanceMatrix.status !== "OK") return null;
  const rows = distanceMatrix.rows;
  if (!Array.isArray(rows) || rows.length === 0) return null;
  const row = rows[0];
  const elements = row.elements;
  if (!Array.isArray(elements) || elements.length === 0) return null;
  return elements[0];
}

function getDurationTextFromDistanceMatrix(distanceMatrix) {
  const element = getFirstElementInDistanceMatrix(distanceMatrix);
  if (!element) return null;
  if (element.duration_in_traffic) return element.duration_in_traffic.text;
  if (element.duration) return element.duration.text;
  return null;
}

function getDistanceValueFromDistanceMatrix(distanceMatrix) {
  const element = getFirstElementInDistanceMatrix(distanceMatrix);
  if (!element || !element.distance) return null;
  return parseFloat(element.distance.value, 10);
}

function getDurationValueFromDistanceMatrix(distanceMatrix) {
  const element = getFirstElementInDistanceMatrix(distanceMatrix);
  if (!element) return undefined;
  if (element.duration_in_traffic) return parseInt(element.duration_in_traffic.value, 10);
  if (element.duration) return parseInt(element.duration.value, 10);
  return undefined;
}

function getDistanceTextFromDistanceMatrix(distanceMatrix) {
  const element = getFirstElementInDistanceMatrix(distanceMatrix);
  if (!element || !element.distance) return null;
  return element.distance.text;
}

module.exports = {
  getFirstElementInDistanceMatrix,
  getDurationTextFromDistanceMatrix,
  getDistanceValueFromDistanceMatrix,
  getDurationValueFromDistanceMatrix,
  getDistanceTextFromDistanceMatrix,
};
