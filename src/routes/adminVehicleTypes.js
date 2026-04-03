const express = require("express");
const adminVehicleTypeController = require("../controllers/adminVehicleTypeController");
const { uploadDriverRewardImage, uploadImageError } = require("../middleware/uploadImage");

const router = express.Router();

router.get("/vehicle-types", adminVehicleTypeController.listVehicleTypes);
router.post("/vehicle-types", adminVehicleTypeController.createVehicleType);
router.get("/vehicle-types/:id", adminVehicleTypeController.getVehicleType);
router.patch("/vehicle-types/:id", adminVehicleTypeController.updateVehicleType);
router.delete("/vehicle-types/:id", adminVehicleTypeController.deleteVehicleType);

router.get("/sub-vehicle-types", adminVehicleTypeController.listSubVehicleTypes);
router.post("/sub-vehicle-types", adminVehicleTypeController.createSubVehicleType);
router.get("/sub-vehicle-types/:id", adminVehicleTypeController.getSubVehicleType);
router.patch("/sub-vehicle-types/:id", adminVehicleTypeController.updateSubVehicleType);
router.delete("/sub-vehicle-types/:id", adminVehicleTypeController.deleteSubVehicleType);

router.get("/rental-packages", adminVehicleTypeController.listRentalPackages);
router.post("/rental-packages", adminVehicleTypeController.createRentalPackage);
router.get("/rental-packages/:id", adminVehicleTypeController.getRentalPackage);
router.patch("/rental-packages/:id", adminVehicleTypeController.updateRentalPackage);
router.delete("/rental-packages/:id", adminVehicleTypeController.deleteRentalPackage);

router.get("/set-prices", adminVehicleTypeController.listSetPrices);
router.post("/set-prices", adminVehicleTypeController.createSetPrice);
router.get("/set-prices/:id", adminVehicleTypeController.getSetPrice);
router.patch("/set-prices/:id", adminVehicleTypeController.updateSetPrice);
router.delete("/set-prices/:id", adminVehicleTypeController.deleteSetPrice);

router.get("/rental-package-prices", adminVehicleTypeController.listRentalPackagePrices);
router.post("/rental-package-prices", adminVehicleTypeController.createRentalPackagePrice);
router.get("/rental-package-prices/:id", adminVehicleTypeController.getRentalPackagePrice);
router.patch("/rental-package-prices/:id", adminVehicleTypeController.updateRentalPackagePrice);
router.delete("/rental-package-prices/:id", adminVehicleTypeController.deleteRentalPackagePrice);

router.get("/driver-rewards", adminVehicleTypeController.listDriverRewards);
router.post(
  "/driver-rewards",
  uploadDriverRewardImage.single("image"),
  uploadImageError,
  adminVehicleTypeController.createDriverReward
);
router.get("/driver-rewards/:id", adminVehicleTypeController.getDriverReward);
router.patch(
  "/driver-rewards/:id",
  uploadDriverRewardImage.single("image"),
  uploadImageError,
  adminVehicleTypeController.updateDriverReward
);
router.delete("/driver-rewards/:id", adminVehicleTypeController.deleteDriverReward);

router.get("/driver-incentives", adminVehicleTypeController.listDriverIncentives);
router.post("/driver-incentives", adminVehicleTypeController.createDriverIncentive);
router.get("/driver-incentives/:id", adminVehicleTypeController.getDriverIncentive);
router.patch("/driver-incentives/:id", adminVehicleTypeController.updateDriverIncentive);
router.delete("/driver-incentives/:id", adminVehicleTypeController.deleteDriverIncentive);

router.get("/driver-surges", adminVehicleTypeController.listDriverSurges);
router.post("/driver-surges", adminVehicleTypeController.createDriverSurge);
router.get("/driver-surges/:id", adminVehicleTypeController.getDriverSurge);
router.patch("/driver-surges/:id", adminVehicleTypeController.updateDriverSurge);
router.delete("/driver-surges/:id", adminVehicleTypeController.deleteDriverSurge);

module.exports = router;

