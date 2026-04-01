const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const config = require("./config");
const {
  authRoutes,
  commonRoutes,
  apiCommonRoutes,
  userRoutes,
  requestRoutes,
  paymentRoutes,
  driverRoutes,
  ownerRoutes,
  dispatcherRoutes,
  rootApiRoutes,
  webRoutes,
  adminRoutes,
} = require("./routes/index");

const app = express();

app.disable("x-powered-by");
if (config.trustProxy) {
  app.set("trust proxy", 1);
}

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: config.jsonBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: config.jsonBodyLimit }));

if (config.nodeEnv === "development") {
  app.use(morgan("dev"));
}

app.get("/", (req, res) => {
  res.json({ status: "ok", service: "node-backend", database: "mongodb" });
});

// Non-versioned CMS-style endpoints (Laravel routes/api.php)
app.use("/api", rootApiRoutes);

/** Laravel routes/web.php — JSON under /web (Laravel paths are unprefixed; see web.js header). */
app.use("/web", webRoutes);

/**
 * API v1 — mount order matters for overlapping paths.
 * Auth routes live at /api/v1/* (same paths as Flutter ApiEndpoints, not /api/v1/auth/*).
 */
app.use("/api/v1", authRoutes);

/** Admin React panel — same routes as `/web` but JWT + role (see `config.adminPanelRoles`). */
app.use("/api/v1/admin", adminRoutes);

app.use("/api/v1", commonRoutes);

app.use("/api/v1", apiCommonRoutes);

app.use("/api/v1/user", userRoutes);

app.use("/api/v1/request", requestRoutes);

app.use("/api/v1/payment", paymentRoutes);

app.use("/api/v1/driver", driverRoutes);

app.use("/api/v1/owner", ownerRoutes);

app.use("/api/v1/dispatcher", dispatcherRoutes);

app.use((req, res, next) => {
  res.status(404).json({ message: "Not Found" });
});

app.use((err, req, res, next) => {
  if (config.nodeEnv === "development") {
    console.error(err);
  } else {
    console.error(err.message || err);
  }
  const status = err.status || 500;
  res.status(status).json({
    message: err.message || "Internal Server Error",
  });
});

module.exports = app;

