const express = require("express");
const adminUserController = require("../controllers/adminUserController");

const router = express.Router();

router.get("/", adminUserController.listUsers);
router.post("/", adminUserController.createUser);
router.get("/delete-requests", adminUserController.listDeleteRequests);
router.get("/deleted", adminUserController.listDeleteRequests);
router.get("/deleted/:id/profile", adminUserController.getDeletedUserProfile);
router.patch("/deleted/:id/restore", adminUserController.restoreDeletedUser);
router.delete("/deleted/:id", adminUserController.deletePermanentlyFromDeleted);

router.get("/:id/wallet", adminUserController.getWallet);
router.get("/:id/wallet-history", adminUserController.getWalletHistory);
router.get("/:id/reviews", adminUserController.getReviewHistory);
router.get("/:id/review-history", adminUserController.getReviewHistory);
router.get("/:id/requests", adminUserController.getRequests);
router.get("/:id/requests/:request_id", adminUserController.getRequestDetail);

router.get("/:id", adminUserController.getUser);
router.patch("/:id", adminUserController.updateUser);
router.delete("/:id", adminUserController.deleteUser);

module.exports = router;
