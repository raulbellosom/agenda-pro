import {
  must,
  safeBodyJson,
  json,
  splitName,
  Client,
  Databases,
  Users,
  ID,
  Query,
} from "./_shared.js";

export default async ({ req, res, log, error }) => {
  // Track what was created for error reporting
  let createdUser = null;
  let createdProfile = null;
  let groupMemberDoc = null;
  let userRoleDoc = null;
  let userSettingsDoc = null;

  try {
    const client = new Client()
      .setEndpoint(must("APPWRITE_ENDPOINT"))
      .setProject(must("APPWRITE_PROJECT_ID"))
      .setKey(must("APPWRITE_API_KEY"));

    const databases = new Databases(client);
    const users = new Users(client);

    const databaseId = must("APPWRITE_DATABASE_ID");
    const usersProfileCollectionId = must("COLLECTION_USERS_PROFILE_ID");

    // Optional collections for tenancy/RBAC
    const groupMembersCollectionId =
      process.env.COLLECTION_GROUP_MEMBERS_ID || "";
    const userRolesCollectionId = process.env.COLLECTION_USER_ROLES_ID || "";
    const userSettingsCollectionId =
      process.env.COLLECTION_USER_SETTINGS_ID || "";
    const defaultGroupRole = process.env.DEFAULT_GROUP_ROLE || "MEMBER";
    const defaultRoleId = process.env.DEFAULT_ROLE_ID || "";

    const payload = safeBodyJson(req);

    const email = String(payload.email || "")
      .trim()
      .toLowerCase();
    const password = String(payload.password || "");
    const name = String(payload.name || "").trim();

    if (!email || !password || !name) {
      return json(res, 400, {
        ok: false,
        error: "email, password, name are required",
      });
    }

    // Validar y limpiar teléfono si se proporciona
    let validPhone = undefined;
    if (payload.phone) {
      const rawPhone = String(payload.phone).trim();
      // Debe empezar con + y tener entre 7-15 dígitos totales
      if (rawPhone.startsWith("+")) {
        const digits = rawPhone.slice(1).replace(/\D/g, "");
        if (digits.length >= 7 && digits.length <= 15) {
          validPhone = `+${digits}`;
        }
      }
    }

    // 1) Create Auth user
    // Signature: users.create(userId, email, phone, password, name)
    log?.("Creating Auth user...");
    createdUser = await users.create(
      ID.unique(),
      email,
      validPhone,
      password,
      name
    );
    log?.(`Auth user created: ${createdUser.$id}`);

    // 2) Create users_profile
    const parsed = splitName(name);
    const firstName = String(payload.firstName || parsed.firstName).trim();
    const lastName = String(payload.lastName || parsed.lastName).trim();

    if (!firstName || !lastName) {
      return json(res, 400, {
        ok: false,
        error: "firstName and lastName are required",
      });
    }

    const profilePayload = {
      userAuthId: createdUser.$id,
      email,
      username: String(payload.username || "").trim() || undefined,
      firstName,
      lastName,
      phone: validPhone,
      avatarFileId: String(payload.avatarFileId || "").trim() || undefined,
      isPlatformAdmin: payload.isPlatformAdmin === true,
      status: String(payload.status || "ACTIVE"),
      enabled: payload.enabled ?? true,
      emailVerified: false, // Must verify email before login
    };

    // Remove undefined fields
    Object.keys(profilePayload).forEach(
      (k) => profilePayload[k] === undefined && delete profilePayload[k]
    );

    log?.("Creating users_profile...");
    createdProfile = await databases.createDocument(
      databaseId,
      usersProfileCollectionId,
      ID.unique(),
      profilePayload
    );
    log?.(`Profile created: ${createdProfile.$id}`);

    // 3) Optional: create group membership (group_members)
    // ⚠️ CAMBIO v2: groupId ahora es groups.$id directamente (no teamId)
    // Schema: groupId = groups.$id, profileId = users_profile.$id
    // Relationships: group = groups.$id, profile = users_profile.$id
    if (payload.groupId && groupMembersCollectionId) {
      try {
        log?.(`Creating group membership for groupId: ${payload.groupId}`);

        const memberPayload = {
          // Campos escalares (sin relaciones two-way)
          groupId: String(payload.groupId), // groups.$id
          profileId: createdProfile.$id, // users_profile.$id
          role: String(payload.role || defaultGroupRole),
          enabled: true,
          joinedAt: new Date().toISOString(),
          notes: String(payload.notes || ""),
        };

        groupMemberDoc = await databases.createDocument(
          databaseId,
          groupMembersCollectionId,
          ID.unique(),
          memberPayload
        );
        log?.(`Group membership created: ${groupMemberDoc.$id}`);
      } catch (memberError) {
        log?.(
          `Warning: Failed to create group membership: ${memberError.message}`
        );
        // No fallar todo el proceso
      }
    }

    // 4) Optional: assign a default Role (user_roles)
    // ⚠️ CAMBIO v2: groupId es groups.$id directamente
    if (
      payload.groupId &&
      userRolesCollectionId &&
      (payload.roleId || defaultRoleId)
    ) {
      try {
        log?.("Creating user role assignment...");
        userRoleDoc = await databases.createDocument(
          databaseId,
          userRolesCollectionId,
          ID.unique(),
          {
            // Campos escalares (sin relaciones two-way)
            groupId: String(payload.groupId), // groups.$id
            profileId: createdProfile.$id, // users_profile.$id
            roleId: String(payload.roleId || defaultRoleId),
            enabled: true,
            assignedAt: new Date().toISOString(),
          }
        );
        log?.(`User role assigned: ${userRoleDoc.$id}`);
      } catch (roleError) {
        log?.(`Warning: Failed to assign role: ${roleError.message}`);
      }
    }

    // 5) Create user_settings with defaults (GLOBAL settings, not group-specific)
    // User settings are now global per user, not per group
    const userSettingsCollectionId =
      process.env.COLLECTION_USER_SETTINGS_ID || "";
    if (userSettingsCollectionId) {
      try {
        log?.("Creating global user settings with defaults...");
        userSettingsDoc = await databases.createDocument(
          databaseId,
          userSettingsCollectionId,
          ID.unique(),
          {
            // Required fields
            profileId: createdProfile.$id,
            // Optional with defaults (from schema)
            timezone: String(payload.timezone || "America/Mexico_City"),
            dateFormat: String(payload.dateFormat || "DD/MM/YYYY"),
            timeFormat: String(payload.timeFormat || "24h"),
            weekStartsOn: Number(payload.weekStartsOn ?? 0), // 0 = Sunday
            notificationsEnabled: payload.notificationsEnabled ?? true,
            emailNotificationsEnabled:
              payload.emailNotificationsEnabled ?? true,
            pushNotificationsEnabled: payload.pushNotificationsEnabled ?? false,
            defaultReminderMinutes: Number(
              payload.defaultReminderMinutes ?? 15
            ),
            soundEnabled: payload.soundEnabled ?? true,
            language: String(payload.language || "es"),
            theme: String(payload.theme || "SYSTEM"),
            enabled: true,
            // groupId is NULL (not included) - settings are global
          }
        );
        log?.(`User settings created: ${userSettingsDoc.$id}`);
      } catch (settingsError) {
        log?.(
          `Warning: Failed to create user settings: ${settingsError.message}`
        );
        // No fallar todo el proceso - settings pueden crearse después
      }
    }

    // 6) Create personal default calendar (always, regardless of group)
    const calendarsCollectionId = process.env.COLLECTION_CALENDARS_ID || "";
    if (calendarsCollectionId) {
      try {
        log?.("Creating personal default calendar...");
        const personalCalendar = await databases.createDocument(
          databaseId,
          calendarsCollectionId,
          ID.unique(),
          {
            ownerProfileId: createdProfile.$id,
            scope: "PERSONAL", // PERSONAL calendar
            name: "Mi Calendario",
            color: "violet",
            icon: "calendar",
            visibility: "PRIVATE", // Personal calendars are always private
            isDefault: true,
            enabled: true,
            // groupId is NULL (not included)
          }
        );
        log?.(`Personal calendar created: ${personalCalendar.$id}`);
      } catch (calendarError) {
        log?.(
          `Warning: Failed to create personal calendar: ${calendarError.message}`
        );
        // No fallar todo el proceso
      }
    }

    return json(res, 201, {
      ok: true,
      user: createdUser,
      profile: createdProfile,
      groupMember: groupMemberDoc,
      userRole: userRoleDoc,
      userSettings: userSettingsDoc,
    });
  } catch (e) {
    try {
      error?.(e.message || String(e));
    } catch {}
    return json(res, 500, {
      ok: false,
      error: e.message || String(e),
      // Info de lo que sí se creó (para debugging)
      partialData: {
        userId: createdUser?.$id || null,
        profileId: createdProfile?.$id || null,
      },
    });
  }
};
