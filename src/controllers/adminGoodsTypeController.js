const mongoose = require("mongoose");
const GoodsType = require("../models/GoodsType");

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

async function listGoodsTypes(req, res, next) {
  try {
    const { page, limit, skip } = parsePage(req);
    const active = req.query.active;
    const filter = {};
    if (active === "1" || active === "true") filter.active = true;
    if (active === "0" || active === "false") filter.active = false;

    const [items, total] = await Promise.all([
      GoodsType.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      GoodsType.countDocuments(filter),
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

async function getGoodsType(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");
    const doc = await GoodsType.findById(id).lean();
    if (!doc) return err(res, 404, "Goods type not found");
    return ok(res, { goods_type: doc });
  } catch (e) {
    next(e);
  }
}

async function createGoodsType(req, res, next) {
  try {
    const body = req.body || {};
    const name = body.name || body.languageFields?.en;
    if (!name) return err(res, 422, "name is required (or languageFields.en)");

    const doc = await GoodsType.create({
      name: String(name).trim(),
      languageFields: body.languageFields ?? undefined,
      goods_types_for: body.goods_types_for != null ? String(body.goods_types_for).toLowerCase() : "both",
      description: body.description,
      image: body.image,
      active: body.active !== false,
    });

    return res
      .status(201)
      .json({ success: true, message: "Created", goods_type: doc.toObject() });
  } catch (e) {
    next(e);
  }
}

async function updateGoodsType(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");

    const doc = await GoodsType.findById(id);
    if (!doc) return err(res, 404, "Goods type not found");

    const body = req.body || {};
    if (body.name !== undefined) doc.name = String(body.name).trim();
    if (body.languageFields?.en && body.name === undefined) {
      doc.name = String(body.languageFields.en).trim();
    }
    if (body.languageFields !== undefined) doc.languageFields = body.languageFields;
    if (body.goods_types_for !== undefined) {
      doc.goods_types_for = body.goods_types_for == null ? "both" : String(body.goods_types_for).toLowerCase();
    }
    if (body.description !== undefined) doc.description = body.description;
    if (body.image !== undefined) doc.image = body.image;
    if (body.active !== undefined) doc.active = Boolean(body.active);

    await doc.save();
    return ok(res, { goods_type: doc.toObject() }, "Updated");
  } catch (e) {
    next(e);
  }
}

async function deleteGoodsType(req, res, next) {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) return err(res, 400, "Invalid id");

    const doc = await GoodsType.findByIdAndDelete(id);
    if (!doc) return err(res, 404, "Goods type not found");
    return ok(res, { id }, "Deleted");
  } catch (e) {
    next(e);
  }
}

module.exports = {
  listGoodsTypes,
  getGoodsType,
  createGoodsType,
  updateGoodsType,
  deleteGoodsType,
};

