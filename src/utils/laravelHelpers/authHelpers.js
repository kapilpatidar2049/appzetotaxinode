const { arrayHasAll } = require("../phpHelpers/coreSync");

/** Laravel App\Base\Constants\Auth\Role parity */
const Role = {
  USER: "user",
  DRIVER: "driver",
  OWNER: "owner",
  DISPATCHER: "dispatcher",
  SUPER_ADMIN: "super-admin",
  ADMIN: "admin",
};

function otpLoginRoles() {
  return [Role.USER, Role.DRIVER, Role.OWNER];
}

/** Admin-style roles that use username (Laravel Role::adminRoles). */
function rolesUsingUsername() {
  return [Role.SUPER_ADMIN, Role.ADMIN, Role.DISPATCHER];
}

function roleAllowed(role, allowedList) {
  const roles = typeof role === "string" ? [role] : role;
  return arrayHasAll(roles, allowedList);
}

function roleAllowedUsernameLogin(role) {
  return roleAllowed(role, rolesUsingUsername());
}

function roleAllowedOTPLogin(role) {
  return roleAllowed(role, otpLoginRoles());
}

module.exports = {
  Role,
  otpLoginRoles,
  rolesUsingUsername,
  roleAllowed,
  roleAllowedUsernameLogin,
  roleAllowedOTPLogin,
};
