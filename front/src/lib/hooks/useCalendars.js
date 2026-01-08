/**
 * React Query hooks para Calendars
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants";
import * as calendarService from "../services/calendarService";

/**
 * Hook para obtener los calendarios visibles para el usuario
 * Incluye:
 * - Calendarios PERSONALES del usuario (scope=PERSONAL)
 * - Calendarios GROUP del grupo actual (scope=GROUP, según visibility)
 */
export function useCalendars(groupId, currentProfileId = null) {
  return useQuery({
    queryKey: [QUERY_KEYS.CALENDARS, groupId, currentProfileId],
    queryFn: () => calendarService.getCalendars(groupId, currentProfileId),
    enabled: !!currentProfileId, // Solo requiere profileId (groupId puede ser null)
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook para obtener el calendario por defecto
 * Prioriza calendario personal sobre calendario de grupo
 */
export function useDefaultCalendar(groupId, ownerProfileId) {
  return useQuery({
    queryKey: [QUERY_KEYS.CALENDARS, "default", groupId, ownerProfileId],
    queryFn: () => calendarService.getDefaultCalendar(groupId, ownerProfileId),
    enabled: !!ownerProfileId, // Solo requiere ownerProfileId (groupId puede ser null)
    staleTime: 5 * 60 * 1000,
  });
}

/**
 * Hook para obtener un calendario específico
 */
export function useCalendar(calendarId) {
  return useQuery({
    queryKey: [QUERY_KEYS.CALENDARS, "detail", calendarId],
    queryFn: () => calendarService.getCalendar(calendarId),
    enabled: !!calendarId,
  });
}

/**
 * Hook para crear un calendario
 */
export function useCreateCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => calendarService.createCalendar(data),
    onSuccess: (newCalendar, variables) => {
      // Invalidar tanto calendarios de grupo como personales
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CALENDARS],
      });
    },
  });
}

/**
 * Hook para actualizar un calendario
 */
export function useUpdateCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ calendarId, data }) =>
      calendarService.updateCalendar(calendarId, data),
    onSuccess: (updatedCalendar) => {
      queryClient.setQueryData(
        [QUERY_KEYS.CALENDARS, "detail", updatedCalendar.$id],
        updatedCalendar
      );
      // Invalidar todas las queries de calendarios (personales y de grupo)
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CALENDARS],
      });
    },
  });
}

/**
 * Hook para eliminar un calendario
 */
export function useDeleteCalendar() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (calendarId) => calendarService.deleteCalendar(calendarId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.CALENDARS] });
    },
  });
}

// Re-export calendar colors
export { CALENDAR_COLORS } from "../services/calendarService";
