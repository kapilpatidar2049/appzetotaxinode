// HTTP utilities – Node/Express friendly wrappers around the old Laravel helpers.
// Prefer importing from here instead of `laravelHelpers` directly.

const {
  respondOk,
  respondSuccess,
  respondCreated,
  respondNoContent,
  respondFailed,
  respondBadRequest,
  respondUnauthorized,
  respondForbidden,
  respondNotFound,
  respondMethodNotAllowed,
  respondInternalError,
  buildSuccessPayload,
  buildErrorPayload,
} = require("../utils/laravelHelpers");

const {
  CustomValidationError,
  AuthorizationError,
} = require("../utils/laravelHelpers").errors;

const {
  throwCustomValidationException,
  throwInvalidCredentialsException,
  throwAccountDisabledException,
  throwAccountNotActivatedException,
  throwSendOTPErrorException,
  throwCustomException,
  throwAuthorizationException,
} = require("../utils/laravelHelpers");

module.exports = {
  // Response helpers (Express)
  respondOk,
  respondSuccess,
  respondCreated,
  respondNoContent,
  respondFailed,
  respondBadRequest,
  respondUnauthorized,
  respondForbidden,
  respondNotFound,
  respondMethodNotAllowed,
  respondInternalError,
  buildSuccessPayload,
  buildErrorPayload,

  // Error / exception classes + throw helpers
  CustomValidationError,
  AuthorizationError,
  throwCustomValidationException,
  throwInvalidCredentialsException,
  throwAccountDisabledException,
  throwAccountNotActivatedException,
  throwSendOTPErrorException,
  throwCustomException,
  throwAuthorizationException,
};

