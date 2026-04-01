const ThirdPartySetting = require("../../models/ThirdPartySetting");
const Setting = require("../../models/Setting");
const Language = require("../../models/Language");

async function thirdPartyValue(module, key) {
  const doc = await ThirdPartySetting.findOne({ module, key }).lean();
  return doc ? doc.value : null;
}

async function settingValue(key) {
  const doc = await Setting.findOne({ key }).lean();
  return doc ? doc.value : null;
}

/** Laravel: get_map_settings */
async function getMapSettings(key) {
  return thirdPartyValue("map", key);
}

/** Laravel: get_payment_settings */
async function getPaymentSettings(key) {
  return thirdPartyValue("payment", key);
}

/** Laravel: get_firebase_settings */
async function getFirebaseSettings(key) {
  return thirdPartyValue("firebase", key);
}

/** Laravel: get_sms_settings */
async function getSmsSettings(key) {
  return thirdPartyValue("sms", key);
}

/** Laravel: get_active_sms_settings */
async function getActiveSmsSettings() {
  const doc = await ThirdPartySetting.findOne({
    module: "sms",
    value: "1",
  })
    .select("key")
    .lean();
  return doc ? doc.key : null;
}

/** Laravel: get_settings (settings table) */
async function getSettings(key) {
  return settingValue(key);
}

/** Laravel: app_name() */
async function appName() {
  const v = await settingValue("app_name");
  return v != null ? String(v) : "";
}

/** Laravel: active_languages() */
async function activeLanguages() {
  return Language.find({ active: true }).sort({ order: 1, name: 1 }).lean();
}

/** Laravel: default_language() */
async function defaultLanguage() {
  return Language.findOne({ is_default: true }).lean();
}

module.exports = {
  getMapSettings,
  getPaymentSettings,
  getFirebaseSettings,
  getSmsSettings,
  getActiveSmsSettings,
  getSettings,
  appName,
  activeLanguages,
  defaultLanguage,
  thirdPartyValue,
  settingValue,
};
