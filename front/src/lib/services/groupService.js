/**
 * Groups Service
 * Maneja operaciones de groups y group_members
 */
import { ID, Query } from "appwrite";
import { databases, functions } from "../../shared/appwrite/client";
import {
  APPWRITE,
  COLLECTIONS,
  ENUMS,
  FUNCTIONS,
  DEFAULTS,
} from "../constants";

const { databaseId } = APPWRITE;

/**
 * Obtiene todos los grupos donde el usuario es miembro
 */
export async function getGroupsForProfile(profileId) {
  // Primero obtenemos las membresías del usuario
  const memberships = await databases.listDocuments(
    databaseId,
    COLLECTIONS.GROUP_MEMBERS,
    [
      Query.equal("profileId", profileId),
      Query.equal("enabled", true),
      Query.limit(100),
    ]
  );

  if (memberships.documents.length === 0) {
    return [];
  }

  // Obtenemos los IDs de grupos
  const groupIds = memberships.documents.map((m) => m.groupId);

  // Obtenemos los grupos
  const groups = await databases.listDocuments(databaseId, COLLECTIONS.GROUPS, [
    Query.equal("$id", groupIds),
    Query.equal("enabled", true),
  ]);

  // Combinamos la info de membresía con el grupo
  return groups.documents.map((group) => {
    const membership = memberships.documents.find(
      (m) => m.groupId === group.$id
    );
    return {
      ...group,
      membershipRole: membership?.role,
      membershipId: membership?.$id,
      joinedAt: membership?.joinedAt,
    };
  });
}

/**
 * Obtiene un grupo por ID
 */
export async function getGroup(groupId) {
  return databases.getDocument(databaseId, COLLECTIONS.GROUPS, groupId);
}

/**
 * Crea un nuevo grupo (usando Function para crear defaults)
 */
export async function createGroup(data, ownerProfileId) {
  // Si hay una función configurada, usarla
  if (FUNCTIONS.CREATE_GROUP_WITH_DEFAULTS) {
    try {
      const execution = await functions.createExecution(
        FUNCTIONS.CREATE_GROUP_WITH_DEFAULTS,
        JSON.stringify({
          ...data,
          ownerProfileId,
        }),
        false // async = false para esperar respuesta
      );

      const response = JSON.parse(execution.responseBody);

      // Verificar si la función tuvo éxito
      if (!response.ok) {
        throw new Error(response.error || "Error al crear el espacio");
      }

      // Devolver el grupo creado
      return response.group;
    } catch (error) {
      // Si es un error de parseo o de la función, propagar con mensaje legible
      if (error.message) {
        throw error;
      }
      console.error("Function execution failed:", error);
      throw new Error("Error al crear el espacio. Intenta de nuevo.");
    }
  }

  // Fallback: crear grupo directamente
  const groupId = ID.unique();
  const group = await databases.createDocument(
    databaseId,
    COLLECTIONS.GROUPS,
    groupId,
    {
      name: data.name,
      description: data.description || "",
      ownerProfileId,
      timezone: data.timezone || DEFAULTS.TIMEZONE,
      enabled: true,
    }
  );

  // Crear la membresía del owner
  await databases.createDocument(
    databaseId,
    COLLECTIONS.GROUP_MEMBERS,
    ID.unique(),
    {
      groupId: group.$id,
      profileId: ownerProfileId,
      role: ENUMS.GROUP_MEMBER_ROLE.OWNER,
      enabled: true,
      joinedAt: new Date().toISOString(),
    }
  );

  // Crear calendario por defecto
  await databases.createDocument(
    databaseId,
    COLLECTIONS.CALENDARS,
    ID.unique(),
    {
      groupId: group.$id,
      ownerProfileId,
      name: "Mi calendario",
      color: DEFAULTS.CALENDAR_COLOR,
      visibility: ENUMS.CALENDAR_VISIBILITY.GROUP,
      isDefault: true,
      enabled: true,
    }
  );

  return group;
}

/**
 * Actualiza un grupo
 */
export async function updateGroup(groupId, data) {
  return databases.updateDocument(
    databaseId,
    COLLECTIONS.GROUPS,
    groupId,
    data
  );
}

/**
 * Soft delete de un grupo
 */
export async function deleteGroup(groupId) {
  return databases.updateDocument(databaseId, COLLECTIONS.GROUPS, groupId, {
    enabled: false,
  });
}

/**
 * Obtiene los miembros de un grupo
 */
export async function getGroupMembers(groupId) {
  const memberships = await databases.listDocuments(
    databaseId,
    COLLECTIONS.GROUP_MEMBERS,
    [
      Query.equal("groupId", groupId),
      Query.equal("enabled", true),
      Query.limit(100),
    ]
  );

  // Obtener los perfiles de los miembros
  if (memberships.documents.length === 0) {
    return [];
  }

  const profileIds = memberships.documents.map((m) => m.profileId);
  const profiles = await databases.listDocuments(
    databaseId,
    COLLECTIONS.USERS_PROFILE,
    [Query.equal("$id", profileIds), Query.equal("enabled", true)]
  );

  return memberships.documents.map((membership) => {
    const profile = profiles.documents.find(
      (p) => p.$id === membership.profileId
    );
    return {
      ...membership,
      profile,
    };
  });
}

/**
 * Verifica si un usuario es miembro de un grupo
 */
export async function isGroupMember(groupId, profileId) {
  const response = await databases.listDocuments(
    databaseId,
    COLLECTIONS.GROUP_MEMBERS,
    [
      Query.equal("groupId", groupId),
      Query.equal("profileId", profileId),
      Query.equal("enabled", true),
      Query.limit(1),
    ]
  );
  return response.documents.length > 0;
}

/**
 * Verifica si un usuario es owner de un grupo
 */
export async function isGroupOwner(groupId, profileId) {
  const response = await databases.listDocuments(
    databaseId,
    COLLECTIONS.GROUP_MEMBERS,
    [
      Query.equal("groupId", groupId),
      Query.equal("profileId", profileId),
      Query.equal("role", ENUMS.GROUP_MEMBER_ROLE.OWNER),
      Query.equal("enabled", true),
      Query.limit(1),
    ]
  );
  return response.documents.length > 0;
}
