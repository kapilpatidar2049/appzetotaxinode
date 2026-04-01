const fs = require("fs");
const path = require("path");

const HELPERS_ROOT = path.join(__dirname, "..", "..", "..", "..", "Helpers");

const helpersJsonCache = new Map();

function loadHelpersJson(relativePathFromHelpers) {
  const full = path.join(HELPERS_ROOT, relativePathFromHelpers);
  if (!fs.existsSync(full)) {
    return null;
  }
  try {
    const stat = fs.statSync(full);
    const hit = helpersJsonCache.get(full);
    if (hit && hit.mtimeMs === stat.mtimeMs) {
      return hit.data;
    }
    const data = JSON.parse(fs.readFileSync(full, "utf8"));
    helpersJsonCache.set(full, { mtimeMs: stat.mtimeMs, data });
    return data;
  } catch {
    return null;
  }
}

function loadTimeZones() {
  return loadHelpersJson(path.join("TimeZones", "time_zones.json")) || [];
}

function loadCountries() {
  return loadHelpersJson(path.join("Countries", "countries.json")) || [];
}

function loadCountryCodes() {
  return loadHelpersJson(path.join("Countries", "CountryCodes.json")) || [];
}

module.exports = {
  HELPERS_ROOT,
  loadHelpersJson,
  loadTimeZones,
  loadCountries,
  loadCountryCodes,
};
