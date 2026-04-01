const ThirdPartySetting = require("../models/ThirdPartySetting");
const Setting = require("../models/Setting");

/**
 * Mirror Laravel helper get_map_settings($key)
 */
async function getMapSetting(key) {
  const doc = await ThirdPartySetting.findOne({ module: "map", key }).lean();
  return doc ? doc.value : null;
}

/**
 * Mirror Laravel helper get_settings($key)
 */
async function getSetting(key) {
  const doc = await Setting.findOne({ key }).lean();
  return doc ? doc.value : null;
}

module.exports = {
  getMapSetting,
  getSetting,
};
