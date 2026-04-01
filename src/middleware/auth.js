const jwt = require("jsonwebtoken");
const config = require("../config");

/**
 * Helper to sign a JWT for a given payload.
 * Controllers will use this to generate tokens after successful login/registration.
 */
function signToken(payload) {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
}

/**
 * Strict authentication middleware – equivalent to Laravel's auth:sanctum
 * in the sense that it requires a valid token and attaches the user to req.user.
 *
 * Expected header: Authorization: Bearer <token>
 */
function authenticate(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const parts = authHeader.split(" ");

  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const token = parts[1];

  try {
    const decoded = jwt.verify(token, config.jwtSecret);
    req.user = decoded;
    return next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

/**
 * Optional authentication middleware – does not fail the request if token is missing/invalid.
 * Useful for routes that behave slightly differently for logged-in vs guest users.
 */
function optionalAuthenticate(req, res, next) {
  const authHeader = req.headers.authorization || "";
  const parts = authHeader.split(" ");

  if (parts.length === 2 && parts[0] === "Bearer") {
    const token = parts[1];
    try {
      const decoded = jwt.verify(token, config.jwtSecret);
      req.user = decoded;
    } catch (err) {
      // Ignore invalid token; treat as unauthenticated
    }
  }

  return next();
}

module.exports = {
  signToken,
  authenticate,
  optionalAuthenticate,
};

