const { countries } = require("countries-list");
const Country = require("../models/Country");

async function runCountriesTableSeeder() {
  const existing = await Country.countDocuments();
  if (existing > 0) return;

  const docs = Object.entries(countries).map(([code, c]) => {
    const rawPhone = c.phone;
    const phoneDigits = Array.isArray(rawPhone) ? rawPhone[0] : rawPhone;
    const dial =
      phoneDigits != null ? `+${String(phoneDigits).replace(/^\+/, "")}` : "";
    const cur = c.currency;
    const currencyCode = Array.isArray(cur) && cur.length ? cur[0] : cur || "";
    return {
      code,
      name: c.name || code,
      dial_code: dial,
      flag: code,
      currency_name: "",
      currency_symbol: "",
      currency_code: currencyCode || "",
      active: true,
    };
  });

  await Country.insertMany(docs, { ordered: false }).catch((err) => {
    if (err.code !== 11000) throw err;
  });
}

module.exports = { runCountriesTableSeeder };
