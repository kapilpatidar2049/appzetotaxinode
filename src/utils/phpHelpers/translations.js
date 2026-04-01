const fs = require("fs");
const path = require("path");

/** Avoid re-reading translation files on every notification (sync I/O is costly under load). */
const jsonFileCache = new Map();

function loadJsonCached(filePath) {
  try {
    if (!fs.existsSync(filePath)) return null;
    const stat = fs.statSync(filePath);
    const hit = jsonFileCache.get(filePath);
    if (hit && hit.mtimeMs === stat.mtimeMs) {
      return hit.data;
    }
    const raw = fs.readFileSync(filePath, "utf8");
    const data = JSON.parse(raw);
    jsonFileCache.set(filePath, { mtimeMs: stat.mtimeMs, data });
    return data;
  } catch {
    return null;
  }
}

function applyReplacements(translation, replace) {
  let out = translation;
  Object.entries(replace || {}).forEach(([k, value]) => {
    out = out.split(`:${k}`).join(String(value));
  });
  return out;
}

/**
 * Laravel custom_trans — reads public/lang/{locale}/push_notifications.json
 * @param {string} [publicRoot] default process.cwd()/public
 */
function customTrans(key, replace = {}, locale = null, publicRoot) {
  const loc = locale || process.env.APP_LOCALE || "en";
  const root = publicRoot || path.join(process.cwd(), "public");
  const filePath = path.join(root, "lang", loc, "push_notifications.json");
  const translations = loadJsonCached(filePath);
  if (!translations || translations[key] == null) return key;
  return applyReplacements(String(translations[key]), replace);
}

function customRemarksTrans(key, replace = {}, locale = null, publicRoot) {
  const loc = locale || process.env.APP_LOCALE || "en";
  const root = publicRoot || path.join(process.cwd(), "public");
  const filePath = path.join(root, "lang", loc, "wallet_remarks.json");
  const translations = loadJsonCached(filePath);
  if (!translations || translations[key] == null) return key;
  return applyReplacements(String(translations[key]), replace);
}

function customStatusTrans(key, replace = {}, locale = null, publicRoot) {
  const loc = locale || process.env.APP_LOCALE || "en";
  const root = publicRoot || path.join(process.cwd(), "public");
  const filePath = path.join(root, "lang", loc, "view_pages_3.json");
  const translations = loadJsonCached(filePath);
  if (!translations || translations[key] == null) return key;
  return applyReplacements(String(translations[key]), replace);
}

module.exports = {
  customTrans,
  customRemarksTrans,
  customStatusTrans,
};
