const axios = require("axios");
const ThirdPartySetting = require("../models/ThirdPartySetting");
const User = require("../models/User");
const { sendFcmOtpMessage } = require("./firebaseAdmin");

function str(v) {
  if (v == null) return "";
  return String(v).trim();
}

function isEnabled(settings, key) {
  const v = settings[key];
  return v === true || v === 1 || str(v) === "1" || str(v).toLowerCase() === "true";
}

async function loadSmsSettings() {
  const rows = await ThirdPartySetting.find({
    module: "sms",
    is_active: { $ne: false },
  })
    .lean();
  const settings = {};
  for (const r of rows) {
    settings[r.key] = r.value;
  }
  return settings;
}

/** E.164 for SMS providers; falls back to digits-only if country missing. */
function toE164(country_code, mobile) {
  const raw = str(mobile).replace(/\s/g, "");
  if (raw.startsWith("+")) return raw;
  const cc = str(country_code).replace(/^\+/, "").replace(/\D/g, "");
  const digits = raw.replace(/\D/g, "");
  if (!digits) return "";
  if (cc) return `+${cc}${digits}`;
  return `+${digits}`;
}

async function resolveFcmToken(device_token, mobile) {
  const fromBody = str(device_token);
  if (fromBody) return fromBody;
  const u = await User.findOne({ mobile: str(mobile) }).select("fcm_token").lean();
  return u && str(u.fcm_token) ? str(u.fcm_token) : null;
}

async function sendTwilio(e164, message, s) {
  const sid = str(s.twilio_sid);
  const token = str(s.twilio_token);
  const from = str(s.twilio_from_number);
  if (!sid || !token || !from) {
    return { ok: false, error: "Twilio credentials incomplete" };
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`;
  const body = new URLSearchParams({
    To: e164,
    From: from,
    Body: message,
  });
  const auth = Buffer.from(`${sid}:${token}`).toString("base64");
  const res = await axios.post(url, body.toString(), {
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    timeout: 25000,
    validateStatus: () => true,
  });
  if (res.status >= 200 && res.status < 300) return { ok: true };
  return { ok: false, error: `Twilio HTTP ${res.status}` };
}

async function sendMsg91(e164, message, country_code, s) {
  const authkey = str(s.msg91_auth_key);
  if (!authkey) return { ok: false, error: "MSG91 auth key missing" };
  const sender =
    str(s.msg91_sender_id) ||
    str(process.env.MSG91_DEFAULT_SENDER) ||
    "VERIFY";
  const cc = str(country_code).replace(/^\+/, "").replace(/\D/g, "") || "91";
  let national = e164.replace(/^\+/, "");
  if (national.startsWith(cc)) {
    national = national.slice(cc.length);
  }
  const url = "https://api.msg91.com/api/sendhttp.php";
  const params = new URLSearchParams({
    authkey,
    mobiles: national,
    message,
    sender,
    route: "4",
    country: cc,
  });
  const res = await axios.get(`${url}?${params.toString()}`, {
    timeout: 25000,
    validateStatus: () => true,
  });
  const text = str(res.data);
  if (res.status === 200 && !text.toLowerCase().includes("error")) {
    return { ok: true };
  }
  return { ok: false, error: `MSG91: ${text || res.status}` };
}

async function sendSparrow(nationalMobile, message, s) {
  const token = str(s.sparrow_token);
  const from = str(s.sparrow_sender_id);
  if (!token || !from) return { ok: false, error: "Sparrow token or sender missing" };
  const to = nationalMobile.replace(/\D/g, "").replace(/^0+/, "");
  const url = "https://api.sparrowsms.com/v2/sms/";
  const params = new URLSearchParams({
    token,
    from,
    to,
    text: message,
  });
  const res = await axios.get(`${url}?${params.toString()}`, {
    timeout: 25000,
    validateStatus: () => true,
  });
  if (res.status !== 200) {
    return { ok: false, error: `Sparrow HTTP ${res.status}` };
  }
  const d = res.data;
  if (typeof d === "string") {
    if (/error|fail/i.test(d)) return { ok: false, error: `Sparrow: ${d.slice(0, 200)}` };
    return { ok: true };
  }
  if (d && (d.status === 200 || d.code === 200 || d.status === "success")) {
    return { ok: true };
  }
  return { ok: false, error: `Sparrow: ${JSON.stringify(d).slice(0, 200)}` };
}

async function sendSmsAla(e164Digits, message, s) {
  const apiId = str(s.smsala_api_key);
  const apiPass = str(s.smsala_secrect_key);
  if (!apiId || !apiPass) return { ok: false, error: "SMS ALA api key or secret missing" };
  const sender = str(s.smsala_from_number);
  const url = str(process.env.SMSALA_API_URL) || "https://api.smsala.com/api/SendSMS";
  const form = new URLSearchParams({
    api_id: apiId,
    api_password: apiPass,
    sms_type: "T",
    encoding: "T",
    sender_id: sender || apiId.slice(0, 6),
    phonenumber: e164Digits,
    textmessage: message,
  });
  const token = str(s.smsala_token);
  const headers = { "Content-Type": "application/x-www-form-urlencoded" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const res = await axios.post(url, form.toString(), { headers, timeout: 25000, validateStatus: () => true });
  const body = typeof res.data === "string" ? res.data : JSON.stringify(res.data);
  if (res.status >= 200 && res.status < 300 && !body.toLowerCase().includes("fail")) {
    return { ok: true };
  }
  return { ok: false, error: `SMS ALA: ${body.slice(0, 200)}` };
}

async function sendSmsIndiaHub(nationalOrFull, message, s) {
  const apiKey = str(s.sms_india_hub_api_key);
  const sid = str(s.sms_india_hub_sid);
  if (!apiKey || !sid) return { ok: false, error: "SMS India Hub API key or SID missing" };
  const msisdn = nationalOrFull.replace(/^\+/, "").replace(/\D/g, "");
  const base = str(process.env.SMS_INDIA_HUB_URL) || "https://cloud.smsindiahub.in/vendorsms/pushsms.aspx";
  const params = new URLSearchParams({
    APIKey: apiKey,
    msisdn,
    sid,
    msg: message,
    fl: "0",
    gwid: "2",
    dc: "0",
  });
  const res = await axios.get(`${base}?${params.toString()}`, { timeout: 25000, validateStatus: () => true });
  const text = str(res.data);
  if (res.status === 200 && !/error|fail|invalid/i.test(text)) {
    return { ok: true };
  }
  return { ok: false, error: `SMS India Hub: ${text.slice(0, 200)}` };
}

async function sendKudiSms(e164Digits, message, s) {
  const apiKey = str(s.kudi_sms_api_key);
  const sender = str(s.kudi_sms_sender_id);
  if (!apiKey || !sender) return { ok: false, error: "Kudi SMS api key or sender missing" };
  const url =
    str(process.env.KUDI_SMS_API_URL) || "https://my.kudisms.net/api/v2/sms/send";
  const payload = {
    api_key: apiKey,
    sender_id: sender,
    sender,
    message,
    recipient: e164Digits,
    to: e164Digits,
  };
  const res = await axios.post(url, payload, {
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    timeout: 25000,
    validateStatus: () => true,
  });
  if (res.status >= 200 && res.status < 300) return { ok: true };
  return {
    ok: false,
    error: `Kudi SMS HTTP ${res.status} (override URL with KUDI_SMS_API_URL if needed)`,
  };
}

const SMS_ORDER = [
  { key: "enable_twilio", name: "twilio", send: "twilio" },
  { key: "enable_sms_ala", name: "sms_ala", send: "sms_ala" },
  { key: "enable_msg91", name: "msg91", send: "msg91" },
  { key: "enable_sparrow", name: "sparrow", send: "sparrow" },
  { key: "enable_sms_india_hub", name: "sms_india_hub", send: "sms_india_hub" },
  { key: "enable_kudi_sms_api_key", name: "kudi", send: "kudi" },
];

async function trySmsGateways(e164, message, country_code, settings) {
  const e164Digits = e164.replace(/^\+/, "");
  const lastErrors = [];

  for (const g of SMS_ORDER) {
    if (!isEnabled(settings, g.key)) continue;
    try {
      let r;
      if (g.send === "twilio") r = await sendTwilio(e164, message, settings);
      else if (g.send === "msg91") r = await sendMsg91(e164, message, country_code, settings);
      else if (g.send === "sparrow") r = await sendSparrow(e164Digits, message, settings);
      else if (g.send === "sms_ala") r = await sendSmsAla(e164Digits, message, settings);
      else if (g.send === "sms_india_hub") r = await sendSmsIndiaHub(e164Digits, message, settings);
      else if (g.send === "kudi") r = await sendKudiSms(e164Digits, message, settings);
      if (r && r.ok) return { ok: true, channel: g.name };
      lastErrors.push(`${g.name}: ${r && r.error}`);
    } catch (e) {
      lastErrors.push(`${g.name}: ${e.message}`);
    }
  }

  return {
    ok: false,
    error: lastErrors.length ? lastErrors.join("; ") : "No SMS gateway is enabled in settings",
  };
}

function anySmsEnabled(settings) {
  return SMS_ORDER.some((g) => isEnabled(settings, g.key));
}

/**
 * Deliver login / registration OTP: Firebase push when enabled (with SMS fallback),
 * otherwise first enabled SMS provider.
 */
async function deliverOtp({ mobile, country_code, otp, device_token, skipExternal }) {
  if (skipExternal) {
    return { ok: true, channel: "demo" };
  }

  const settings = await loadSmsSettings();
  const e164 = toE164(country_code, mobile);
  if (!e164 || e164 === "+") {
    return { ok: false, error: "Invalid mobile number" };
  }

  const message = `Your verification code is ${otp}`;
  const firebaseOtpOn = isEnabled(settings, "enable_firebase_otp");
  const fcmToken = firebaseOtpOn ? await resolveFcmToken(device_token, mobile) : null;

  if (firebaseOtpOn && fcmToken) {
    const pushed = await sendFcmOtpMessage(fcmToken, otp, { mobile });
    if (pushed) {
      return { ok: true, channel: "firebase_push" };
    }
    if (anySmsEnabled(settings)) {
      const sms = await trySmsGateways(e164, message, country_code, settings);
      if (sms.ok) return { ...sms, channel: `${sms.channel}_after_fcm_fail` };
    }
    return { ok: false, error: "Failed to send OTP via push notification" };
  }

  if (firebaseOtpOn && !fcmToken) {
    if (anySmsEnabled(settings)) {
      const sms = await trySmsGateways(e164, message, country_code, settings);
      if (sms.ok) return { ...sms, channel: sms.channel };
    }
    return {
      ok: false,
      error:
        "Firebase OTP is on but no device FCM token was found. Send device_token with the request or enable an SMS gateway as fallback.",
    };
  }

  const smsOnly = await trySmsGateways(e164, message, country_code, settings);
  return smsOnly.ok ? { ok: true, channel: smsOnly.channel } : { ok: false, error: smsOnly.error };
}

module.exports = {
  deliverOtp,
  loadSmsSettings,
  toE164,
  isEnabled,
};
