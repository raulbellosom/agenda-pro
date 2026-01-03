/**
 * Profile Service
 * Maneja operaciones de users_profile con sincronización a Auth
 */
import { Query, ID } from "appwrite";
import { databases, account, storage } from "../../shared/appwrite/client";
import { APPWRITE, COLLECTIONS, BUCKETS } from "../constants";

const { databaseId } = APPWRITE;
const collectionId = COLLECTIONS.USERS_PROFILE;

/**
 * Obtiene el perfil por userAuthId
 */
export async function getProfileByAuthId(userAuthId) {
  const response = await databases.listDocuments(databaseId, collectionId, [
    Query.equal("userAuthId", userAuthId),
    Query.equal("enabled", true),
    Query.limit(1),
  ]);
  return response.documents[0] || null;
}

/**
 * Obtiene un perfil por ID
 */
export async function getProfile(profileId) {
  return databases.getDocument(databaseId, collectionId, profileId);
}

/**
 * Actualiza un perfil y sincroniza con Auth si es necesario
 */
export async function updateProfile(profileId, data) {
  // Actualizar el documento en users_profile
  const updatedProfile = await databases.updateDocument(
    databaseId,
    collectionId,
    profileId,
    data
  );

  // Si se actualizó el nombre, sincronizar con Appwrite Auth
  if (data.firstName !== undefined || data.lastName !== undefined) {
    try {
      const fullName = `${data.firstName || updatedProfile.firstName} ${
        data.lastName || updatedProfile.lastName
      }`.trim();
      await account.updateName(fullName);
    } catch (error) {
      console.warn("Could not sync name with Auth:", error);
      // No fallar si la sincronización falla
    }
  }

  // Si se actualizó el email, también actualizar en Auth (requiere verificación)
  // NOTA: Cambiar email requiere un flow especial con verificación
  // Por ahora solo actualizamos en profile

  return updatedProfile;
}

/**
 * Actualiza el email (requiere password para verificación)
 */
export async function updateEmail(profileId, newEmail, password) {
  // Primero actualizar en Auth
  await account.updateEmail(newEmail, password);

  // Luego actualizar en profile
  return databases.updateDocument(databaseId, collectionId, profileId, {
    email: newEmail.toLowerCase(),
  });
}

/**
 * Cambia la contraseña del usuario
 */
export async function updatePassword(newPassword, oldPassword) {
  return account.updatePassword(newPassword, oldPassword);
}

/**
 * Sube una foto de perfil y actualiza el profile
 */
export async function uploadAvatar(profileId, file) {
  const bucketId = BUCKETS.AVATARS;

  if (!bucketId) {
    throw new Error("Bucket de avatares no configurado");
  }

  // Subir el archivo
  const uploadedFile = await storage.createFile(bucketId, ID.unique(), file);

  // Obtener el perfil actual para ver si hay avatar anterior
  const currentProfile = await getProfile(profileId);

  // Si había un avatar anterior, eliminarlo
  if (currentProfile.avatarFileId) {
    try {
      await storage.deleteFile(bucketId, currentProfile.avatarFileId);
    } catch (error) {
      console.warn("Could not delete old avatar:", error);
    }
  }

  // Actualizar el perfil con el nuevo avatarFileId
  const updatedProfile = await databases.updateDocument(
    databaseId,
    collectionId,
    profileId,
    { avatarFileId: uploadedFile.$id }
  );

  return {
    profile: updatedProfile,
    fileId: uploadedFile.$id,
  };
}

/**
 * Elimina la foto de perfil
 */
export async function deleteAvatar(profileId) {
  const bucketId = BUCKETS.AVATARS;
  const currentProfile = await getProfile(profileId);

  if (currentProfile.avatarFileId) {
    try {
      await storage.deleteFile(bucketId, currentProfile.avatarFileId);
    } catch (error) {
      console.warn("Could not delete avatar file:", error);
    }
  }

  return databases.updateDocument(databaseId, collectionId, profileId, {
    avatarFileId: null,
  });
}

/**
 * Obtiene la URL de vista del avatar
 */
export function getAvatarUrl(avatarFileId, width = 200, height = 200) {
  if (!avatarFileId || !BUCKETS.AVATARS) return null;

  return storage.getFilePreview(
    BUCKETS.AVATARS,
    avatarFileId,
    width,
    height,
    "center",
    100
  );
}

/**
 * Busca perfiles por email (para invitaciones)
 */
export async function findProfileByEmail(email) {
  const response = await databases.listDocuments(databaseId, collectionId, [
    Query.equal("email", email.toLowerCase()),
    Query.equal("enabled", true),
    Query.limit(1),
  ]);
  return response.documents[0] || null;
}
