/**
 * Invitations Service
 * Maneja operaciones de invitaciones a grupos
 */
import { ID, Query } from "appwrite";
import { databases, functions } from "../../shared/appwrite/client";
import { APPWRITE, COLLECTIONS, FUNCTIONS, ENUMS } from "../constants";

const { databaseId } = APPWRITE;

// =============================================================================
// LIST & GET
// =============================================================================

/**
 * Obtiene las invitaciones pendientes de un grupo
 */
export async function getGroupInvitations(groupId, status = null) {
  const queries = [
    Query.equal("groupId", groupId),
    Query.equal("enabled", true),
    Query.orderDesc("$createdAt"),
    Query.limit(100),
  ];

  if (status) {
    queries.push(Query.equal("status", status));
  }

  const response = await databases.listDocuments(
    databaseId,
    COLLECTIONS.GROUP_INVITATIONS,
    queries
  );

  return response.documents;
}

/**
 * Obtiene las invitaciones pendientes para un usuario (por email o profileId)
 * Enriquece con datos del grupo y rol asignado
 */
export async function getInvitationsForUser(email, profileId = null) {
  const queries = [
    Query.equal("status", ENUMS.INVITATION_STATUS.PENDING),
    Query.equal("enabled", true),
    Query.orderDesc("$createdAt"),
    Query.limit(50),
  ];

  // Buscar por email o por profileId
  if (profileId) {
    queries.push(Query.equal("invitedProfileId", profileId));
  } else {
    queries.push(Query.equal("invitedEmail", email.toLowerCase()));
  }

  const response = await databases.listDocuments(
    databaseId,
    COLLECTIONS.GROUP_INVITATIONS,
    queries
  );

  const invitations = response.documents;

  // Si no hay invitaciones, retornar vacío
  if (invitations.length === 0) {
    return [];
  }

  // Obtener IDs únicos de grupos y roles
  const groupIds = [...new Set(invitations.map((inv) => inv.groupId))];
  const roleIds = [
    ...new Set(invitations.map((inv) => inv.invitedRoleId).filter(Boolean)),
  ];

  // Cargar grupos
  let groupsMap = {};
  if (groupIds.length > 0) {
    const groupsResponse = await databases.listDocuments(
      databaseId,
      COLLECTIONS.GROUPS,
      [Query.equal("$id", groupIds), Query.limit(50)]
    );
    groupsMap = Object.fromEntries(
      groupsResponse.documents.map((g) => [g.$id, g])
    );
  }

  // Cargar roles
  let rolesMap = {};
  if (roleIds.length > 0) {
    const rolesResponse = await databases.listDocuments(
      databaseId,
      COLLECTIONS.ROLES,
      [Query.equal("$id", roleIds), Query.limit(50)]
    );
    rolesMap = Object.fromEntries(
      rolesResponse.documents.map((r) => [r.$id, r])
    );
  }

  // Enriquecer invitaciones con datos del grupo y rol
  return invitations.map((inv) => ({
    ...inv,
    group: groupsMap[inv.groupId] || null,
    role: rolesMap[inv.invitedRoleId] || null,
  }));
}

/**
 * Obtiene una invitación por su token
 * Enriquece con datos del grupo, rol e invitador
 */
export async function getInvitationByToken(token) {
  const response = await databases.listDocuments(
    databaseId,
    COLLECTIONS.GROUP_INVITATIONS,
    [Query.equal("token", token), Query.limit(1)]
  );

  const invitation = response.documents[0];

  if (!invitation) {
    return null;
  }

  // Cargar datos del grupo
  let group = null;
  try {
    group = await databases.getDocument(
      databaseId,
      COLLECTIONS.GROUPS,
      invitation.groupId
    );
  } catch (err) {
    console.error("Error loading group:", err);
  }

  // Cargar datos del rol
  let role = null;
  if (invitation.invitedRoleId) {
    try {
      role = await databases.getDocument(
        databaseId,
        COLLECTIONS.ROLES,
        invitation.invitedRoleId
      );
    } catch (err) {
      console.error("Error loading role:", err);
    }
  }

  // Cargar datos del invitador
  let inviter = null;
  if (invitation.invitedByProfileId) {
    try {
      inviter = await databases.getDocument(
        databaseId,
        COLLECTIONS.USERS_PROFILE,
        invitation.invitedByProfileId
      );
    } catch (err) {
      console.error("Error loading inviter:", err);
    }
  }

  // Enriquecer invitación
  return {
    ...invitation,
    groupName: group?.name || null,
    roleName: role?.name || null,
    inviterName: inviter
      ? `${inviter.firstName} ${inviter.lastName}`.trim()
      : null,
  };
}

/**
 * Obtiene una invitación por ID
 */
export async function getInvitation(invitationId) {
  return databases.getDocument(
    databaseId,
    COLLECTIONS.GROUP_INVITATIONS,
    invitationId
  );
}

// =============================================================================
// INVITE
// =============================================================================

/**
 * Envía una invitación usando la función serverless
 */
export async function sendInvitation({
  groupId,
  invitedByProfileId,
  invitedEmail,
  invitedRoleId,
  message,
  expiryDays,
}) {
  if (!FUNCTIONS.INVITE_TO_GROUP) {
    throw new Error("Función de invitación no configurada");
  }

  const execution = await functions.createExecution(
    FUNCTIONS.INVITE_TO_GROUP,
    JSON.stringify({
      groupId,
      invitedByProfileId,
      invitedEmail: invitedEmail.toLowerCase().trim(),
      invitedRoleId,
      message: message?.trim() || undefined,
      expiryDays,
    }),
    false // async = false para esperar respuesta
  );

  const response = JSON.parse(execution.responseBody);

  if (!response.ok) {
    throw new Error(response.error || "Error al enviar invitación");
  }

  return response;
}

// =============================================================================
// ACCEPT / REJECT / CANCEL
// =============================================================================

/**
 * Acepta una invitación usando la función serverless
 */
export async function acceptInvitation(token, profileId) {
  if (!FUNCTIONS.ACCEPT_INVITATION) {
    throw new Error("Función de aceptación no configurada");
  }

  const execution = await functions.createExecution(
    FUNCTIONS.ACCEPT_INVITATION,
    JSON.stringify({
      token,
      profileId,
      action: "accept",
    }),
    false
  );

  const response = JSON.parse(execution.responseBody);

  if (!response.ok) {
    throw new Error(response.error || "Error al aceptar invitación");
  }

  return response;
}

/**
 * Rechaza una invitación
 */
export async function rejectInvitation(token, profileId) {
  if (!FUNCTIONS.ACCEPT_INVITATION) {
    throw new Error("Función de aceptación no configurada");
  }

  const execution = await functions.createExecution(
    FUNCTIONS.ACCEPT_INVITATION,
    JSON.stringify({
      token,
      profileId,
      action: "reject",
    }),
    false
  );

  const response = JSON.parse(execution.responseBody);

  if (!response.ok) {
    throw new Error(response.error || "Error al rechazar invitación");
  }

  return response;
}

/**
 * Cancela una invitación (el invitador cancela)
 */
export async function cancelInvitation(invitationId) {
  return databases.updateDocument(
    databaseId,
    COLLECTIONS.GROUP_INVITATIONS,
    invitationId,
    {
      status: ENUMS.INVITATION_STATUS.CANCELLED,
      respondedAt: new Date().toISOString(),
    }
  );
}

/**
 * Reenvía una invitación (genera nuevo token y expiración)
 */
export async function resendInvitation(invitationId, invitedByProfileId) {
  // Obtener invitación actual
  const invitation = await getInvitation(invitationId);

  if (!invitation) {
    throw new Error("Invitación no encontrada");
  }

  // Cancelar la anterior
  await cancelInvitation(invitationId);

  // Crear una nueva
  return sendInvitation({
    groupId: invitation.groupId,
    invitedByProfileId,
    invitedEmail: invitation.invitedEmail,
    invitedRoleId: invitation.invitedRoleId,
    message: invitation.message,
    expiryDays: 7,
  });
}

// =============================================================================
// UTILITIES
// =============================================================================

/**
 * Verifica si una invitación está expirada
 */
export function isInvitationExpired(invitation) {
  if (!invitation.expiresAt) return false;
  return new Date(invitation.expiresAt) < new Date();
}

/**
 * Obtiene el tiempo restante de una invitación
 */
export function getInvitationTimeRemaining(invitation) {
  if (!invitation.expiresAt) return null;

  const expiresAt = new Date(invitation.expiresAt);
  const now = new Date();
  const diffMs = expiresAt - now;

  if (diffMs <= 0) return { expired: true };

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  return {
    expired: false,
    days,
    hours,
    text:
      days > 0
        ? `${days} día${days > 1 ? "s" : ""}`
        : `${hours} hora${hours > 1 ? "s" : ""}`,
  };
}

/**
 * Formatea la fecha de expiración
 */
export function formatExpirationDate(expiresAt) {
  return new Date(expiresAt).toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}
