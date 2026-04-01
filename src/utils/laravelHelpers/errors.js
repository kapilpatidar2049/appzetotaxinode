/** Express / Node equivalents of Laravel validation & auth exceptions. */

class CustomValidationError extends Error {
  constructor(message, field = null) {
    super(typeof message === "string" ? message : JSON.stringify(message));
    this.name = "CustomValidationError";
    this.field = field;
    this.status = 422;
    this.errors = field ? { [field]: [this.message] } : null;
  }
}

class AuthorizationError extends Error {
  constructor(message = "Forbidden") {
    super(message);
    this.name = "AuthorizationError";
    this.status = 403;
  }
}

module.exports = {
  CustomValidationError,
  AuthorizationError,
};
