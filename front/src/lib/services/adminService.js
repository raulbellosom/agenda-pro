/**
 * Admin Data Service
 * Operaciones de administración de plataforma
 * Solo para Platform Admins
 */
import { ID, Query } from "appwrite";
import { databases, functions, account } from "../../shared/appwrite/client";
import { APPWRITE, COLLECTIONS, FUNCTIONS } from "../constants";

const { databaseId } = APPWRITE;

// =============================================================================
// USERS
// =============================================================================

/**
 * Obtiene todos los usuarios de la plataforma
 * Solo para Platform Admins
 */
export async function getAllUsers() {
  const response = await databases.listDocuments(
    databaseId,
    COLLECTIONS.USERS_PROFILE,
    [Query.orderDesc("$createdAt"), Query.limit(500)]
  );
  return response.documents;
}

/**
 * Obtiene un usuario por ID
 */
export async function getUser(userId) {
  return databases.getDocument(databaseId, COLLECTIONS.USERS_PROFILE, userId);
}

/**
 * Obtiene un usuario por email
 */
export async function getUserByEmail(email) {
  const response = await databases.listDocuments(
    databaseId,
    COLLECTIONS.USERS_PROFILE,
    [Query.equal("email", email.toLowerCase()), Query.limit(1)]
  );
  return response.documents[0] || null;
}

/**
 * Crea un nuevo usuario (usando función serverless)
 * Solo para Platform Admins
 */
export async function createUser({
  email,
  firstName,
  lastName,
  password,
  isPlatformAdmin = false,
}) {
  // Si existe la función create-user-with-profile, usarla
  if (FUNCTIONS.CREATE_USER_WITH_PROFILE) {
    const execution = await functions.createExecution(
      FUNCTIONS.CREATE_USER_WITH_PROFILE,
      JSON.stringify({
        email: email.toLowerCase().trim(),
        firstName: firstName.trim(),
        lastName: lastName?.trim() || "",
        password,
        isPlatformAdmin,
        emailVerified: true, // Admin-created users are pre-verified
      }),
      false
    );

    const response = JSON.parse(execution.responseBody);

    if (!response.ok) {
      throw new Error(response.error || "Error al crear usuario");
    }

    return response;
  }

  // Fallback: crear directamente (solo perfil, sin auth)
  const profile = await databases.createDocument(
    databaseId,
    COLLECTIONS.USERS_PROFILE,
    ID.unique(),
    {
      email: email.toLowerCase().trim(),
      firstName: firstName.trim(),
      lastName: lastName?.trim() || "",
      isPlatformAdmin,
      emailVerified: true,
      status: "ACTIVE",
      enabled: true,
    }
  );

  return { ok: true, profile };
}

/**
 * Actualiza un usuario
 * Solo para Platform Admins
 */
export async function updateUser(userId, data) {
  const updateData = {};

  if (data.firstName !== undefined) updateData.firstName = data.firstName;
  if (data.lastName !== undefined) updateData.lastName = data.lastName;
  if (data.status !== undefined) updateData.status = data.status;
  if (data.isPlatformAdmin !== undefined)
    updateData.isPlatformAdmin = data.isPlatformAdmin;
  if (data.emailVerified !== undefined)
    updateData.emailVerified = data.emailVerified;
  if (data.enabled !== undefined) updateData.enabled = data.enabled;

  return databases.updateDocument(
    databaseId,
    COLLECTIONS.USERS_PROFILE,
    userId,
    updateData
  );
}

/**
 * Cambia el estado de un usuario (ACTIVE/SUSPENDED/DELETED)
 */
export async function toggleUserStatus(userId, status) {
  return databases.updateDocument(
    databaseId,
    COLLECTIONS.USERS_PROFILE,
    userId,
    { status, enabled: status !== "DELETED" }
  );
}

/**
 * Cambia si un usuario es Platform Admin
 */
export async function togglePlatformAdmin(userId, isPlatformAdmin) {
  return databases.updateDocument(
    databaseId,
    COLLECTIONS.USERS_PROFILE,
    userId,
    { isPlatformAdmin }
  );
}

// =============================================================================
// GROUPS
// =============================================================================

/**
 * Obtiene todos los grupos de la plataforma
 * Solo para Platform Admins
 */
export async function getAllGroups() {
  const response = await databases.listDocuments(
    databaseId,
    COLLECTIONS.GROUPS,
    [Query.orderDesc("$createdAt"), Query.limit(500)]
  );
  return response.documents;
}

/**
 * Obtiene estadísticas de un grupo
 */
export async function getGroupStats(groupId) {
  const [members, calendars, events] = await Promise.all([
    databases.listDocuments(databaseId, COLLECTIONS.GROUP_MEMBERS, [
      Query.equal("groupId", groupId),
      Query.equal("enabled", true),
      Query.limit(1),
    ]),
    databases.listDocuments(databaseId, COLLECTIONS.CALENDARS, [
      Query.equal("groupId", groupId),
      Query.equal("enabled", true),
      Query.limit(1),
    ]),
    databases.listDocuments(databaseId, COLLECTIONS.EVENTS, [
      Query.equal("groupId", groupId),
      Query.equal("enabled", true),
      Query.limit(1),
    ]),
  ]);

  return {
    membersCount: members.total,
    calendarsCount: calendars.total,
    eventsCount: events.total,
  };
}

// =============================================================================
// AUDIT LOGS (preparado para futuro)
// =============================================================================

/**
 * Obtiene logs de auditoría
 * Solo para Platform Admins
 */
export async function getAuditLogs(filters = {}) {
  const queries = [Query.orderDesc("$createdAt"), Query.limit(200)];

  if (filters.action) {
    queries.push(Query.equal("action", filters.action));
  }

  if (filters.profileId) {
    queries.push(Query.equal("profileId", filters.profileId));
  }

  if (filters.groupId) {
    queries.push(Query.equal("groupId", filters.groupId));
  }

  if (filters.entityType) {
    queries.push(Query.equal("entityType", filters.entityType));
  }

  const response = await databases.listDocuments(
    databaseId,
    COLLECTIONS.AUDIT_LOGS,
    queries
  );

  return response.documents;
}

/**
 * Crea un log de auditoría
 * Para uso interno desde funciones
 */
export async function createAuditLog({
  groupId,
  profileId,
  action,
  entityType,
  entityId,
  entityName,
  details,
  ipAddress,
  userAgent,
}) {
  return databases.createDocument(
    databaseId,
    COLLECTIONS.AUDIT_LOGS,
    ID.unique(),
    {
      groupId: groupId || null,
      profileId,
      action,
      entityType,
      entityId: entityId || null,
      entityName: entityName || null,
      details: details ? JSON.stringify(details) : null,
      ipAddress: ipAddress || null,
      userAgent: userAgent || null,
      createdAt: new Date().toISOString(),
      enabled: true,
    }
  );
}

/**
 * Obtiene estadísticas generales de la plataforma
 */
export async function getPlatformStats() {
  const [users, groups, permissions, auditLogs] = await Promise.all([
    databases.listDocuments(databaseId, COLLECTIONS.USERS_PROFILE, [
      Query.limit(1),
    ]),
    databases.listDocuments(databaseId, COLLECTIONS.GROUPS, [Query.limit(1)]),
    databases.listDocuments(databaseId, COLLECTIONS.PERMISSIONS, [
      Query.limit(1),
    ]),
    databases.listDocuments(databaseId, COLLECTIONS.AUDIT_LOGS, [
      Query.limit(1),
    ]),
  ]);

  // Get verified users count
  const verifiedUsers = await databases.listDocuments(
    databaseId,
    COLLECTIONS.USERS_PROFILE,
    [Query.equal("emailVerified", true), Query.limit(1)]
  );

  // Get active groups count
  const activeGroups = await databases.listDocuments(
    databaseId,
    COLLECTIONS.GROUPS,
    [Query.equal("enabled", true), Query.limit(1)]
  );

  return {
    totalUsers: users.total,
    verifiedUsers: verifiedUsers.total,
    totalGroups: groups.total,
    activeGroups: activeGroups.total,
    totalPermissions: permissions.total,
    totalAuditLogs: auditLogs.total,
  };
}

/**
 * Obtiene los logs de auditoría más recientes (para dashboard)
 */
export async function getRecentAuditLogs(limit = 10) {
  const response = await databases.listDocuments(
    databaseId,
    COLLECTIONS.AUDIT_LOGS,
    [Query.orderDesc("$createdAt"), Query.limit(limit)]
  );

  return response.documents;
}
