const fs = require("fs");
const path = require("path");

const phpPath = path.join(__dirname, "..", "phpseeders", "ReferralConditionSeeder.php");
const php = fs.readFileSync(phpPath, "utf8");

const block = php.split("protected $referral = [")[1].split(/\n\s*\];\s*\n\s*\/\*\*/)[0];
const cleaned = block.replace(/^\s*\/\/.*$/gm, "");
const chunks = cleaned.split(/^\s*\[\s*$/m).filter(Boolean);

function parseDescription(chunk) {
  const dm = /'description'\s*=>\s*/m.exec(chunk);
  if (!dm) return null;
  let after = chunk.slice(dm.index + dm[0].length).trimStart();
  if (!after.startsWith("'")) return null;
  after = after.slice(1);
  const end = after.lastIndexOf("',");
  if (end === -1) return null;
  return after.slice(0, end).trim();
}

const items = [];
for (const ch of chunks) {
  const label = /'label_referral'\s*=>\s*'([^']*)'/.exec(ch)?.[1];
  const rtype = /'referral_type'\s*=>\s*'([^']*)'/.exec(ch)?.[1];
  const description = parseDescription(ch);
  if (label && rtype && description !== null) {
    items.push({ label_referral: label, referral_type: rtype, description });
  }
}

const outDir = path.join(__dirname, "..", "src", "seeders", "data");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "referralConditions.json");
fs.writeFileSync(outPath, JSON.stringify(items, null, 2));
console.log("wrote", outPath, "count", items.length);
