const mongoose = require("mongoose");
const Language = require("../models/Language");

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

/** Payload: code "hi,Hindi" → code hi, name Hindi */
function parseCodeAndName(body) {
  const rawCode = body.code != null ? String(body.code).trim() : "";
  const explicitName = body.name != null ? String(body.name).trim() : "";

  if (rawCode.includes(",")) {
    const idx = rawCode.indexOf(",");
    const code = rawCode.slice(0, idx).trim().toLowerCase();
    const nameFromCode = rawCode.slice(idx + 1).trim();
    return {
      code: code.replace(/\s+/g, ""),
      name: explicitName || nameFromCode,
    };
  }

  return {
    code: rawCode.toLowerCase().replace(/\s+/g, ""),
    name: explicitName || rawCode,
  };
}

function formatLanguageRow(doc) {
  const o = doc.toObject ? doc.toObject() : doc;
  const created = o.createdAt ? new Date(o.createdAt) : null;
  const updated = o.updatedAt ? new Date(o.updatedAt) : null;
  const iso = (d) =>
    d
      ? d.toISOString().replace(/\.\d{3}Z$/, ".000000Z")
      : null;

  return {
    id: o._id,
    name: o.name,
    code: o.code,
    direction: o.direction || "ltr",
    active: o.active ? 1 : 0,
    default_status: o.is_default ? 1 : 0,
    created_at: iso(created),
    updated_at: iso(updated),
  };
}

function listBaseUrl(req) {
  const envBase = process.env.APP_URL && String(process.env.APP_URL).replace(/\/+$/, "");
  if (envBase) return `${envBase}/api/v1/admin/languages`;
  return `${req.protocol}://${req.get("host")}/api/v1/admin/languages`;
}

function buildPaginator(req, { page, limit, total, rows }) {
  const lastPage = Math.ceil(total / limit) || 1;
  const path = listBaseUrl(req);
  const queryBase = `limit=${limit}`;
  const pageUrl = (p) => `${path}?${queryBase}&page=${p}`;

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

async function clearOtherDefaults(exceptId) {
  await Language.updateMany(
    { _id: { $ne: exceptId }, is_default: true },
    { $set: { is_default: false } }
  );
}

async function listLanguages(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const { active, search } = req.query;
    const filter = {};
    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;
    if (search && String(search).trim()) {
      const q = String(search).trim();
      filter.$or = [
        { name: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
        { code: new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") },
      ];
    }

    const [docs, total] = await Promise.all([
      Language.find(filter).sort({ order: 1, name: 1 }).skip(skip).limit(limit).lean(),
      Language.countDocuments(filter),
    ]);

    const rows = docs.map((d) => formatLanguageRow(d));
    const paginator = buildPaginator(req, { page, limit, total, rows });

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

async function getLanguage(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Language.findById(id).lean();
    if (!doc) return err(res, 404, "Language not found");
    return res.json({
      success: true,
      message: "success",
      data: formatLanguageRow(doc),
    });
  } catch (e) {
    next(e);
  }
}

async function createLanguage(req, res, next) {
  try {
    const body = req.body || {};
    const { code, name } = parseCodeAndName(body);
    const direction = String(body.direction || "ltr").toLowerCase();
    if (!code) return err(res, 422, "code is required (e.g. hi,Hindi or code + name)");
    if (!name) return err(res, 422, "name is required (use hi,Hindi in code or pass name)");
    if (!["ltr", "rtl"].includes(direction)) {
      return err(res, 422, "direction must be ltr or rtl");
    }

    const active = body.active === undefined ? true : body.active === true || body.active === 1 || body.active === "1";
    const defaultStatus =
      body.default_status === 1 ||
      body.default_status === true ||
      body.default_status === "1";

    if (defaultStatus) {
      await Language.updateMany({}, { $set: { is_default: false } });
    }

    const order =
      body.order != null && body.order !== ""
        ? Number(body.order)
        : (await Language.countDocuments()) + 1;

    const doc = await Language.create({
      name,
      code,
      direction,
      active,
      is_default: Boolean(defaultStatus),
      order: Number.isFinite(order) ? order : 0,
    });

    return res.status(201).json({
      success: true,
      message: "Created",
      data: formatLanguageRow(doc),
    });
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", { code: "Language code already exists" });
    }
    next(e);
  }
}

async function updateLanguage(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Language.findById(id);
    if (!doc) return err(res, 404, "Language not found");

    const body = req.body || {};

    if (body.code !== undefined || body.name !== undefined) {
      const codeStr = body.code !== undefined ? String(body.code) : "";
      if (codeStr.includes(",")) {
        const p = parseCodeAndName(body);
        if (p.code) doc.code = p.code;
        if (p.name) doc.name = p.name;
      } else {
        if (body.code !== undefined) doc.code = codeStr.trim().toLowerCase().replace(/\s+/g, "");
        if (body.name !== undefined) doc.name = String(body.name).trim();
      }
    }

    if (body.direction !== undefined) {
      const direction = String(body.direction).toLowerCase();
      if (!["ltr", "rtl"].includes(direction)) {
        return err(res, 422, "direction must be ltr or rtl");
      }
      doc.direction = direction;
    }

    if (body.active !== undefined) {
      doc.active = body.active === true || body.active === 1 || body.active === "1";
    }

    if (body.default_status !== undefined || body.is_default !== undefined) {
      const def =
        body.default_status !== undefined ? body.default_status : body.is_default;
      const on = def === true || def === 1 || def === "1";
      if (on) await clearOtherDefaults(doc._id);
      doc.is_default = on;
    }

    if (body.order !== undefined) doc.order = body.order == null ? 0 : Number(body.order);

    await doc.save();

    return res.json({
      success: true,
      message: "Updated",
      data: formatLanguageRow(doc),
    });
  } catch (e) {
    if (e && e.code === 11000) {
      return err(res, 422, "Validation failed", { code: "Language code already exists" });
    }
    next(e);
  }
}

async function updateLanguageStatus(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Language.findById(id);
    if (!doc) return err(res, 404, "Language not found");

    const body = req.body || {};

    if (body.active !== undefined) {
      doc.active = body.active === true || body.active === 1 || body.active === "1";
    }

    if (body.default_status !== undefined) {
      const on = body.default_status === true || body.default_status === 1 || body.default_status === "1";
      if (on) await clearOtherDefaults(doc._id);
      doc.is_default = on;
    }

    await doc.save();

    return res.json({
      success: true,
      message: "Updated",
      data: formatLanguageRow(doc),
    });
  } catch (e) {
    next(e);
  }
}

async function deleteLanguage(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await Language.findById(id);
    if (!doc) return err(res, 404, "Language not found");
    if (doc.is_default) {
      return err(res, 422, "Cannot delete the default language; set another as default first");
    }

    await Language.deleteOne({ _id: id });
    return res.json({ success: true, message: "Deleted", data: { id } });
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listLanguages,
  getLanguage,
  createLanguage,
  updateLanguage,
  updateLanguageStatus,
  deleteLanguage,
};
