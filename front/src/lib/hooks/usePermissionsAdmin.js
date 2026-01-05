/**
 * React Query hooks para administración de permisos
 * Solo para Platform Admins
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants";
import * as rbacService from "../services/rbacService";
import { getAllPermissionsAsArray, SYSTEM_PERMISSIONS } from "../permissions";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Hook para listar todos los permisos (incluyendo deshabilitados)
 */
export function useAllPermissions() {
  return useQuery({
    queryKey: [QUERY_KEYS.PERMISSIONS, "all"],
    queryFn: rbacService.listAllPermissions,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });
}

/**
 * Hook para obtener un permiso por ID
 */
export function usePermission(permissionId) {
  return useQuery({
    queryKey: [QUERY_KEYS.PERMISSIONS, permissionId],
    queryFn: () => rbacService.getPermission(permissionId),
    enabled: !!permissionId,
  });
}

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Hook para crear un nuevo permiso
 */
export function useCreatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ key, description }) =>
      rbacService.createPermission(key, description),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERMISSIONS] });
    },
  });
}

/**
 * Hook para actualizar un permiso
 */
export function useUpdatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ permissionId, data }) =>
      rbacService.updatePermission(permissionId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERMISSIONS] });
    },
  });
}

/**
 * Hook para eliminar un permiso (soft delete)
 */
export function useDeletePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (permissionId) => rbacService.deletePermission(permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERMISSIONS] });
    },
  });
}

/**
 * Hook para eliminar permanentemente un permiso
 */
export function useHardDeletePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (permissionId) =>
      rbacService.hardDeletePermission(permissionId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERMISSIONS] });
    },
  });
}

/**
 * Hook para hacer seed de permisos faltantes
 */
export function useSeedPermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const allSystemPermissions = getAllPermissionsAsArray();
      return rbacService.seedPermissions(allSystemPermissions);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.PERMISSIONS] });
    },
  });
}

// =============================================================================
// UTILITY HOOKS
// =============================================================================

/**
 * Hook que calcula los permisos faltantes en la BD
 */
export function useMissingPermissions() {
  const { data: permissions = [], isLoading } = useAllPermissions();

  if (isLoading) {
    return { missingPermissions: [], existingKeys: new Set(), isLoading: true };
  }

  const existingKeys = new Set(permissions.map((p) => p.key));
  const missingPermissions = Object.values(SYSTEM_PERMISSIONS).filter(
    (key) => !existingKeys.has(key)
  );

  return {
    missingPermissions,
    existingKeys,
    isLoading: false,
    totalExpected: Object.keys(SYSTEM_PERMISSIONS).length,
    totalExisting: existingKeys.size,
  };
}

/**
 * Hook que agrupa los permisos por categoría para mostrar en UI
 */
export function usePermissionsByCategory() {
  const { data: permissions = [], isLoading } = useAllPermissions();

  if (isLoading) {
    return { permissionsByCategory: [], isLoading: true };
  }

  const { PERMISSION_CATEGORIES } = require("../permissions");

  const permissionsByCategory = PERMISSION_CATEGORIES.map((category) => {
    const categoryPermissions = permissions.filter((p) =>
      category.permissions.includes(p.key)
    );

    return {
      ...category,
      permissions: categoryPermissions,
      total: category.permissions.length,
      existing: categoryPermissions.length,
    };
  });

  return { permissionsByCategory, isLoading: false };
}
