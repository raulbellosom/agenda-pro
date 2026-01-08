import {
  must,
  safeBodyJson,
  json,
  Client,
  Databases,
  ID,
  Query,
} from "./_shared.js";

/**
 * acceptInvitation
 *
 * Accepts a group invitation and creates the membership.
 * Can also reject/cancel invitations.
 *
 * Expected payload:
 * {
 *   "token": "invitation_token_here",       // Required: the invitation token
 *   "profileId": "profile_abc123",          // Required: profile of the user accepting
 *   "action": "accept"                      // Optional: "accept" (default), "reject", "cancel"
 * }
 */
export default async ({ req, res, log, error }) => {
  try {
    const client = new Client()
      .setEndpoint(must("APPWRITE_ENDPOINT"))
      .setProject(must("APPWRITE_PROJECT_ID"))
      .setKey(must("APPWRITE_API_KEY"));

    const databases = new Databases(client);

    // Required env vars
    const databaseId = must("APPWRITE_DATABASE_ID");
    const groupsCollectionId = must("COLLECTION_GROUPS_ID");
    const groupMembersCollectionId = must("COLLECTION_GROUP_MEMBERS_ID");
    const invitationsCollectionId = must("COLLECTION_GROUP_INVITATIONS_ID");
    const usersProfileCollectionId = must("COLLECTION_USERS_PROFILE_ID");
    const rolesCollectionId = must("COLLECTION_ROLES_ID");
    const userRolesCollectionId = must("COLLECTION_USER_ROLES_ID");
    const calendarsCollectionId = must("COLLECTION_CALENDARS_ID");
    const notificationsCollectionId = must("COLLECTION_NOTIFICATIONS_ID");
    const auditLogsCollectionId = must("COLLECTION_AUDIT_LOGS_ID");

    // Optional collections
    const userSettingsCollectionId =
      process.env.COLLECTION_USER_SETTINGS_ID || "";

    // Defaults
    const defaultCalendarColor = process.env.DEFAULT_CALENDAR_COLOR || "10b981";
    const defaultTimezone =
      process.env.DEFAULT_TIMEZONE || "America/Mexico_City";
    const defaultLanguage = process.env.DEFAULT_LANGUAGE || "es";

    const payload = safeBodyJson(req);

    // Validate required fields
    const token = String(payload.token || "").trim();
    const profileId = String(payload.profileId || "").trim();
    const action = String(payload.action || "accept").toLowerCase();

    if (!token) {
      return json(res, 400, { ok: false, error: "token is required" });
    }
    if (!profileId) {
      return json(res, 400, { ok: false, error: "profileId is required" });
    }
    if (!["accept", "reject", "cancel"].includes(action)) {
      return json(res, 400, {
        ok: false,
        error: "action must be accept, reject, or cancel",
      });
    }

    log?.(`Processing invitation: action=${action}, profileId=${profileId}`);

    // =========================================================================
    // 1) Find the invitation by token
    // =========================================================================
    const invitations = await databases.listDocuments(
      databaseId,
      invitationsCollectionId,
      [Query.equal("token", token), Query.limit(1)]
    );

    if (invitations.total === 0) {
      return json(res, 404, { ok: false, error: "Invitation not found" });
    }

    const invitation = invitations.documents[0];

    // =========================================================================
    // 2) Validate invitation status
    // =========================================================================
    if (!invitation.enabled) {
      return json(res, 400, {
        ok: false,
        error: "Invitation has been disabled",
      });
    }

    if (invitation.status !== "PENDING") {
      return json(res, 400, {
        ok: false,
        error: `Invitation is already ${invitation.status.toLowerCase()}`,
        status: invitation.status,
      });
    }

    // Check expiration
    const expiresAt = new Date(invitation.expiresAt);
    if (expiresAt < new Date()) {
      // Mark as expired
      await databases.updateDocument(
        databaseId,
        invitationsCollectionId,
        invitation.$id,
        { status: "EXPIRED", respondedAt: new Date().toISOString() }
      );
      return json(res, 400, { ok: false, error: "Invitation has expired" });
    }

    // =========================================================================
    // 3) Verify the user's profile matches the invitation
    // =========================================================================
    let userProfile;
    try {
      userProfile = await databases.getDocument(
        databaseId,
        usersProfileCollectionId,
        profileId
      );
    } catch {
      return json(res, 404, { ok: false, error: "Profile not found" });
    }

    // Verify email matches (case-insensitive)
    if (
      userProfile.email.toLowerCase() !== invitation.invitedEmail.toLowerCase()
    ) {
      return json(res, 403, {
        ok: false,
        error: "This invitation was sent to a different email address",
      });
    }

    // =========================================================================
    // 4) Get the group
    // =========================================================================
    let group;
    try {
      group = await databases.getDocument(
        databaseId,
        groupsCollectionId,
        invitation.groupId
      );
    } catch {
      return json(res, 404, { ok: false, error: "Group no longer exists" });
    }

    if (!group.enabled) {
      return json(res, 400, { ok: false, error: "Group has been disabled" });
    }

    const groupId = group.$id;

    // =========================================================================
    // 5) Handle the action
    // =========================================================================
    const now = new Date().toISOString();
    let result = { action };

    if (action === "reject") {
      // Simply mark as rejected
      await databases.updateDocument(
        databaseId,
        invitationsCollectionId,
        invitation.$id,
        { status: "REJECTED", respondedAt: now }
      );

      // Notify the inviter
      try {
        // Obtener el perfil del invitador para el accountId
        const inviterProfile = await databases.getDocument(
          databaseId,
          usersProfileCollectionId,
          invitation.invitedByProfileId
        );

        await databases.createDocument(
          databaseId,
          notificationsCollectionId,
          ID.unique(),
          {
            groupId,
            profileId: invitation.invitedByProfileId,
            accountId: inviterProfile.accountId, // Agregar accountId para permisos
            kind: "SYSTEM",
            title: "Invitación rechazada",
            body: `${userProfile.firstName} ${userProfile.lastName} ha rechazado la invitación al grupo "${group.name}"`,
            entityType: "group_invitations",
            entityId: invitation.$id,
            createdAt: now,
            enabled: true,
          }
        );
      } catch (notifError) {
        log?.(`Warning: Failed to create notification: ${notifError.message}`);
      }

      result.message = "Invitation rejected";
    } else if (action === "cancel") {
      // Mark as cancelled (usually by inviter)
      await databases.updateDocument(
        databaseId,
        invitationsCollectionId,
        invitation.$id,
        { status: "CANCELLED", respondedAt: now }
      );
      result.message = "Invitation cancelled";
    } else {
      // action === "accept"
      // =====================================================================
      // 5a) Check if already a member
      // =====================================================================
      const existingMember = await databases.listDocuments(
        databaseId,
        groupMembersCollectionId,
        [
          Query.equal("groupId", groupId),
          Query.equal("profileId", profileId),
          Query.equal("enabled", true),
          Query.limit(1),
        ]
      );

      if (existingMember.total > 0) {
        // Mark invitation as accepted anyway
        await databases.updateDocument(
          databaseId,
          invitationsCollectionId,
          invitation.$id,
          { status: "ACCEPTED", respondedAt: now, invitedProfileId: profileId }
        );
        return json(res, 400, {
          ok: false,
          error: "You are already a member of this group",
        });
      }

      // =====================================================================
      // 5b) Create group_member
      // =====================================================================
      const member = await databases.createDocument(
        databaseId,
        groupMembersCollectionId,
        ID.unique(),
        {
          groupId,
          profileId,
          membershipRole: "MEMBER",
          enabled: true,
          joinedAt: now,
        }
      );
      log?.(`Member created: ${member.$id}`);
      result.member = {
        $id: member.$id,
        membershipRole: member.membershipRole,
      };

      // =====================================================================
      // 5c) Assign role from invitation (using invitedRoleId)
      // =====================================================================
      // Use the role specified in the invitation
      if (invitation.invitedRoleId) {
        // Verify the role exists and is enabled
        try {
          const invitedRole = await databases.getDocument(
            databaseId,
            rolesCollectionId,
            invitation.invitedRoleId
          );

          if (
            invitedRole &&
            invitedRole.enabled &&
            invitedRole.groupId === groupId
          ) {
            const userRole = await databases.createDocument(
              databaseId,
              userRolesCollectionId,
              ID.unique(),
              {
                groupId,
                profileId,
                roleId: invitation.invitedRoleId,
                enabled: true,
                assignedAt: now,
              }
            );
            log?.(`User role assigned: ${userRole.$id} (${invitedRole.name})`);
            result.userRole = { $id: userRole.$id, roleName: invitedRole.name };
          } else {
            log?.(
              `Warning: Invited role ${invitation.invitedRoleId} not valid, falling back to Editor`
            );
            // Fallback to Editor role
            const editorRoles = await databases.listDocuments(
              databaseId,
              rolesCollectionId,
              [
                Query.equal("groupId", groupId),
                Query.equal("name", "Editor"),
                Query.equal("enabled", true),
                Query.limit(1),
              ]
            );

            if (editorRoles.total > 0) {
              const userRole = await databases.createDocument(
                databaseId,
                userRolesCollectionId,
                ID.unique(),
                {
                  groupId,
                  profileId,
                  roleId: editorRoles.documents[0].$id,
                  enabled: true,
                  assignedAt: now,
                }
              );
              log?.(`User role assigned (fallback): ${userRole.$id}`);
              result.userRole = { $id: userRole.$id, roleName: "Editor" };
            }
          }
        } catch (roleError) {
          log?.(`Warning: Could not assign invited role: ${roleError.message}`);
        }
      } else {
        // Legacy: if no invitedRoleId, assign Editor role by default
        const roles = await databases.listDocuments(
          databaseId,
          rolesCollectionId,
          [
            Query.equal("groupId", groupId),
            Query.equal("name", "Editor"),
            Query.equal("enabled", true),
            Query.limit(1),
          ]
        );

        if (roles.total > 0) {
          const userRole = await databases.createDocument(
            databaseId,
            userRolesCollectionId,
            ID.unique(),
            {
              groupId,
              profileId,
              roleId: roles.documents[0].$id,
              enabled: true,
              assignedAt: now,
            }
          );
          log?.(`User role assigned (default): ${userRole.$id}`);
          result.userRole = { $id: userRole.$id, roleName: "Editor" };
        }
      }

      // =====================================================================
      // 5d) Create or reactivate personal calendar for new member
      // =====================================================================
      // Primero buscar si existe un calendario Personal desactivado
      const existingCalendars = await databases.listDocuments(
        databaseId,
        calendarsCollectionId,
        [
          Query.equal("groupId", groupId),
          Query.equal("ownerProfileId", profileId),
          Query.equal("name", "Personal"),
          Query.equal("isDefault", true),
          Query.limit(1),
        ]
      );

      let calendar;
      if (existingCalendars.total > 0) {
        // Reactivar el calendario existente
        calendar = await databases.updateDocument(
          databaseId,
          calendarsCollectionId,
          existingCalendars.documents[0].$id,
          {
            enabled: true,
            visibility: "PRIVATE", // Asegurar que sea PRIVATE
          }
        );
        log?.(
          `Personal calendar reactivated: ${calendar.$id} (was previously disabled)`
        );
      } else {
        // Crear nuevo calendario Personal
        calendar = await databases.createDocument(
          databaseId,
          calendarsCollectionId,
          ID.unique(),
          {
            groupId,
            ownerProfileId: profileId,
            name: "Personal",
            color: defaultCalendarColor,
            visibility: "PRIVATE",
            isDefault: true,
            enabled: true,
          }
        );
        log?.(`Personal calendar created: ${calendar.$id}`);
      }
      result.calendar = { $id: calendar.$id, name: calendar.name };

      // =====================================================================
      // 5e) Create user_settings for this group
      // =====================================================================
      if (userSettingsCollectionId) {
        try {
          const userSettings = await databases.createDocument(
            databaseId,
            userSettingsCollectionId,
            ID.unique(),
            {
              groupId,
              profileId,
              timezone: defaultTimezone,
              dateFormat: "DD/MM/YYYY",
              timeFormat: "24h",
              weekStartsOn: 0,
              defaultCalendarId: calendar.$id,
              notificationsEnabled: true,
              emailNotificationsEnabled: true,
              pushNotificationsEnabled: false,
              defaultReminderMinutes: 15,
              soundEnabled: true,
              language: defaultLanguage,
              theme: "SYSTEM",
              enabled: true,
            }
          );
          log?.(`User settings created: ${userSettings.$id}`);
          result.userSettings = { $id: userSettings.$id };
        } catch (settingsError) {
          log?.(
            `Warning: Failed to create user settings: ${settingsError.message}`
          );
          // No fallar todo el proceso - settings pueden crearse después desde el frontend
        }
      }

      // =====================================================================
      // 5f) Mark invitation as accepted
      // =====================================================================
      await databases.updateDocument(
        databaseId,
        invitationsCollectionId,
        invitation.$id,
        { status: "ACCEPTED", respondedAt: now, invitedProfileId: profileId }
      );

      // =====================================================================
      // 5g) Notify the inviter
      // =====================================================================
      try {
        // Obtener el perfil del invitador para el accountId
        const inviterProfile = await databases.getDocument(
          databaseId,
          usersProfileCollectionId,
          invitation.invitedByProfileId
        );

        await databases.createDocument(
          databaseId,
          notificationsCollectionId,
          ID.unique(),
          {
            groupId,
            profileId: invitation.invitedByProfileId,
            accountId: inviterProfile.accountId, // Agregar accountId para permisos
            kind: "SYSTEM",
            title: "Invitación aceptada",
            body: `${userProfile.firstName} ${userProfile.lastName} ha aceptado la invitación al grupo "${group.name}"`,
            entityType: "group_members",
            entityId: member.$id,
            createdAt: now,
            enabled: true,
          }
        );
      } catch (notifError) {
        log?.(`Warning: Failed to create notification: ${notifError.message}`);
      }

      result.message = "Invitation accepted successfully";
    }

    // =========================================================================
    // 6) Create audit log
    // =========================================================================
    try {
      await databases.createDocument(
        databaseId,
        auditLogsCollectionId,
        ID.unique(),
        {
          groupId,
          profileId,
          action: action === "accept" ? "CREATE" : "UPDATE",
          entityType:
            action === "accept" ? "group_members" : "group_invitations",
          entityId: action === "accept" ? result.member?.$id : invitation.$id,
          entityName: `${userProfile.firstName} ${userProfile.lastName}`,
          details: JSON.stringify({
            action,
            invitationId: invitation.$id,
            invitedRoleId: invitation.invitedRoleId,
          }),
          createdAt: now,
          enabled: true,
        }
      );
    } catch (auditError) {
      log?.(`Warning: Failed to create audit log: ${auditError.message}`);
    }

    // =========================================================================
    // Success response
    // =========================================================================
    return json(res, 200, {
      ok: true,
      ...result,
      invitation: {
        $id: invitation.$id,
        status:
          action === "accept"
            ? "ACCEPTED"
            : action === "reject"
            ? "REJECTED"
            : "CANCELLED",
      },
      group: {
        $id: group.$id,
        name: group.name,
      },
      profile: {
        $id: userProfile.$id,
        firstName: userProfile.firstName,
        lastName: userProfile.lastName,
      },
    });
  } catch (e) {
    try {
      error?.(e.message || String(e));
    } catch {}
    return json(res, 500, { ok: false, error: e.message || String(e) });
  }
};
