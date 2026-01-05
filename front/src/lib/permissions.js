/**
 * Sistema de Permisos RBAC - Agenda Pro
 *
 * Define los permisos del sistema y sus categorías.
 * Basado en: 04_group_roles_permissions_RBAC.md
 */

// =============================================================================
// PERMISOS DEL SISTEMA
// =============================================================================

/**
 * Lista completa de permisos del sistema
 * Formato: modulo.accion
 */
export const SYSTEM_PERMISSIONS = {
  // ─────────────────────────────────────────────────────────────────────────
  // Grupo / Espacio
  // ─────────────────────────────────────────────────────────────────────────
  GROUP_READ: "group.read",
  GROUP_UPDATE: "group.update",
  GROUP_DELETE: "group.delete",
  GROUP_BILLING_READ: "group.billing.read",
  GROUP_BILLING_MANAGE: "group.billing.manage",

  // ─────────────────────────────────────────────────────────────────────────
  // Miembros e Invitaciones
  // ─────────────────────────────────────────────────────────────────────────
  MEMBERS_READ: "members.read",
  MEMBERS_INVITE: "members.invite",
  MEMBERS_RESEND_INVITE: "members.resend_invite",
  MEMBERS_CANCEL_INVITE: "members.cancel_invite",
  MEMBERS_REMOVE: "members.remove",
  MEMBERS_UPDATE_ROLES: "members.update_roles",
  MEMBERS_MANAGE: "members.manage",

  // ─────────────────────────────────────────────────────────────────────────
  // Roles y Permisos
  // ─────────────────────────────────────────────────────────────────────────
  ROLES_READ: "roles.read",
  ROLES_MANAGE: "roles.manage",
  PERMISSIONS_READ: "permissions.read",

  // ─────────────────────────────────────────────────────────────────────────
  // Calendarios
  // ─────────────────────────────────────────────────────────────────────────
  CALENDARS_READ: "calendars.read",
  CALENDARS_CREATE: "calendars.create",
  CALENDARS_UPDATE: "calendars.update",
  CALENDARS_DELETE: "calendars.delete",
  CALENDARS_MANAGE: "calendars.manage",

  // ─────────────────────────────────────────────────────────────────────────
  // Eventos
  // ─────────────────────────────────────────────────────────────────────────
  EVENTS_READ: "events.read",
  EVENTS_CREATE: "events.create",
  EVENTS_UPDATE: "events.update",
  EVENTS_DELETE: "events.delete",
  EVENTS_MANAGE: "events.manage",
  EVENTS_INVITE_ATTENDEES: "events.invite_attendees",

  // ─────────────────────────────────────────────────────────────────────────
  // Notificaciones
  // ─────────────────────────────────────────────────────────────────────────
  NOTIFICATIONS_READ: "notifications.read",
};

// =============================================================================
// DESCRIPCIONES DE PERMISOS
// =============================================================================

/**
 * Descripciones legibles de cada permiso
 */
export const PERMISSION_DESCRIPTIONS = {
  // Grupo
  [SYSTEM_PERMISSIONS.GROUP_READ]: "Ver información del espacio de trabajo",
  [SYSTEM_PERMISSIONS.GROUP_UPDATE]:
    "Editar nombre, descripción y configuración del espacio",
  [SYSTEM_PERMISSIONS.GROUP_DELETE]: "Eliminar el espacio de trabajo",
  [SYSTEM_PERMISSIONS.GROUP_BILLING_READ]: "Ver información de facturación",
  [SYSTEM_PERMISSIONS.GROUP_BILLING_MANAGE]: "Gestionar suscripción y pagos",

  // Miembros
  [SYSTEM_PERMISSIONS.MEMBERS_READ]: "Ver lista de miembros del espacio",
  [SYSTEM_PERMISSIONS.MEMBERS_INVITE]: "Invitar nuevos miembros al espacio",
  [SYSTEM_PERMISSIONS.MEMBERS_RESEND_INVITE]:
    "Reenviar invitaciones pendientes",
  [SYSTEM_PERMISSIONS.MEMBERS_CANCEL_INVITE]:
    "Cancelar invitaciones pendientes",
  [SYSTEM_PERMISSIONS.MEMBERS_REMOVE]: "Eliminar miembros del espacio",
  [SYSTEM_PERMISSIONS.MEMBERS_UPDATE_ROLES]: "Cambiar roles de los miembros",
  [SYSTEM_PERMISSIONS.MEMBERS_MANAGE]: "Gestión completa de miembros",

  // Roles
  [SYSTEM_PERMISSIONS.ROLES_READ]: "Ver roles disponibles",
  [SYSTEM_PERMISSIONS.ROLES_MANAGE]: "Crear, editar y eliminar roles",
  [SYSTEM_PERMISSIONS.PERMISSIONS_READ]: "Ver permisos del sistema",

  // Calendarios
  [SYSTEM_PERMISSIONS.CALENDARS_READ]: "Ver calendarios",
  [SYSTEM_PERMISSIONS.CALENDARS_CREATE]: "Crear nuevos calendarios",
  [SYSTEM_PERMISSIONS.CALENDARS_UPDATE]: "Editar calendarios existentes",
  [SYSTEM_PERMISSIONS.CALENDARS_DELETE]: "Eliminar calendarios",
  [SYSTEM_PERMISSIONS.CALENDARS_MANAGE]: "Gestión completa de calendarios",

  // Eventos
  [SYSTEM_PERMISSIONS.EVENTS_READ]: "Ver eventos",
  [SYSTEM_PERMISSIONS.EVENTS_CREATE]: "Crear nuevos eventos",
  [SYSTEM_PERMISSIONS.EVENTS_UPDATE]: "Editar eventos existentes",
  [SYSTEM_PERMISSIONS.EVENTS_DELETE]: "Eliminar eventos",
  [SYSTEM_PERMISSIONS.EVENTS_MANAGE]: "Gestión completa de eventos",
  [SYSTEM_PERMISSIONS.EVENTS_INVITE_ATTENDEES]: "Invitar asistentes a eventos",

  // Notificaciones
  [SYSTEM_PERMISSIONS.NOTIFICATIONS_READ]: "Ver notificaciones",
};

// =============================================================================
// CATEGORÍAS DE PERMISOS
// =============================================================================

/**
 * Categorías para organizar los permisos en la UI
 */
export const PERMISSION_CATEGORIES = [
  {
    id: "group",
    label: "Espacio de Trabajo",
    icon: "Building2",
    color: "violet",
    description: "Configuración general del espacio",
    permissions: [
      SYSTEM_PERMISSIONS.GROUP_READ,
      SYSTEM_PERMISSIONS.GROUP_UPDATE,
      SYSTEM_PERMISSIONS.GROUP_DELETE,
      SYSTEM_PERMISSIONS.GROUP_BILLING_READ,
      SYSTEM_PERMISSIONS.GROUP_BILLING_MANAGE,
    ],
  },
  {
    id: "members",
    label: "Miembros",
    icon: "Users",
    color: "blue",
    description: "Gestión de miembros e invitaciones",
    permissions: [
      SYSTEM_PERMISSIONS.MEMBERS_READ,
      SYSTEM_PERMISSIONS.MEMBERS_INVITE,
      SYSTEM_PERMISSIONS.MEMBERS_RESEND_INVITE,
      SYSTEM_PERMISSIONS.MEMBERS_CANCEL_INVITE,
      SYSTEM_PERMISSIONS.MEMBERS_REMOVE,
      SYSTEM_PERMISSIONS.MEMBERS_UPDATE_ROLES,
      SYSTEM_PERMISSIONS.MEMBERS_MANAGE,
    ],
  },
  {
    id: "roles",
    label: "Roles y Permisos",
    icon: "Shield",
    color: "amber",
    description: "Administración de roles RBAC",
    permissions: [
      SYSTEM_PERMISSIONS.ROLES_READ,
      SYSTEM_PERMISSIONS.ROLES_MANAGE,
      SYSTEM_PERMISSIONS.PERMISSIONS_READ,
    ],
  },
  {
    id: "calendars",
    label: "Calendarios",
    icon: "Calendar",
    color: "emerald",
    description: "Gestión de calendarios",
    permissions: [
      SYSTEM_PERMISSIONS.CALENDARS_READ,
      SYSTEM_PERMISSIONS.CALENDARS_CREATE,
      SYSTEM_PERMISSIONS.CALENDARS_UPDATE,
      SYSTEM_PERMISSIONS.CALENDARS_DELETE,
      SYSTEM_PERMISSIONS.CALENDARS_MANAGE,
    ],
  },
  {
    id: "events",
    label: "Eventos",
    icon: "CalendarDays",
    color: "cyan",
    description: "Gestión de eventos",
    permissions: [
      SYSTEM_PERMISSIONS.EVENTS_READ,
      SYSTEM_PERMISSIONS.EVENTS_CREATE,
      SYSTEM_PERMISSIONS.EVENTS_UPDATE,
      SYSTEM_PERMISSIONS.EVENTS_DELETE,
      SYSTEM_PERMISSIONS.EVENTS_MANAGE,
      SYSTEM_PERMISSIONS.EVENTS_INVITE_ATTENDEES,
    ],
  },
  {
    id: "notifications",
    label: "Notificaciones",
    icon: "Bell",
    color: "pink",
    description: "Sistema de notificaciones",
    permissions: [SYSTEM_PERMISSIONS.NOTIFICATIONS_READ],
  },
];

// =============================================================================
// ROLES PREDEFINIDOS
// =============================================================================

/**
 * Roles base que se crean automáticamente al crear un grupo
 * Estos roles tienen isSystem=true y no pueden eliminarse
 */
export const SYSTEM_ROLES = {
  ADMIN: {
    name: "Admin",
    description: "Acceso completo al espacio de trabajo",
    isSystem: true,
    permissions: Object.values(SYSTEM_PERMISSIONS),
  },
  EDITOR: {
    name: "Editor",
    description: "Puede crear y editar calendarios y eventos",
    isSystem: true,
    permissions: [
      SYSTEM_PERMISSIONS.GROUP_READ,
      SYSTEM_PERMISSIONS.MEMBERS_READ,
      SYSTEM_PERMISSIONS.ROLES_READ,
      SYSTEM_PERMISSIONS.PERMISSIONS_READ,
      SYSTEM_PERMISSIONS.CALENDARS_READ,
      SYSTEM_PERMISSIONS.CALENDARS_CREATE,
      SYSTEM_PERMISSIONS.CALENDARS_UPDATE,
      SYSTEM_PERMISSIONS.EVENTS_READ,
      SYSTEM_PERMISSIONS.EVENTS_CREATE,
      SYSTEM_PERMISSIONS.EVENTS_UPDATE,
      SYSTEM_PERMISSIONS.EVENTS_DELETE,
      SYSTEM_PERMISSIONS.EVENTS_INVITE_ATTENDEES,
      SYSTEM_PERMISSIONS.NOTIFICATIONS_READ,
    ],
  },
  VIEWER: {
    name: "Viewer",
    description: "Solo puede ver calendarios y eventos",
    isSystem: true,
    permissions: [
      SYSTEM_PERMISSIONS.GROUP_READ,
      SYSTEM_PERMISSIONS.MEMBERS_READ,
      SYSTEM_PERMISSIONS.CALENDARS_READ,
      SYSTEM_PERMISSIONS.EVENTS_READ,
      SYSTEM_PERMISSIONS.NOTIFICATIONS_READ,
    ],
  },
};

// =============================================================================
// UTILIDADES
// =============================================================================

/**
 * Obtiene todos los permisos como array de objetos
 * Útil para seed en la base de datos
 */
export function getAllPermissionsAsArray() {
  return Object.values(SYSTEM_PERMISSIONS).map((key) => ({
    key,
    description: PERMISSION_DESCRIPTIONS[key] || "",
    enabled: true,
  }));
}

/**
 * Obtiene la categoría de un permiso
 */
export function getPermissionCategory(permissionKey) {
  return PERMISSION_CATEGORIES.find((cat) =>
    cat.permissions.includes(permissionKey)
  );
}

/**
 * Obtiene el icono de color para una categoría
 */
export function getCategoryColor(categoryId) {
  const cat = PERMISSION_CATEGORIES.find((c) => c.id === categoryId);
  return cat?.color || "gray";
}

/**
 * Verifica si un permiso es de tipo "manage" (acceso completo)
 */
export function isManagePermission(permissionKey) {
  return permissionKey.endsWith(".manage");
}

/**
 * Obtiene permisos relacionados (mismo módulo)
 */
export function getRelatedPermissions(permissionKey) {
  const [module] = permissionKey.split(".");
  return Object.values(SYSTEM_PERMISSIONS).filter((key) =>
    key.startsWith(`${module}.`)
  );
}
