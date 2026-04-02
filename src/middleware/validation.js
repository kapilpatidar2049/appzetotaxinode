const Joi = require("joi");

const mongoId = Joi.string().hex().length(24);

const joiOptions = {
  abortEarly: false,
  stripUnknown: true,
};

function formatJoiError(error) {
  return error.details.map((d) => d.message.replace(/"/g, ""));
}

function validateBody(schema, options = {}) {
  return (req, res, next) => {
    const raw = req.body === undefined || req.body === null ? {} : req.body;
    const { error, value } = schema.validate(raw, { ...joiOptions, ...options });
    if (error) {
      return res.status(422).json({
        success: false,
        message: formatJoiError(error).join(", "),
        errors: error.details.map((d) => ({ path: d.path, message: d.message })),
      });
    }
    req.body = value;
    next();
  };
}

function validateQuery(schema, options = {}) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.query || {}, { ...joiOptions, ...options });
    if (error) {
      return res.status(422).json({
        success: false,
        message: formatJoiError(error).join(", "),
        errors: error.details.map((d) => ({ path: d.path, message: d.message })),
      });
    }
    req.query = value;
    next();
  };
}

function validateParams(schema, options = {}) {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.params || {}, { ...joiOptions, ...options });
    if (error) {
      return res.status(422).json({
        success: false,
        message: formatJoiError(error).join(", "),
        errors: error.details.map((d) => ({ path: d.path, message: d.message })),
      });
    }
    req.params = value;
    next();
  };
}

/** Any JSON object (typical for complex mobile payloads). */
const genericObject = Joi.object().unknown(true);

const schemas = {
  generic: {
    object: genericObject,
    emptyOrObject: Joi.object().unknown(true).default({}),
  },

  params: {
    mongoId: Joi.object({ id: mongoId.required() }),
    favouriteLocation: Joi.object({ favourite_location: mongoId.required() }),
    requestId: Joi.object({ requestId: mongoId.required() }),
    card: Joi.object({ card: mongoId.required() }),
    fleet: Joi.object({ fleet: mongoId.required() }),
    driver: Joi.object({ driver: mongoId.required() }),
    supportTicket: Joi.object({ supportTicket: mongoId.required() }),
    sos: Joi.object({ sos: mongoId.required() }),
    notification: Joi.object({ notification: mongoId.required() }),
    requestmodel: Joi.object({ requestmodel: mongoId.required() }),
    request: Joi.object({ request: mongoId.required() }),
    service_location: Joi.object({ service_location: mongoId.required() }),
    latLng: Joi.object({
      lat: Joi.string().required(),
      lng: Joi.string().required(),
    }),
    earningsDates: Joi.object({
      from_date: Joi.string().required(),
      to_date: Joi.string().required(),
    }),
    historyId: Joi.object({ id: mongoId.required() }),
  },

  auth: {
    mobileOtp: Joi.object({
      mobile: Joi.string().trim().required(),
      country_code: Joi.string().trim().allow("", null).optional(),
    }),

    validateSmsOtp: Joi.object({
      mobile: Joi.string().trim().required(),
      otp: Joi.string().trim().required(),
    }),

    loginWithMobile: Joi.object({
      mobile: Joi.string().trim().required(),
      password: Joi.string().required(),
      device_token: Joi.string().allow(null, "").optional(),
      role: Joi.string().optional(),
    }),

    loginWithEmail: Joi.object({
      email: Joi.string().email().required(),
      password: Joi.string().required(),
      device_token: Joi.string().allow(null, "").optional(),
      role: Joi.string().optional(),
    }),

    logout: Joi.object().unknown(true).default({}),

    resetPasswordMobileCheck: Joi.object({
      mobile: Joi.string().trim().required(),
      role: Joi.string().optional(),
    }),

    registerUser: Joi.object({
      name: Joi.string().trim().required(),
      mobile: Joi.string().trim().required(),
      password: Joi.string().required(),
      password_confirmation: Joi.string().required(),
      email: Joi.string().email().allow(null, "").optional(),
      country: Joi.alternatives().try(Joi.string(), mongoId, Joi.valid(null)).optional(),
      device_token: Joi.string().allow(null, "").optional(),
    }),

    validateUserMobile: Joi.object({
      mobile: Joi.string().trim().required(),
      email: Joi.string().email().allow("").optional(),
    }),

    validateUserMobileForLogin: Joi.object({
      mobile: Joi.string().trim().required(),
    }),

    updateUserPassword: Joi.object({
      mobile: Joi.string().trim().required(),
      password: Joi.string().required(),
      role: Joi.string().optional(),
    }),

    registerDriver: Joi.object({
      name: Joi.string().trim().required(),
      mobile: Joi.string().trim().required(),
      password: Joi.string().required(),
      email: Joi.string().email().allow(null, "").optional(),
      country: Joi.alternatives().try(Joi.string(), mongoId, Joi.valid(null)).optional(),
      device_token: Joi.string().allow(null, "").optional(),
    }),

    validateDriverMobile: Joi.object({
      mobile: Joi.string().trim().required(),
      email: Joi.string().email().allow("").optional(),
    }),

    validateDriverMobileForLogin: Joi.object({
      mobile: Joi.string().trim().required(),
    }),

    sendRegistrationOtp: Joi.object({
      mobile: Joi.string().trim().required(),
    }),

    ownerRegister: Joi.object({
      name: Joi.string().trim().required(),
      mobile: Joi.string().trim().required(),
      email: Joi.string().email().allow(null, "").optional(),
      password: Joi.string().required(),
      country: Joi.alternatives().try(Joi.string(), mongoId).optional(),
      device_token: Joi.string().allow(null, "").optional(),
    }).unknown(true),

    updateReferral: Joi.object({
      referral_code: Joi.string().trim().allow("").optional(),
      refferal_code: Joi.string().trim().allow("").optional(),
    }).unknown(true),

    sendMailOtp: Joi.object({
      email: Joi.string().email().required(),
    }),

    validateEmailOtp: Joi.object({
      email: Joi.string().email().required(),
      otp: Joi.string().trim().required(),
    }),

    validateRegistrationOtp: Joi.object({
      mobile: Joi.string().trim().required(),
      otp: Joi.string().trim().required(),
    }),

    adminRegister: Joi.object({
      name: Joi.string().trim().required(),
      email: Joi.string().email().required(),
      mobile: Joi.string().trim().required(),
      password: Joi.string().required(),
      password_confirmation: Joi.string().optional(),
    }),

    passwordForgot: Joi.object({
      email: Joi.string().email().required(),
    }),

    passwordValidateToken: Joi.object({
      email: Joi.string().email().optional(),
      token: Joi.string().required(),
    }).unknown(true),

    passwordReset: Joi.object({
      email: Joi.string().email().optional(),
      token: Joi.string().required(),
      password: Joi.string().required(),
      password_confirmation: Joi.string().optional(),
    }).unknown(true),
  },

  dispatcher: {
    requestEta: genericObject,
    listPackages: genericObject,
  },
  adminAdmins: {
    create: Joi.object({
      first_name: Joi.string().trim().required(),
      last_name: Joi.string().trim().required(),
      email: Joi.string().email().required(),
      mobile: Joi.string().trim().required(),
      password: Joi.string().required(),
      role: Joi.string().valid("admin", "dispatcher").required(),
      active: Joi.boolean().optional(),

      // AdminDetail optional fields
      address: Joi.string().allow("", null).optional(),
      country: Joi.string().allow("", null).optional(),
      pincode: Joi.string().allow("", null).optional(),
      timezone: Joi.string().allow("", null).optional(),
      emergency_contact: Joi.string().allow("", null).optional(),
      area_name: Joi.string().allow("", null).optional(),
    }),
    update: Joi.object({
      first_name: Joi.string().trim().optional(),
      last_name: Joi.string().trim().optional(),
      email: Joi.string().email().optional(),
      mobile: Joi.string().trim().optional(),
      password: Joi.string().optional(),
      role: Joi.string().valid("admin", "dispatcher", "super-admin").optional(),
      active: Joi.boolean().optional(),

      address: Joi.string().allow("", null).optional(),
      country: Joi.string().allow("", null).optional(),
      pincode: Joi.string().allow("", null).optional(),
      timezone: Joi.string().allow("", null).optional(),
      emergency_contact: Joi.string().allow("", null).optional(),
      area_name: Joi.string().allow("", null).optional(),
    }),
  },
};

module.exports = {
  validateBody,
  validateQuery,
  validateParams,
  schemas,
  mongoId,
  Joi,
};
