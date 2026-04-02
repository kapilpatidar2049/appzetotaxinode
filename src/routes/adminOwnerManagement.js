const express = require("express");
const c = require("../controllers/adminOwnerManagementController");

const router = express.Router();

router.get("/dashboard", c.dashboard);

// Manage Owners CRUD
router.get("/manage-owners", c.listManageOwners);
router.post("/manage-owners", c.createManageOwner);
router.get("/manage-owners/:id", c.getManageOwner);
router.patch("/manage-owners/:id", c.updateManageOwner);
router.delete("/manage-owners/:id", c.deleteManageOwner);
// Approve owner based on required fleet/driver document approvals
router.patch("/manage-owners/:id/approve", c.approveOwner);

// Owner Wallet CRUD + adjustment
router.get("/owner-wallet", c.listOwnerWallets);
router.post("/owner-wallet", c.createOwnerWallet);
router.get("/owner-wallet/:owner_id", c.getOwnerWallet);
router.patch("/owner-wallet/:owner_id", c.updateOwnerWallet);
router.post("/owner-wallet/:owner_id/adjust", c.adjustOwnerWallet);
router.delete("/owner-wallet/:owner_id", c.deleteOwnerWallet);

// Fleet Management / Manage Fleet CRUD
router.get("/fleet-management", c.listFleets);
router.post("/fleet-management", c.createFleet);
router.get("/fleet-management/:id", c.getFleet);
router.patch("/fleet-management/:id", c.updateFleet);
router.delete("/fleet-management/:id", c.deleteFleet);

router.get("/manage-fleet", c.listFleets);
router.post("/manage-fleet", c.createFleet);
router.get("/manage-fleet/:id", c.getFleet);
router.patch("/manage-fleet/:id", c.updateFleet);
router.delete("/manage-fleet/:id", c.deleteFleet);

// Blocked Fleet Drivers CRUD
router.get("/blocked-fleet-drivers", c.listBlockedFleetDrivers);
router.post("/blocked-fleet-drivers", c.createBlockedFleetDriver);
router.get("/blocked-fleet-drivers/:id", c.getBlockedFleetDriver);
router.patch("/blocked-fleet-drivers/:id", c.updateBlockedFleetDriver);
router.delete("/blocked-fleet-drivers/:id", c.deleteBlockedFleetDriver);

// Fleet Needed Document CRUD
router.get("/fleet-needed-document", c.listFleetNeededDocuments);
router.post("/fleet-needed-document", c.createFleetNeededDocument);
router.get("/fleet-needed-document/:id", c.getFleetNeededDocument);
router.patch("/fleet-needed-document/:id", c.updateFleetNeededDocument);
router.delete("/fleet-needed-document/:id", c.deleteFleetNeededDocument);

// Owner Needed Document CRUD
router.get("/owner-needed-document", c.listOwnerNeededDocuments);
router.post("/owner-needed-document", c.createOwnerNeededDocument);
router.get("/owner-needed-document/:id", c.getOwnerNeededDocument);
router.patch("/owner-needed-document/:id", c.updateOwnerNeededDocument);
router.delete("/owner-needed-document/:id", c.deleteOwnerNeededDocument);

// Driver Needed Document CRUD (document_for: normal|fleet|both)
router.get("/driver-needed-document", c.listDriverNeededDocuments);
router.post("/driver-needed-document", c.createDriverNeededDocument);
router.get("/driver-needed-document/:id", c.getDriverNeededDocument);
router.patch("/driver-needed-document/:id", c.updateDriverNeededDocument);
router.delete("/driver-needed-document/:id", c.deleteDriverNeededDocument);

// Uploaded fleet/driver documents review by admin
router.get("/owner-documents", c.listOwnerDocumentUploads);
router.post("/owner-documents", c.uploadOwnerDocument);
router.patch("/owner-documents/:id/review", c.reviewOwnerDocumentUpload);
router.get("/fleet-documents", c.listFleetDocumentUploads);
router.patch("/fleet-documents/:id/review", c.reviewFleetDocumentUpload);
router.get("/driver-documents", c.listDriverDocumentUploads);
router.patch("/driver-documents/:id/review", c.reviewDriverDocumentUpload);

// Approve/reject fleet + driver based on required document approvals
router.patch("/fleet-management/:id/approve", c.approveFleet);
router.patch("/drivers/:id/approve", c.approveDriver);

// Driver ratings
router.get("/driver-ratings", c.listDriverRatings);
router.get("/driver-ratings/:id", c.getDriverRatingDetails);

module.exports = router;
