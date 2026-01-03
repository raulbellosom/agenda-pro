import { must, json, Client, Databases, ID, Query } from "./_shared.js";

/**
 * cron_expireInvitations
 *
 * Scheduled function that runs periodically to expire pending invitations
 * that have passed their expiration date.
 *
 * Configure CRON in Appwrite Console:
 *   - Every hour: 0 * * * *
 *   - Every 30 minutes: *\/30 * * * *
 *   - Every 15 minutes: *\/15 * * * *
 *
 * No payload required - this runs automatically on schedule.
 */
export default async ({ req, res, log, error }) => {
  const startTime = Date.now();
  let processedCount = 0;
  let expiredCount = 0;
  let errorCount = 0;

  try {
    const client = new Client()
      .setEndpoint(must("APPWRITE_ENDPOINT"))
      .setProject(must("APPWRITE_PROJECT_ID"))
      .setKey(must("APPWRITE_API_KEY"));

    const databases = new Databases(client);

    // Required env vars
    const databaseId = must("APPWRITE_DATABASE_ID");
    const invitationsCollectionId = must("COLLECTION_GROUP_INVITATIONS_ID");
    const auditLogsCollectionId = must("COLLECTION_AUDIT_LOGS_ID");

    // Optional
    const batchSize = parseInt(process.env.BATCH_SIZE || "100", 10);

    const now = new Date();
    log?.(`[CRON] Starting expire invitations job at ${now.toISOString()}`);

    // =========================================================================
    // Find all pending invitations that have expired
    // =========================================================================
    // Query: status = PENDING AND enabled = true AND expiresAt < now
    const expiredInvitations = await databases.listDocuments(
      databaseId,
      invitationsCollectionId,
      [
        Query.equal("status", "PENDING"),
        Query.equal("enabled", true),
        Query.lessThan("expiresAt", now.toISOString()),
        Query.limit(batchSize),
      ]
    );

    processedCount = expiredInvitations.total;
    log?.(`[CRON] Found ${processedCount} expired invitations to process`);

    if (processedCount === 0) {
      return json(res, 200, {
        ok: true,
        message: "No expired invitations found",
        processed: 0,
        expired: 0,
        errors: 0,
        durationMs: Date.now() - startTime,
      });
    }

    // =========================================================================
    // Process each expired invitation
    // =========================================================================
    for (const invitation of expiredInvitations.documents) {
      try {
        // Update invitation status to EXPIRED
        await databases.updateDocument(
          databaseId,
          invitationsCollectionId,
          invitation.$id,
          {
            status: "EXPIRED",
            respondedAt: now.toISOString(),
          }
        );

        expiredCount++;
        log?.(
          `[CRON] Expired invitation ${invitation.$id} for ${invitation.invitedEmail}`
        );

        // Create audit log entry
        try {
          await databases.createDocument(
            databaseId,
            auditLogsCollectionId,
            ID.unique(),
            {
              groupId: invitation.groupId,
              profileId: "SYSTEM", // System action
              action: "UPDATE",
              entityType: "group_invitations",
              entityId: invitation.$id,
              entityName: invitation.invitedEmail,
              details: JSON.stringify({
                reason: "automatic_expiration",
                originalExpiresAt: invitation.expiresAt,
                expiredAt: now.toISOString(),
              }),
              createdAt: now.toISOString(),
              enabled: true,
            }
          );
        } catch (auditError) {
          // Non-critical, continue
          log?.(
            `[CRON] Warning: Failed to create audit log: ${auditError.message}`
          );
        }
      } catch (e) {
        errorCount++;
        log?.(
          `[CRON] Error expiring invitation ${invitation.$id}: ${e.message}`
        );
      }
    }

    // =========================================================================
    // Summary
    // =========================================================================
    const durationMs = Date.now() - startTime;
    const summary = {
      ok: true,
      message: `Expired ${expiredCount} invitations`,
      processed: processedCount,
      expired: expiredCount,
      errors: errorCount,
      durationMs,
      hasMore: expiredInvitations.total >= batchSize,
    };

    log?.(`[CRON] Job completed: ${JSON.stringify(summary)}`);

    return json(res, 200, summary);
  } catch (e) {
    try {
      error?.(e.message || String(e));
    } catch {}

    return json(res, 500, {
      ok: false,
      error: e.message || String(e),
      processed: processedCount,
      expired: expiredCount,
      errors: errorCount + 1,
      durationMs: Date.now() - startTime,
    });
  }
};
