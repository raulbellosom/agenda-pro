/**
 * React Query hooks para Groups
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants";
import * as groupService from "../services/groupService";

/**
 * Hook para obtener los grupos del usuario
 */
export function useGroups(profileId) {
  return useQuery({
    queryKey: [QUERY_KEYS.GROUPS, profileId],
    queryFn: () => groupService.getGroupsForProfile(profileId),
    enabled: !!profileId,
    staleTime: 2 * 60 * 1000, // 2 minutos
  });
}

/**
 * Hook para obtener un grupo específico
 */
export function useGroup(groupId) {
  return useQuery({
    queryKey: [QUERY_KEYS.GROUPS, "detail", groupId],
    queryFn: () => groupService.getGroup(groupId),
    enabled: !!groupId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook para crear un grupo
 */
export function useCreateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ data, ownerProfileId }) =>
      groupService.createGroup(data, ownerProfileId),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GROUPS, variables.ownerProfileId],
      });
    },
  });
}

/**
 * Hook para actualizar un grupo
 */
export function useUpdateGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, data }) => groupService.updateGroup(groupId, data),
    onSuccess: (updatedGroup) => {
      queryClient.setQueryData(
        [QUERY_KEYS.GROUPS, "detail", updatedGroup.$id],
        updatedGroup
      );
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GROUPS] });
    },
  });
}

/**
 * Hook para eliminar un grupo (soft delete)
 */
export function useDeleteGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId) => groupService.deleteGroup(groupId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GROUPS] });
    },
  });
}

/**
 * Hook para salir de un grupo
 */
export function useLeaveGroup() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, profileId }) =>
      groupService.leaveGroup(groupId, profileId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GROUPS] });
    },
  });
}

/**
 * Hook para subir logo de grupo
 */
export function useUploadGroupLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ groupId, file }) =>
      groupService.uploadGroupLogo(groupId, file),
    onSuccess: (result) => {
      queryClient.setQueryData(
        [QUERY_KEYS.GROUPS, "detail", result.group.$id],
        result.group
      );
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GROUPS] });
    },
  });
}

/**
 * Hook para eliminar logo de grupo
 */
export function useDeleteGroupLogo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (groupId) => groupService.deleteGroupLogo(groupId),
    onSuccess: (updatedGroup) => {
      queryClient.setQueryData(
        [QUERY_KEYS.GROUPS, "detail", updatedGroup.$id],
        updatedGroup
      );
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GROUPS] });
    },
  });
}

/**
 * Hook para obtener los miembros de un grupo
 */
export function useGroupMembers(groupId) {
  return useQuery({
    queryKey: [QUERY_KEYS.GROUP_MEMBERS, groupId],
    queryFn: () => groupService.getGroupMembers(groupId),
    enabled: !!groupId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook para crear un grupo con defaults (calendario, etc)
 * Para uso con WorkspaceProvider
 */
export function useCreateGroupWithDefaults() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      name,
      description,
      ownerProfileId,
      timezone,
      logoFileId,
    }) => {
      return groupService.createGroup(
        { name, description, timezone, logoFileId },
        ownerProfileId
      );
    },
    onSuccess: () => {
      // Invalidar todas las queries de grupos
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GROUPS] });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CALENDARS] });
    },
  });
}

// Re-export utils
export { getGroupLogoUrl } from "../services/groupService";
