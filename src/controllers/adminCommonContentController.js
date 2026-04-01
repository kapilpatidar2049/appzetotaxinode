const mongoose = require("mongoose");
const Sos = require("../models/Sos");
const Faq = require("../models/Faq");
const CancellationReason = require("../models/CancellationReason");
const MobileAppSetting = require("../models/MobileAppSetting");

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

// FAQs
async function listFaqs(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const { active, user_type } = req.query;
    const filter = {};
    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;
    if (user_type) filter.user_type = user_type;

    const [items, total] = await Promise.all([
      Faq.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit).lean(),
      Faq.countDocuments(filter),
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

async function getFaq(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Faq.findById(id).lean();
    if (!doc) return err(res, 404, "Faq not found");
    return ok(res, { faq: doc });
  } catch (e) {
    next(e);
  }
}

async function createFaq(req, res, next) {
  try {
    const body = req.body || {};
    if (!body.question || !body.answer) {
      return err(res, 422, "question and answer are required");
    }
    const doc = await Faq.create({
      question: String(body.question).trim(),
      answer: String(body.answer).trim(),
      user_type: body.user_type || "all",
      active: body.active !== false,
      order: body.order != null ? Number(body.order) : 0,
    });
    return res.status(201).json({ success: true, message: "Created", faq: doc.toObject() });
  } catch (e) {
    next(e);
  }
}

async function updateFaq(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Faq.findById(id);
    if (!doc) return err(res, 404, "Faq not found");

    const body = req.body || {};
    if (body.question !== undefined) doc.question = String(body.question).trim();
    if (body.answer !== undefined) doc.answer = String(body.answer).trim();
    if (body.user_type !== undefined) doc.user_type = body.user_type;
    if (body.order !== undefined) doc.order = body.order == null ? 0 : Number(body.order);
    if (body.active !== undefined) doc.active = Boolean(body.active);

    await doc.save();
    return ok(res, { faq: doc.toObject() }, "Updated");
  } catch (e) {
    next(e);
  }
}

async function deleteFaq(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Faq.findByIdAndDelete(id);
    if (!doc) return err(res, 404, "Faq not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

// Cancellation reasons
async function listCancellationReasons(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const { active, user_type } = req.query;
    const filter = {};
    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;
    if (user_type) filter.user_type = user_type;

    const [items, total] = await Promise.all([
      CancellationReason.find(filter)
        .sort({ order: 1, createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      CancellationReason.countDocuments(filter),
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

async function getCancellationReason(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await CancellationReason.findById(id).lean();
    if (!doc) return err(res, 404, "Cancellation reason not found");
    return ok(res, { cancellation_reason: doc });
  } catch (e) {
    next(e);
  }
}

async function createCancellationReason(req, res, next) {
  try {
    const body = req.body || {};
    if (!body.reason) return err(res, 422, "reason is required");
    const doc = await CancellationReason.create({
      reason: String(body.reason).trim(),
      user_type: body.user_type || "both",
      active: body.active !== false,
      order: body.order != null ? Number(body.order) : 0,
    });
    return res
      .status(201)
      .json({ success: true, message: "Created", cancellation_reason: doc.toObject() });
  } catch (e) {
    next(e);
  }
}

async function updateCancellationReason(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await CancellationReason.findById(id);
    if (!doc) return err(res, 404, "Cancellation reason not found");

    const body = req.body || {};
    if (body.reason !== undefined) doc.reason = String(body.reason).trim();
    if (body.user_type !== undefined) doc.user_type = body.user_type;
    if (body.order !== undefined) doc.order = body.order == null ? 0 : Number(body.order);
    if (body.active !== undefined) doc.active = Boolean(body.active);

    await doc.save();
    return ok(res, { cancellation_reason: doc.toObject() }, "Updated");
  } catch (e) {
    next(e);
  }
}

async function deleteCancellationReason(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await CancellationReason.findByIdAndDelete(id);
    if (!doc) return err(res, 404, "Cancellation reason not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

// SOS master list (global SOS numbers, not per-user contacts)
async function listSos(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const { active, type } = req.query;
    const filter = {};
    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;
    if (type) filter.type = type;

    const [items, total] = await Promise.all([
      Sos.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Sos.countDocuments(filter),
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

async function getSos(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Sos.findById(id).lean();
    if (!doc) return err(res, 404, "Sos not found");
    return ok(res, { sos: doc });
  } catch (e) {
    next(e);
  }
}

async function createSos(req, res, next) {
  try {
    const body = req.body || {};
    if (!body.name || !body.number) {
      return err(res, 422, "name and number are required");
    }
    const doc = await Sos.create({
      name: String(body.name).trim(),
      number: String(body.number).trim(),
      type: body.type || "event",
      active: body.active !== false,
    });
    return res.status(201).json({ success: true, message: "Created", sos: doc.toObject() });
  } catch (e) {
    next(e);
  }
}

async function updateSos(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Sos.findById(id);
    if (!doc) return err(res, 404, "Sos not found");

    const body = req.body || {};
    if (body.name !== undefined) doc.name = String(body.name).trim();
    if (body.number !== undefined) doc.number = String(body.number).trim();
    if (body.type !== undefined) doc.type = body.type;
    if (body.active !== undefined) doc.active = Boolean(body.active);

    await doc.save();
    return ok(res, { sos: doc.toObject() }, "Updated");
  } catch (e) {
    next(e);
  }
}

async function deleteSos(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Sos.findByIdAndDelete(id);
    if (!doc) return err(res, 404, "Sos not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

// App modules (taxi/delivery x normal/rental/outstation)
async function listAppModules(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const { active, transport_type, service_type } = req.query;
    const filter = {};
    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;
    if (transport_type) filter.transport_type = String(transport_type).toLowerCase();
    if (service_type) filter.service_type = String(service_type).toLowerCase();

    const [items, total] = await Promise.all([
      MobileAppSetting.find(filter)
        .sort({ order_by: 1, createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      MobileAppSetting.countDocuments(filter),
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

async function createAppModule(req, res, next) {
  try {
    const body = req.body || {};
    const transportType = String(body.transport_type || "").toLowerCase();
    const serviceType = String(body.service_type || "").toLowerCase();
    const allowedTransport = ["taxi", "delivery"];
    const allowedService = ["normal", "rental", "outstation"];

    if (!body.name) return err(res, 422, "name is required");
    if (!allowedTransport.includes(transportType)) {
      return err(res, 422, "transport_type must be taxi or delivery");
    }
    if (!allowedService.includes(serviceType)) {
      return err(res, 422, "service_type must be normal, rental, or outstation");
    }

    const doc = await MobileAppSetting.create({
      name: String(body.name).trim(),
      transport_type: transportType,
      short_description: body.short_description != null ? String(body.short_description).trim() : "",
      description: body.description != null ? String(body.description).trim() : "",
      service_type: serviceType,
      mobile_menu_icon: body.mobile_menu_icon || null,
      order_by: body.order_by != null ? String(body.order_by) : "0",
      active: body.active !== false,
    });

    return res
      .status(201)
      .json({ success: true, message: "Created", app_module: doc.toObject() });
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", {
        duplicate: "Module already exists for this name + transport_type + service_type",
      });
    }
    next(e);
  }
}

async function getAppModule(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await MobileAppSetting.findById(id).lean();
    if (!doc) return err(res, 404, "App module not found");
    return ok(res, { app_module: doc });
  } catch (e) {
    next(e);
  }
}

async function updateAppModule(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await MobileAppSetting.findById(id);
    if (!doc) return err(res, 404, "App module not found");

    const body = req.body || {};
    const allowedTransport = ["taxi", "delivery"];
    const allowedService = ["normal", "rental", "outstation"];

    if (body.name !== undefined) doc.name = String(body.name).trim();
    if (body.transport_type !== undefined) {
      const transportType = String(body.transport_type).toLowerCase();
      if (!allowedTransport.includes(transportType)) {
        return err(res, 422, "transport_type must be taxi or delivery");
      }
      doc.transport_type = transportType;
    }
    if (body.service_type !== undefined) {
      const serviceType = String(body.service_type).toLowerCase();
      if (!allowedService.includes(serviceType)) {
        return err(res, 422, "service_type must be normal, rental, or outstation");
      }
      doc.service_type = serviceType;
    }
    if (body.short_description !== undefined) doc.short_description = body.short_description;
    if (body.description !== undefined) doc.description = body.description;
    if (body.mobile_menu_icon !== undefined) doc.mobile_menu_icon = body.mobile_menu_icon;
    if (body.order_by !== undefined) doc.order_by = body.order_by != null ? String(body.order_by) : "0";
    if (body.active !== undefined) doc.active = Boolean(body.active);

    await doc.save();
    return ok(res, { app_module: doc.toObject() }, "Updated");
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", {
        duplicate: "Module already exists for this name + transport_type + service_type",
      });
    }
    next(e);
  }
}

async function deleteAppModule(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await MobileAppSetting.findByIdAndDelete(id);
    if (!doc) return err(res, 404, "App module not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listFaqs,
  getFaq,
  createFaq,
  updateFaq,
  deleteFaq,
  listCancellationReasons,
  getCancellationReason,
  createCancellationReason,
  updateCancellationReason,
  deleteCancellationReason,
  listSos,
  getSos,
  createSos,
  updateSos,
  deleteSos,
  listAppModules,
  createAppModule,
  getAppModule,
  updateAppModule,
  deleteAppModule,
};

