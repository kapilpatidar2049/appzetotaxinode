const { HTTP_STATUS_TEXTS } = require("./httpStatusTexts");

/**
 * Merge into Laravel-style success JSON: { success, message, data }.
 * If `data` is not already shaped as { data: ... }, it is wrapped.
 */
function formatResponseData(success, data, message = null) {
  let payload = data;
  if (
    !(
      payload &&
      typeof payload === "object" &&
      !Array.isArray(payload) &&
      Object.prototype.hasOwnProperty.call(payload, "data")
    )
  ) {
    payload = { data: payload };
  }
  const out = { success, message, ...payload };
  return Object.fromEntries(
    Object.entries(out).filter(([, v]) => v !== null && v !== undefined)
  );
}

/**
 * Laravel formatErrorResponseData — { success, message, status_code, errors }
 */
function formatErrorResponseData(success, message, statusCode, errors = null) {
  let msg = message;
  if (!msg && statusCode) {
    msg = HTTP_STATUS_TEXTS[statusCode] || "Error";
  }
  const out = {
    success,
    message: msg,
    status_code: statusCode,
    errors,
  };
  return Object.fromEntries(
    Object.entries(out).filter(([, v]) => v !== null && v !== undefined)
  );
}

// --- Express send helpers (trait methods → functions taking res) ---

function sendJson(res, body, status = 200) {
  return res.status(status).json(body);
}

function respondOk(res, data = null, success = true, message = null) {
  return sendJson(res, formatResponseData(success, data, message), 200);
}

function respondSuccess(res, data = null, message = "success") {
  return sendJson(res, formatResponseData(true, data, message), 200);
}

function respondCreated(res, data = null, message = "created") {
  return sendJson(res, formatResponseData(true, data, message), 201);
}

function respondNoContent(res) {
  return res.status(204).send();
}

function respondError(res, message, status, errors = null) {
  return sendJson(
    res,
    formatErrorResponseData(false, message, status, errors),
    status
  );
}

function respondFailed(res, message = "failed") {
  return respondError(res, message, 200);
}

function respondBadRequest(res, message = null) {
  return respondError(res, message, 400);
}

function respondUnauthorized(res, message = null) {
  return respondError(res, message, 401);
}

function respondForbidden(res, message = null) {
  return respondError(res, message, 403);
}

function respondNotFound(res, message = null) {
  return respondError(res, message, 404);
}

function respondMethodNotAllowed(res, message = null) {
  return respondError(res, message, 405);
}

function respondInternalError(res, message = null) {
  return respondError(res, message, 500);
}

/**
 * Returns payload only (for non-Express use or tests).
 */
function buildSuccessPayload(data = null, message = "success") {
  return formatResponseData(true, data, message);
}

function buildErrorPayload(message, statusCode, errors = null) {
  return formatErrorResponseData(false, message, statusCode, errors);
}

module.exports = {
  formatResponseData,
  formatErrorResponseData,
  sendJson,
  respondOk,
  respondSuccess,
  respondCreated,
  respondNoContent,
  respondError,
  respondFailed,
  respondBadRequest,
  respondUnauthorized,
  respondForbidden,
  respondNotFound,
  respondMethodNotAllowed,
  respondInternalError,
  buildSuccessPayload,
  buildErrorPayload,
};
