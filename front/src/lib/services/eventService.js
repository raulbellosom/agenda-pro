/**
 * Events Service
 * Maneja operaciones de events
 */
import { ID, Query } from "appwrite";
import { databases } from "../../shared/appwrite/client";
import { APPWRITE, COLLECTIONS, ENUMS } from "../constants";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
} from "date-fns";

const { databaseId } = APPWRITE;
const collectionId = COLLECTIONS.EVENTS;

/**
 * Obtiene eventos de un grupo en un rango de fechas
 */
export async function getEvents(
  groupId,
  { startDate, endDate, calendarIds } = {}
) {
  const queries = [
    Query.equal("groupId", groupId),
    Query.equal("enabled", true),
    Query.orderAsc("startAt"),
    Query.limit(500),
  ];

  if (startDate) {
    queries.push(Query.greaterThanEqual("startAt", startDate.toISOString()));
  }

  if (endDate) {
    queries.push(Query.lessThanEqual("startAt", endDate.toISOString()));
  }

  if (calendarIds && calendarIds.length > 0) {
    queries.push(Query.equal("calendarId", calendarIds));
  }

  const response = await databases.listDocuments(
    databaseId,
    collectionId,
    queries
  );
  return response.documents;
}

/**
 * Obtiene eventos de un día específico
 */
export async function getEventsForDay(groupId, date, calendarIds) {
  return getEvents(groupId, {
    startDate: startOfDay(date),
    endDate: endOfDay(date),
    calendarIds,
  });
}

/**
 * Obtiene eventos de una semana
 */
export async function getEventsForWeek(
  groupId,
  date,
  calendarIds,
  weekStartsOn = 1
) {
  return getEvents(groupId, {
    startDate: startOfWeek(date, { weekStartsOn }),
    endDate: endOfWeek(date, { weekStartsOn }),
    calendarIds,
  });
}

/**
 * Obtiene eventos de un mes
 */
export async function getEventsForMonth(groupId, date, calendarIds) {
  // Extendemos un poco para incluir días de otros meses visibles en la vista
  const start = startOfWeek(startOfMonth(date), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(date), { weekStartsOn: 1 });

  return getEvents(groupId, {
    startDate: start,
    endDate: end,
    calendarIds,
  });
}

/**
 * Obtiene un evento por ID
 */
export async function getEvent(eventId) {
  return databases.getDocument(databaseId, collectionId, eventId);
}

/**
 * Crea un nuevo evento
 */
export async function createEvent(data) {
  const now = new Date().toISOString();
  return databases.createDocument(databaseId, collectionId, ID.unique(), {
    groupId: data.groupId,
    calendarId: data.calendarId,
    ownerProfileId: data.ownerProfileId,
    title: data.title,
    description: data.description || "",
    locationText: data.locationText || "",
    startAt: data.startAt,
    endAt: data.endAt,
    allDay: data.allDay || false,
    timezone: data.timezone || null,
    status: data.status || ENUMS.EVENT_STATUS.CONFIRMED,
    visibility: data.visibility || ENUMS.EVENT_VISIBILITY.INHERIT,
    recurrenceRule: data.recurrenceRule || null,
    recurrenceUntil: data.recurrenceUntil || null,
    enabled: true,
    createdAt: now,
    updatedAt: now,
  });
}

/**
 * Actualiza un evento
 */
export async function updateEvent(eventId, data) {
  return databases.updateDocument(databaseId, collectionId, eventId, {
    ...data,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Soft delete de un evento
 */
export async function deleteEvent(eventId) {
  return databases.updateDocument(databaseId, collectionId, eventId, {
    enabled: false,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Busca eventos por título
 */
export async function searchEvents(groupId, searchTerm, limit = 20) {
  const response = await databases.listDocuments(databaseId, collectionId, [
    Query.equal("groupId", groupId),
    Query.equal("enabled", true),
    Query.search("title", searchTerm),
    Query.orderDesc("startAt"),
    Query.limit(limit),
  ]);
  return response.documents;
}

/**
 * Obtiene próximos eventos
 */
export async function getUpcomingEvents(groupId, limit = 10) {
  const now = new Date().toISOString();
  const response = await databases.listDocuments(databaseId, collectionId, [
    Query.equal("groupId", groupId),
    Query.equal("enabled", true),
    Query.greaterThanEqual("startAt", now),
    Query.orderAsc("startAt"),
    Query.limit(limit),
  ]);
  return response.documents;
}
