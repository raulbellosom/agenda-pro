/**
 * Calendar Service
 * Maneja operaciones de calendars
 */
import { ID, Query } from "appwrite";
import { databases } from "../../shared/appwrite/client";
import { APPWRITE, COLLECTIONS, ENUMS, DEFAULTS } from "../constants";

const { databaseId } = APPWRITE;
const collectionId = COLLECTIONS.CALENDARS;

/**
 * Obtiene todos los calendarios de un grupo
 */
export async function getCalendars(groupId) {
  const response = await databases.listDocuments(databaseId, collectionId, [
    Query.equal("groupId", groupId),
    Query.equal("enabled", true),
    Query.orderAsc("name"),
    Query.limit(100),
  ]);
  return response.documents;
}

/**
 * Obtiene los calendarios de un usuario en un grupo
 */
export async function getUserCalendars(groupId, ownerProfileId) {
  const response = await databases.listDocuments(databaseId, collectionId, [
    Query.equal("groupId", groupId),
    Query.equal("ownerProfileId", ownerProfileId),
    Query.equal("enabled", true),
    Query.orderAsc("name"),
    Query.limit(100),
  ]);
  return response.documents;
}

/**
 * Obtiene el calendario por defecto de un usuario
 */
export async function getDefaultCalendar(groupId, ownerProfileId) {
  const response = await databases.listDocuments(databaseId, collectionId, [
    Query.equal("groupId", groupId),
    Query.equal("ownerProfileId", ownerProfileId),
    Query.equal("isDefault", true),
    Query.equal("enabled", true),
    Query.limit(1),
  ]);
  return response.documents[0] || null;
}

/**
 * Obtiene un calendario por ID
 */
export async function getCalendar(calendarId) {
  return databases.getDocument(databaseId, collectionId, calendarId);
}

/**
 * Crea un nuevo calendario
 */
export async function createCalendar(data) {
  return databases.createDocument(databaseId, collectionId, ID.unique(), {
    groupId: data.groupId,
    ownerProfileId: data.ownerProfileId,
    name: data.name,
    color: data.color || DEFAULTS.CALENDAR_COLOR,
    icon: data.icon || "calendar",
    visibility: data.visibility || ENUMS.CALENDAR_VISIBILITY.GROUP,
    isDefault: data.isDefault || false,
    enabled: true,
  });
}

/**
 * Actualiza un calendario
 */
export async function updateCalendar(calendarId, data) {
  return databases.updateDocument(databaseId, collectionId, calendarId, data);
}

/**
 * Soft delete de un calendario
 */
export async function deleteCalendar(calendarId) {
  return databases.updateDocument(databaseId, collectionId, calendarId, {
    enabled: false,
  });
}

/**
 * Colores predefinidos para calendarios
 */
export const CALENDAR_COLORS = [
  { id: "cyan", value: "22d3ee", label: "Cyan" },
  { id: "blue", value: "3b82f6", label: "Azul" },
  { id: "violet", value: "8b5cf6", label: "Violeta" },
  { id: "pink", value: "ec4899", label: "Rosa" },
  { id: "red", value: "ef4444", label: "Rojo" },
  { id: "orange", value: "f97316", label: "Naranja" },
  { id: "amber", value: "f59e0b", label: "Ámbar" },
  { id: "emerald", value: "10b981", label: "Esmeralda" },
  { id: "teal", value: "14b8a6", label: "Teal" },
  { id: "slate", value: "64748b", label: "Gris" },
];
