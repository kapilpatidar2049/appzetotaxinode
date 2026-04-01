const express = require("express");
const adminWalletController = require("../controllers/adminWalletController");

const router = express.Router();

// User wallets
router.get("/users", adminWalletController.listUserWallets);
router.get("/users/:user_id", adminWalletController.getUserWallet);
router.post("/users/:user_id/adjust", adminWalletController.adjustUserWallet);

// Driver wallets
router.get("/drivers", adminWalletController.listDriverWallets);
router.get("/drivers/:driver_id", adminWalletController.getDriverWallet);
router.post("/drivers/:driver_id/adjust", adminWalletController.adjustDriverWallet);

// Withdrawal requests
router.get("/withdrawals", adminWalletController.listWithdrawals);
router.get("/withdrawals/:id", adminWalletController.getWithdrawal);
router.patch("/withdrawals/:id", adminWalletController.updateWithdrawalStatus);

module.exports = router;

