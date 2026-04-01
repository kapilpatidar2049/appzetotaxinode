const authRoutes = require("./auth");
const userRoutes = require("./user");
const driverRoutes = require("./driver");
const requestRoutes = require("./request");
const commonRoutes = require("./common");
const paymentRoutes = require("./payment");
const ownerRoutes = require("./owner");
const dispatcherRoutes = require("./dispatcher");
const apiCommonRoutes = require("./apiCommon");
const rootApiRoutes = require("./rootApi");
const webRoutes = require("./web");
const adminRoutes = require("./admin");

module.exports = {
  authRoutes,
  userRoutes,
  driverRoutes,
  requestRoutes,
  commonRoutes,
  paymentRoutes,
  ownerRoutes,
  dispatcherRoutes,
  apiCommonRoutes,
  rootApiRoutes,
  webRoutes,
  adminRoutes,
};
