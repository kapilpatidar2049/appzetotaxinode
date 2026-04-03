const mongoose = require("mongoose");
const User = require("../models/User");
const Driver = require("../models/Driver");
const Notification = require("../models/Notification");
const ServiceLocation = require("../models/ServiceLocation");
const { sendFcmNotification, initializeFirebaseAdmin } = require("../services/firebaseAdmin");

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

function normalizeObjectIdList(list) {
  if (!Array.isArray(list)) return [];
  return list.filter((x) => mongoose.Types.ObjectId.isValid(x)).map((x) => String(x));
}

function parsePagination(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
  return { page, limit, skip: (page - 1) * limit };
}

function normalizeSendTo(value) {
  const v = String(value || "").toLowerCase();
  if (["users", "drivers", "all"].includes(v)) return v;
  return null;
}

function parseNotificationPayload(body = {}) {
  const sendTo = normalizeSendTo(body.send_to || body.role || "all");
  return {
    service_location_id: body.service_location_id,
    send_to: sendTo,
    push_title: String(body.push_title || body.title || "").trim(),
    message: String(body.message || body.body || "").trim(),
    banner_image: body.banner_image || body.image || null,
    data: body.data && typeof body.data === "object" ? body.data : undefined,
    active_only: body.active_only !== false,
  };
}

async function resolveRecipientTokens({
  serviceLocationId,
  sendTo,
  activeOnly = true,
  tokens = [],
  userIds = [],
  driverIds = [],
}) {
  const tokensSet = new Set(Array.isArray(tokens) ? tokens.filter(Boolean) : []);
  const normalizedUserIds = normalizeObjectIdList(userIds);
  const normalizedDriverIds = normalizeObjectIdList(driverIds);

  if (normalizedUserIds.length) {
    const users = await User.find({ _id: { $in: normalizedUserIds } }).select("fcm_token").lean();
    for (const u of users) {
      if (u.fcm_token) tokensSet.add(u.fcm_token);
    }
  }

  if (normalizedDriverIds.length) {
    const drivers = await Driver.find({ _id: { $in: normalizedDriverIds } })
      .select("user_id")
      .populate("user_id", "fcm_token")
      .lean();
    for (const d of drivers) {
      if (d.user_id && d.user_id.fcm_token) tokensSet.add(d.user_id.fcm_token);
    }
  }

  const driverScopeFilter = {
    ...(activeOnly ? { active: true } : {}),
    ...(serviceLocationId ? { service_location_id: serviceLocationId } : {}),
  };

  if (sendTo === "users" || sendTo === "all") {
    const users = await User.find({ ...(activeOnly ? { active: true } : {}) })
      .select("fcm_token")
      .lean();
    for (const u of users) {
      if (u.fcm_token) tokensSet.add(u.fcm_token);
    }
  }
  if (sendTo === "drivers" || sendTo === "all") {
    const drivers = await Driver.find(driverScopeFilter)
      .select("user_id")
      .populate("user_id", "fcm_token")
      .lean();
    for (const d of drivers) {
      if (d.user_id && d.user_id.fcm_token) tokensSet.add(d.user_id.fcm_token);
    }
  }

  return Array.from(tokensSet);
}

async function dispatchNotificationPush(notificationDoc, body = {}) {
  if (!initializeFirebaseAdmin()) {
    return {
      recipients: 0,
      sent: 0,
      failed: 0,
      skipped: true,
      reason:
        "Firebase is not configured. Set FIREBASE_SERVICE_ACCOUNT_JSON (or GOOGLE_APPLICATION_CREDENTIALS).",
    };
  }

  const tokens = await resolveRecipientTokens({
    serviceLocationId: notificationDoc.service_location_id || null,
    sendTo: notificationDoc.send_to || "all",
    activeOnly: body.active_only !== false,
    tokens: body.tokens || [],
    userIds: body.user_ids || [],
    driverIds: body.driver_ids || [],
  });

  if (!tokens.length) {
    return { recipients: 0, sent: 0, failed: 0, skipped: true, reason: "No push recipients found." };
  }

  const results = await Promise.all(
    tokens.map((token) =>
      sendFcmNotification(token, notificationDoc.push_title, notificationDoc.message, {
        data: notificationDoc.data,
      })
    )
  );
  const sent = results.filter(Boolean).length;
  const failed = tokens.length - sent;
  return { recipients: tokens.length, sent, failed, skipped: false };
}

async function listNotifications(req, res, next) {
  try {
    const { page, limit, skip } = parsePagination(req);
    const filter = {};
    if (req.query.send_to) {
      const sendTo = normalizeSendTo(req.query.send_to);
      if (!sendTo) return err(res, 422, "send_to must be users, drivers or all");
      filter.send_to = sendTo;
    }
    if (req.query.service_location_id) {
      if (!mongoose.Types.ObjectId.isValid(req.query.service_location_id)) {
        return err(res, 422, "Invalid service_location_id");
      }
      filter.service_location_id = req.query.service_location_id;
    }

    const [items, total] = await Promise.all([
      Notification.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("service_location_id", "name")
        .lean(),
      Notification.countDocuments(filter),
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

async function getNotification(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Notification.findById(id).populate("service_location_id", "name").lean();
    if (!doc) return err(res, 404, "Notification not found");
    return ok(res, { notification: doc });
  } catch (e) {
    next(e);
  }
}

async function createNotification(req, res, next) {
  try {
    const payload = parseNotificationPayload(req.body || {});
    if (req.file) payload.banner_image = `/uploads/notifications/${req.file.filename}`;
    const errors = {};
    if (!payload.push_title) errors.push_title = "push_title is required";
    if (!payload.message) errors.message = "message is required";
    if (!payload.send_to) errors.send_to = "send_to must be users, drivers or all";
    if (!payload.service_location_id) {
      errors.service_location_id = "service_location_id is required";
    } else if (!mongoose.Types.ObjectId.isValid(payload.service_location_id)) {
      errors.service_location_id = "Invalid service_location_id";
    }
    if (Object.keys(errors).length) return err(res, 422, "Validation failed", errors);

    const exists = await ServiceLocation.findById(payload.service_location_id).select("_id").lean();
    if (!exists) return err(res, 422, "Validation failed", { service_location_id: "Service location not found" });

    const doc = await Notification.create({
      service_location_id: payload.service_location_id,
      send_to: payload.send_to,
      push_title: payload.push_title,
      title: payload.push_title,
      message: payload.message,
      body: payload.message,
      banner_image: payload.banner_image,
      data: payload.data,
    });

    const dispatch = await dispatchNotificationPush(doc, req.body || {});
    if (!dispatch.skipped) {
      doc.sent = true;
      doc.sent_at = new Date();
      await doc.save();
    }

    return res.status(201).json({
      success: true,
      message: dispatch.skipped ? "Notification created (push skipped)" : "Notification created and sent",
      notification: doc.toObject(),
      push: dispatch,
    });
  } catch (e) {
    next(e);
  }
}

async function updateNotification(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Notification.findById(id);
    if (!doc) return err(res, 404, "Notification not found");

    const body = req.body || {};
    if (body.service_location_id !== undefined) {
      if (body.service_location_id && !mongoose.Types.ObjectId.isValid(body.service_location_id)) {
        return err(res, 422, "Invalid service_location_id");
      }
      doc.service_location_id = body.service_location_id || null;
    }
    if (body.send_to !== undefined) {
      const sendTo = normalizeSendTo(body.send_to);
      if (!sendTo) return err(res, 422, "send_to must be users, drivers or all");
      doc.send_to = sendTo;
    }
    if (body.push_title !== undefined || body.title !== undefined) {
      const value = String(body.push_title ?? body.title ?? "").trim();
      doc.push_title = value;
      doc.title = value;
    }
    if (body.message !== undefined || body.body !== undefined) {
      const value = String(body.message ?? body.body ?? "").trim();
      doc.message = value;
      doc.body = value;
    }
    if (body.banner_image !== undefined || body.image !== undefined) {
      doc.banner_image = body.banner_image ?? body.image ?? null;
    }
    if (req.file) {
      doc.banner_image = `/uploads/notifications/${req.file.filename}`;
    }
    if (body.data !== undefined && typeof body.data === "object") {
      doc.data = body.data;
    }

    await doc.save();
    return ok(res, { notification: doc.toObject() }, "Updated");
  } catch (e) {
    next(e);
  }
}

async function deleteNotification(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Notification.findByIdAndDelete(id);
    if (!doc) return err(res, 404, "Notification not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

async function sendNotification(req, res, next) {
  try {
    const body = req.body || {};
    const { notification_id } = body;
    let notificationDoc = null;

    if (notification_id) {
      if (!mongoose.Types.ObjectId.isValid(notification_id)) return err(res, 422, "Invalid notification_id");
      notificationDoc = await Notification.findById(notification_id);
      if (!notificationDoc) return err(res, 404, "Notification not found");
    } else {
      const payload = parseNotificationPayload(body);
      if (req.file) payload.banner_image = `/uploads/notifications/${req.file.filename}`;
      if (!payload.push_title) return err(res, 422, "push_title is required");
      if (!payload.message) return err(res, 422, "message is required");
      if (!payload.send_to) return err(res, 422, "send_to must be users, drivers or all");
      notificationDoc = await Notification.create({
        service_location_id:
          payload.service_location_id && mongoose.Types.ObjectId.isValid(payload.service_location_id)
            ? payload.service_location_id
            : null,
        send_to: payload.send_to,
        push_title: payload.push_title,
        title: payload.push_title,
        message: payload.message,
        body: payload.message,
        banner_image: payload.banner_image,
        data: payload.data,
      });
    }

    const dispatch = await dispatchNotificationPush(notificationDoc, body);
    if (!dispatch.skipped) {
      notificationDoc.sent = true;
      notificationDoc.sent_at = new Date();
      await notificationDoc.save();
    }

    return ok(
      res,
      {
        notification_id: notificationDoc._id,
        push: dispatch,
      },
      dispatch.skipped ? "Push skipped" : "Notification sent"
    );
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listNotifications,
  createNotification,
  getNotification,
  updateNotification,
  deleteNotification,
  sendNotification,
};
