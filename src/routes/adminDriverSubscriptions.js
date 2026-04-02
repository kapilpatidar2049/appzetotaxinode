const express = require("express");
const c = require("../controllers/adminDriverSubscriptionController");

const router = express.Router();

router.get("/plans/list", c.listPlans);
router.post("/plans", c.createPlan);
router.get("/plans/:id", c.getPlan);
router.patch("/plans/:id", c.updatePlan);
router.delete("/plans/:id", c.deletePlan);

router.get("/", c.listSubscriptions);
router.post("/", c.createSubscription);
router.get("/:id", c.getSubscription);
router.patch("/:id", c.updateSubscription);
router.delete("/:id", c.deleteSubscription);

module.exports = router;
