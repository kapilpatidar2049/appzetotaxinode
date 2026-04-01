/**
 * Strips MySQL / dbClient branches so the codebase is MongoDB (Mongoose) only.
 * Run from repo: node scripts/mongo-only-strip.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src");

function braceEnd(s, openIdx) {
  let depth = 0;
  for (let i = openIdx; i < s.length; i++) {
    const ch = s[i];
    if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function stripNotMongoBlocks(src) {
  const needle = 'if (config.dbClient !== "mongo")';
  let out = src;
  let guard = 0;
  while (guard++ < 2000 && out.includes(needle)) {
    const start = out.indexOf(needle);
    const open = out.indexOf("{", start);
    if (open === -1) break;
    const close = braceEnd(out, open);
    if (close === -1) break;
    out = out.slice(0, start) + out.slice(close + 1);
  }
  return out;
}

function stripMongoElseBlocks(src) {
  const needle = 'if (config.dbClient === "mongo")';
  let out = src;
  let guard = 0;
  while (guard++ < 2000 && out.includes(needle)) {
    const start = out.indexOf(needle);
    const open = out.indexOf("{", start);
    if (open === -1) break;
    const close1 = braceEnd(out, open);
    if (close1 === -1) break;
    const after = out.slice(close1 + 1).trimStart();
    if (!after.startsWith("else")) break;
    const elseOpen = close1 + 1 + out.slice(close1 + 1).indexOf("{");
    const close2 = braceEnd(out, elseOpen);
    if (close2 === -1) break;
    const innerMongo = out.slice(open + 1, close1);
    out = out.slice(0, start) + innerMongo + out.slice(close2 + 1);
  }
  return out;
}

function unwrapMongoOnlyIfs(src) {
  const needle = 'if (config.dbClient === "mongo")';
  let out = src;
  let guard = 0;
  while (guard++ < 2000 && out.includes(needle)) {
    const start = out.indexOf(needle);
    const open = out.indexOf("{", start);
    if (open === -1) break;
    const close1 = braceEnd(out, open);
    if (close1 === -1) break;
    const after = out.slice(close1 + 1).trimStart();
    if (after.startsWith("else")) break;
    const inner = out.slice(open + 1, close1);
    out = out.slice(0, start) + inner + out.slice(close1 + 1);
  }
  return out;
}

function stripTernaryDbClient(src) {
  return src.replace(
    /config\.dbClient\s*===\s*["']mongo["']\s*\?\s*([^:]+)\s*:\s*([^;]+);/g,
    (_, a) => `${a.trim()};`
  );
}

function stripQueryImport(src) {
  return src.replace(
    /^\s*const\s*\{\s*query\s*\}\s*=\s*require\([^)]+\);\s*\r?\n/gm,
    ""
  );
}

const files = [
  path.join(ROOT, "controllers", "authController.js"),
  path.join(ROOT, "controllers", "commonController.js"),
  path.join(ROOT, "controllers", "driverController.js"),
  path.join(ROOT, "controllers", "ownerController.js"),
  path.join(ROOT, "controllers", "requestController.js"),
  path.join(ROOT, "controllers", "paymentController.js"),
  path.join(ROOT, "controllers", "userController.js"),
  path.join(ROOT, "controllers", "webController.js"),
  path.join(ROOT, "controllers", "rootApiController.js"),
  path.join(ROOT, "routes", "apiCommon.js"),
  path.join(ROOT, "utils", "phpHelpers", "settingsDb.js"),
  path.join(ROOT, "services", "realtimeTripSync.js"),
  path.join(ROOT, "controllers", "adminRequestController.js"),
  path.join(ROOT, "controllers", "adminServiceLocationController.js"),
  path.join(ROOT, "controllers", "adminPromoController.js"),
  path.join(ROOT, "controllers", "adminOwnerController.js"),
  path.join(ROOT, "controllers", "adminDriverController.js"),
  path.join(ROOT, "controllers", "adminUserController.js"),
  path.join(ROOT, "controllers", "adminInertiaJsonController.js"),
];

for (const f of files) {
  if (!fs.existsSync(f)) {
    console.warn("skip missing", f);
    continue;
  }
  let s = fs.readFileSync(f, "utf8");
  s = stripQueryImport(s);
  s = stripMongoElseBlocks(s);
  s = stripNotMongoBlocks(s);
  s = unwrapMongoOnlyIfs(s);
  s = stripTernaryDbClient(s);
  fs.writeFileSync(f, s);
  console.log("processed", path.relative(path.join(__dirname, ".."), f));
}
