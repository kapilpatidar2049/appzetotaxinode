const mongoose = require("mongoose");
const crypto = require("crypto");
const NotificationChannelTemplate = require("../models/NotificationChannelTemplate");

function err(res, status, message, errors) {
  return res.status(status).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });
}

function parsePage(req) {
  const page = Math.max(1, parseInt(req.query.page, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
  return { page, limit, skip: (page - 1) * limit };
}

function isoLaravel(d) {
  if (!d) return null;
  const x = d instanceof Date ? d : new Date(d);
  return x.toISOString().replace(/\.\d{3}Z$/, ".000000Z");
}

function translationRowId(sub) {
  const s = String(sub._id || "");
  const n = parseInt(s.slice(-8), 16);
  return Number.isFinite(n) ? n : 0;
}

function formatTranslationWord(channelUuid, sub) {
  const o = sub.toObject ? sub.toObject() : sub;
  return {
    id: translationRowId(o),
    notification_channel_id: channelUuid,
    email_subject: o.email_subject ?? "",
    mail_body: o.mail_body ?? "",
    button_name: o.button_name ?? "",
    footer_content: o.footer_content ?? "",
    footer_copyrights: o.footer_copyrights ?? "",
    push_title: o.push_title ?? "",
    push_body: o.push_body ?? "",
    locale: o.locale ?? "",
    created_at: null,
    updated_at: null,
  };
}

function formatChannel(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  const uuid = o.uuid || String(o._id);
  const translations = (o.translations || []).map((t) => formatTranslationWord(uuid, t));

  return {
    id: uuid,
    role: o.role ?? "user",
    topics: o.topics ?? "",
    topics_content: o.topics_content ?? "",
    push_notification: Number(o.push_notification) ? 1 : 0,
    mail: Number(o.mail) ? 1 : 0,
    sms: Number(o.sms) ? 1 : 0,
    email_subject: o.email_subject ?? "",
    logo_img: o.logo_img ?? "",
    mail_body: o.mail_body ?? "",
    button_name: o.button_name ?? "",
    button_url: o.button_url ?? "",
    show_button: Number(o.show_button) ? 1 : 0,
    banner_img: o.banner_img ?? "",
    show_img: Number(o.show_img) ? 1 : 0,
    footer: o.footer ?? "",
    footer_content: o.footer_content ?? "",
    footer_copyrights: o.footer_copyrights ?? "",
    show_fbicon: Number(o.show_fbicon) !== 0 ? 1 : 0,
    show_instaicon: Number(o.show_instaicon) !== 0 ? 1 : 0,
    show_twittericon: Number(o.show_twittericon) !== 0 ? 1 : 0,
    show_linkedinicon: Number(o.show_linkedinicon) !== 0 ? 1 : 0,
    push_title: o.push_title ?? "",
    push_body: o.push_body ?? "",
    translation_dataset: o.translation_dataset ?? "",
    created_at: isoLaravel(o.createdAt),
    updated_at: isoLaravel(o.updatedAt),
    notification_channel_translation_words: translations,
  };
}

function listBaseUrl(req) {
  const envBase = process.env.APP_URL && String(process.env.APP_URL).replace(/\/+$/, "");
  if (envBase) return `${envBase}/api/v1/admin/notification-channels`;
  return `${req.protocol}://${req.get("host")}/api/v1/admin/notification-channels`;
}

function parseSort(sortRaw) {
  const s = String(sortRaw || "").trim();
  if (!s) return { createdAt: -1 };
  const desc = s.startsWith("-");
  const key = desc ? s.slice(1) : s;
  const map = {
    created_at: "createdAt",
    updated_at: "updatedAt",
    topics: "topics",
    role: "role",
  };
  const field = map[key] || "createdAt";
  return { [field]: desc ? -1 : 1 };
}

function buildPaginator(req, { page, limit, total, rows, extraQuery = {} }) {
  const lastPage = Math.ceil(total / limit) || 1;
  const path = listBaseUrl(req);

  const pageUrl = (pNum) => {
    const pms = new URLSearchParams();
    pms.set("limit", String(limit));
    pms.set("page", String(pNum));
    if (extraQuery.roletype) pms.set("roletype", String(extraQuery.roletype));
    if (extraQuery.sort) pms.set("sort", String(extraQuery.sort));
    if (extraQuery.search) pms.set("search", String(extraQuery.search));
    return `${path}?${pms.toString()}`;
  };

  const links = [];
  links.push({
    url: page > 1 ? pageUrl(page - 1) : null,
    label: "&laquo; Previous",
    page: null,
    active: false,
  });
  for (let i = 1; i <= lastPage; i += 1) {
    links.push({
      url: pageUrl(i),
      label: String(i),
      page: i,
      active: i === page,
    });
  }
  links.push({
    url: page < lastPage ? pageUrl(page + 1) : null,
    label: "Next &raquo;",
    page: null,
    active: false,
  });

  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = (page - 1) * limit + rows.length;

  return {
    current_page: page,
    data: rows,
    first_page_url: pageUrl(1),
    from,
    last_page: lastPage,
    last_page_url: pageUrl(lastPage),
    links,
    next_page_url: page < lastPage ? pageUrl(page + 1) : null,
    path,
    per_page: limit,
    prev_page_url: page > 1 ? pageUrl(page - 1) : null,
    to,
    total,
  };
}

function resolveIdFilter(id) {
  if (mongoose.Types.ObjectId.isValid(id) && String(id).length === 24) {
    return { $or: [{ _id: id }, { uuid: id }] };
  }
  return { uuid: id };
}

function to01(v) {
  if (v === undefined || v === null) return undefined;
  if (typeof v === "boolean") return v ? 1 : 0;
  const n = Number(v);
  if (Number.isFinite(n)) return n !== 0 ? 1 : 0;
  const s = String(v).toLowerCase();
  if (s === "true") return 1;
  if (s === "false" || s === "0") return 0;
  return v ? 1 : 0;
}

async function listNotificationChannels(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const { roletype, search } = req.query;
    const filter = {};

    if (roletype && String(roletype).trim()) {
      filter.role = String(roletype).trim().toLowerCase();
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      const rx = new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i");
      filter.$or = [{ topics: rx }, { topics_content: rx }, { email_subject: rx }];
    }

    const sort = parseSort(req.query.sort);

    const [docs, total] = await Promise.all([
      NotificationChannelTemplate.find(filter).sort(sort).skip(skip).limit(limit).lean(),
      NotificationChannelTemplate.countDocuments(filter),
    ]);

    const rows = docs.map((d) => formatChannel(d));
    const extraQuery = {
      roletype: req.query.roletype,
      sort: req.query.sort,
      search: req.query.search,
    };
    const paginator = buildPaginator(req, { page, limit, total, rows, extraQuery });

    return res.json({
      success: true,
      message: "success",
      results: rows,
      paginator,
    });
  } catch (e) {
    next(e);
  }
}

async function getNotificationChannel(req, res, next) {
  try {
    const { id } = req.params;
    const doc = await NotificationChannelTemplate.findOne(resolveIdFilter(id)).lean();
    if (!doc) return err(res, 404, "Notification channel not found");
    return res.json({
      success: true,
      message: "success",
      data: formatChannel(doc),
    });
  } catch (e) {
    next(e);
  }
}

function normalizeTranslations(body) {
  if (!body || !Array.isArray(body.notification_channel_translation_words)) {
    return undefined;
  }
  return body.notification_channel_translation_words.map((t) => ({
    locale: String(t.locale || "").trim() || "en",
    email_subject: t.email_subject != null ? String(t.email_subject) : "",
    mail_body: t.mail_body != null ? String(t.mail_body) : "",
    button_name: t.button_name != null ? String(t.button_name) : "",
    footer_content: t.footer_content != null ? String(t.footer_content) : "",
    footer_copyrights: t.footer_copyrights != null ? String(t.footer_copyrights) : "",
    push_title: t.push_title != null ? String(t.push_title) : "",
    push_body: t.push_body != null ? String(t.push_body) : "",
  }));
}

async function updateNotificationChannel(req, res, next) {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const doc = await NotificationChannelTemplate.findOne(resolveIdFilter(id));
    if (!doc) return err(res, 404, "Notification channel not found");

    const set = {};
    const fields = [
      "role",
      "topics",
      "topics_content",
      "email_subject",
      "logo_img",
      "mail_body",
      "button_name",
      "button_url",
      "banner_img",
      "footer",
      "footer_content",
      "footer_copyrights",
      "push_title",
      "push_body",
      "translation_dataset",
    ];
    for (const k of fields) {
      if (body[k] !== undefined) set[k] = typeof body[k] === "string" ? body[k] : String(body[k] ?? "");
    }

    if (body.push_notification !== undefined) set.push_notification = to01(body.push_notification);
    if (body.mail !== undefined) set.mail = to01(body.mail);
    if (body.sms !== undefined) set.sms = to01(body.sms);
    if (body.show_button !== undefined) set.show_button = to01(body.show_button);
    if (body.show_img !== undefined) set.show_img = to01(body.show_img);
    if (body.show_fbicon !== undefined) set.show_fbicon = to01(body.show_fbicon);
    if (body.show_instaicon !== undefined) set.show_instaicon = to01(body.show_instaicon);
    if (body.show_twittericon !== undefined) set.show_twittericon = to01(body.show_twittericon);
    if (body.show_linkedinicon !== undefined) set.show_linkedinicon = to01(body.show_linkedinicon);

    Object.assign(doc, set);

    const tr = normalizeTranslations(body);
    if (tr) doc.translations = tr;

    await doc.save();

    return res.json({
      success: true,
      message: "success",
      data: formatChannel(doc),
    });
  } catch (e) {
    next(e);
  }
}

async function togglePush(req, res, next) {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const doc = await NotificationChannelTemplate.findOne(resolveIdFilter(id));
    if (!doc) return err(res, 404, "Notification channel not found");

    const raw = body.push_notification !== undefined ? body.push_notification : body.enabled;
    if (raw === undefined) {
      return err(res, 422, "Validation failed", {
        push_notification: "push_notification or enabled is required (0/1 or true/false)",
      });
    }
    doc.push_notification = to01(raw);
    await doc.save();

    return res.json({
      success: true,
      message: "success",
      data: formatChannel(doc),
    });
  } catch (e) {
    next(e);
  }
}

async function toggleMail(req, res, next) {
  try {
    const { id } = req.params;
    const body = req.body || {};
    const doc = await NotificationChannelTemplate.findOne(resolveIdFilter(id));
    if (!doc) return err(res, 404, "Notification channel not found");

    const raw = body.mail !== undefined ? body.mail : body.enabled;
    if (raw === undefined) {
      return err(res, 422, "Validation failed", {
        mail: "mail or enabled is required (0/1 or true/false)",
      });
    }
    doc.mail = to01(raw);
    await doc.save();

    return res.json({
      success: true,
      message: "success",
      data: formatChannel(doc),
    });
  } catch (e) {
    next(e);
  }
}

async function createNotificationChannel(req, res, next) {
  try {
    const body = req.body || {};
    const topics = body.topics != null ? String(body.topics).trim() : "";
    if (!topics) return err(res, 422, "Validation failed", { topics: "topics is required" });

    const payload = {
      uuid: body.uuid && String(body.uuid).trim() ? String(body.uuid).trim() : crypto.randomUUID(),
      role: body.role != null ? String(body.role).trim().toLowerCase() : "user",
      topics,
      topics_content: body.topics_content != null ? String(body.topics_content) : "",
      push_notification: to01(body.push_notification ?? 1),
      mail: to01(body.mail ?? 0),
      sms: to01(body.sms ?? 0),
      email_subject: body.email_subject != null ? String(body.email_subject) : "",
      logo_img: body.logo_img != null ? String(body.logo_img) : "",
      mail_body: body.mail_body != null ? String(body.mail_body) : "",
      button_name: body.button_name != null ? String(body.button_name) : "",
      button_url: body.button_url != null ? String(body.button_url) : "",
      show_button: to01(body.show_button ?? 0),
      banner_img: body.banner_img != null ? String(body.banner_img) : "",
      show_img: to01(body.show_img ?? 0),
      footer: body.footer != null ? String(body.footer) : "",
      footer_content: body.footer_content != null ? String(body.footer_content) : "",
      footer_copyrights: body.footer_copyrights != null ? String(body.footer_copyrights) : "",
      show_fbicon: to01(body.show_fbicon ?? 1),
      show_instaicon: to01(body.show_instaicon ?? 1),
      show_twittericon: to01(body.show_twittericon ?? 1),
      show_linkedinicon: to01(body.show_linkedinicon ?? 1),
      push_title: body.push_title != null ? String(body.push_title) : "",
      push_body: body.push_body != null ? String(body.push_body) : "",
      translation_dataset: body.translation_dataset != null ? String(body.translation_dataset) : "",
    };

    const tr = normalizeTranslations(body);
    if (tr) payload.translations = tr;

    const doc = await NotificationChannelTemplate.create(payload);
    return res.status(201).json({
      success: true,
      message: "success",
      data: formatChannel(doc),
    });
  } catch (e) {
    if (e.code === 11000) return err(res, 422, "Duplicate uuid or topics for this role");
    next(e);
  }
}

module.exports = {
  listNotificationChannels,
  getNotificationChannel,
  createNotificationChannel,
  updateNotificationChannel,
  togglePush,
  toggleMail,
};
