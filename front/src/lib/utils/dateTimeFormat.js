/**
 * Utilidades para formatear fechas y horas según preferencias del usuario
 */
import { format as dateFnsFormat } from "date-fns";
import { es } from "date-fns/locale";

// Mapeo de formatos de usuario a formatos date-fns
const DATE_FORMAT_MAP = {
  "DD/MM/YYYY": "dd/MM/yyyy",
  "MM/DD/YYYY": "MM/dd/yyyy",
  "YYYY-MM-DD": "yyyy-MM-dd",
  "D MMM YYYY": "d MMM yyyy",
};

// Formatos de hora
const TIME_FORMAT_MAP = {
  "24h": "HH:mm",
  "12h": "h:mm a",
};

/**
 * Formatea una fecha según las preferencias del usuario
 * @param {Date|string} date - Fecha a formatear
 * @param {string} userFormat - Formato de usuario (DD/MM/YYYY, etc)
 * @param {object} options - Opciones adicionales para date-fns
 * @returns {string} Fecha formateada
 */
export function formatDate(date, userFormat = "DD/MM/YYYY", options = {}) {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;
  const dateFnsPattern =
    DATE_FORMAT_MAP[userFormat] || DATE_FORMAT_MAP["DD/MM/YYYY"];

  return dateFnsFormat(dateObj, dateFnsPattern, {
    locale: es,
    ...options,
  });
}

/**
 * Formatea una hora según las preferencias del usuario
 * @param {Date|string} date - Fecha/hora a formatear
 * @param {string} userFormat - Formato de usuario (24h o 12h)
 * @param {object} options - Opciones adicionales para date-fns
 * @returns {string} Hora formateada
 */
export function formatTime(date, userFormat = "24h", options = {}) {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;
  const timeFnsPattern = TIME_FORMAT_MAP[userFormat] || TIME_FORMAT_MAP["24h"];

  return dateFnsFormat(dateObj, timeFnsPattern, {
    locale: es,
    ...options,
  });
}

/**
 * Formatea fecha y hora juntas
 * @param {Date|string} date - Fecha/hora a formatear
 * @param {string} dateFormat - Formato de fecha
 * @param {string} timeFormat - Formato de hora
 * @param {object} options - Opciones adicionales
 * @returns {string} Fecha y hora formateadas
 */
export function formatDateTime(
  date,
  dateFormat = "DD/MM/YYYY",
  timeFormat = "24h",
  options = {}
) {
  if (!date) return "";

  const dateObj = typeof date === "string" ? new Date(date) : date;
  const datePart = formatDate(dateObj, dateFormat, options);
  const timePart = formatTime(dateObj, timeFormat, options);

  return `${datePart} ${timePart}`;
}

/**
 * Formatea un rango de horas
 * @param {Date|string} startDate - Hora de inicio
 * @param {Date|string} endDate - Hora de fin
 * @param {string} timeFormat - Formato de hora
 * @returns {string} Rango formateado (ej: "14:00 - 15:30" o "2:00 PM - 3:30 PM")
 */
export function formatTimeRange(startDate, endDate, timeFormat = "24h") {
  if (!startDate || !endDate) return "";

  const startTime = formatTime(startDate, timeFormat);
  const endTime = formatTime(endDate, timeFormat);

  return `${startTime} - ${endTime}`;
}

/**
 * Devuelve el nombre de un día de la semana según el índice
 * @param {number} dayIndex - Índice del día (0=Domingo, 1=Lunes, etc)
 * @param {string} format - 'short' (L, M, M...) o 'medium' (LUN, MAR, MIÉ...) o 'long' (Lunes, Martes...)
 * @returns {string} Nombre del día
 */
export function getDayName(dayIndex, format = "short") {
  const dayNames = {
    short: ["D", "L", "M", "M", "J", "V", "S"],
    medium: ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"],
    long: [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ],
  };

  return dayNames[format]?.[dayIndex] || "";
}

/**
 * Genera array de nombres de días según weekStartsOn
 * @param {number} weekStartsOn - 0=Domingo, 1=Lunes, 6=Sábado
 * @param {string} format - 'short', 'medium', o 'long'
 * @returns {Array<string>} Array de 7 nombres de días
 */
export function getWeekDayNames(weekStartsOn = 1, format = "short") {
  const allDays = {
    short: ["D", "L", "M", "M", "J", "V", "S"],
    medium: ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"],
    long: [
      "Domingo",
      "Lunes",
      "Martes",
      "Miércoles",
      "Jueves",
      "Viernes",
      "Sábado",
    ],
  };

  const days = allDays[format] || allDays.short;

  // Reordenar según weekStartsOn
  return [...days.slice(weekStartsOn), ...days.slice(0, weekStartsOn)];
}
