const express = require("express");
const c = require("../controllers/adminReportController");

const router = express.Router();

router.get("/options", c.reportOptions);
router.get("/user/download", c.downloadUserReport);
router.get("/driver/download", c.downloadDriverReport);
router.get("/driver-duty/download", c.downloadDriverDutyReport);
router.get("/owner/download", c.downloadOwnerReport);
router.get("/finance/download", c.downloadFinanceReport);
router.get("/fleet-finance/download", c.downloadFleetFinanceReport);

module.exports = router;
