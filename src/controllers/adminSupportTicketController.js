const mongoose = require("mongoose");
const SupportTicket = require("../models/SupportTicket");
const SupportTicketMessage = require("../models/SupportTicketMessage");
const SupportTicketTitle = require("../models/SupportTicketTitle");

function ok(res, data, message = "success") {
  return res.json({ success: true, message, data });
}

function err(res, status, message, errors) {
  return res.status(status).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}

function parsePage(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

// Ticket titles (master)
async function listTitles(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const { active, user_type } = req.query;
    const filter = {};
    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;
    if (user_type) filter.user_type = user_type;

    const [items, total] = await Promise.all([
      SupportTicketTitle.find(filter)
        .sort({ order: 1, createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupportTicketTitle.countDocuments(filter),
    ]);

    return ok(res, {
      results: items,
      paginator: {
        total,
        per_page: limit,
        current_page: page,
        last_page: Math.ceil(total / limit) || 1,
      },
    });
  } catch (e) {
    next(e);
  }
}

async function getTitle(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await SupportTicketTitle.findById(id).lean();
    if (!doc) return err(res, 404, "Support ticket title not found");
    return ok(res, { title: doc });
  } catch (e) {
    next(e);
  }
}

async function createTitle(req, res, next) {
  try {
    const body = req.body || {};
    if (!body.title) return err(res, 422, "title is required");
    const doc = await SupportTicketTitle.create({
      title: String(body.title).trim(),
      user_type: body.user_type || "all",
      active: body.active !== false,
      order: body.order != null ? Number(body.order) : 0,
    });
    return res
      .status(201)
      .json({ success: true, message: "Created", title: doc.toObject() });
  } catch (e) {
    next(e);
  }
}

async function updateTitle(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await SupportTicketTitle.findById(id);
    if (!doc) return err(res, 404, "Support ticket title not found");

    const body = req.body || {};
    if (body.title !== undefined) doc.title = String(body.title).trim();
    if (body.user_type !== undefined) doc.user_type = body.user_type;
    if (body.order !== undefined) doc.order = body.order == null ? 0 : Number(body.order);
    if (body.active !== undefined) doc.active = Boolean(body.active);

    await doc.save();
    return ok(res, { title: doc.toObject() }, "Updated");
  } catch (e) {
    next(e);
  }
}

async function deleteTitle(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");

    const ticketCount = await SupportTicket.countDocuments({ support_ticket_title_id: id });
    if (ticketCount > 0) {
      return err(res, 422, "Cannot delete title with existing tickets");
    }

    const doc = await SupportTicketTitle.findByIdAndDelete(id);
    if (!doc) return err(res, 404, "Support ticket title not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

// Tickets
async function listTickets(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      SupportTicket.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("support_ticket_title_id", "title")
        .lean(),
      SupportTicket.countDocuments(filter),
    ]);

    return ok(res, {
      results: items,
      paginator: {
        total,
        per_page: limit,
        current_page: page,
        last_page: Math.ceil(total / limit) || 1,
      },
    });
  } catch (e) {
    next(e);
  }
}

async function getTicket(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");

    const ticket = await SupportTicket.findById(id)
      .populate("support_ticket_title_id", "title")
      .lean();
    if (!ticket) return err(res, 404, "Ticket not found");

    const messages = await SupportTicketMessage.find({ support_ticket_id: id })
      .sort({ createdAt: 1 })
      .lean();

    return ok(res, { ticket, messages });
  } catch (e) {
    next(e);
  }
}

async function replyToTicket(req, res, next) {
  try {
    const { id } = req.params;
    const { message } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    if (!message) return err(res, 422, "message is required");

    const ticket = await SupportTicket.findById(id);
    if (!ticket) return err(res, 404, "Ticket not found");

    await SupportTicketMessage.create({
      support_ticket_id: ticket._id,
      message,
    });

    if (ticket.status === "open") {
      ticket.status = "in_progress";
      await ticket.save();
    }

    return ok(res, null, "Reply added");
  } catch (e) {
    next(e);
  }
}

async function updateTicketStatus(req, res, next) {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    if (!status) return err(res, 422, "status is required");
    const allowed = ["open", "in_progress", "closed"];
    if (!allowed.includes(status)) return err(res, 422, "Invalid status");

    const ticket = await SupportTicket.findById(id);
    if (!ticket) return err(res, 404, "Ticket not found");

    ticket.status = status;
    if (status === "closed") {
      ticket.closed_at = ticket.closed_at || new Date();
    }
    await ticket.save();

    return ok(res, { ticket: ticket.toObject() }, "Updated");
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listTitles,
  getTitle,
  createTitle,
  updateTitle,
  deleteTitle,
  listTickets,
  getTicket,
  replyToTicket,
  updateTicketStatus,
};

