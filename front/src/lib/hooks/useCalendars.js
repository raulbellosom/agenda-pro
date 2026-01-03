/**
 * React Query hooks para Calendars
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants";
import * as calendarService from "../services/calendarService";

/**
 * Hook para obtener los calendarios de un grupo
 */
export function useCalendars(groupId) {
  return useQuery({
    queryKey: [QUERY_KEYS.CALENDARS, groupId],
    queryFn: () => calendarService.getCalendars(groupId),
    enabled: !!groupId,
    staleTime: 2 * 60 * 1000,
  });
}

/**
 * Hook para obtener el calendario por defecto
 */
export function useDefaultCalendar(groupId, ownerProfileId) {
  return useQuery({
    queryKey: [QUERY_KEYS.CALENDARS, "default", groupId, ownerProfileId],
    queryFn: () => calendarService.getDefaultCalendar(groupId, ownerProfileId),
    enabled: !!groupId && !!ownerProfileId,
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
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CALENDARS, variables.groupId],
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
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.CALENDARS, updatedCalendar.groupId],
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
