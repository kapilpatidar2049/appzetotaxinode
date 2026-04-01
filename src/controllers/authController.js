const bcrypt = require("bcryptjs");
const { signToken } = require("../middleware/auth");
const config = require("../config");
const User = require("../models/User");
const Role = require("../models/Role");
const RoleUser = require("../models/RoleUser");
const MailOtp = require("../models/MailOtp");
const MobileOtp = require("../models/MobileOtp");
const Driver = require("../models/Driver");
const Owner = require("../models/Owner");
const AdminDetail = require("../models/AdminDetail");
const PasswordResetToken = require("../models/PasswordResetToken");

// Utility: fetch a role id by slug (e.g. 'user', 'driver')
async function getRoleIdBySlug(slug) {
  
    const role = await Role.findOne({ slug }).lean();
    return role ? role._id : null;
  
}

async function userHasRole(userId, roleSlug) {
  
  const role = await Role.findOne({ slug: roleSlug }).lean();
  if (!role) {
    return false;
  }
  const link = await RoleUser.findOne({ user_id: userId, role_id: role._id }).lean();
  return Boolean(link);
}

// Utility: fetch user by email/mobile + role slug
async function findUserByCredentials({ email, mobile, roleSlug }) {
  
    const or = [];
    if (email) or.push({ email });
    if (mobile) or.push({ mobile });
    if (!or.length) return null;
    const user = await User.findOne({ $or: or }).lean();
    if (!user) return null;
    const hasRole = (user.role && user.role === roleSlug) || (await userHasRole(user._id, roleSlug));
    return hasRole ? user : null;
}

// Generic login handler similar to loginUserAccountApp in Laravel
async function loginWithRole(req, res, roleSlug) {
  try {
    const { email, mobile, password, device_token } = req.body || {};

    if (!password || (!email && !mobile)) {
      return res.status(422).json({
        success: false,
        message: "Email or mobile and password are required",
      });
    }

    const user = await findUserByCredentials({ email, mobile, roleSlug });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    // Optionally update device token
    if (device_token) {
      
        await User.updateOne({ _id: user._id || user.id }, { $set: { fcm_token: device_token } });
      
    }

    const tokenPayload = {
      id: user._id || user.id,
      email: user.email,
      mobile: user.mobile,
      role: roleSlug,
    };

    const accessToken = signToken(tokenPayload);

    return res.json({
      success: true,
      message: "success",
      access_token: accessToken,
      user: {
        id: user._id || user.id,
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        role: roleSlug,
      },
    });
  } catch (err) {
    console.error("Error in loginWithRole:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// POST /api/v1/auth/user/login
async function loginUser(req, res) {
  return loginWithRole(req, res, "user");
}

// POST /api/v1/auth/driver/login
async function loginDriver(req, res) {
  // Laravel version supports driver and owner via role parameter.
  // Here we default to 'driver' unless body.role === 'owner'.
  const roleSlug = req.body && req.body.role === "owner" ? "owner" : "driver";
  return loginWithRole(req, res, roleSlug);
}

// POST /api/v1/admin/login — first matching admin-panel role wins (see config.adminPanelRoles)
async function loginAdmin(req, res) {
  try {
    const { email, mobile, password, device_token } = req.body || {};
    const roles = config.adminPanelRoles;

    if (!password || (!email && !mobile)) {
      return res.status(422).json({
        success: false,
        message: "Email or mobile and password are required",
      });
    }

    for (const roleSlug of roles) {
      const user = await findUserByCredentials({ email, mobile, roleSlug });
      if (!user) {
        continue;
      }

      const valid = await bcrypt.compare(password, user.password);
      if (!valid) {
        return res.status(401).json({
          success: false,
          message: "Invalid credentials",
        });
      }

      if (device_token) {
        await User.updateOne({ _id: user._id || user.id }, { $set: { fcm_token: device_token } });
      }

      const tokenPayload = {
        id: user._id || user.id,
        email: user.email,
        mobile: user.mobile,
        role: roleSlug,
      };

      const accessToken = signToken(tokenPayload);

      return res.json({
        success: true,
        message: "success",
        access_token: accessToken,
        user: {
          id: user._id || user.id,
          name: user.name,
          email: user.email,
          mobile: user.mobile,
          role: roleSlug,
        },
      });
    }

    return res.status(401).json({
      success: false,
      message: "Invalid credentials",
    });
  } catch (err) {
    console.error("Error in loginAdmin:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// POST /api/v1/auth/mobile-otp
async function mobileOtp(req, res) {
  try {
    const { mobile, country_code } = req.body || {};

    if (!mobile) {
      return res.status(422).json({
        success: false,
        message: "mobile is required",
      });
    }

    let otp = Math.floor(100000 + Math.random() * 900000);

    if (process.env.APP_FOR === "demo" || process.env.APP_FOR === "demo1") {
      otp = 123456;
    }

    
      const existing = await MobileOtp.findOne({ mobile }).lean();
      if (existing) {
        await MobileOtp.updateOne(
          { _id: existing._id },
          { $set: { otp: String(otp), country_code: country_code || null } }
        );
      } else {
        await MobileOtp.create({ mobile, otp: String(otp), country_code: country_code || null });
      }
    

    // Here we do not integrate actual SMS gateways; that should be added later.
    // For now we just respond success like Laravel.
    return res.json({
      success: true,
      message: "success",
    });
  } catch (err) {
    console.error("Error in mobileOtp:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// POST /api/v1/auth/validate-otp
async function validateSmsOtp(req, res) {
  try {
    const { mobile, otp } = req.body || {};
    let valid = false;
    if(process.env.APP_FOR === "demo" || process.env.APP_FOR === "demo1"){
      if(otp === "123456"){
        valid = true;
      }else{
        valid = false;
      }
    }else{
      const row = await MobileOtp.findOne({ mobile, otp: String(otp) }).lean();
      valid = Boolean(row);
      const token = signToken({ id: row.id });
    }

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Invalid OTP",
      });
    }

    // For now we simply acknowledge OTP; any further login/registration flow
    // (like creating a user) should be added here if needed.
    return res.json({
      success: true,
      message: "success",
    });
  } catch (err) {
    console.error("Error in validateSmsOtp:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// POST /api/v1/auth/user/register
async function registerUser(req, res) {
  try {
    const {
      name,
      email,
      mobile,
      password,
      password_confirmation,
      country,
      device_token,
    } = req.body || {};

    if (!name || !mobile || !password || !password_confirmation) {
      return res.status(422).json({
        success: false,
        message: "name, mobile and password are required",
      });
    }

    if (password !== password_confirmation) {
      return res.status(422).json({
        success: false,
        message: "Password confirmation does not match",
      });
    }

    // Check duplicates
    if (email) {
      
        const existingEmail = await User.findOne({ email }).lean();
        if (existingEmail) {
          return res.status(422).json({
            success: false,
            message: "Provided email has already been taken",
          });
        }
      
    }

    const existingMobile = await User.findOne({ mobile }).lean();
    if (existingMobile) {
      return res.status(422).json({
        success: false,
        message: "Provided mobile has already been taken",
      });
    }

    const hashed = await bcrypt.hash(password, 10);

    let userId;
    
      const createdUser = await User.create({
        name,
        email: email || null,
        mobile,
        password: hashed,
        country: country || null,
        active: true,
        role: "user",
      });
      userId = createdUser._id;
    

    // Attach "user" role
    const roleId = await getRoleIdBySlug("user");
    if (roleId) {
      
        await RoleUser.updateOne(
          { role_id: roleId, user_id: userId },
          { $setOnInsert: { role_id: roleId, user_id: userId } },
          { upsert: true }
        );
      
    }

    if (device_token) {
      
        await User.updateOne({ _id: userId }, { $set: { fcm_token: device_token } });
      
    }

    const tokenPayload = {
      id: userId,
      email: email || null,
      mobile,
      role: "user",
    };

    const accessToken = signToken(tokenPayload);

    return res.status(201).json({
      success: true,
      message: "success",
      access_token: accessToken,
      user: {
        id: userId,
        name,
        email: email || null,
        mobile,
        role: "user",
      },
    });
  } catch (err) {
    console.error("Error in registerUser:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

// POST /api/v1/auth/logout
async function logout(req, res) {
  try {
    // With JWT we cannot revoke a specific token without additional storage.
    // For now we simply clear device token for the user if authenticated.
    const user = req.user;

    if (user && user.id) {
      
        await User.updateOne({ _id: user.id }, { $set: { fcm_token: null } });
      
    }

    return res.json({
      success: true,
      message: "success",
    });
  } catch (err) {
    console.error("Error in logout:", err);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
}

async function resetPasswordMobileCheck(req, res) {
  try {
    const { mobile, role } = req.body || {};
    if (!mobile) {
      return res.status(422).json({ success: false, message: "mobile is required" });
    }
    const roleSlug = role || "user";
    const user = await findUserByCredentials({ mobile, roleSlug });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.json({ success: true, message: "success" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function validateUserMobile(req, res) {
  try {
    const { mobile, email } = req.body || {};
    if (!mobile) return res.status(422).json({ success: false, message: "mobile is required" });
    const mobileTaken = await User.findOne({ mobile }).lean();
    if (mobileTaken) {
      return res.status(422).json({ success: false, message: "Provided mobile has already been taken" });
    }
    if (email) {
      const emailTaken = await User.findOne({ email }).lean();
      if (emailTaken) {
        return res.status(422).json({ success: false, message: "Provided email has already been taken" });
      }
    }
    return res.json({ success: true, message: "mobile_validated" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function validateUserMobileForLogin(req, res) {
  try {
    const { mobile } = req.body || {};
    if (!mobile) return res.status(422).json({ success: false, message: "mobile is required" });
    const user = await User.findOne({ mobile }).lean();
    if (!user) return res.status(404).json({ success: false, message: "User with that mobile number doesn't exist." });
    return res.json({ success: true, message: "success" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function updateUserPassword(req, res) {
  try {
    const { mobile, password, role } = req.body || {};
    if (!mobile || !password) return res.status(422).json({ success: false, message: "mobile and password are required" });
    const roleSlug = role || "user";
    const user = await findUserByCredentials({ mobile, roleSlug });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const hashed = await bcrypt.hash(password, 10);
    
      await User.updateOne({ _id: user._id || user.id }, { $set: { password: hashed } });
    
    return res.json({ success: true, message: "reset-success" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function updateDriverPassword(req, res) {
  return updateUserPassword(req, res);
}

async function registerDriver(req, res) {
  try {
    const { name, mobile, email, password, country, device_token } = req.body || {};
    if (!name || !mobile || !password) {
      return res.status(422).json({ success: false, message: "name, mobile and password are required" });
    }
    const mobileExists = await User.findOne({ mobile }).lean();
    if (mobileExists) return res.status(422).json({ success: false, message: "Provided mobile has already been taken" });
    if (email) {
      const emailExists = await User.findOne({ email }).lean();
      if (emailExists) return res.status(422).json({ success: false, message: "Provided email has already been taken" });
    }
    const hashed = await bcrypt.hash(password, 10);
    let userId;
    
      const user = await User.create({
        name,
        email: email || null,
        mobile,
        password: hashed,
        country: country || null,
        active: true,
        fcm_token: device_token || null,
        mobile_confirmed: true,
        role: "driver",
      });
      userId = user._id;
    
    const roleId = await getRoleIdBySlug("driver");
    if (roleId) {
      
        await RoleUser.updateOne(
          { role_id: roleId, user_id: userId },
          { $setOnInsert: { role_id: roleId, user_id: userId } },
          { upsert: true }
        );
      
    }
    
      await Driver.create({
        user_id: userId,
        name,
        mobile,
        email: email || null,
        active: false,
        approve: false,
        available: false,
      });
    
    const accessToken = signToken({ id: userId, email: email || null, mobile, role: "driver" });
    return res.status(201).json({ success: true, message: "success", access_token: accessToken });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function validateDriverMobile(req, res) {
  return validateUserMobile(req, res);
}

async function validateDriverMobileForLogin(req, res) {
  return validateUserMobileForLogin(req, res);
}

async function sendRegistrationOtp(req, res) {
  return mobileOtp(req, res);
}

async function ownerRegister(req, res) {
  try {
    const { name, mobile, email, password, country, device_token } = req.body || {};
    if (!name || !mobile || !password) {
      return res.status(422).json({ success: false, message: "name, mobile and password are required" });
    }
    const mobileExists = await User.findOne({ mobile }).lean();
    if (mobileExists) return res.status(422).json({ success: false, message: "Provided mobile has already been taken" });
    const hashed = await bcrypt.hash(password, 10);
    let userId;
    
      const user = await User.create({
        name,
        email: email || null,
        mobile,
        password: hashed,
        country: country || null,
        active: true,
        fcm_token: device_token || null,
        mobile_confirmed: true,
        role: "owner",
      });
      userId = user._id;
    
    const roleId = await getRoleIdBySlug("owner");
    if (roleId) {
      
        await RoleUser.updateOne(
          { role_id: roleId, user_id: userId },
          { $setOnInsert: { role_id: roleId, user_id: userId } },
          { upsert: true }
        );
      
    }
    
      await Owner.create({ user_id: userId, owner_name: name, active: false, approve: false });
    
    const accessToken = signToken({ id: userId, email: email || null, mobile, role: "owner" });
    return res.status(201).json({ success: true, message: "success", access_token: accessToken });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function updateUserReferral(req, res) {
  try {
    const authUserId = req.user?.id;
    const { refferal_code } = req.body || {};
    if (!authUserId) return res.status(401).json({ success: false, message: "Unauthorized" });
    if (!refferal_code) return res.status(422).json({ success: false, message: "refferal_code is required" });
    const referrer = await User.findOne({ refferal_code }).select("_id").lean();
    if (!referrer) return res.status(422).json({ success: false, message: "Invalid referral code." });
    if (String(referrer._id) === String(authUserId)) {
      return res.status(422).json({ success: false, message: "You cannot use your own referral code." });
    }
    await User.updateOne(
      { _id: authUserId, $or: [{ referred_by: null }, { referred_by: referrer._id }] },
      { $set: { referred_by: referrer._id } }
    );
    return res.json({ success: true, message: "success" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function updateDriverReferral(req, res) {
  return updateUserReferral(req, res);
}

async function getReferral(req, res) {
  try {
    const authUserId = req.user?.id;
    if (!authUserId) return res.status(401).json({ success: false, message: "Unauthorized" });
    const row = await User.findById(authUserId).select("refferal_code referred_by").lean();
    return res.json({ success: true, message: "success", data: row || null });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function sendMailOtp(req, res) {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(422).json({ success: false, message: "email is required" });
    let otp = Math.floor(100000 + Math.random() * 900000);
    if (process.env.APP_FOR === "demo" || process.env.APP_FOR === "demo1") otp = 123456;
    
      const existing = await MailOtp.findOne({ email }).lean();
      if (existing) {
        await MailOtp.updateOne({ _id: existing._id }, { $set: { otp: String(otp), verified: false } });
      } else {
        await MailOtp.create({ email, otp: String(otp), verified: false });
      }
    
    return res.json({ success: true, message: "success" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function validateEmailOtp(req, res) {
  try {
    const { email, otp } = req.body || {};
    if (!email || !otp) return res.status(422).json({ success: false, message: "email and otp are required" });
    
      const row = await MailOtp.findOne({ email, otp: String(otp) }).lean();
      if (!row) return res.status(422).json({ success: false, message: "The otp provided has Invaild" });
      await MailOtp.updateOne({ _id: row._id }, { $set: { verified: true } });
    
    return res.json({ success: true, message: "success" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function validateRegistrationOtp(req, res) {
  return validateSmsOtp(req, res);
}

async function adminRegister(req, res) {
  try {
    const { first_name, last_name, email, password, mobile, role } = req.body || {};
    if (!first_name || !last_name || !email || !password || !mobile) {
      return res.status(422).json({ success: false, message: "first_name, last_name, email, password, mobile are required" });
    }
    const fullName = `${first_name} ${last_name}`;
    const hashed = await bcrypt.hash(password, 10);
    let userId;
    
      const user = await User.create({
        name: fullName,
        email,
        mobile,
        password: hashed,
        mobile_confirmed: true,
        active: true,
        role: role || "super-admin",
      });
      userId = user._id;
      await AdminDetail.create({
        user_id: userId,
        first_name,
        last_name,
        email,
        mobile,
      });
    
    const roleId = await getRoleIdBySlug(role || "super-admin");
    if (roleId) {
      
        await RoleUser.updateOne(
          { role_id: roleId, user_id: userId },
          { $setOnInsert: { role_id: roleId, user_id: userId } },
          { upsert: true }
        );
      
    }
    return res.json({ success: true, message: "success" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function passwordForgot(req, res) {
  try {
    const { email, mobile } = req.body || {};
    if (!email && !mobile) return res.status(422).json({ success: false, message: "email or mobile is required" });
    const user = await User.findOne(email ? { email } : { mobile }).lean();
    if (!user) return res.status(404).json({ success: false, message: "We can't find a user with that email address." });
    const token = cryptoRandomToken();
    
      await PasswordResetToken.findOneAndUpdate(
        { email: email || `mobile:${mobile}` },
        { $set: { token } },
        { upsert: true, new: true }
      );
    
    return res.json({ success: true, message: "success", token });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

function cryptoRandomToken() {
  return require("crypto").randomBytes(24).toString("hex");
}

async function passwordValidateToken(req, res) {
  try {
    const { email, token } = req.body || {};
    if (!email || !token) return res.status(422).json({ success: false, message: "email and token are required" });
    let savedToken = null;
    
      const row = await PasswordResetToken.findOne({ email }).lean();
      savedToken = row ? row.token : null;
    
    if (!savedToken || savedToken !== token) {
      return res.status(422).json({ success: false, message: "The password reset token is invalid or has expired." });
    }
    return res.json({ success: true, message: "success" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

async function passwordReset(req, res) {
  try {
    const { email, token, mobile, role, password } = req.body || {};
    if (!password) return res.status(422).json({ success: false, message: "password is required" });
    let user = null;
    if (email && token) {
      
        const tokenRow = await PasswordResetToken.findOne({ email }).lean();
        if (!tokenRow || tokenRow.token !== token) {
          return res.status(422).json({ success: false, message: "The password reset token is invalid or has expired." });
        }
        user = await User.findOne({ email }).lean();
      
    } else if (mobile) {
      user = await findUserByCredentials({ mobile, roleSlug: role || "user" });
    }
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    const hashed = await bcrypt.hash(password, 10);
    
      await User.updateOne(
        { _id: user._id || user.id },
        { $set: { password: hashed, remember_token: null } }
      );
      if (email) await PasswordResetToken.deleteOne({ email });
    
    return res.json({ success: true, message: "reset-success" });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
}

module.exports = {
  loginUser,
  loginDriver,
  loginAdmin,
  mobileOtp,
  validateSmsOtp,
  registerUser,
  logout,
  resetPasswordMobileCheck,
  validateUserMobile,
  validateUserMobileForLogin,
  updateUserPassword,
  updateDriverPassword,
  registerDriver,
  validateDriverMobile,
  validateDriverMobileForLogin,
  sendRegistrationOtp,
  ownerRegister,
  updateUserReferral,
  updateDriverReferral,
  getReferral,
  sendMailOtp,
  validateEmailOtp,
  validateRegistrationOtp,
  adminRegister,
  passwordForgot,
  passwordValidateToken,
  passwordReset,
};

