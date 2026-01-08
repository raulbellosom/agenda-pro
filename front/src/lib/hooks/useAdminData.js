/**
 * React Query hooks para Administración de Plataforma
 * Solo para Platform Admins
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants";
import * as adminService from "../services/adminService";

// =============================================================================
// USERS
// =============================================================================

/**
 * Hook para obtener todos los usuarios
 */
export function useAllUsers() {
  return useQuery({
    queryKey: [QUERY_KEYS.ADMIN, "users"],
    queryFn: () => adminService.getAllUsers(),
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

/**
 * Hook para obtener un usuario específico
 */
export function useUser(userId) {
  return useQuery({
    queryKey: [QUERY_KEYS.ADMIN, "users", userId],
    queryFn: () => adminService.getUser(userId),
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook para crear un usuario
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => adminService.createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN, "users"] });
    },
  });
}

/**
 * Hook para actualizar un usuario
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, data }) => adminService.updateUser(userId, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN, "users"] });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.ADMIN, "users", variables.userId],
      });
    },
  });
}

/**
 * Hook para cambiar estado de usuario
 */
export function useToggleUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, status }) =>
      adminService.toggleUserStatus(userId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN, "users"] });
    },
  });
}

/**
 * Hook para cambiar si es Platform Admin
 */
export function useTogglePlatformAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, isPlatformAdmin }) =>
      adminService.togglePlatformAdmin(userId, isPlatformAdmin),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.ADMIN, "users"] });
    },
  });
}

// =============================================================================
// GROUPS
// =============================================================================

/**
 * Hook para obtener todos los grupos
 */
export function useAllGroups() {
  return useQuery({
    queryKey: [QUERY_KEYS.ADMIN, "groups"],
    queryFn: () => adminService.getAllGroups(),
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook para obtener estadísticas de un grupo
 */
export function useGroupStats(groupId) {
  return useQuery({
    queryKey: [QUERY_KEYS.ADMIN, "groups", groupId, "stats"],
    queryFn: () => adminService.getGroupStats(groupId),
    enabled: !!groupId,
    staleTime: 5 * 60 * 1000,
  });
}

// =============================================================================
// AUDIT LOGS
// =============================================================================

/**
 * Hook para obtener logs de auditoría
 */
export function useAuditLogs(filters = {}) {
  return useQuery({
    queryKey: [QUERY_KEYS.ADMIN, "audit", filters],
    queryFn: () => adminService.getAuditLogs(filters),
    staleTime: 30 * 1000, // 30 segundos
  });
}

/**
 * Hook para obtener logs recientes (para dashboard)
 */
export function useRecentAuditLogs(limit = 10) {
  return useQuery({
    queryKey: [QUERY_KEYS.ADMIN, "audit", "recent", limit],
    queryFn: () => adminService.getRecentAuditLogs(limit),
    staleTime: 30 * 1000,
  });
}

/**
 * Hook para obtener estadísticas de plataforma
 */
export function usePlatformStats() {
  return useQuery({
    queryKey: [QUERY_KEYS.ADMIN, "platform-stats"],
    queryFn: () => adminService.getPlatformStats(),
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}
