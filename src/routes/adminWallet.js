const express = require("express");
const adminWalletController = require("../controllers/adminWalletController");

const router = express.Router();

// User wallets
router.get("/users", adminWalletController.listUserWallets);
router.get("/users/:user_id", adminWalletController.getUserWallet);
router.post("/users/:user_id/adjust", adminWalletController.adjustUserWallet);
router.post("/users/:user_id/add", adminWalletController.addUserWalletAmount);
router.post("/users/:user_id/deduct", adminWalletController.deductUserWalletAmount);

// Driver wallets
router.get("/drivers", adminWalletController.listDriverWallets);
router.get("/drivers/negative", adminWalletController.listNegativeDriverWallets);
router.get("/drivers/withdrawals", adminWalletController.listDriversWithWithdrawals);
router.get("/drivers/:driver_id/withdrawals", adminWalletController.listWithdrawalsForDriver);
router.get("/drivers/:driver_id", adminWalletController.getDriverWallet);
router.post("/drivers/:driver_id/adjust", adminWalletController.adjustDriverWallet);
router.post("/drivers/:driver_id/add", adminWalletController.addDriverWalletAmount);
router.post("/drivers/:driver_id/deduct", adminWalletController.deductDriverWalletAmount);

// Withdrawal requests
router.get("/withdrawals", adminWalletController.listWithdrawals);
router.get("/withdrawals/:id", adminWalletController.getWithdrawal);
router.patch("/withdrawals/:id", adminWalletController.updateWithdrawalStatus);
router.delete("/withdrawals/:id", adminWalletController.deleteWithdrawalRequest);

module.exports = router;

