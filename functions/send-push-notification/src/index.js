import {
  must,
  safeBodyJson,
  json,
  Client,
  Databases,
  Query,
  initializeApp,
  cert,
  getApps,
  getMessaging,
} from "./_shared.js";

/**
 * send-push-notification
 *
 * This function is triggered when a new notification is created.
 * It sends push notifications to all devices registered for the user.
 *
 * Trigger: databases.*.collections.*.documents.*.create
 * Collection: NOTIFICATIONS
 *
 * Expected trigger payload (from Appwrite Event):
 * {
 *   "$id": "notification_id",
 *   "profileId": "user_profile_id",
 *   "groupId": "group_id",
 *   "kind": "INVITE|EVENT_REMINDER|SYSTEM",
 *   "title": "Notification title",
 *   "body": "Notification body",
 *   "entityType": "group_invitations|events|...",
 *   "entityId": "entity_id",
 *   "metadata": "{...}",
 *   ...
 * }
 */
export default async ({ req, res, log, error }) => {
  try {
    // Initialize Appwrite client
    const client = new Client()
      .setEndpoint(must("APPWRITE_ENDPOINT"))
      .setProject(must("APPWRITE_PROJECT_ID"))
      .setKey(must("APPWRITE_API_KEY"));

    const databases = new Databases(client);

    // Required env vars
    const databaseId = must("APPWRITE_DATABASE_ID");
    const pushSubscriptionsCollectionId = must(
      "COLLECTION_PUSH_SUBSCRIPTIONS_ID"
    );

    // Initialize Firebase Admin (only if not already initialized)
    let firebaseApp;
    try {
      // Check if Firebase app already exists
      const existingApps = getApps();
      
      if (existingApps.length > 0) {
        // Use existing app
        firebaseApp = existingApps[0];
        log?.("Using existing Firebase Admin app");
      } else {
        // Initialize new app
        firebaseApp = initializeApp({
          credential: cert({
            projectId: must("FIREBASE_PROJECT_ID"),
            privateKey: must("FIREBASE_PRIVATE_KEY").replace(/\\n/g, "\n"),
            clientEmail: must("FIREBASE_CLIENT_EMAIL"),
          }),
        });
        log?.("Firebase Admin initialized");
      }
    } catch (firebaseError) {
      error?.(
        `Failed to initialize Firebase: ${firebaseError.message}`
      );
      return json(res, 500, {
        ok: false,
        error: "Firebase initialization failed",
      });
    }

    // Parse the notification from the event payload
    const notification = safeBodyJson(req);

    if (!notification.$id || !notification.profileId) {
      log?.("Invalid notification payload - missing required fields");
      return json(res, 400, {
        ok: false,
        error: "Invalid notification payload",
      });
    }

    const profileId = notification.profileId;
    const notificationTitle = notification.title || "Nueva notificación";
    const notificationBody = notification.body || "";
    const notificationKind = notification.kind || "SYSTEM";
    const groupId = notification.groupId || null;

    log?.(
      `Processing notification ${notification.$id} for user ${profileId}`
    );

    // Get all push subscriptions for this user
    const subscriptions = await databases.listDocuments(
      databaseId,
      pushSubscriptionsCollectionId,
      [
        Query.equal("profileId", profileId),
        Query.equal("isActive", true),
        Query.equal("enabled", true),
      ]
    );

    if (subscriptions.documents.length === 0) {
      log?.(`No push subscriptions found for user ${profileId}`);
      return json(res, 200, {
        ok: true,
        message: "No push subscriptions found",
        sent: 0,
      });
    }

    log?.(`Found ${subscriptions.documents.length} push subscriptions`);

    // Send push notification to each device
    const messaging = getMessaging(firebaseApp);
    let successCount = 0;
    let failureCount = 0;
    const failedTokens = [];

    for (const subscription of subscriptions.documents) {
      const token = subscription.endpoint; // FCM token stored as endpoint

      // Skip if not a valid FCM token (p256dh === 'fcm' is our marker)
      if (subscription.p256dh !== "fcm") {
        log?.(`Skipping non-FCM subscription ${subscription.$id}`);
        continue;
      }

      try {
        const message = {
          token,
          notification: {
            title: notificationTitle,
            body: notificationBody,
          },
          data: {
            notificationId: notification.$id,
            profileId: profileId,
            kind: notificationKind,
            groupId: groupId || "",
            entityType: notification.entityType || "",
            entityId: notification.entityId || "",
            clickAction: "FLUTTER_NOTIFICATION_CLICK",
          },
          webpush: {
            fcmOptions: {
              link: `${process.env.APP_URL || "http://localhost:5173"}/notifications`,
            },
          },
        };

        await messaging.send(message);
        successCount++;
        log?.(`Push sent successfully to token ${token.substring(0, 20)}...`);

        // Update lastUsedAt
        await databases.updateDocument(
          databaseId,
          pushSubscriptionsCollectionId,
          subscription.$id,
          {
            lastUsedAt: new Date().toISOString(),
          }
        );
      } catch (sendError) {
        failureCount++;
        log?.(
          `Failed to send push to token ${token.substring(0, 20)}...: ${
            sendError.message
          }`
        );

        // If token is invalid, mark subscription as inactive
        if (
          sendError.code === "messaging/invalid-registration-token" ||
          sendError.code === "messaging/registration-token-not-registered"
        ) {
          failedTokens.push(subscription.$id);
          try {
            await databases.updateDocument(
              databaseId,
              pushSubscriptionsCollectionId,
              subscription.$id,
              {
                isActive: false,
              }
            );
            log?.(`Marked subscription ${subscription.$id} as inactive`);
          } catch (updateError) {
            error?.(
              `Failed to update subscription ${subscription.$id}: ${updateError.message}`
            );
          }
        }
      }
    }

    log?.(
      `Push notification sending complete: ${successCount} sent, ${failureCount} failed`
    );

    return json(res, 200, {
      ok: true,
      message: `Push notifications sent to ${successCount} device(s)`,
      sent: successCount,
      failed: failureCount,
      failedTokens,
    });
  } catch (err) {
    error?.(`Error in send-push-notification: ${err.message}`);
    return json(res, 500, {
      ok: false,
      error: err.message || "Internal server error",
    });
  }
};
