/** Minimal HTTP status text map (Laravel Response::$statusTexts parity for helpers). */
const HTTP_STATUS_TEXTS = {
  200: "OK",
  201: "Created",
  204: "No Content",
  400: "Bad Request",
  401: "Unauthorized",
  403: "Forbidden",
  404: "Not Found",
  405: "Method Not Allowed",
  422: "Unprocessable Entity",
  500: "Internal Server Error",
};

module.exports = { HTTP_STATUS_TEXTS };
