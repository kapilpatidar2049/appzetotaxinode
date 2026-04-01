const GoodsType = require("../models/GoodsType");
const { upsertByKey } = require("./utils");

async function runGoodsTypeSeeder() {
  await upsertByKey(GoodsType, "name", [
    { name: "Documents", active: true },
    { name: "Food", active: true },
    { name: "Parcel", active: true },
  ]);
}

module.exports = { runGoodsTypeSeeder };

