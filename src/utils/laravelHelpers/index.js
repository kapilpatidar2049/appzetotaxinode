/**
 * Laravel Helpers folder — Node mirror (Response, Exception, Auth, Payment, Rides, data).
 * Original PHP: backend/Helpers/
 */

const responseHelpers = require("./responseHelpers");
const exceptionHelpers = require("./exceptionHelpers");
const authHelpers = require("./authHelpers");
const paymentReferenceHelper = require("./paymentReferenceHelper");
const referralHelper = require("./referralHelper");
const errors = require("./errors");
const httpStatusTexts = require("./httpStatusTexts");
const dataLoaders = require("./data/loadJson");
const rides = require("./rides");
const { noDriverFound } = require("../../services/noDriverFoundService");

module.exports = {
  ...responseHelpers,
  ...exceptionHelpers,
  ...authHelpers,
  ...paymentReferenceHelper,
  errors,
  httpStatusTexts,
  data: dataLoaders,
  rides,
  noDriverFound,
  /** Explicit namespaces (avoid clashes) */
  responseHelpers,
  exceptionHelpers,
  authHelpers,
  paymentReferenceHelper,
  referralHelper,
  referral: referralHelper,
};
