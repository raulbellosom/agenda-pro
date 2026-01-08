import {
  must,
  safeBodyJson,
  json,
  generateToken,
  hasPermission,
  isOwnerOrAdmin,
  sendInvitationEmail,
  Client,
  Databases,
  ID,
  Query,
} from "./_shared.js";

/**
 * inviteToGroup
 *
 * Invites a user to join a group by email.
 * Creates an invitation with a unique token and expiration date.
 * Uses RBAC - invitedRoleId instead of enum role.
 * Sends email notification via SMTP for new users.
 *
 * Expected payload:
 * {
 *   "groupId": "group_abc123",             // Required: group to invite to
 *   "invitedByProfileId": "profile_xyz",   // Required: who is inviting
 *   "invitedEmail": "user@example.com",    // Required: email to invite
 *   "invitedRoleId": "role_abc123",        // Required: role ID to assign on accept
 *   "message": "Join our team!",           // Optional: custom message
 *   "expiryDays": 7                        // Optional: days until expiration
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
    const notificationsCollectionId = must("COLLECTION_NOTIFICATIONS_ID");
    const auditLogsCollectionId = must("COLLECTION_AUDIT_LOGS_ID");
    const rolesCollectionId = must("COLLECTION_ROLES_ID");

    // RBAC collections
    const userRolesCollectionId = must("COLLECTION_USER_ROLES_ID");
    const rolePermissionsCollectionId = must("COLLECTION_ROLE_PERMISSIONS_ID");
    const permissionsCollectionId = must("COLLECTION_PERMISSIONS_ID");

    const collections = {
      userRoles: userRolesCollectionId,
      rolePermissions: rolePermissionsCollectionId,
      permissions: permissionsCollectionId,
      groupMembers: groupMembersCollectionId,
    };

    // Default expiry days
    const defaultExpiryDays = parseInt(
      process.env.DEFAULT_INVITATION_EXPIRY_DAYS || "7",
      10
    );

    // App URL for invitation links
    const appUrl = process.env.APP_URL || "http://localhost:5173";

    const payload = safeBodyJson(req);

    // Validate required fields
    const groupId = String(payload.groupId || "").trim();
    const invitedByProfileId = String(payload.invitedByProfileId || "").trim();
    const invitedEmail = String(payload.invitedEmail || "")
      .trim()
      .toLowerCase();
    const invitedRoleId = String(payload.invitedRoleId || "").trim();

    if (!groupId) {
      return json(res, 400, { ok: false, error: "groupId is required" });
    }
    if (!invitedByProfileId) {
      return json(res, 400, {
        ok: false,
        error: "invitedByProfileId is required",
      });
    }
    if (!invitedEmail) {
      return json(res, 400, { ok: false, error: "invitedEmail is required" });
    }
    if (!invitedRoleId) {
      return json(res, 400, { ok: false, error: "invitedRoleId is required" });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(invitedEmail)) {
      return json(res, 400, { ok: false, error: "Invalid email format" });
    }

    // Optional fields
    const message = String(payload.message || "").trim() || undefined;
    const expiryDays = parseInt(payload.expiryDays || defaultExpiryDays, 10);

    log?.(
      `Invite request: ${invitedEmail} to group ${groupId} by ${invitedByProfileId}`
    );

    // =========================================================================
    // 1) Verify the group exists
    // =========================================================================
    let group;
    try {
      group = await databases.getDocument(
        databaseId,
        groupsCollectionId,
        groupId
      );
    } catch {
      return json(res, 404, { ok: false, error: "Group not found" });
    }

    if (!group.enabled) {
      return json(res, 400, { ok: false, error: "Group is disabled" });
    }

    // =========================================================================
    // 2) Verify the invited role exists and belongs to this group
    // =========================================================================
    let invitedRole;
    try {
      invitedRole = await databases.getDocument(
        databaseId,
        rolesCollectionId,
        invitedRoleId
      );
    } catch {
      return json(res, 404, { ok: false, error: "Role not found" });
    }

    if (invitedRole.groupId !== groupId) {
      return json(res, 400, {
        ok: false,
        error: "Role does not belong to this group",
      });
    }

    if (!invitedRole.enabled) {
      return json(res, 400, { ok: false, error: "Role is disabled" });
    }

    // =========================================================================
    // 3) Verify inviter has permission to invite
    // =========================================================================
    const inviterIsOwner = await isOwnerOrAdmin(
      databases,
      databaseId,
      collections,
      groupId,
      invitedByProfileId
    );

    if (!inviterIsOwner) {
      const canInvite = await hasPermission(
        databases,
        databaseId,
        collections,
        groupId,
        invitedByProfileId,
        "members.invite"
      );

      if (!canInvite) {
        return json(res, 403, {
          ok: false,
          error: "You don't have permission to invite members to this group",
        });
      }
    }

    // =========================================================================
    // 4) Get inviter profile for email
    // =========================================================================
    let inviterProfile;
    try {
      inviterProfile = await databases.getDocument(
        databaseId,
        usersProfileCollectionId,
        invitedByProfileId
      );
    } catch {
      return json(res, 404, { ok: false, error: "Inviter profile not found" });
    }

    // =========================================================================
    // 5) Check if user is already a member
    // =========================================================================
    const existingMember = await databases.listDocuments(
      databaseId,
      groupMembersCollectionId,
      [
        Query.equal("groupId", groupId),
        Query.equal("enabled", true),
        Query.limit(100),
      ]
    );

    // Find profile by email to check membership
    const profileByEmail = await databases.listDocuments(
      databaseId,
      usersProfileCollectionId,
      [Query.equal("email", invitedEmail), Query.limit(1)]
    );

    const inviteeExists = profileByEmail.total > 0;
    const invitedProfileId = inviteeExists
      ? profileByEmail.documents[0].$id
      : undefined;

    if (inviteeExists) {
      const alreadyMember = existingMember.documents.some(
        (m) => m.profileId === invitedProfileId
      );
      if (alreadyMember) {
        return json(res, 400, {
          ok: false,
          error: "User is already a member of this group",
        });
      }
    }

    // =========================================================================
    // 6) Check for existing pending invitation
    // =========================================================================
    const existingInvitation = await databases.listDocuments(
      databaseId,
      invitationsCollectionId,
      [
        Query.equal("groupId", groupId),
        Query.equal("invitedEmail", invitedEmail),
        Query.equal("status", "PENDING"),
        Query.equal("enabled", true),
        Query.limit(1),
      ]
    );

    if (existingInvitation.total > 0) {
      return json(res, 400, {
        ok: false,
        error: "A pending invitation already exists for this email",
        existingInvitationId: existingInvitation.documents[0].$id,
      });
    }

    // =========================================================================
    // 7) Create the invitation
    // =========================================================================
    const token = generateToken(32);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiryDays);

    const invitationData = {
      groupId,
      invitedEmail,
      invitedProfileId,
      invitedByProfileId,
      invitedRoleId,
      status: "PENDING",
      token,
      message,
      expiresAt: expiresAt.toISOString(),
      enabled: true,
    };

    // Remove undefined fields
    Object.keys(invitationData).forEach(
      (k) => invitationData[k] === undefined && delete invitationData[k]
    );

    const invitation = await databases.createDocument(
      databaseId,
      invitationsCollectionId,
      ID.unique(),
      invitationData
    );
    log?.(`Invitation created: ${invitation.$id}`);

    // =========================================================================
    // 8) Create notification or send email based on user existence
    // =========================================================================
    const inviteLink = `${appUrl}/invite/${token}`;
    let emailSent = false;

    if (inviteeExists) {
      // User exists - create in-app notification
      try {
        // Obtener el accountId del usuario invitado
        const invitedUserProfile = profileByEmail.documents[0];

        await databases.createDocument(
          databaseId,
          notificationsCollectionId,
          ID.unique(),
          {
            groupId,
            profileId: invitedProfileId,
            accountId: invitedUserProfile.accountId, // Agregar accountId para permisos
            kind: "INVITE",
            title: `Invitación a ${group.name}`,
            body:
              message || `Has sido invitado a unirte al grupo "${group.name}"`,
            entityType: "group_invitations",
            entityId: invitation.$id,
            metadata: JSON.stringify({
              token,
              inviteLink,
              inviterName: `${inviterProfile.firstName} ${inviterProfile.lastName}`,
              roleName: invitedRole.name,
            }),
            createdAt: new Date().toISOString(),
            enabled: true,
          }
        );
        log?.(`In-app notification created for existing user`);
      } catch (notifError) {
        log?.(`Warning: Failed to create notification: ${notifError.message}`);
      }
    }

    // Always try to send email (both for new and existing users)
    try {
      emailSent = await sendInvitationEmail({
        to: invitedEmail,
        inviterName: `${inviterProfile.firstName} ${inviterProfile.lastName}`,
        inviterEmail: inviterProfile.email,
        groupName: group.name,
        roleName: invitedRole.name,
        message,
        inviteLink,
        expiresAt: expiresAt.toISOString(),
        isNewUser: !inviteeExists,
      });
      if (emailSent) {
        log?.(`Invitation email sent to ${invitedEmail}`);
      }
    } catch (emailError) {
      log?.(`Warning: Failed to send email: ${emailError.message}`);
      // Non-critical - continue even if email fails
    }

    // =========================================================================
    // 9) Create audit log
    // =========================================================================
    try {
      await databases.createDocument(
        databaseId,
        auditLogsCollectionId,
        ID.unique(),
        {
          groupId,
          profileId: invitedByProfileId,
          action: "CREATE",
          entityType: "group_invitations",
          entityId: invitation.$id,
          entityName: invitedEmail,
          details: JSON.stringify({
            invitedEmail,
            invitedRoleId,
            roleName: invitedRole.name,
            expiresAt: expiresAt.toISOString(),
            emailSent,
            inviteeExists,
          }),
          createdAt: new Date().toISOString(),
          enabled: true,
        }
      );
    } catch (auditError) {
      log?.(`Warning: Failed to create audit log: ${auditError.message}`);
    }

    // =========================================================================
    // Success response
    // =========================================================================
    return json(res, 201, {
      ok: true,
      invitation: {
        $id: invitation.$id,
        groupId,
        invitedEmail,
        invitedRoleId,
        roleName: invitedRole.name,
        status: "PENDING",
        token,
        expiresAt: expiresAt.toISOString(),
      },
      group: {
        $id: group.$id,
        name: group.name,
      },
      inviteeExists,
      emailSent,
      inviteLink,
    });
  } catch (e) {
    try {
      error?.(e.message || String(e));
    } catch {}
    return json(res, 500, { ok: false, error: e.message || String(e) });
  }
};
