// Central place to read environment variables used by the Node backend.
// We intentionally keep it small; add keys here as needed.

function envInt(name, fallback) {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : fallback;
}

function envBool(name, fallback = false) {
  const v = process.env[name];
  if (v === undefined || v === "") return fallback;
  return ["1", "true", "yes", "on"].includes(String(v).toLowerCase());
}

const config = {
  nodeEnv: process.env.NODE_ENV || "development",
  /** Laravel config('app.app_for'): e.g. bidding, taxi */
  appFor: process.env.APP_FOR || "taxi",
  port: process.env.NODE_PORT || 4000,
  jwtSecret: process.env.JWT_SECRET || "change-this-jwt-secret",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  mongoUri: process.env.MONGO_URI || "mongodb://127.0.0.1:27017/taxibackend",
  /** Mongoose driver pool (per process). Raise under load; watch Mongo max connections. */
  mongoMaxPoolSize: envInt("MONGO_MAX_POOL_SIZE", 50),
  mongoMinPoolSize: envInt("MONGO_MIN_POOL_SIZE", 2),
  /** Express JSON body size cap. */
  jsonBodyLimit: process.env.JSON_BODY_LIMIT || "1mb",
  /** Behind reverse proxy / ALB — needed for correct client IP in logs and rate limits. */
  trustProxy: envBool("TRUST_PROXY", false),
  /** Roles allowed to call `GET/POST /api/v1/admin/*` (comma-separated env override). */
  adminPanelRoles: (process.env.ADMIN_PANEL_ROLES || "super-admin,admin,dispatcher")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
};

module.exports = config;

