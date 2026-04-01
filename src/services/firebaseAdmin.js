/**
 * Optional firebase-admin (FCM + Realtime DB). Install: npm install firebase-admin
 * Env: FIREBASE_SERVICE_ACCOUNT_JSON — recommended (full JSON string)
 *      GOOGLE_APPLICATION_CREDENTIALS — path to service account file
 *      FIREBASE_DATABASE_URL — for RTDB (bid-meta remove)
 */

function tryLoadAdmin() {
  try {
    return require("firebase-admin");
  } catch {
    return null;
  }
}

let initialized = false;

function initializeFirebaseAdmin() {
  if (initialized) return true;
  const admin = tryLoadAdmin();
  if (!admin) return false;
  if (admin.apps && admin.apps.length > 0) {
    initialized = true;
    return true;
  }

  const databaseURL = process.env.FIREBASE_DATABASE_URL;
  const saJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;

  try {
    if (saJson) {
      const cred = admin.credential.cert(JSON.parse(saJson));
      admin.initializeApp({
        credential: cred,
        ...(databaseURL ? { databaseURL } : {}),
      });
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        ...(databaseURL ? { databaseURL } : {}),
      });
    } else {
      return false;
    }
    initialized = true;
    return true;
  } catch (err) {
    console.warn("[firebase] initialize failed:", err.message);
    return false;
  }
}

async function removeRealtimePath(path) {
  const admin = tryLoadAdmin();
  if (!admin) return false;
  if (!process.env.FIREBASE_DATABASE_URL) return false;
  if (!initializeFirebaseAdmin()) return false;
  try {
    await admin.database().ref(path).remove();
    return true;
  } catch (err) {
    console.warn("[firebase] RTDB remove failed:", err.message);
    return false;
  }
}

/** Set RTDB value (e.g. `request-meta/{requestId}` on admin assign). */
async function setRealtimeValue(path, value) {
  const admin = tryLoadAdmin();
  if (!admin) return false;
  if (!process.env.FIREBASE_DATABASE_URL) return false;
  if (!initializeFirebaseAdmin()) return false;
  try {
    await admin.database().ref(path).set(value);
    return true;
  } catch (err) {
    console.warn("[firebase] RTDB set failed:", err.message);
    return false;
  }
}

/**
 * Partial update (Laravel `getReference(...)->update([...])`).
 * Use `rtdbNow()` for server timestamps in the payload.
 */
async function updateRealtimeValue(path, value) {
  const admin = tryLoadAdmin();
  if (!admin) return false;
  if (!process.env.FIREBASE_DATABASE_URL) return false;
  if (!initializeFirebaseAdmin()) return false;
  try {
    await admin.database().ref(path).update(value);
    return true;
  } catch (err) {
    console.warn("[firebase] RTDB update failed:", err.message);
    return false;
  }
}

/** Firebase server timestamp for `.update()` / `.set()` payloads (matches Laravel ServerTimestamp). */
function rtdbNow() {
  const admin = tryLoadAdmin();
  if (!admin || !initializeFirebaseAdmin()) {
    return Date.now();
  }
  return admin.database.ServerValue.TIMESTAMP;
}

async function sendFcmNotification(token, title, body) {
  if (!token) return false;
  const admin = tryLoadAdmin();
  if (!admin) {
    console.warn("[fcm] firebase-admin not installed; skip push");
    return false;
  }
  if (!initializeFirebaseAdmin()) {
    console.warn("[fcm] Firebase not configured; skip push");
    return false;
  }
  try {
    await admin.messaging().send({
      token,
      notification: { title, body },
    });
    return true;
  } catch (err) {
    console.warn("[fcm] send failed:", err.message);
    return false;
  }
}

module.exports = {
  tryLoadAdmin,
  initializeFirebaseAdmin,
  removeRealtimePath,
  setRealtimeValue,
  updateRealtimeValue,
  rtdbNow,
  sendFcmNotification,
};
