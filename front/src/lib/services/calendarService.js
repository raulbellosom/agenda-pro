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
 * Obtiene todos los calendarios visibles para el usuario
 * Incluye:
 * - Calendarios PERSONALES del usuario (scope=PERSONAL)
 * - Calendarios GROUP del grupo actual (scope=GROUP, según visibility)
 */
export async function getCalendars(groupId, currentProfileId = null) {
  if (!currentProfileId) {
    return [];
  }

  const allCalendars = [];

  // 1. Obtener calendarios PERSONALES del usuario (siempre, sin importar groupId)
  const personalResponse = await databases.listDocuments(
    databaseId,
    collectionId,
    [
      Query.equal("ownerProfileId", currentProfileId),
      Query.equal("scope", ENUMS.CALENDAR_SCOPE.PERSONAL),
      Query.equal("enabled", true),
      Query.orderAsc("name"),
      Query.limit(100),
    ]
  );
  allCalendars.push(...personalResponse.documents);

  // 2. Si hay groupId, obtener calendarios del grupo
  if (groupId) {
    const groupResponse = await databases.listDocuments(
      databaseId,
      collectionId,
      [
        Query.equal("groupId", groupId),
        Query.equal("scope", ENUMS.CALENDAR_SCOPE.GROUP),
        Query.equal("enabled", true),
        Query.orderAsc("name"),
        Query.limit(100),
      ]
    );

    // Filtrar calendarios del grupo según visibility
    const visibleGroupCalendars = groupResponse.documents.filter((calendar) => {
      if (calendar.visibility === ENUMS.CALENDAR_VISIBILITY.PRIVATE) {
        return calendar.ownerProfileId === currentProfileId;
      }
      return true;
    });

    allCalendars.push(...visibleGroupCalendars);
  }

  return allCalendars;
}

/**
 * Obtiene los calendarios de un usuario (personales y de grupo)
 */
export async function getUserCalendars(groupId, ownerProfileId) {
  const queries = [
    Query.equal("ownerProfileId", ownerProfileId),
    Query.equal("enabled", true),
    Query.orderAsc("name"),
    Query.limit(100),
  ];

  // Si hay groupId, también incluir calendarios de ese grupo
  // Si no hay groupId, solo obtener calendarios personales
  if (groupId) {
    // Esta query solo funciona si usamos OR, pero como Appwrite no tiene OR directo,
    // haremos dos queries y las combinamos
    const personalResponse = await databases.listDocuments(
      databaseId,
      collectionId,
      [
        Query.equal("ownerProfileId", ownerProfileId),
        Query.equal("scope", ENUMS.CALENDAR_SCOPE.PERSONAL),
        Query.equal("enabled", true),
        Query.orderAsc("name"),
        Query.limit(100),
      ]
    );

    const groupResponse = await databases.listDocuments(
      databaseId,
      collectionId,
      [
        Query.equal("groupId", groupId),
        Query.equal("ownerProfileId", ownerProfileId),
        Query.equal("scope", ENUMS.CALENDAR_SCOPE.GROUP),
        Query.equal("enabled", true),
        Query.orderAsc("name"),
        Query.limit(100),
      ]
    );

    return [...personalResponse.documents, ...groupResponse.documents];
  } else {
    // Solo personales
    const response = await databases.listDocuments(databaseId, collectionId, [
      Query.equal("ownerProfileId", ownerProfileId),
      Query.equal("scope", ENUMS.CALENDAR_SCOPE.PERSONAL),
      Query.equal("enabled", true),
      Query.orderAsc("name"),
      Query.limit(100),
    ]);
    return response.documents;
  }
}

/**
 * Obtiene el calendario por defecto de un usuario
 * Prioriza:
 * 1. Calendario PERSONAL marcado como default
 * 2. Primer calendario PERSONAL
 * 3. Calendario GROUP marcado como default (si hay groupId)
 */
export async function getDefaultCalendar(groupId, ownerProfileId) {
  // 1. Buscar calendario PERSONAL por defecto
  const personalDefault = await databases.listDocuments(
    databaseId,
    collectionId,
    [
      Query.equal("ownerProfileId", ownerProfileId),
      Query.equal("scope", ENUMS.CALENDAR_SCOPE.PERSONAL),
      Query.equal("isDefault", true),
      Query.equal("enabled", true),
      Query.limit(1),
    ]
  );

  if (personalDefault.documents.length > 0) {
    return personalDefault.documents[0];
  }

  // 2. Si no hay default personal, buscar cualquier calendario PERSONAL
  const anyPersonal = await databases.listDocuments(databaseId, collectionId, [
    Query.equal("ownerProfileId", ownerProfileId),
    Query.equal("scope", ENUMS.CALENDAR_SCOPE.PERSONAL),
    Query.equal("enabled", true),
    Query.orderAsc("$createdAt"),
    Query.limit(1),
  ]);

  if (anyPersonal.documents.length > 0) {
    return anyPersonal.documents[0];
  }

  // 3. Si no hay personales y hay groupId, buscar del grupo
  if (groupId) {
    const groupDefault = await databases.listDocuments(
      databaseId,
      collectionId,
      [
        Query.equal("groupId", groupId),
        Query.equal("ownerProfileId", ownerProfileId),
        Query.equal("scope", ENUMS.CALENDAR_SCOPE.GROUP),
        Query.equal("isDefault", true),
        Query.equal("enabled", true),
        Query.limit(1),
      ]
    );

    if (groupDefault.documents.length > 0) {
      return groupDefault.documents[0];
    }

    // Si no hay default de grupo, buscar cualquier calendario del grupo del usuario
    const anyGroup = await databases.listDocuments(databaseId, collectionId, [
      Query.equal("groupId", groupId),
      Query.equal("ownerProfileId", ownerProfileId),
      Query.equal("scope", ENUMS.CALENDAR_SCOPE.GROUP),
      Query.equal("enabled", true),
      Query.orderAsc("$createdAt"),
      Query.limit(1),
    ]);

    return anyGroup.documents[0] || null;
  }

  return null;
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
  const calendarData = {
    ownerProfileId: data.ownerProfileId,
    name: data.name,
    color: data.color || DEFAULTS.CALENDAR_COLOR,
    icon: data.icon || "calendar",
    scope: data.scope || ENUMS.CALENDAR_SCOPE.GROUP,
    visibility: data.visibility || ENUMS.CALENDAR_VISIBILITY.GROUP,
    isDefault: data.isDefault || false,
    enabled: true,
  };

  // Solo agregar groupId si el scope es GROUP
  if (data.scope === ENUMS.CALENDAR_SCOPE.GROUP && data.groupId) {
    calendarData.groupId = data.groupId;
  }

  return databases.createDocument(
    databaseId,
    collectionId,
    ID.unique(),
    calendarData
  );
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
