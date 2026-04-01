const express = require("express");
const adminUserController = require("../controllers/adminUserController");

const router = express.Router();

router.get("/", adminUserController.listUsers);
router.post("/", adminUserController.createUser);

router.get("/:id/wallet", adminUserController.getWallet);
router.get("/:id/wallet-history", adminUserController.getWalletHistory);
router.get("/:id/requests", adminUserController.getRequests);

router.get("/:id", adminUserController.getUser);
router.patch("/:id", adminUserController.updateUser);
router.delete("/:id", adminUserController.deleteUser);

module.exports = router;
