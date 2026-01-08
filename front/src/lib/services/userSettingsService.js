/**
 * User Settings Service
 * Maneja las preferencias globales del usuario
 */
import { Query, ID } from "appwrite";
import { databases } from "../../shared/appwrite/client";
import { APPWRITE, COLLECTIONS, DEFAULTS } from "../constants";

const { databaseId } = APPWRITE;
const collectionId = COLLECTIONS.USER_SETTINGS;

/**
 * Obtiene las preferencias globales del usuario
 */
export async function getUserSettings(profileId) {
  if (!collectionId) {
    console.warn("User settings collection not configured");
    return null;
  }

  const response = await databases.listDocuments(databaseId, collectionId, [
    Query.equal("profileId", profileId),
    Query.equal("enabled", true),
    Query.limit(1),
  ]);

  return response.documents[0] || null;
}

/**
 * Crea o actualiza las preferencias del usuario
 */
export async function upsertUserSettings(profileId, data) {
  if (!collectionId) {
    throw new Error("User settings collection not configured");
  }

  // Buscar settings existentes
  const existing = await getUserSettings(profileId);

  if (existing) {
    // Actualizar
    return databases.updateDocument(
      databaseId,
      collectionId,
      existing.$id,
      data
    );
  }

  // Crear nuevas con defaults (sin groupId, settings son globales)
  return databases.createDocument(databaseId, collectionId, ID.unique(), {
    profileId,
    timezone: DEFAULTS.TIMEZONE,
    dateFormat: DEFAULTS.DATE_FORMAT,
    timeFormat: DEFAULTS.TIME_FORMAT,
    weekStartsOn: DEFAULTS.WEEK_STARTS_ON,
    defaultReminderMinutes: DEFAULTS.DEFAULT_REMINDER_MINUTES,
    language: DEFAULTS.LANGUAGE,
    theme: "SYSTEM",
    notificationsEnabled: true,
    emailNotificationsEnabled: true,
    pushNotificationsEnabled: false,
    soundEnabled: true,
    enabled: true,
    ...data,
  });
}

/**
 * Actualiza preferencias específicas
 */
export async function updateUserSettings(settingsId, data) {
  if (!collectionId) {
    throw new Error("User settings collection not configured");
  }

  return databases.updateDocument(databaseId, collectionId, settingsId, data);
}

/**
 * Obtiene o crea settings con valores por defecto
 */
export async function getOrCreateUserSettings(profileId) {
  const existing = await getUserSettings(profileId);

  if (existing) return existing;

  return upsertUserSettings(profileId, {});
}

// Opciones disponibles para settings
export const SETTINGS_OPTIONS = {
  timezones: [
    { value: "America/Mexico_City", label: "Ciudad de México (GMT-6)" },
    { value: "America/Cancun", label: "Cancún (GMT-5)" },
    { value: "America/Tijuana", label: "Tijuana (GMT-8)" },
    { value: "America/Hermosillo", label: "Hermosillo (GMT-7)" },
    { value: "America/New_York", label: "Nueva York (GMT-5)" },
    { value: "America/Los_Angeles", label: "Los Ángeles (GMT-8)" },
    { value: "America/Chicago", label: "Chicago (GMT-6)" },
    { value: "Europe/Madrid", label: "Madrid (GMT+1)" },
    { value: "Europe/London", label: "Londres (GMT+0)" },
    { value: "UTC", label: "UTC (GMT+0)" },
  ],
  dateFormats: [
    { value: "DD/MM/YYYY", label: "31/12/2024" },
    { value: "MM/DD/YYYY", label: "12/31/2024" },
    { value: "YYYY-MM-DD", label: "2024-12-31" },
    { value: "D MMM YYYY", label: "31 Dic 2024" },
  ],
  timeFormats: [
    { value: "24h", label: "24 horas (14:30)" },
    { value: "12h", label: "12 horas (2:30 PM)" },
  ],
  weekStartsOn: [
    { value: 0, label: "Domingo" },
    { value: 1, label: "Lunes" },
    { value: 6, label: "Sábado" },
  ],
  reminderOptions: [
    { value: 0, label: "Al momento" },
    { value: 5, label: "5 minutos antes" },
    { value: 10, label: "10 minutos antes" },
    { value: 15, label: "15 minutos antes" },
    { value: 30, label: "30 minutos antes" },
    { value: 60, label: "1 hora antes" },
    { value: 120, label: "2 horas antes" },
    { value: 1440, label: "1 día antes" },
  ],
  languages: [
    { value: "es", label: "Español" },
    { value: "en", label: "English" },
  ],
  themes: [
    { value: "SYSTEM", label: "Automático (sistema)" },
    { value: "LIGHT", label: "Claro" },
    { value: "DARK", label: "Oscuro" },
  ],
};
