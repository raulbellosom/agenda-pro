# Plan de Implementación: Audit Logs Completo

> **Objetivo:** Implementar un sistema completo de auditoría que registre todas las acciones importantes del usuario, tanto a nivel personal como de grupo.

---

## 📊 Estado Actual

### ✅ Implementado

**Base de Datos:**

- ✅ Colección `audit_logs` configurada con `groupId` opcional
- ✅ Índices correctos para consultas personales y de grupo

**Código:**

- ✅ `adminService.createAuditLog()` - soporta `groupId` opcional
- ✅ `adminService.getAuditLogs()` - consulta con filtros
- ✅ Funciones backend que usan audit logs:
  - `invite-to-group` - registra invitaciones
  - `accept-invitation` - registra aceptación/rechazo
  - `cron-expire-invitations` - registra expiraciones automáticas

### ❌ Falta Implementar

**Acciones sin audit logs:**

1. **Autenticación (Personales - sin groupId)**

   - Login
   - Logout
   - Registro de usuario
   - Verificación de email
   - Cambio de contraseña
   - Recuperación de contraseña

2. **Perfil de Usuario (Personales - sin groupId)**

   - Actualizar perfil (nombre, email, teléfono)
   - Cambiar avatar
   - Actualizar configuraciones (`user_settings`)
   - Gestionar suscripciones push

3. **Calendarios Personales (Personales - sin groupId)**

   - Crear calendario personal
   - Actualizar calendario personal
   - Eliminar calendario personal

4. **Eventos Personales (Personales - sin groupId)**

   - Crear evento en calendario personal
   - Actualizar evento personal
   - Eliminar evento personal
   - Agregar asistentes a evento personal
   - Agregar recordatorios a evento personal

5. **Grupos (Con groupId)**

   - Crear grupo
   - Actualizar grupo
   - Eliminar grupo
   - Transferir ownership

6. **Calendarios de Grupo (Con groupId)**

   - Crear calendario de grupo
   - Actualizar calendario de grupo
   - Eliminar calendario de grupo
   - Compartir calendario

7. **Eventos de Grupo (Con groupId)**

   - Crear evento en calendario de grupo
   - Actualizar evento de grupo
   - Eliminar evento de grupo
   - Agregar asistentes a evento de grupo
   - Agregar recordatorios a evento de grupo

8. **Roles y Permisos (Con groupId)**
   - Crear rol
   - Actualizar rol
   - Eliminar rol
   - Asignar permisos a rol
   - Asignar rol a usuario
   - Remover rol de usuario

---

## 🎯 Prioridades de Implementación

### 🔴 Prioridad Alta (Crítico para seguridad y compliance)

1. **Autenticación**

   - Login exitoso/fallido
   - Logout
   - Cambio de contraseña
   - Verificación de email

2. **Acciones en Grupos**
   - Crear/editar/eliminar grupo
   - Invitar/remover miembros
   - Cambiar roles de usuarios

### 🟡 Prioridad Media (Importante para trazabilidad)

3. **Calendarios y Eventos**

   - Crear/editar/eliminar calendarios (personales y de grupo)
   - Crear/editar/eliminar eventos (personales y de grupo)

4. **Perfil de Usuario**
   - Actualizar perfil
   - Cambiar configuraciones

### 🟢 Prioridad Baja (Nice to have)

5. **Acciones detalladas**
   - Agregar/remover asistentes
   - Gestionar recordatorios
   - Compartir calendarios
   - Actualizar suscripciones push

---

## 📋 Plan de Implementación

### Fase 1: Backend Functions (Funciones Appwrite)

#### 1.1 Función: `create-user-with-profile`

**Acción:** Registrar creación de usuario

```javascript
// Al final de la función, después de crear el usuario exitosamente
await databases.createDocument(databaseId, auditLogsCollectionId, ID.unique(), {
  groupId: null, // Acción personal
  profileId: createdProfile.$id,
  action: "CREATE",
  entityType: "users_profile",
  entityId: createdProfile.$id,
  entityName: `${firstName} ${lastName}`,
  details: JSON.stringify({
    email: email,
    emailVerified: false,
    personalCalendarCreated: true,
    userSettingsCreated: true,
  }),
  ipAddress: req.headers["x-forwarded-for"] || null,
  userAgent: req.headers["user-agent"] || null,
  createdAt: new Date().toISOString(),
  enabled: true,
});
```

#### 1.2 Función: `email-verification`

**Acción:** Registrar verificación de email

```javascript
// Después de marcar email como verificado
await databases.createDocument(databaseId, auditLogsCollectionId, ID.unique(), {
  groupId: null, // Acción personal
  profileId: profileDoc.$id,
  action: "UPDATE",
  entityType: "email_verification",
  entityId: tokenDoc.$id,
  entityName: email,
  details: JSON.stringify({
    action: "email_verified",
    verifiedAt: new Date().toISOString(),
  }),
  createdAt: new Date().toISOString(),
  enabled: true,
});
```

#### 1.3 Función: `create-group-with-defaults`

**Acción:** Registrar creación de grupo

```javascript
// Después de crear el grupo
await databases.createDocument(databaseId, auditLogsCollectionId, ID.unique(), {
  groupId: createdGroup.$id, // Acción de grupo
  profileId: ownerProfileId,
  action: "CREATE",
  entityType: "groups",
  entityId: createdGroup.$id,
  entityName: groupName,
  details: JSON.stringify({
    rolesCreated: rolesCreated.length,
    defaultCalendarCreated: true,
    ownerRole: "Admin",
  }),
  ipAddress: req.headers["x-forwarded-for"] || null,
  userAgent: req.headers["user-agent"] || null,
  createdAt: new Date().toISOString(),
  enabled: true,
});
```

---

### Fase 2: Frontend Services (Servicios React)

#### 2.1 Servicio: `authService.js`

**Crear helper para audit logs de autenticación**

```javascript
// En lib/services/authService.js
import { createAuditLog } from "./adminService";

async function logAuthAction(action, profileId, details = {}) {
  try {
    await createAuditLog({
      groupId: null, // Acciones de auth son personales
      profileId,
      action,
      entityType: "auth",
      details,
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
    // No fallar la operación principal si el log falla
  }
}

// Modificar función de login
export async function login(email, password) {
  const session = await account.createEmailPasswordSession(email, password);
  const user = await account.get();
  const profile = await getProfileByAuthId(user.$id);

  // Registrar login exitoso
  await logAuthAction("LOGIN", profile.$id, {
    email: user.email,
    loginAt: new Date().toISOString(),
  });

  return { user, profile };
}

// Agregar en logout
export async function logout(profileId) {
  await logAuthAction("LOGOUT", profileId, {
    logoutAt: new Date().toISOString(),
  });
  await account.deleteSession("current");
}
```

#### 2.2 Servicio: `calendarService.js`

**Agregar audit logs para calendarios**

```javascript
// En lib/services/calendarService.js
import { createAuditLog } from "./adminService";

async function logCalendarAction(action, calendar, profileId, details = {}) {
  try {
    await createAuditLog({
      groupId: calendar.groupId || null, // NULL si es personal
      profileId,
      action,
      entityType: "calendars",
      entityId: calendar.$id,
      entityName: calendar.name,
      details: {
        scope: calendar.scope,
        visibility: calendar.visibility,
        ...details,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

// Modificar createCalendar
export async function createCalendar(data, profileId) {
  const calendar = await databases.createDocument(
    databaseId,
    COLLECTIONS.CALENDARS,
    ID.unique(),
    data
  );

  await logCalendarAction("CREATE", calendar, profileId, {
    isDefault: calendar.isDefault,
  });

  return calendar;
}

// Modificar updateCalendar
export async function updateCalendar(calendarId, data, profileId) {
  const calendar = await databases.updateDocument(
    databaseId,
    COLLECTIONS.CALENDARS,
    calendarId,
    data
  );

  await logCalendarAction("UPDATE", calendar, profileId, {
    fieldsUpdated: Object.keys(data),
  });

  return calendar;
}

// Modificar deleteCalendar
export async function deleteCalendar(calendarId, calendar, profileId) {
  await databases.updateDocument(
    databaseId,
    COLLECTIONS.CALENDARS,
    calendarId,
    { enabled: false }
  );

  await logCalendarAction("DELETE", calendar, profileId, {
    deletedAt: new Date().toISOString(),
  });
}
```

#### 2.3 Servicio: `eventService.js`

**Agregar audit logs para eventos**

```javascript
// En lib/services/eventService.js
import { createAuditLog } from "./adminService";

async function logEventAction(action, event, profileId, details = {}) {
  try {
    await createAuditLog({
      groupId: event.groupId || null, // NULL si es evento personal
      profileId,
      action,
      entityType: "events",
      entityId: event.$id,
      entityName: event.title,
      details: {
        calendarId: event.calendarId,
        startAt: event.startAt,
        endAt: event.endAt,
        ...details,
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

// Aplicar en createEvent, updateEvent, deleteEvent
// Similar al patrón de calendarios
```

#### 2.4 Servicio: `userSettingsService.js`

**Agregar audit logs para configuraciones**

```javascript
// En lib/services/userSettingsService.js
import { createAuditLog } from "./adminService";

export async function upsertUserSettings(profileId, data) {
  const existing = await getUserSettings(profileId);

  const settings = existing
    ? await databases.updateDocument(
        databaseId,
        collectionId,
        existing.$id,
        data
      )
    : await databases.createDocument(databaseId, collectionId, ID.unique(), {
        profileId,
        ...DEFAULTS,
        ...data,
      });

  // Registrar cambio
  try {
    await createAuditLog({
      groupId: null, // Settings son globales
      profileId,
      action: existing ? "UPDATE" : "CREATE",
      entityType: "user_settings",
      entityId: settings.$id,
      details: {
        fieldsUpdated: Object.keys(data),
      },
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }

  return settings;
}
```

#### 2.5 Servicio: `groupService.js`

**Agregar audit logs para grupos**

```javascript
// En lib/services/groupService.js
import { createAuditLog } from "./adminService";

async function logGroupAction(action, group, profileId, details = {}) {
  try {
    await createAuditLog({
      groupId: group.$id,
      profileId,
      action,
      entityType: "groups",
      entityId: group.$id,
      entityName: group.name,
      details,
    });
  } catch (error) {
    console.error("Failed to create audit log:", error);
  }
}

// Aplicar en createGroup, updateGroup, deleteGroup
```

---

### Fase 3: Provider Level (AuthProvider)

#### 3.1 AuthProvider - Login/Logout automático

```javascript
// En app/providers/AuthProvider.jsx
async function login(email, password) {
  const session = await account.createEmailPasswordSession(email, password);
  await refresh();

  // Audit log de login
  if (profile) {
    try {
      await adminService.createAuditLog({
        groupId: null,
        profileId: profile.$id,
        action: "LOGIN",
        entityType: "auth",
        details: {
          email: session.email,
          provider: session.provider,
        },
      });
    } catch (err) {
      console.error("Failed to log login:", err);
    }
  }
}

async function logout() {
  const currentProfile = profile; // Guardar antes de cerrar sesión

  try {
    if (currentProfile) {
      await adminService.createAuditLog({
        groupId: null,
        profileId: currentProfile.$id,
        action: "LOGOUT",
        entityType: "auth",
        details: {
          logoutAt: new Date().toISOString(),
        },
      });
    }
  } catch (err) {
    console.error("Failed to log logout:", err);
  } finally {
    await account.deleteSession("current");
    setUser(null);
    setProfile(null);
  }
}
```

---

## 🔧 Utilidades Compartidas

### Crear `lib/utils/auditLogger.js`

```javascript
import { createAuditLog } from "../services/adminService";

/**
 * Helper para crear audit logs de forma consistente
 */
export async function logAction({
  action,
  entityType,
  entityId,
  entityName,
  profileId,
  groupId = null,
  details = {},
}) {
  try {
    await createAuditLog({
      groupId,
      profileId,
      action,
      entityType,
      entityId: entityId || null,
      entityName: entityName || null,
      details,
    });
  } catch (error) {
    console.error(
      `Failed to create audit log for ${action} ${entityType}:`,
      error
    );
    // No lanzar error - audit logs no deben romper la funcionalidad principal
  }
}

/**
 * Helper para acciones personales (sin grupo)
 */
export async function logPersonalAction({
  action,
  entityType,
  profileId,
  details = {},
}) {
  return logAction({
    action,
    entityType,
    profileId,
    groupId: null,
    details,
  });
}

/**
 * Helper para acciones de grupo
 */
export async function logGroupAction({
  action,
  entityType,
  groupId,
  profileId,
  details = {},
}) {
  return logAction({
    action,
    entityType,
    profileId,
    groupId,
    details,
  });
}
```

---

## 📈 Métricas y Reportes

### Consultas Útiles

```javascript
// Actividad reciente del usuario (personal + grupos)
function getUserActivity(profileId, limit = 50) {
  return databases.listDocuments(databaseId, COLLECTIONS.AUDIT_LOGS, [
    Query.equal("profileId", profileId),
    Query.orderDesc("createdAt"),
    Query.limit(limit),
  ]);
}

// Solo acciones personales del usuario
function getUserPersonalActivity(profileId, limit = 50) {
  return databases.listDocuments(databaseId, COLLECTIONS.AUDIT_LOGS, [
    Query.equal("profileId", profileId),
    Query.isNull("groupId"),
    Query.orderDesc("createdAt"),
    Query.limit(limit),
  ]);
}

// Actividad en un grupo específico
function getGroupActivity(groupId, limit = 100) {
  return databases.listDocuments(databaseId, COLLECTIONS.AUDIT_LOGS, [
    Query.equal("groupId", groupId),
    Query.orderDesc("createdAt"),
    Query.limit(limit),
  ]);
}

// Logins del usuario
function getUserLogins(profileId, limit = 20) {
  return databases.listDocuments(databaseId, COLLECTIONS.AUDIT_LOGS, [
    Query.equal("profileId", profileId),
    Query.equal("action", "LOGIN"),
    Query.orderDesc("createdAt"),
    Query.limit(limit),
  ]);
}

// Cambios críticos (CREATE/DELETE en grupos)
function getCriticalActions(groupId) {
  return databases.listDocuments(databaseId, COLLECTIONS.AUDIT_LOGS, [
    Query.equal("groupId", groupId),
    Query.equal("action", ["CREATE", "DELETE"]),
    Query.orderDesc("createdAt"),
  ]);
}
```

---

## ⚠️ Consideraciones Importantes

### 1. Performance

- **No bloquear operaciones principales**: Usar try-catch y continuar aunque falle el audit log
- **Hacer logs async**: No esperar respuesta si no es crítico
- **Limitar detalles**: No guardar información sensible en `details`

### 2. Privacidad y Seguridad

- **NO registrar passwords**: Jamás incluir contraseñas en los logs
- **Anonimizar datos sensibles**: Enmascarar emails parcialmente si es necesario
- **Limpiar datos viejos**: Implementar política de retención (ej: 90 días)

### 3. Compliance

- **GDPR**: Permitir exportar/eliminar logs de un usuario
- **Timestamps precisos**: Usar siempre ISO 8601
- **Inmutabilidad**: No permitir editar/eliminar logs (solo soft delete si es necesario)

### 4. Escalabilidad

- **Índices eficientes**: Ya configurados en schema
- **Paginación**: Siempre usar límites en queries
- **Archivado**: Mover logs viejos a storage si crecen mucho

---

## 🎯 Orden de Implementación Recomendado

### Sprint 1: Fundamentos (1-2 días)

1. ✅ Crear utilidad `auditLogger.js`
2. ✅ Implementar en `AuthProvider` (login/logout)
3. ✅ Implementar en `create-user-with-profile`
4. ✅ Implementar en `email-verification`

### Sprint 2: Calendarios y Eventos (2-3 días)

5. ✅ Implementar en `calendarService.js` (personales y de grupo)
6. ✅ Implementar en `eventService.js` (personales y de grupo)
7. ✅ Implementar en `create-group-with-defaults`

### Sprint 3: Configuraciones y Roles (1-2 días)

8. ✅ Implementar en `userSettingsService.js`
9. ✅ Implementar en `groupService.js` (actualizar/eliminar)
10. ✅ Implementar gestión de roles (si aplica)

### Sprint 4: UI y Reportes (2-3 días)

11. ✅ Crear página de audit logs para admins
12. ✅ Agregar sección de "Actividad reciente" en perfil de usuario
13. ✅ Dashboard de actividad de grupo para owners

---

## 📊 Ejemplo de UI: Página de Audit Logs

```jsx
// features/admin/AuditLogsPage.jsx
export function AuditLogsPage() {
  const [filters, setFilters] = useState({
    action: null,
    entityType: null,
    profileId: null,
    groupId: null,
  });

  const { data: logs, isLoading } = useAuditLogs(filters);

  return (
    <div>
      <h1>Audit Logs</h1>

      {/* Filtros */}
      <div>
        <select
          onChange={(e) => setFilters({ ...filters, action: e.target.value })}
        >
          <option value="">Todas las acciones</option>
          <option value="CREATE">Crear</option>
          <option value="UPDATE">Actualizar</option>
          <option value="DELETE">Eliminar</option>
          <option value="LOGIN">Login</option>
          <option value="LOGOUT">Logout</option>
        </select>

        <select
          onChange={(e) =>
            setFilters({ ...filters, entityType: e.target.value })
          }
        >
          <option value="">Todos los tipos</option>
          <option value="auth">Autenticación</option>
          <option value="calendars">Calendarios</option>
          <option value="events">Eventos</option>
          <option value="groups">Grupos</option>
          <option value="users_profile">Perfiles</option>
        </select>
      </div>

      {/* Tabla */}
      <table>
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Usuario</th>
            <th>Acción</th>
            <th>Tipo</th>
            <th>Entidad</th>
            <th>Grupo</th>
            <th>Detalles</th>
          </tr>
        </thead>
        <tbody>
          {logs?.map((log) => (
            <tr key={log.$id}>
              <td>{formatDate(log.createdAt)}</td>
              <td>{log.profileId}</td>
              <td>
                <Badge>{log.action}</Badge>
              </td>
              <td>{log.entityType}</td>
              <td>{log.entityName || log.entityId}</td>
              <td>{log.groupId ? "Grupo" : "Personal"}</td>
              <td>
                <button onClick={() => showDetails(log)}>Ver</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
```

---

## ✅ Checklist de Implementación

### Backend Functions

- [ ] create-user-with-profile
- [ ] email-verification
- [ ] create-group-with-defaults
- [ ] (Opcional) update-group
- [ ] (Opcional) delete-group

### Frontend Services

- [ ] authService - login/logout
- [ ] calendarService - CRUD calendarios
- [ ] eventService - CRUD eventos
- [ ] userSettingsService - actualizar settings
- [ ] groupService - CRUD grupos

### Providers

- [ ] AuthProvider - login/logout automático

### Utilidades

- [ ] lib/utils/auditLogger.js

### UI

- [ ] Página admin de audit logs
- [ ] Sección de actividad en perfil
- [ ] Dashboard de grupo con actividad

### Testing

- [ ] Tests de audit logs en backend
- [ ] Tests de audit logs en frontend
- [ ] Verificar que no se rompa funcionalidad si falla audit

---

## 🚀 Próximos Pasos

1. **Revisar y aprobar** este plan
2. **Priorizar** qué implementar primero
3. **Asignar** sprints al equipo
4. **Implementar** fase por fase
5. **Testing** exhaustivo
6. **Documentar** para el equipo

---

**Fecha de creación:** 2026-01-07  
**Versión:** 1.0  
**Estado:** 📋 Plan - Pendiente de aprobación
