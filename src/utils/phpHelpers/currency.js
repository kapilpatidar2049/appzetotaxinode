const axios = require("axios");
const { cacheGet, cachePut } = require("./memoryCache");

const CURRENCYLAYER_BASE = "http://apilayer.net/api";
const DEFAULT_ACCESS_KEY =
  process.env.CURRENCYLAYER_ACCESS_KEY || "bf2ce041ad76f21bf70835b4840f6a67";

/**
 * Laravel: get_and_set_currency_value_using_curreny_layer
 * Fetches live USD-quoted rates and caches per currency code (key without USD prefix).
 */
async function getAndSetCurrencyValueUsingCurrencyLayer() {
  try {
    const url = `${CURRENCYLAYER_BASE}/live?access_key=${encodeURIComponent(
      DEFAULT_ACCESS_KEY
    )}&source=USD&format=1`;
    const { data } = await axios.get(url, { timeout: 20000 });
    const quotes = data && data.quotes;
    if (!quotes || typeof quotes !== "object") return false;

    Object.entries(quotes).forEach(([k, value]) => {
      const code = String(k).replace(/^USD/i, "");
      cachePut(code, value, 1440);
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Laravel: convert_currency_to_usd
 * @returns {{ converted_amount: string|number, converted_type: string }}
 */
async function convertCurrencyToUsd(currencyCode, amount) {
  const code = String(currencyCode || "").toUpperCase();
  if (code === "USD") {
    return { converted_amount: amount, converted_type: "USD-USD" };
  }

  let usdPerUnit = cacheGet(code);
  if (usdPerUnit == null) {
    const ok = await getAndSetCurrencyValueUsingCurrencyLayer();
    if (!ok) {
      return {
        converted_amount: 0,
        converted_type: `${code}-USD`,
      };
    }
    usdPerUnit = cacheGet(code);
  }

  if (usdPerUnit == null || Number(usdPerUnit) === 0) {
    return {
      converted_amount: 0,
      converted_type: `${code}-USD`,
    };
  }

  const converted = Number(amount) / Number(usdPerUnit);
  return {
    converted_amount: Number(converted).toFixed(2),
    converted_type: `${code}-USD`,
  };
}

/**
 * Laravel: get_current_curreny_value
 */
async function getCurrentCurrencyValue() {
  const url = `${CURRENCYLAYER_BASE}/live?access_key=${encodeURIComponent(
    DEFAULT_ACCESS_KEY
  )}&source=USD&format=1`;
  const { data } = await axios.get(url, { timeout: 20000 });
  const currencyArray = data && data.quotes;
  if (!currencyArray || typeof currencyArray !== "object") {
    throw new Error("Invalid currency layer response");
  }

  cachePut("currency_cache", "yes", 1440);
  Object.entries(currencyArray).forEach(([k, value]) => {
    const code = String(k).replace(/^USD/i, "");
    cachePut(code, value, 1440);
  });

  return currencyArray;
}

module.exports = {
  convertCurrencyToUsd,
  getAndSetCurrencyValueUsingCurrencyLayer,
  getCurrentCurrencyValue,
};
