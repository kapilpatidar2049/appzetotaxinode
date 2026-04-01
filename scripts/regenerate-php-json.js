const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const php = process.env.PHP_PATH || "php";
const root = path.join(__dirname, "..");

function runPhp(script, outRel) {
  const buf = execFileSync(php, [path.join(__dirname, script)], { cwd: root });
  fs.writeFileSync(path.join(root, outRel), buf.toString("utf8").replace(/^\uFEFF/, ""), "utf8");
  console.log("wrote", outRel);
}

runPhp("dump-make-models.php", "src/seeders/data/carMakeModel.json");
runPhp("dump-states-cities.php", "src/seeders/data/statesCities.json");
require("./extract-third-party.js");
require("./extract-referral.js");
