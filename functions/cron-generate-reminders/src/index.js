import {
  must,
  json,
  calculateTriggerTime,
  Client,
  Databases,
  ID,
  Query,
} from "./_shared.js";

/**
 * cron_generateReminders
 *
 * Scheduled function that runs every minute (or 2 minutes) to check for
 * event reminders that need to be triggered and creates notifications.
 *
 * Configure CRON in Appwrite Console:
 *   - Every minute: * * * * *
 *   - Every 2 minutes: *\/2 * * * *
 *
 * Strategy:
 * 1. Find events starting in the next X minutes (LOOK_AHEAD_MINUTES)
 * 2. For each event, check its reminders
 * 3. If a reminder's trigger time is NOW (within the current window), create notification
 * 4. Mark the reminder as triggered (lastTriggeredAt) to avoid duplicates
 *
 * No payload required - this runs automatically on schedule.
 */
export default async ({ req, res, log, error }) => {
  const startTime = Date.now();
  let eventsProcessed = 0;
  let remindersChecked = 0;
  let notificationsCreated = 0;
  let errorCount = 0;

  try {
    const client = new Client()
      .setEndpoint(must("APPWRITE_ENDPOINT"))
      .setProject(must("APPWRITE_PROJECT_ID"))
      .setKey(must("APPWRITE_API_KEY"));

    const databases = new Databases(client);

    // Required env vars
    const databaseId = must("APPWRITE_DATABASE_ID");
    const eventsCollectionId = must("COLLECTION_EVENTS_ID");
    const eventRemindersCollectionId = must("COLLECTION_EVENT_REMINDERS_ID");
    const eventAttendeesCollectionId = must("COLLECTION_EVENT_ATTENDEES_ID");
    const calendarsCollectionId = must("COLLECTION_CALENDARS_ID");
    const notificationsCollectionId = must("COLLECTION_NOTIFICATIONS_ID");
    const usersProfileCollectionId = must("COLLECTION_USERS_PROFILE_ID");

    // Optional config
    const batchSize = parseInt(process.env.BATCH_SIZE || "100", 10);
    const lookAheadMinutes = parseInt(
      process.env.LOOK_AHEAD_MINUTES || "5",
      10
    );

    const now = new Date();
    const windowStart = new Date(now);
    windowStart.setMinutes(windowStart.getMinutes() - 1); // 1 min ago (to catch anything missed)

    const windowEnd = new Date(now);
    windowEnd.setMinutes(windowEnd.getMinutes() + lookAheadMinutes);

    // For determining if reminder should trigger: between windowStart and now
    const triggerWindowEnd = new Date(now);
    triggerWindowEnd.setMinutes(triggerWindowEnd.getMinutes() + 1);

    log?.(`[CRON] Starting generate reminders job at ${now.toISOString()}`);
    log?.(
      `[CRON] Looking for events starting between ${windowStart.toISOString()} and ${windowEnd.toISOString()}`
    );

    // =========================================================================
    // 1) Find upcoming events in the look-ahead window
    // =========================================================================
    // We need events that:
    // - Are enabled and CONFIRMED
    // - Start within our look-ahead window (to check their reminders)
    const maxLookAhead = new Date(now);
    maxLookAhead.setHours(maxLookAhead.getHours() + 24); // Max 24h ahead for reminders

    const upcomingEvents = await databases.listDocuments(
      databaseId,
      eventsCollectionId,
      [
        Query.equal("enabled", true),
        Query.equal("status", "CONFIRMED"),
        Query.greaterThan("startAt", windowStart.toISOString()),
        Query.lessThan("startAt", maxLookAhead.toISOString()),
        Query.limit(batchSize),
      ]
    );

    log?.(`[CRON] Found ${upcomingEvents.total} upcoming events to check`);

    if (upcomingEvents.total === 0) {
      return json(res, 200, {
        ok: true,
        message: "No upcoming events found",
        eventsProcessed: 0,
        remindersChecked: 0,
        notificationsCreated: 0,
        errors: 0,
        durationMs: Date.now() - startTime,
      });
    }

    // =========================================================================
    // 2) Process each event
    // =========================================================================
    for (const event of upcomingEvents.documents) {
      try {
        eventsProcessed++;
        const eventStartAt = new Date(event.startAt);

        // Get reminders for this event
        const reminders = await databases.listDocuments(
          databaseId,
          eventRemindersCollectionId,
          [
            Query.equal("eventId", event.$id),
            Query.equal("enabled", true),
            Query.limit(20),
          ]
        );

        for (const reminder of reminders.documents) {
          remindersChecked++;

          // Calculate when this reminder should trigger
          const triggerTime = calculateTriggerTime(eventStartAt, reminder);

          if (!triggerTime) {
            log?.(
              `[CRON] Skipping reminder ${reminder.$id}: invalid trigger config`
            );
            continue;
          }

          // Check if trigger time is within our current execution window
          // (between windowStart and triggerWindowEnd)
          if (triggerTime < windowStart || triggerTime > triggerWindowEnd) {
            // Not time yet, or already past
            continue;
          }

          // Check if already triggered (to avoid duplicates)
          if (reminder.lastTriggeredAt) {
            const lastTriggered = new Date(reminder.lastTriggeredAt);
            // If triggered within the last hour for this same event, skip
            const hourAgo = new Date(now);
            hourAgo.setHours(hourAgo.getHours() - 1);
            if (lastTriggered > hourAgo) {
              log?.(
                `[CRON] Skipping reminder ${reminder.$id}: already triggered recently`
              );
              continue;
            }
          }

          log?.(
            `[CRON] Triggering reminder ${reminder.$id} for event "${event.title}"`
          );

          // ===================================================================
          // 3) Determine who to notify
          // ===================================================================
          const recipientProfileIds = new Set();

          // Always notify the event owner
          recipientProfileIds.add(event.ownerProfileId);

          // Get attendees
          const attendees = await databases.listDocuments(
            databaseId,
            eventAttendeesCollectionId,
            [
              Query.equal("eventId", event.$id),
              Query.equal("enabled", true),
              Query.notEqual("responseStatus", "DECLINED"),
              Query.limit(100),
            ]
          );

          for (const attendee of attendees.documents) {
            if (attendee.profileId) {
              recipientProfileIds.add(attendee.profileId);
            }
          }

          // ===================================================================
          // 4) Create notifications for each recipient
          // ===================================================================
          const channels = reminder.channel || ["IN_APP"];

          // Format time display
          const minutesUntil = Math.round((eventStartAt - now) / (1000 * 60));
          let timeText;
          if (minutesUntil <= 0) {
            timeText = "ahora";
          } else if (minutesUntil < 60) {
            timeText = `en ${minutesUntil} minutos`;
          } else {
            const hours = Math.round(minutesUntil / 60);
            timeText = `en ${hours} hora${hours > 1 ? "s" : ""}`;
          }

          for (const profileId of recipientProfileIds) {
            try {
              // Create IN_APP notification
              if (channels.includes("IN_APP")) {
                // Obtener el perfil para el accountId
                let accountId;
                try {
                  const profile = await databases.getDocument(
                    databaseId,
                    usersProfileCollectionId,
                    profileId
                  );
                  accountId = profile.accountId;
                } catch (profileError) {
                  log?.(
                    `[CRON] Warning: Could not get accountId for ${profileId}: ${profileError.message}`
                  );
                }

                await databases.createDocument(
                  databaseId,
                  notificationsCollectionId,
                  ID.unique(),
                  {
                    // groupId is optional - only set if event has groupId
                    ...(event.groupId && { groupId: event.groupId }),
                    profileId,
                    accountId, // Agregar accountId para permisos
                    kind: "EVENT_REMINDER",
                    title: `Recordatorio: ${event.title}`,
                    body: `Tu evento "${event.title}" comienza ${timeText}`,
                    entityType: "events",
                    entityId: event.$id,
                    createdAt: now.toISOString(),
                    enabled: true,
                  }
                );
                notificationsCreated++;
              }

              // TODO: Handle PUSH and EMAIL channels
              // For PUSH: Look up push_subscriptions and call a push service
              // For EMAIL: Call an email service or queue
            } catch (notifError) {
              errorCount++;
              log?.(
                `[CRON] Error creating notification for ${profileId}: ${notifError.message}`
              );
            }
          }

          // ===================================================================
          // 5) Mark reminder as triggered
          // ===================================================================
          try {
            await databases.updateDocument(
              databaseId,
              eventRemindersCollectionId,
              reminder.$id,
              {
                lastTriggeredAt: now.toISOString(),
              }
            );
          } catch (updateError) {
            log?.(
              `[CRON] Warning: Failed to update lastTriggeredAt: ${updateError.message}`
            );
          }
        }
      } catch (eventError) {
        errorCount++;
        log?.(
          `[CRON] Error processing event ${event.$id}: ${eventError.message}`
        );
      }
    }

    // =========================================================================
    // Summary
    // =========================================================================
    const durationMs = Date.now() - startTime;
    const summary = {
      ok: true,
      message: `Created ${notificationsCreated} notifications`,
      eventsProcessed,
      remindersChecked,
      notificationsCreated,
      errors: errorCount,
      durationMs,
      hasMore: upcomingEvents.total >= batchSize,
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
      eventsProcessed,
      remindersChecked,
      notificationsCreated,
      errors: errorCount + 1,
      durationMs: Date.now() - startTime,
    });
  }
};
