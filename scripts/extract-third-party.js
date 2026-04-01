const fs = require("fs");
const path = require("path");

const phpPath = path.join(__dirname, "..", "phpseeders", "ThirdPartySettingSeeder.php");
const t = fs.readFileSync(phpPath, "utf8");

let payBlock = t.split("protected $payment_settings = [")[1].split("protected $invoice_configuration")[0];
payBlock = payBlock.replace(/\/\/.*$/gm, "");

const invBlock = t.split("protected $invoice_configuration = [")[1].split("];")[0];

function parseSeg(seg) {
  const nameM = /'name'\s*=>\s*'([^']*)'/.exec(seg);
  const valM = /'value'\s*=>\s*'([^']*)'/.exec(seg);
  const modM = /'module'\s*=>\s*'([^']*)'/.exec(seg);
  if (!nameM || !valM || !modM) return null;
  return { key: nameM[1], value: valM[1], module: modM[1] };
}

function parsePhpArray(body) {
  const parts = body.split(/\n\s*\[/).filter((x) => x.includes("'name'"));
  const out = [];
  for (const p of parts) {
    const o = parseSeg("[" + p);
    if (o) out.push(o);
  }
  return out;
}

const payment_settings = parsePhpArray(payBlock);
const invoice_configuration = parsePhpArray(invBlock);

const outDir = path.join(__dirname, "..", "src", "seeders", "data");
fs.mkdirSync(outDir, { recursive: true });
const outPath = path.join(outDir, "thirdPartySettings.json");
fs.writeFileSync(
  outPath,
  JSON.stringify({ payment_settings, invoice_configuration }, null, 2)
);
console.log("wrote", outPath, "payment", payment_settings.length, "invoice", invoice_configuration.length);
