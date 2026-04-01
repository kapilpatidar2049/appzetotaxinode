/**
 * Controllers barrel — Express handlers (Mongo-first; MySQL branches where kept).
 * Routes are mounted from `src/routes/` and `src/app.js`.
 */

module.exports = {
  authController: require("./authController"),
  userController: require("./userController"),
  driverController: require("./driverController"),
  requestController: require("./requestController"),
  paymentController: require("./paymentController"),
  commonController: require("./commonController"),
  ownerController: require("./ownerController"),
  dispatcherController: require("./dispatcherController"),
  rootApiController: require("./rootApiController"),
  webController: require("./webController"),
  adminUserController: require("./adminUserController"),
  adminDriverController: require("./adminDriverController"),
  adminOwnerController: require("./adminOwnerController"),
  adminRequestController: require("./adminRequestController"),
  adminPromoController: require("./adminPromoController"),
  adminServiceLocationController: require("./adminServiceLocationController"),
};
