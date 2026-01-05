/**
 * React Query hooks para RBAC (Roles, Permisos, User Roles)
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants";
import * as rbacService from "../services/rbacService";

// =============================================================================
// PERMISSIONS
// =============================================================================

/**
 * Hook para obtener todos los permisos del sistema
 */
export function usePermissions() {
  return useQuery({
    queryKey: [QUERY_KEYS.PERMISSIONS],
    queryFn: () => rbacService.getAllPermissions(),
    staleTime: 10 * 60 * 1000, // 10 minutos - permisos son estáticos
  });
}

// =============================================================================
// ROLES
// =============================================================================

/**
 * Hook para obtener los roles de un grupo
 */
export function useGroupRoles(groupId) {
  return useQuery({
    queryKey: [QUERY_KEYS.ROLES, groupId],
    queryFn: () => rbacService.getRolesForGroup(groupId),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener un rol específico
 */
export function useRole(roleId) {
  return useQuery({
    queryKey: [QUERY_KEYS.ROLES, "detail", roleId],
    queryFn: () => rbacService.getRole(roleId),
    enabled: !!roleId,
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener los permisos de un rol
 */
export function useRolePermissions(groupId, roleId) {
  return useQuery({
    queryKey: [QUERY_KEYS.ROLE_PERMISSIONS, groupId, roleId],
    queryFn: () => rbacService.getRolePermissions(groupId, roleId),
    enabled: !!groupId && !!roleId,
    staleTime: 5 * 60 * 1000,
  });
}

// =============================================================================
// USER PERMISSIONS
// =============================================================================

/**
 * Hook para obtener los roles de un usuario en un grupo
 */
export function useUserRoles(groupId, profileId) {
  return useQuery({
    queryKey: [QUERY_KEYS.USER_ROLES, groupId, profileId],
    queryFn: () => rbacService.getUserRolesInGroup(groupId, profileId),
    enabled: !!groupId && !!profileId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para obtener todos los permisos efectivos de un usuario en un grupo
 */
export function useUserPermissions(groupId, profileId) {
  return useQuery({
    queryKey: [QUERY_KEYS.USER_PERMISSIONS, groupId, profileId],
    queryFn: () => rbacService.getUserPermissionsInGroup(groupId, profileId),
    enabled: !!groupId && !!profileId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook para verificar si un usuario tiene un permiso específico
 * Usa los permisos cacheados si están disponibles
 */
export function useHasPermission(groupId, profileId, permissionKey) {
  const { data: permissions, isLoading } = useUserPermissions(
    groupId,
    profileId
  );

  const hasPermission =
    permissions?.some((p) => p.key === permissionKey) ?? false;

  return {
    hasPermission,
    isLoading,
  };
}

/**
 * Hook para verificar múltiples permisos a la vez
 * Retorna un objeto con cada permiso y si el usuario lo tiene
 */
export function useHasPermissions(groupId, profileId, permissionKeys = []) {
  const { data: permissions, isLoading } = useUserPermissions(
    groupId,
    profileId
  );

  const permissionSet = new Set(permissions?.map((p) => p.key) || []);

  const result = {};
  for (const key of permissionKeys) {
    result[key] = permissionSet.has(key);
  }

  return {
    permissions: result,
    isLoading,
    // Helper: devuelve true si tiene al menos uno de los permisos
    hasAny: permissionKeys.some((key) => permissionSet.has(key)),
    // Helper: devuelve true si tiene todos los permisos
    hasAll: permissionKeys.every((key) => permissionSet.has(key)),
  };
}

// Re-export permission constants
export {
  SYSTEM_PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
  PERMISSION_CATEGORIES,
} from "../services/rbacService";
