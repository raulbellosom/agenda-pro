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
 * Obtiene eventos por calendarios en un rango de fechas
 * Soporta calendarios personales (sin groupId) y de grupo
 */
export async function getEvents(
  groupId,
  { startDate, endDate, calendarIds } = {}
) {
  const queries = [
    Query.equal("enabled", true),
    Query.orderAsc("startAt"),
    Query.limit(500),
  ];

  // Si hay groupId, filtrar por grupo
  if (groupId) {
    queries.push(Query.equal("groupId", groupId));
  }

  if (startDate) {
    queries.push(Query.greaterThanEqual("startAt", startDate.toISOString()));
  }

  if (endDate) {
    queries.push(Query.lessThanEqual("startAt", endDate.toISOString()));
  }

  // Si hay calendarIds, filtrar por calendarios específicos
  // Esto es importante para obtener eventos de calendarios personales
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

  // Construir payload solo con campos que existen en la colección
  const payload = {
    calendarId: data.calendarId,
    ownerProfileId: data.ownerProfileId,
    title: data.title,
    description: data.description || "",
    locationText: data.locationText || "",
    startAt: data.startAt,
    endAt: data.endAt,
    allDay: data.allDay || false,
    status: data.status || ENUMS.EVENT_STATUS.CONFIRMED,
    enabled: true,
    createdAt: now,
    updatedAt: now,
  };

  // Solo agregar groupId si existe (eventos de grupo)
  // Eventos en calendarios personales no tendrán groupId
  if (data.groupId) {
    payload.groupId = data.groupId;
  }

  // Campos opcionales - solo agregar si tienen valor
  // Nota: visibility, timezone, recurrenceRule, recurrenceUntil
  // pueden no existir aún en la colección de Appwrite
  // Descomentar cuando se creen en la base de datos:
  // if (data.visibility) payload.visibility = data.visibility;
  // if (data.timezone) payload.timezone = data.timezone;
  // if (data.recurrenceRule) payload.recurrenceRule = data.recurrenceRule;
  // if (data.recurrenceUntil) payload.recurrenceUntil = data.recurrenceUntil;

  return databases.createDocument(
    databaseId,
    collectionId,
    ID.unique(),
    payload
  );
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
 * Si se proporciona groupId, busca en ese grupo; si no, busca por calendarIds
 */
export async function searchEvents(
  groupId,
  searchTerm,
  limit = 20,
  calendarIds = null
) {
  const queries = [
    Query.equal("enabled", true),
    Query.search("title", searchTerm),
    Query.orderDesc("startAt"),
    Query.limit(limit),
  ];

  if (groupId) {
    queries.push(Query.equal("groupId", groupId));
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
 * Obtiene próximos eventos
 * Soporta filtrar por groupId o calendarIds
 */
export async function getUpcomingEvents(
  groupId,
  limit = 10,
  calendarIds = null
) {
  const now = new Date().toISOString();
  const queries = [
    Query.equal("enabled", true),
    Query.greaterThanEqual("startAt", now),
    Query.orderAsc("startAt"),
    Query.limit(limit),
  ];

  if (groupId) {
    queries.push(Query.equal("groupId", groupId));
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
