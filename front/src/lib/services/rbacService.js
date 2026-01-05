/**
 * RBAC Service (Roles, Permissions, User Roles)
 * Maneja operaciones de roles y permisos por grupo
 */
import { ID, Query } from "appwrite";
import { databases } from "../../shared/appwrite/client";
import { APPWRITE, COLLECTIONS } from "../constants";

const { databaseId } = APPWRITE;

// =============================================================================
// PERMISSIONS - CRUD (Platform Admin)
// =============================================================================

/**
 * Obtiene todos los permisos del sistema (incluyendo deshabilitados)
 * Solo para Platform Admins
 */
export async function listAllPermissions() {
  const response = await databases.listDocuments(
    databaseId,
    COLLECTIONS.PERMISSIONS,
    [Query.orderAsc("key"), Query.limit(200)]
  );
  return response.documents;
}

/**
 * Obtiene todos los permisos habilitados
 */
export async function getAllPermissions() {
  const response = await databases.listDocuments(
    databaseId,
    COLLECTIONS.PERMISSIONS,
    [Query.equal("enabled", true), Query.orderAsc("key"), Query.limit(200)]
  );
  return response.documents;
}

/**
 * Obtiene un permiso por su ID
 */
export async function getPermission(permissionId) {
  return databases.getDocument(
    databaseId,
    COLLECTIONS.PERMISSIONS,
    permissionId
  );
}

/**
 * Obtiene un permiso por su key
 */
export async function getPermissionByKey(key) {
  const response = await databases.listDocuments(
    databaseId,
    COLLECTIONS.PERMISSIONS,
    [Query.equal("key", key), Query.limit(1)]
  );
  return response.documents[0] || null;
}

/**
 * Crea un nuevo permiso
 * Solo para Platform Admins
 */
export async function createPermission(key, description = "") {
  // Verificar si ya existe
  const existing = await getPermissionByKey(key);
  if (existing) {
    throw new Error(`El permiso "${key}" ya existe`);
  }

  return databases.createDocument(
    databaseId,
    COLLECTIONS.PERMISSIONS,
    ID.unique(),
    {
      key,
      description,
      enabled: true,
    }
  );
}

/**
 * Actualiza un permiso existente
 * Solo para Platform Admins
 */
export async function updatePermission(permissionId, data) {
  // Si se está actualizando el key, verificar que no exista otro con ese key
  if (data.key) {
    const existing = await getPermissionByKey(data.key);
    if (existing && existing.$id !== permissionId) {
      throw new Error(`Ya existe un permiso con el key "${data.key}"`);
    }
  }

  return databases.updateDocument(
    databaseId,
    COLLECTIONS.PERMISSIONS,
    permissionId,
    data
  );
}

/**
 * Elimina un permiso (soft delete)
 * Solo para Platform Admins
 */
export async function deletePermission(permissionId) {
  return databases.updateDocument(
    databaseId,
    COLLECTIONS.PERMISSIONS,
    permissionId,
    { enabled: false }
  );
}

/**
 * Elimina permanentemente un permiso
 * ¡PELIGROSO! Solo para Platform Admins
 */
export async function hardDeletePermission(permissionId) {
  return databases.deleteDocument(
    databaseId,
    COLLECTIONS.PERMISSIONS,
    permissionId
  );
}

/**
 * Crea múltiples permisos a la vez (seed)
 * Solo para Platform Admins
 */
export async function seedPermissions(permissionsArray) {
  const results = {
    created: [],
    skipped: [],
    errors: [],
  };

  for (const perm of permissionsArray) {
    try {
      const existing = await getPermissionByKey(perm.key);
      if (existing) {
        results.skipped.push(perm.key);
        continue;
      }

      await databases.createDocument(
        databaseId,
        COLLECTIONS.PERMISSIONS,
        ID.unique(),
        {
          key: perm.key,
          description: perm.description || "",
          enabled: true,
        }
      );
      results.created.push(perm.key);
    } catch (err) {
      results.errors.push({ key: perm.key, error: err.message });
    }
  }

  return results;
}

// =============================================================================
// ROLES
// =============================================================================

/**
 * Obtiene todos los roles de un grupo
 */
export async function getRolesForGroup(groupId) {
  const response = await databases.listDocuments(
    databaseId,
    COLLECTIONS.ROLES,
    [
      Query.equal("groupId", groupId),
      Query.equal("enabled", true),
      Query.orderAsc("name"),
      Query.limit(50),
    ]
  );
  return response.documents;
}

/**
 * Obtiene un rol por ID
 */
export async function getRole(roleId) {
  return databases.getDocument(databaseId, COLLECTIONS.ROLES, roleId);
}

/**
 * Obtiene los permisos asignados a un rol
 */
export async function getRolePermissions(groupId, roleId) {
  // Get role_permissions entries
  const rolePermsResponse = await databases.listDocuments(
    databaseId,
    COLLECTIONS.ROLE_PERMISSIONS,
    [
      Query.equal("groupId", groupId),
      Query.equal("roleId", roleId),
      Query.equal("enabled", true),
      Query.limit(100),
    ]
  );

  if (rolePermsResponse.documents.length === 0) {
    return [];
  }

  // Get the permission IDs
  const permissionIds = rolePermsResponse.documents.map(
    (rp) => rp.permissionId
  );

  // Get the actual permissions
  const permissionsResponse = await databases.listDocuments(
    databaseId,
    COLLECTIONS.PERMISSIONS,
    [Query.equal("$id", permissionIds), Query.equal("enabled", true)]
  );

  return permissionsResponse.documents;
}

// =============================================================================
// USER ROLES
// =============================================================================

/**
 * Obtiene los roles asignados a un usuario en un grupo
 */
export async function getUserRolesInGroup(groupId, profileId) {
  const response = await databases.listDocuments(
    databaseId,
    COLLECTIONS.USER_ROLES,
    [
      Query.equal("groupId", groupId),
      Query.equal("profileId", profileId),
      Query.equal("enabled", true),
      Query.limit(10),
    ]
  );

  if (response.documents.length === 0) {
    return [];
  }

  // Get the role IDs
  const roleIds = response.documents.map((ur) => ur.roleId);

  // Get the actual roles
  const rolesResponse = await databases.listDocuments(
    databaseId,
    COLLECTIONS.ROLES,
    [Query.equal("$id", roleIds), Query.equal("enabled", true)]
  );

  // Combine user_roles with role info
  return response.documents.map((userRole) => {
    const role = rolesResponse.documents.find((r) => r.$id === userRole.roleId);
    return {
      ...userRole,
      role,
    };
  });
}

/**
 * Obtiene todos los permisos efectivos de un usuario en un grupo
 * Esto incluye los permisos de todos sus roles
 */
export async function getUserPermissionsInGroup(groupId, profileId) {
  // Get user's roles
  const userRoles = await getUserRolesInGroup(groupId, profileId);

  if (userRoles.length === 0) {
    return [];
  }

  const roleIds = userRoles.map((ur) => ur.roleId);

  // Get role_permissions for all roles
  const rolePermsResponse = await databases.listDocuments(
    databaseId,
    COLLECTIONS.ROLE_PERMISSIONS,
    [
      Query.equal("groupId", groupId),
      Query.equal("roleId", roleIds),
      Query.equal("enabled", true),
      Query.limit(200),
    ]
  );

  if (rolePermsResponse.documents.length === 0) {
    return [];
  }

  // Get unique permission IDs
  const permissionIds = [
    ...new Set(rolePermsResponse.documents.map((rp) => rp.permissionId)),
  ];

  // Get the actual permissions
  const permissionsResponse = await databases.listDocuments(
    databaseId,
    COLLECTIONS.PERMISSIONS,
    [Query.equal("$id", permissionIds), Query.equal("enabled", true)]
  );

  return permissionsResponse.documents;
}

/**
 * Verifica si un usuario tiene un permiso específico en un grupo
 */
export async function userHasPermission(groupId, profileId, permissionKey) {
  const permissions = await getUserPermissionsInGroup(groupId, profileId);
  return permissions.some((p) => p.key === permissionKey);
}

/**
 * Verifica múltiples permisos a la vez
 * Retorna un objeto con cada permiso y si el usuario lo tiene
 */
export async function userHasPermissions(groupId, profileId, permissionKeys) {
  const permissions = await getUserPermissionsInGroup(groupId, profileId);
  const permissionSet = new Set(permissions.map((p) => p.key));

  const result = {};
  for (const key of permissionKeys) {
    result[key] = permissionSet.has(key);
  }
  return result;
}

// =============================================================================
// RE-EXPORTS
// =============================================================================

// Re-export permission constants from centralized file
export {
  SYSTEM_PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
  PERMISSION_CATEGORIES,
  SYSTEM_ROLES,
  getAllPermissionsAsArray,
  getPermissionCategory,
} from "../permissions";
