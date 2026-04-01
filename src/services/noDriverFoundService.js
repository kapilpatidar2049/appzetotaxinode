/**
 * Port of Helpers/Rides/NoDriversFoundHelper.php
 * Cancels requests, removes bid-meta (bidding), notifies user via FCM when configured.
 */

const mongoose = require("mongoose");
const config = require("../config");
const Request = require("../models/Request");
const User = require("../models/User");
const { removeRealtimePath, sendFcmNotification } = require("./firebaseAdmin");
const { customTrans } = require("../utils/phpHelpers/translations");

const DEFAULT_TITLE = "No driver available";
const DEFAULT_BODY = "We couldn't find a driver nearby. Please try again later.";

async function resolveMongoTitleBody(userLang) {
  const tTitle = customTrans("no_driver_found_title", {}, userLang);
  const tBody = customTrans("no_driver_found_body", {}, userLang);
  const title =
    tTitle && tTitle !== "no_driver_found_title"
      ? tTitle
      : process.env.NO_DRIVER_FOUND_TITLE || DEFAULT_TITLE;
  const body =
    tBody && tBody !== "no_driver_found_body"
      ? tBody
      : process.env.NO_DRIVER_FOUND_BODY || DEFAULT_BODY;
  return { title, body };
}

/**
 * @param {string[]} requestIds — Mongo ObjectId strings
 * @param {object} [_options] reserved (PHP had $database Kreait)
 */
async function noDriverFound(requestIds) {
  const ids = Array.isArray(requestIds) ? requestIds : [requestIds];
  const appFor = config.appFor;

  for (const rawId of ids) {
    if (!mongoose.Types.ObjectId.isValid(rawId)) continue;

    const requestDetail = await Request.findById(rawId);
    if (!requestDetail) continue;

    await Request.findByIdAndUpdate(rawId, {
      is_cancelled: true,
      cancel_method: 0,
      cancelled_at: new Date(),
    });

    if (appFor === "bidding") {
      await removeRealtimePath(`bid-meta/${rawId}`);
    }

    const user = await User.findById(requestDetail.user_id).lean();
    if (!user || !user.fcm_token) continue;

    const copy = await resolveMongoTitleBody(user.lang);
    await sendFcmNotification(user.fcm_token, copy.title, copy.body);
  }
}

module.exports = {
  noDriverFound,
};
