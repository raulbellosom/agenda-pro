/**
 * React Query hooks para Events
 */
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { QUERY_KEYS } from "../constants";
import * as eventService from "../services/eventService";

/**
 * Hook para obtener eventos de un mes
 */
export function useMonthEvents(groupId, date, calendarIds) {
  const month = date?.toISOString().slice(0, 7); // YYYY-MM format for cache key

  return useQuery({
    queryKey: [QUERY_KEYS.EVENTS, groupId, "month", month, calendarIds],
    queryFn: () => eventService.getEventsForMonth(groupId, date, calendarIds),
    enabled: !!groupId && !!date,
    staleTime: 1 * 60 * 1000, // 1 minuto
  });
}

/**
 * Hook para obtener eventos de un día
 */
export function useDayEvents(groupId, date, calendarIds) {
  const day = date?.toISOString().slice(0, 10); // YYYY-MM-DD format

  return useQuery({
    queryKey: [QUERY_KEYS.EVENTS, groupId, "day", day, calendarIds],
    queryFn: () => eventService.getEventsForDay(groupId, date, calendarIds),
    enabled: !!groupId && !!date,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook para obtener eventos de una semana
 */
export function useWeekEvents(groupId, date, calendarIds, weekStartsOn = 1) {
  const week = date?.toISOString().slice(0, 10);

  return useQuery({
    queryKey: [QUERY_KEYS.EVENTS, groupId, "week", week, calendarIds],
    queryFn: () =>
      eventService.getEventsForWeek(groupId, date, calendarIds, weekStartsOn),
    enabled: !!groupId && !!date,
    staleTime: 1 * 60 * 1000,
  });
}

/**
 * Hook para obtener próximos eventos
 */
export function useUpcomingEvents(groupId, limit = 10) {
  return useQuery({
    queryKey: [QUERY_KEYS.EVENTS, groupId, "upcoming", limit],
    queryFn: () => eventService.getUpcomingEvents(groupId, limit),
    enabled: !!groupId,
    staleTime: 30 * 1000, // 30 segundos
  });
}

/**
 * Hook para obtener un evento específico
 */
export function useEvent(eventId) {
  return useQuery({
    queryKey: [QUERY_KEYS.EVENTS, "detail", eventId],
    queryFn: () => eventService.getEvent(eventId),
    enabled: !!eventId,
  });
}

/**
 * Hook para crear un evento
 */
export function useCreateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => eventService.createEvent(data),
    onSuccess: (_, variables) => {
      // Invalidar todas las queries de eventos del grupo
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.EVENTS, variables.groupId],
      });
    },
  });
}

/**
 * Hook para actualizar un evento
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ eventId, data }) => eventService.updateEvent(eventId, data),
    onSuccess: (updatedEvent) => {
      queryClient.setQueryData(
        [QUERY_KEYS.EVENTS, "detail", updatedEvent.$id],
        updatedEvent
      );
      queryClient.invalidateQueries({
        queryKey: [QUERY_KEYS.EVENTS, updatedEvent.groupId],
      });
    },
  });
}

/**
 * Hook para eliminar un evento
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (eventId) => eventService.deleteEvent(eventId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] });
    },
  });
}

/**
 * Hook para duplicar un evento
 */
export function useDuplicateEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, newData }) => {
      // Obtener el evento original
      const originalEvent = await eventService.getEvent(eventId);

      // Crear el nuevo evento con los datos del original más las modificaciones
      const duplicatedEvent = {
        ...originalEvent,
        title: newData?.title || `${originalEvent.title} (copia)`,
        startAt: newData?.startAt || originalEvent.startAt,
        endAt: newData?.endAt || originalEvent.endAt,
      };

      // Eliminar campos que no deben duplicarse
      delete duplicatedEvent.$id;
      delete duplicatedEvent.$createdAt;
      delete duplicatedEvent.$updatedAt;
      delete duplicatedEvent.$permissions;
      delete duplicatedEvent.$collectionId;
      delete duplicatedEvent.$databaseId;

      return eventService.createEvent(duplicatedEvent);
    },
    onSuccess: (newEvent) => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] });
    },
  });
}

/**
 * Hook para mover un evento a otro calendario
 */
export function useMoveEvent() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ eventId, newCalendarId }) => {
      return eventService.updateEvent(eventId, { calendarId: newCalendarId });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [QUERY_KEYS.EVENTS] });
    },
  });
}

/**
 * Hook para buscar eventos
 */
export function useSearchEvents(groupId, searchTerm) {
  return useQuery({
    queryKey: [QUERY_KEYS.EVENTS, groupId, "search", searchTerm],
    queryFn: () => eventService.searchEvents(groupId, searchTerm),
    enabled: !!groupId && !!searchTerm && searchTerm.length >= 2,
    staleTime: 30 * 1000,
  });
}
