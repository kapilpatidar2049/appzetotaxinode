const express = require("express");
const adminSupportTicketController = require("../controllers/adminSupportTicketController");

const router = express.Router();

// Titles
router.get("/titles", adminSupportTicketController.listTitles);
router.post("/titles", adminSupportTicketController.createTitle);
router.get("/titles/:id", adminSupportTicketController.getTitle);
router.patch("/titles/:id", adminSupportTicketController.updateTitle);
router.delete("/titles/:id", adminSupportTicketController.deleteTitle);

// Tickets
router.get("/", adminSupportTicketController.listTickets);
router.get("/:id", adminSupportTicketController.getTicket);
router.post("/:id/reply", adminSupportTicketController.replyToTicket);
router.patch("/:id/status", adminSupportTicketController.updateTicketStatus);

module.exports = router;

