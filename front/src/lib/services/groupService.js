/**
 * Groups Service
 * Maneja operaciones de groups y group_members
 */
import { ID, Query } from "appwrite";
import { databases, functions, storage } from "../../shared/appwrite/client";
import {
  APPWRITE,
  COLLECTIONS,
  ENUMS,
  FUNCTIONS,
  DEFAULTS,
  BUCKETS,
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
      membershipRole: membership?.membershipRole,
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
      membershipRole: ENUMS.GROUP_MEMBER_ROLE.OWNER,
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
      Query.equal("membershipRole", ENUMS.GROUP_MEMBER_ROLE.OWNER),
      Query.equal("enabled", true),
      Query.limit(1),
    ]
  );
  return response.documents.length > 0;
}

/**
 * Salir de un grupo (solo para miembros, no owners)
 */
export async function leaveGroup(groupId, profileId) {
  // Buscar la membresía
  const membership = await databases.listDocuments(
    databaseId,
    COLLECTIONS.GROUP_MEMBERS,
    [
      Query.equal("groupId", groupId),
      Query.equal("profileId", profileId),
      Query.equal("enabled", true),
      Query.limit(1),
    ]
  );

  if (membership.documents.length === 0) {
    throw new Error("No eres miembro de este grupo");
  }

  const memberDoc = membership.documents[0];

  // No permitir que el owner abandone el grupo
  if (memberDoc.membershipRole === ENUMS.GROUP_MEMBER_ROLE.OWNER) {
    throw new Error(
      "El propietario no puede abandonar el grupo. Debes eliminarlo o transferir la propiedad."
    );
  }

  // Obtener información del grupo y del usuario que sale
  const [group, leavingProfile] = await Promise.all([
    databases.getDocument(databaseId, COLLECTIONS.GROUPS, groupId),
    databases.getDocument(databaseId, COLLECTIONS.USERS_PROFILE, profileId),
  ]);

  // Buscar al propietario del grupo
  const ownerMembership = await databases.listDocuments(
    databaseId,
    COLLECTIONS.GROUP_MEMBERS,
    [
      Query.equal("groupId", groupId),
      Query.equal("membershipRole", ENUMS.GROUP_MEMBER_ROLE.OWNER),
      Query.equal("enabled", true),
      Query.limit(1),
    ]
  );

  // Soft delete de la membresía
  const result = await databases.updateDocument(
    databaseId,
    COLLECTIONS.GROUP_MEMBERS,
    memberDoc.$id,
    { enabled: false }
  );

  // Desactivar calendarios personales del usuario en este grupo
  try {
    const userCalendars = await databases.listDocuments(
      databaseId,
      COLLECTIONS.CALENDARS,
      [
        Query.equal("groupId", groupId),
        Query.equal("ownerProfileId", profileId),
        Query.equal("enabled", true),
        Query.limit(100),
      ]
    );

    // Desactivar todos los calendarios del usuario
    const deactivatePromises = userCalendars.documents.map((calendar) =>
      databases.updateDocument(
        databaseId,
        COLLECTIONS.CALENDARS,
        calendar.$id,
        { enabled: false }
      )
    );

    await Promise.all(deactivatePromises);
  } catch (calendarError) {
    console.error("Error deactivating user calendars:", calendarError);
    // No lanzamos el error para no interrumpir el proceso de salida
  }

  // Crear notificación para el propietario
  if (ownerMembership.documents.length > 0) {
    const ownerProfileId = ownerMembership.documents[0].profileId;
    const memberName = `${leavingProfile.firstName || ""} ${
      leavingProfile.lastName || ""
    }`.trim();

    try {
      // Obtener el perfil del owner para el accountId
      const ownerProfile = await databases.getDocument(
        databaseId,
        COLLECTIONS.USERS_PROFILE,
        ownerProfileId
      );

      await databases.createDocument(
        databaseId,
        COLLECTIONS.NOTIFICATIONS,
        ID.unique(),
        {
          groupId,
          profileId: ownerProfileId,
          accountId: ownerProfile.accountId, // Agregar accountId para permisos
          kind: "SYSTEM",
          title: `Miembro abandonó ${group.name}`,
          body: `${memberName} ha salido del espacio "${group.name}"`,
          entityType: "groups",
          entityId: groupId,
          metadata: JSON.stringify({
            action: "member_left",
            memberProfileId: profileId,
            memberName,
            groupName: group.name,
          }),
          createdAt: new Date().toISOString(),
          enabled: true,
        }
      );
    } catch (notifError) {
      console.error("Error creating leave notification:", notifError);
      // No lanzamos el error para no interrumpir el proceso de salida
    }
  }

  return result;
}

/**
 * Sube un logo para un grupo y actualiza el grupo
 */
export async function uploadGroupLogo(groupId, file) {
  const bucketId = BUCKETS.AVATARS; // Usamos el mismo bucket que avatares

  if (!bucketId) {
    throw new Error("Bucket de imágenes no configurado");
  }

  // Subir el archivo
  const uploadedFile = await storage.createFile(bucketId, ID.unique(), file);

  // Obtener el grupo actual para ver si hay logo anterior
  const currentGroup = await getGroup(groupId);

  // Si había un logo anterior, eliminarlo
  if (currentGroup.logoFileId) {
    try {
      await storage.deleteFile(bucketId, currentGroup.logoFileId);
    } catch (error) {
      console.warn("Could not delete old logo:", error);
    }
  }

  // Actualizar el grupo con el nuevo logoFileId
  const updatedGroup = await databases.updateDocument(
    databaseId,
    COLLECTIONS.GROUPS,
    groupId,
    { logoFileId: uploadedFile.$id }
  );

  return {
    group: updatedGroup,
    fileId: uploadedFile.$id,
  };
}

/**
 * Elimina el logo de un grupo
 */
export async function deleteGroupLogo(groupId) {
  const bucketId = BUCKETS.AVATARS;
  const currentGroup = await getGroup(groupId);

  if (currentGroup.logoFileId) {
    try {
      await storage.deleteFile(bucketId, currentGroup.logoFileId);
    } catch (error) {
      console.warn("Could not delete logo file:", error);
    }
  }

  return databases.updateDocument(databaseId, COLLECTIONS.GROUPS, groupId, {
    logoFileId: null,
  });
}

/**
 * Obtiene la URL de vista del logo del grupo
 */
export function getGroupLogoUrl(logoFileId, width = 200, height = 200) {
  if (!logoFileId || !BUCKETS.AVATARS) return null;

  return storage.getFilePreview(
    BUCKETS.AVATARS,
    logoFileId,
    width,
    height,
    "center",
    100
  );
}

/**
 * Verifica si el usuario es owner o solo miembro de un grupo
 */
export function getMembershipType(group, profileId) {
  if (group.ownerProfileId === profileId) {
    return "owner";
  }
  return "member";
}
