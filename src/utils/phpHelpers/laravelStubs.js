/**
 * Laravel container-only helpers — not wired in Express. Export placeholders
 * so imports do not break; replace with real services where needed.
 */

function access() {
  throw new Error(
    "access() is Laravel-only. Use req.user / JWT middleware in Express."
  );
}

function sms() {
  throw new Error("sms() is Laravel-only. Integrate Twilio/etc. in Node.");
}

function smsTemplate() {
  throw new Error("sms_template() is Laravel-only.");
}

function filter() {
  throw new Error("filter() is Laravel-only.");
}

function adminInfo() {
  throw new Error("admin_info() is Laravel-only.");
}

function dbSetting() {
  throw new Error(
    "db_setting() is Laravel-only. Use settingsDb.getSettings() or Setting model."
  );
}

module.exports = {
  access,
  sms,
  smsTemplate,
  filter,
  adminInfo,
  dbSetting,
};
