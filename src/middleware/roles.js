function requireAnyRole(roles = []) {
  return (req, res, next) => {
    const userRole = req.user && req.user.role;
    if (!userRole) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    if (!roles.includes(userRole)) {
      return res.status(403).json({
        success: false,
        message: "Forbidden",
      });
    }

    return next();
  };
}

module.exports = {
  requireAnyRole,
};

