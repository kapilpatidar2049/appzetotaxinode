function numberFormat(value) {
  return Number(value).toFixed(7);
}

function zoneLongitudeArrays(longitudeJson) {
  const arr = JSON.parse(longitudeJson || "[]");
  const longs = arr.map((p) => p.lng);
  return longs.map(numberFormat).map(Number);
}

function zoneLatitudeArrays(latitudeJson) {
  const arr = JSON.parse(latitudeJson || "[]");
  const lats = arr.map((p) => p.lat);
  return lats.map(numberFormat).map(Number);
}

/** Laravel pointLocation.php zoneCoordinates */
function zoneCoordinates(longitudeZoneValue, latitudeZoneValue) {
  return `${longitudeZoneValue} ${latitudeZoneValue}`;
}

function isInPolygon(pointsPolygon, verticesX, verticesY, longitudeX, latitudeY) {
  let c = false;
  let j = pointsPolygon - 1;

  for (let i = 0; i < pointsPolygon; i++) {
    const cond1 = verticesY[i] > latitudeY !== verticesY[j] > latitudeY;
    const cond2 =
      longitudeX <
      ((verticesX[j] - verticesX[i]) * (latitudeY - verticesY[i])) /
        (verticesY[j] - verticesY[i]) +
        verticesX[i];

    if (cond1 && cond2) {
      c = !c;
    }
    j = i;
  }
  return c;
}

module.exports = {
  numberFormat,
  zoneLongitudeArrays,
  zoneLatitudeArrays,
  zoneCoordinates,
  isInPolygon,
};

