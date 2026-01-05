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

  return response.documents;
}

/**
 * Obtiene una invitación por su token
 */
export async function getInvitationByToken(token) {
  const response = await databases.listDocuments(
    databaseId,
    COLLECTIONS.GROUP_INVITATIONS,
    [Query.equal("token", token), Query.limit(1)]
  );

  return response.documents[0] || null;
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
