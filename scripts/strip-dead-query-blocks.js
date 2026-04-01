/**
 * Removes unreachable MySQL query() tail blocks after an earlier return in the same try { }.
 * Run: node scripts/strip-dead-query-blocks.js
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..", "src");

const targets = [
  "controllers/commonController.js",
  "controllers/authController.js",
  "controllers/userController.js",
  "controllers/driverController.js",
  "controllers/ownerController.js",
  "controllers/requestController.js",
  "controllers/paymentController.js",
];

function startsQueryLine(trimmed) {
  return (
    /^await\s+query\(/.test(trimmed) ||
    /^const\s+\w+\s*=\s*await\s+query\(/.test(trimmed) ||
    /^\[\s*\w+(?:\s*,\s*\w+)*\s*\]\s*=\s*await\s+query\(/.test(trimmed)
  );
}

function stripDeadMysqlTails(src) {
  const lines = src.split(/\r?\n/);
  const out = [];
  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (startsQueryLine(trimmed)) {
      let k = out.length - 1;
      while (k >= 0 && out[k].trim() === "") k--;
      const prev = k >= 0 ? out[k].trim() : "";
      const deadTail =
        /^return\s+/.test(prev) ||
        /^throw\s+/.test(prev) ||
        prev === "});" ||
        /^\}\s*;\s*$/.test(prev);
      if (deadTail) {
        let depth = 0;
        let started = false;
        let j = i;
        for (; j < lines.length; j++) {
          const L = lines[j];
          for (let c = 0; c < L.length; c++) {
            const ch = L[c];
            if (ch === "(") {
              depth++;
              started = true;
            } else if (ch === ")") {
              depth--;
            }
          }
          if (started && depth <= 0) {
            j++;
            break;
          }
        }
        i = j - 1;
        while (i + 1 < lines.length && lines[i + 1].trim() === "") {
          i++;
        }
        if (i + 1 < lines.length && /^\s*return\s+/.test(lines[i + 1])) {
          i++;
        }
        continue;
      }
    }
    out.push(lines[i]);
  }
  return out.join("\n");
}

for (const rel of targets) {
  const f = path.join(ROOT, rel);
  if (!fs.existsSync(f)) continue;
  let s = fs.readFileSync(f, "utf8");
  const before = s.split("query").length;
  s = stripDeadMysqlTails(s);
  fs.writeFileSync(f, s);
  const after = s.split("query").length;
  console.log(rel, "query-mentions", before, "->", after);
}
