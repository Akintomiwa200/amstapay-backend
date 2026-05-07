let fcm = null;
try {
  const admin = require("firebase-admin");
  if (process.env.FCM_SERVICE_ACCOUNT) {
    const serviceAccount = JSON.parse(process.env.FCM_SERVICE_ACCOUNT);
    admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
    fcm = admin.messaging();
    console.log("✅ FCM initialized");
  }
} catch (err) {
  console.log("ℹ️ FCM not configured — set FCM_SERVICE_ACCOUNT env var");
}

exports.sendPushNotification = async (deviceToken, title, body, data = {}) => {
  if (!fcm || !deviceToken) {
    console.log(`[FCM] Would send: ${title} — ${body} to ${deviceToken}`);
    return { success: false, reason: "FCM not configured" };
  }
  try {
    const result = await fcm.send({ token: deviceToken, notification: { title, body }, data });
    console.log(`[FCM] Sent to ${deviceToken} (${result})`);
    return { success: true, messageId: result };
  } catch (err) {
    console.error("[FCM] Error:", err.message);
    return { success: false, error: err.message };
  }
};

exports.sendBulkPush = async (deviceTokens, title, body, data = {}) => {
  if (!fcm || !deviceTokens?.length) return { success: false, reason: "FCM not configured" };
  try {
    const result = await fcm.sendEachForMulticast({ tokens: deviceTokens, notification: { title, body }, data });
    console.log(`[FCM] Bulk sent to ${result.successCount}/${deviceTokens.length} devices`);
    return { success: true, successCount: result.successCount, failureCount: result.failureCount };
  } catch (err) {
    console.error("[FCM] Bulk error:", err.message);
    return { success: false, error: err.message };
  }
};
