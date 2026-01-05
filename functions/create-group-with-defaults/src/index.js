import {
  must,
  safeBodyJson,
  json,
  Client,
  Databases,
  ID,
  Query,
  BASE_PERMISSIONS,
  ROLE_PERMISSION_MAP,
} from "./_shared.js";

/**
 * createGroupWithDefaults
 *
 * Creates a new group with all defaults:
 * 1. Creates the group document
 * 2. Creates group_member for the owner (role: OWNER)
 * 3. Creates base roles (Admin, Editor, Viewer)
 * 4. Creates/ensures base permissions exist
 * 5. Links permissions to roles (role_permissions)
 * 6. Assigns Admin role to owner (user_roles)
 * 7. Creates default calendar for the owner
 *
 * Expected payload:
 * {
 *   "ownerProfileId": "profile_abc123",     // Required: profile ID of the creator
 *   "name": "My Group",                     // Required: group name
 *   "description": "Group description",     // Optional
 *   "logoFileId": "file_xyz789",            // Optional: Storage file ID
 *   "timezone": "America/Mexico_City",      // Optional: defaults to env
 *   "createTeamCalendar": true              // Optional: create a shared "Team" calendar
 * }
 */
export default async ({ req, res, log, error }) => {
  // Track created documents for potential rollback info
  let createdGroup = null;
  let createdMember = null;
  let createdRoles = [];
  let createdPermissions = [];
  let createdRolePermissions = [];
  let createdUserRole = null;
  let createdCalendars = [];

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
    const rolesCollectionId = must("COLLECTION_ROLES_ID");
    const rolePermissionsCollectionId = must("COLLECTION_ROLE_PERMISSIONS_ID");
    const userRolesCollectionId = must("COLLECTION_USER_ROLES_ID");
    const calendarsCollectionId = must("COLLECTION_CALENDARS_ID");
    const permissionsCollectionId = must("COLLECTION_PERMISSIONS_ID");

    // Optional env vars
    const defaultTimezone =
      process.env.DEFAULT_TIMEZONE || "America/Mexico_City";

    const payload = safeBodyJson(req);

    // Debug logging
    log?.(`[DEBUG] Raw body type: ${typeof req?.body}`);
    log?.(
      `[DEBUG] Body: ${JSON.stringify(req?.body || "undefined").slice(0, 200)}`
    );
    log?.(`[DEBUG] Parsed payload: ${JSON.stringify(payload).slice(0, 200)}`);

    // Validate required fields
    const ownerProfileId = String(payload.ownerProfileId || "").trim();
    const name = String(payload.name || "").trim();

    if (!ownerProfileId) {
      return json(res, 400, { ok: false, error: "ownerProfileId is required" });
    }
    if (!name) {
      return json(res, 400, { ok: false, error: "name is required" });
    }

    // Optional fields
    const description = String(payload.description || "").trim() || undefined;
    const logoFileId = String(payload.logoFileId || "").trim() || undefined;
    const timezone = String(payload.timezone || defaultTimezone).trim();
    const createTeamCalendar = payload.createTeamCalendar === true;

    log?.(`Creating group "${name}" for owner ${ownerProfileId}`);

    // =========================================================================
    // 1) Create the group
    // =========================================================================
    const groupData = {
      name,
      description,
      ownerProfileId,
      logoFileId,
      timezone,
      enabled: true,
    };
    // Remove undefined fields
    Object.keys(groupData).forEach(
      (k) => groupData[k] === undefined && delete groupData[k]
    );

    createdGroup = await databases.createDocument(
      databaseId,
      groupsCollectionId,
      ID.unique(),
      groupData
    );
    const groupId = createdGroup.$id;
    log?.(`Group created: ${groupId}`);

    // =========================================================================
    // 2) Create group_member for owner
    // =========================================================================
    const memberData = {
      groupId,
      profileId: ownerProfileId,
      membershipRole: "OWNER",
      enabled: true,
      joinedAt: new Date().toISOString(),
    };

    createdMember = await databases.createDocument(
      databaseId,
      groupMembersCollectionId,
      ID.unique(),
      memberData
    );
    log?.(`Owner membership created: ${createdMember.$id}`);

    // =========================================================================
    // 3) Ensure base permissions exist (global, not per-group)
    // =========================================================================
    log?.(`[STEP 3] Checking permissions...`);
    const existingPermissions = await databases.listDocuments(
      databaseId,
      permissionsCollectionId,
      [Query.limit(100)]
    );

    const existingPermKeys = new Set(
      existingPermissions.documents.map((p) => p.key)
    );

    // Map permission key -> $id
    const permissionKeyToId = {};
    existingPermissions.documents.forEach((p) => {
      permissionKeyToId[p.key] = p.$id;
    });

    // Create missing permissions
    for (const permKey of BASE_PERMISSIONS) {
      if (!existingPermKeys.has(permKey)) {
        log?.(`[STEP 3] Creating permission: ${permKey}`);
        const newPerm = await databases.createDocument(
          databaseId,
          permissionsCollectionId,
          ID.unique(),
          {
            key: permKey,
            description: `Permission: ${permKey}`,
            enabled: true,
          }
        );
        permissionKeyToId[permKey] = newPerm.$id;
        createdPermissions.push(newPerm);
      }
    }
    log?.(
      `[STEP 3] Permissions ready. Created ${createdPermissions.length} new.`
    );

    // =========================================================================
    // 4) Create base roles for this group
    // =========================================================================
    log?.(`[STEP 4] Creating roles...`);
    const baseRoleNames = ["Admin", "Editor", "Viewer"];
    const roleNameToId = {};

    for (const roleName of baseRoleNames) {
      log?.(`[STEP 4] Creating role: ${roleName}`);
      const roleDoc = await databases.createDocument(
        databaseId,
        rolesCollectionId,
        ID.unique(),
        {
          groupId,
          name: roleName,
          description: `${roleName} role for this group`,
          isSystem: true,
          enabled: true,
        }
      );
      roleNameToId[roleName] = roleDoc.$id;
      createdRoles.push(roleDoc);
      log?.(`[STEP 4] Created role: ${roleName} (${roleDoc.$id})`);
    }

    // =========================================================================
    // 5) Link permissions to roles (role_permissions)
    // =========================================================================
    log?.(`[STEP 5] Linking role_permissions...`);
    for (const [roleName, permKeys] of Object.entries(ROLE_PERMISSION_MAP)) {
      const roleId = roleNameToId[roleName];
      if (!roleId) continue;

      for (const permKey of permKeys) {
        const permissionId = permissionKeyToId[permKey];
        if (!permissionId) {
          log?.(`[STEP 5] Warning: Permission ${permKey} not found, skipping`);
          continue;
        }

        const rolePermDoc = await databases.createDocument(
          databaseId,
          rolePermissionsCollectionId,
          ID.unique(),
          {
            groupId,
            roleId,
            permissionId,
            enabled: true,
          }
        );
        createdRolePermissions.push(rolePermDoc);
      }
    }
    log?.(
      `[STEP 5] Created ${createdRolePermissions.length} role-permission links`
    );

    // =========================================================================
    // 6) Assign Admin role to the owner (user_roles)
    // =========================================================================
    log?.(`[STEP 6] Assigning Admin role to owner...`);
    const adminRoleId = roleNameToId["Admin"];
    if (adminRoleId) {
      createdUserRole = await databases.createDocument(
        databaseId,
        userRolesCollectionId,
        ID.unique(),
        {
          groupId,
          profileId: ownerProfileId,
          roleId: adminRoleId,
          enabled: true,
          assignedAt: new Date().toISOString(),
        }
      );
      log?.(`[STEP 6] Assigned Admin role to owner: ${createdUserRole.$id}`);
    }

    // =========================================================================
    // 7) Create default calendar(s)
    // =========================================================================
    log?.(`[STEP 7] Creating default calendars...`);
    // Personal calendar for the owner
    const calendarData = {
      groupId,
      ownerProfileId,
      name: "Personal",
      color: "violet", // Using color token (violet/blue/green/etc)
      icon: "calendar", // Default Lucide icon name
      visibility: "GROUP", // Using GROUP as it's the default enum value
      isDefault: true,
      enabled: true,
    };
    log?.(
      `[STEP 7] Creating personal calendar with data: ${JSON.stringify(
        calendarData
      )}`
    );

    const personalCalendar = await databases.createDocument(
      databaseId,
      calendarsCollectionId,
      ID.unique(),
      calendarData
    );
    createdCalendars.push(personalCalendar);
    log?.(`[STEP 7] Created personal calendar: ${personalCalendar.$id}`);

    // Optional: Team calendar
    if (createTeamCalendar) {
      const teamCalendar = await databases.createDocument(
        databaseId,
        calendarsCollectionId,
        ID.unique(),
        {
          groupId,
          ownerProfileId,
          name: "Equipo",
          color: "blue", // Using color token
          icon: "users", // Team icon
          visibility: "GROUP",
          isDefault: false,
          enabled: true,
        }
      );
      createdCalendars.push(teamCalendar);
      log?.(`Created team calendar: ${teamCalendar.$id}`);
    }

    // =========================================================================
    // Success response
    // =========================================================================
    return json(res, 201, {
      ok: true,
      group: createdGroup,
      member: createdMember,
      roles: createdRoles.map((r) => ({ $id: r.$id, name: r.name })),
      userRole: createdUserRole
        ? { $id: createdUserRole.$id, roleId: createdUserRole.roleId }
        : null,
      calendars: createdCalendars.map((c) => ({
        $id: c.$id,
        name: c.name,
        visibility: c.visibility,
      })),
      permissionsCreated: createdPermissions.length,
      rolePermissionsCreated: createdRolePermissions.length,
    });
  } catch (e) {
    // Log the error
    try {
      error?.(e.message || String(e));
    } catch {}

    // Return error with context about what was created (for manual cleanup if needed)
    return json(res, 500, {
      ok: false,
      error: e.message || String(e),
      partiallyCreated: {
        group: createdGroup?.$id || null,
        member: createdMember?.$id || null,
        roles: createdRoles.map((r) => r.$id),
        calendars: createdCalendars.map((c) => c.$id),
      },
    });
  }
};
