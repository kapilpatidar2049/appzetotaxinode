const Setting = require("../models/Setting");

function ok(res, data = null, message = "success") {
  return res.json({ success: true, message, data });
}

function settingString(key) {
  return Setting.findOne({ key }).lean().then((doc) => {
    if (!doc || doc.value == null) return "";
    if (typeof doc.value === "string") return doc.value;
    if (typeof doc.value === "object") {
      return (
        doc.value.body ??
        doc.value.html ??
        doc.value.content ??
        String(doc.value)
      );
    }
    return String(doc.value);
  });
}

async function privacyContent(req, res, next) {
  try {
    const content = await settingString("privacy_policy");
    return ok(res, { content });
  } catch (e) {
    next(e);
  }
}

async function termsContent(req, res, next) {
  try {
    const content = await settingString("terms_and_conditions");
    return ok(res, { content });
  } catch (e) {
    next(e);
  }
}

async function complianceContent(req, res, next) {
  try {
    const content = await settingString("compliance_content");
    return ok(res, { content });
  } catch (e) {
    next(e);
  }
}

async function dmvContent(req, res, next) {
  try {
    const content = await settingString("dmv_content");
    return ok(res, { content });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  privacyContent,
  termsContent,
  complianceContent,
  dmvContent,
};
