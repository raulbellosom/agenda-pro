/**
 * React Query hooks para Invitaciones
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants";
import * as invitationService from "../services/invitationService";

// =============================================================================
// QUERIES
// =============================================================================

/**
 * Hook para obtener las invitaciones de un grupo
 */
export function useGroupInvitations(groupId, status = null) {
  return useQuery({
    queryKey: [QUERY_KEYS.GROUP_INVITATIONS, groupId, status],
    queryFn: () => invitationService.getGroupInvitations(groupId, status),
    enabled: !!groupId,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

/**
 * Hook para obtener las invitaciones pendientes para un usuario
 */
export function useUserInvitations(email, profileId = null) {
  return useQuery({
    queryKey: [QUERY_KEYS.USER_INVITATIONS, email, profileId],
    queryFn: () => invitationService.getInvitationsForUser(email, profileId),
    enabled: !!email || !!profileId,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook para obtener una invitación por token
 */
export function useInvitationByToken(token) {
  return useQuery({
    queryKey: [QUERY_KEYS.INVITATION, token],
    queryFn: () => invitationService.getInvitationByToken(token),
    enabled: !!token,
    staleTime: 30 * 1000, // 30 segundos
    retry: 1,
  });
}

// =============================================================================
// MUTATIONS
// =============================================================================

/**
 * Hook para enviar una invitación
 */
export function useSendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      groupId,
      invitedByProfileId,
      invitedEmail,
      invitedRoleId,
      message,
      expiryDays,
    }) =>
      invitationService.sendInvitation({
        groupId,
        invitedByProfileId,
        invitedEmail,
        invitedRoleId,
        message,
        expiryDays,
      }),
    onSuccess: (_, variables) => {
      // Invalidar invitaciones del grupo
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GROUP_INVITATIONS, variables.groupId],
      });
      // Refetch inmediato
      queryClient.refetchQueries({
        queryKey: [QUERY_KEYS.GROUP_INVITATIONS],
        exact: false,
      });
    },
  });
}

/**
 * Hook para aceptar una invitación
 */
export function useAcceptInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ token, profileId }) =>
      invitationService.acceptInvitation(token, profileId),
    onSuccess: (result) => {
      // Invalidar grupos del usuario (ahora es miembro de uno nuevo)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.GROUPS] });
      // Invalidar invitaciones
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GROUP_INVITATIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.USER_INVITATIONS],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVITATION] });
      // Invalidar calendarios (se creó uno nuevo)
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CALENDARS] });
    },
  });
}

/**
 * Hook para rechazar una invitación
 */
export function useRejectInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ token, profileId }) =>
      invitationService.rejectInvitation(token, profileId),
    onSuccess: () => {
      // Invalidar invitaciones
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GROUP_INVITATIONS],
      });
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.USER_INVITATIONS],
      });
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.INVITATION] });
    },
  });
}

/**
 * Hook para cancelar una invitación (el invitador cancela)
 */
export function useCancelInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (invitationId) => {
      console.log("useCancelInvitation - invitationId:", invitationId);
      console.log("useCancelInvitation - length:", invitationId?.length);
      return invitationService.cancelInvitation(invitationId);
    },
    onSuccess: (_, invitationId) => {
      // Invalidar todas las invitaciones de grupo (pending y todas)
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GROUP_INVITATIONS],
      });
      // Refetch inmediato con exact: false para todas las variantes
      queryClient.refetchQueries({
        queryKey: [QUERY_KEYS.GROUP_INVITATIONS],
        exact: false,
      });
    },
  });
}

/**
 * Hook para reenviar una invitación
 */
export function useResendInvitation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ invitationId, invitedByProfileId }) =>
      invitationService.resendInvitation(invitationId, invitedByProfileId),
    onSuccess: () => {
      // Invalidar invitaciones
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.GROUP_INVITATIONS],
      });
      // Refetch inmediato
      queryClient.refetchQueries({
        queryKey: [QUERY_KEYS.GROUP_INVITATIONS],
        exact: false,
      });
    },
  });
}

// =============================================================================
// UTILITIES (re-exports)
// =============================================================================

export {
  isInvitationExpired,
  getInvitationTimeRemaining,
  formatExpirationDate,
} from "../services/invitationService";
