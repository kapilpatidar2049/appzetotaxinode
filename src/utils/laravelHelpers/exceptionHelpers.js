const { CustomValidationError, AuthorizationError } = require("./errors");

function throwCustomValidationException(message, field = null) {
  throw new CustomValidationError(message, field);
}

function throwInvalidCredentialsException(field = null) {
  throwCustomException("These credentials do not match our records.", field);
}

function throwAccountDisabledException(field = null) {
  throwCustomException("The account has been disabled.", field);
}

function throwAccountNotActivatedException(field = null) {
  throwCustomException("The account has not been activated.", field);
}

function throwSendOTPErrorException(field = null) {
  throwCustomException("Error sending otp. Try again later.", field);
}

function throwCustomException(message, field = null) {
  if (field) {
    throwCustomValidationException(message, field);
  }
  throw new Error(typeof message === "string" ? message : JSON.stringify(message));
}

function throwAuthorizationException(message = null) {
  throw new AuthorizationError(message || "Unauthorized");
}

module.exports = {
  throwCustomValidationException,
  throwInvalidCredentialsException,
  throwAccountDisabledException,
  throwAccountNotActivatedException,
  throwSendOTPErrorException,
  throwCustomException,
  throwAuthorizationException,
};
