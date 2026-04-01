const express = require("express");

const authRoutes = require("./auth");
const userRoutes = require("./user");
const driverRoutes = require("./driver");
const requestRoutes = require("./request");
const commonRoutes = require("./common");
const paymentRoutes = require("./payment");
const ownerRoutes = require("./owner");
const dispatcherRoutes = require("./dispatcher");
const apiCommonRoutes = require("./apiCommon");

const router = express.Router();

// Laravel: routes/api/v1/auth.php (no prefix)
router.use("/auth", authRoutes);

// Laravel: routes/api/v1/user.php (prefix 'user')
router.use("/user", userRoutes);

// Laravel: routes/api/v1/driver.php (prefix 'driver')
router.use("/driver", driverRoutes);

// Laravel: routes/api/v1/request.php (prefix 'request')
router.use("/request", requestRoutes);

// Laravel: routes/api/v1/common.php (countries, common/*, types/*, notifications/*, promotions)
router.use("/", commonRoutes);

// Laravel: routes/api/v1/payment.php (prefix 'payment')
router.use("/payment", paymentRoutes);

// Laravel: routes/api/v1/owner.php (prefix 'owner')
router.use("/owner", ownerRoutes);

// Laravel: routes/api/v1/dispatcher.php (prefix 'dispatcher')
router.use("/dispatcher", dispatcherRoutes);

// Laravel: routes/api/v1/api.php (translation/*, servicelocation)
router.use("/", apiCommonRoutes);

module.exports = router;
