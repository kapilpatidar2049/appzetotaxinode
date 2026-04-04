/**
 * Firebase Realtime DB parity with Laravel Api V1 request flow (requests/, request-meta/, bid-meta/, SOS/, drivers/).
 * No-ops when FIREBASE_DATABASE_URL / credentials are missing.
 */

const Driver = require("../models/Driver");
const {
  updateRealtimeValue,
  setRealtimeValue,
  removeRealtimePath,
  rtdbNow,
} = require("./firebaseAdmin");

function strId(id) {
  if (id == null) return "";
  return id.toString ? id.toString() : String(id);
}

/**
 * CreateRequestController: after creating trip, push to `requests/{id}`.
 */
async function publishRequestCreated(doc, body = {}) {
  if (!doc?._id) return;
  const id = strId(doc._id);
  const serviceLocationId = body.service_location_id ?? doc.service_location_id;
  await setRealtimeValue(`requests/${id}`, {
    request_id: id,
    request_number: doc.request_number || id,
    service_location_id: strId(serviceLocationId),
    user_id: strId(doc.user_id),
    trnasport_type: doc.transport_type || "taxi",
    pick_address: doc.pick_address || "",
    drop_address: doc.drop_address || "",
    active: 1,
    is_accept: 0,
    date: doc.createdAt ? new Date(doc.createdAt).toISOString() : new Date().toISOString(),
    updated_at: rtdbNow(),
  });
}

/**
 * UserCancelRequestController — driver availability + clear ride nodes.
 */
async function publishUserCancel(requestDoc) {
  if (!requestDoc) return;
  const id = strId(requestDoc._id);

  if (requestDoc.driver_id) {
    const driver = await Driver.findById(requestDoc.driver_id).lean();
    if (driver) {
      await updateRealtimeValue(`drivers/driver_${strId(driver._id)}`, {
        is_available: true,
        updated_at: rtdbNow(),
      });
    }
  }

  await updateRealtimeValue(`requests/${id}`, {
    is_cancelled: true,
    cancelled_by_user: true,
  });
  await removeRealtimePath(`requests/${id}`);
  await removeRealtimePath(`SOS/${id}`);
  await removeRealtimePath(`request-meta/${id}`);
  await removeRealtimePath(`bid-meta/${id}`);
}

/**
 * DriverCancelRequestController — non-bid: update flags, drop meta + request node (Laravel does not remove bid-meta here).
 */
async function publishDriverCancel(requestId) {
  const id = strId(requestId);
  await updateRealtimeValue(`requests/${id}`, {
    is_cancelled: true,
    cancelled_by_driver: true,
    updated_at: rtdbNow(),
  });
  await removeRealtimePath(`request-meta/${id}`);
  await removeRealtimePath(`requests/${id}`);
}

/**
 * RequestAcceptRejectController — accept branch: brief meta, mark accepted, drop meta node.
 */
async function publishDriverAcceptMetaThenClear(requestId, driverDoc, authUser, requestUserId) {
  const rid = strId(requestId);
  const payload = {
    driver_id: strId(driverDoc._id),
    request_id: rid,
    user_id: strId(requestUserId),
    active: 1,
    is_accepted: 1,
    profile_picture: authUser.profile_picture || "",
    name: authUser.name || "",
    rating: authUser.rating != null ? Number(authUser.rating) : 0,
    updated_at: rtdbNow(),
  };
  await setRealtimeValue(`request-meta/${rid}`, payload);
  await updateRealtimeValue(`requests/${rid}`, { is_accept: 1 });
  await removeRealtimePath(`request-meta/${rid}`);
}

/** Reject / pass: meta for this driver (Laravel sends to next driver via fetchDrivers). */
async function publishDriverRejectMeta(requestId, driverDoc, authUser, requestUserId) {
  const rid = strId(requestId);
  const payload = {
    driver_id: strId(driverDoc._id),
    request_id: rid,
    user_id: strId(requestUserId),
    active: 1,
    is_accepted: 0,
    profile_picture: authUser.profile_picture || "",
    name: authUser.name || "",
    rating: authUser.rating != null ? Number(authUser.rating) : 0,
    updated_at: rtdbNow(),
  };
  await setRealtimeValue(`request-meta/${rid}`, payload);
}

async function removeBidMeta(requestId) {
  await removeRealtimePath(`bid-meta/${strId(requestId)}`);
}

async function publishTripRtdbPatch(requestId, patch) {
  const id = strId(requestId);
  await updateRealtimeValue(`requests/${id}`, { ...patch, updated_at: rtdbNow() });
}

/**
 * Driver live GPS — merges into `drivers/driver_{id}` (GeoFire-style `l`, plus lat/lng aliases).
 * No-ops invalid coords; RTDB no-op when Firebase is not configured.
 */
async function publishDriverLiveLocation(driverDoc, coords, extras = {}) {
  if (!driverDoc?._id) return;
  const lat = Number(coords?.lat);
  const lng = Number(coords?.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
  const id = strId(driverDoc._id);
  const payload = {
    latitude: lat,
    longitude: lng,
    lat,
    lng,
    l: [lat, lng],
    is_available: Boolean(driverDoc.available),
    updated_at: rtdbNow(),
  };
  if (driverDoc.service_location_id != null && driverDoc.service_location_id !== "") {
    payload.service_location_id = strId(driverDoc.service_location_id);
  }
  const br = extras.bearing != null ? Number(extras.bearing) : null;
  const hd = extras.heading != null ? Number(extras.heading) : null;
  if (Number.isFinite(br)) payload.bearing = br;
  if (Number.isFinite(hd)) payload.heading = hd;
  await updateRealtimeValue(`drivers/driver_${id}`, payload);
}

/** RatingsController — after rating, tear down GPS/safety mirrors. */
async function publishRatingCleanup(requestId) {
  const id = strId(requestId);
  await removeRealtimePath(`request-meta/${id}`);
  await removeRealtimePath(`SOS/${id}`);
  await removeRealtimePath(`requests/${id}`);
}

module.exports = {
  publishRequestCreated,
  publishUserCancel,
  publishDriverCancel,
  publishDriverAcceptMetaThenClear,
  publishDriverRejectMeta,
  removeBidMeta,
  publishTripRtdbPatch,
  publishRatingCleanup,
  publishDriverLiveLocation,
};
