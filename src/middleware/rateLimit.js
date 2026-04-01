const rateLimit = require("express-rate-limit");

function buildLimiter(max, windowMs) {
  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests, please try again later.",
    },
  });
}

// Laravel-like presets:
// throttle:120,1 => 120 requests/min
// throttle:30,1  => 30 requests/min
// throttle:10,1  => 10 requests/min
const limit120PerMinute = buildLimiter(120, 60 * 1000);
const limit30PerMinute = buildLimiter(30, 60 * 1000);
const limit10PerMinute = buildLimiter(10, 60 * 1000);

module.exports = {
  limit120PerMinute,
  limit30PerMinute,
  limit10PerMinute,
};

