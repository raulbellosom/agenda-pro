# Visibilidad de Calendarios y Ciclo de Vida

## Visibilidad de Calendarios

Los calendarios en Agenda Pro tienen dos niveles de visibilidad:

### 1. PRIVATE (Privado)

- **Visible solo para**: El dueño del calendario (`ownerProfileId`)
- **Uso típico**: Calendarios personales de cada usuario
- **Comportamiento**:
  - Solo aparecen en la lista de calendarios del dueño
  - No son visibles para otros miembros del grupo
  - Los eventos dentro de estos calendarios tampoco son visibles para otros

### 2. GROUP (Grupo)

- **Visible para**: Todos los miembros del grupo
- **Uso típico**: Calendarios compartidos del equipo
- **Comportamiento**:
  - Aparecen en la lista de calendarios de todos los miembros
  - Los eventos son visibles para todos los miembros del grupo
  - Cualquier miembro puede ver los eventos (permisos de edición dependen de roles)

## Implementación de Filtrado

La función `getCalendars(groupId, currentProfileId)` implementa el filtrado:

```javascript
// Filtrar calendarios según visibility
return response.documents.filter((calendar) => {
  // Si es PRIVATE, solo mostrarlo al dueño
  if (calendar.visibility === ENUMS.CALENDAR_VISIBILITY.PRIVATE) {
    return calendar.ownerProfileId === currentProfileId;
  }
  // Si es GROUP, mostrarlo a todos
  return true;
});
```

## Ciclo de Vida al Entrar/Salir de Grupos

### Escenario 1: Usuario acepta invitación por primera vez

1. Usuario recibe invitación al grupo
2. Acepta la invitación
3. La función `accept-invitation` ejecuta:
   - Crea membresía en `group_members`
   - **Busca** si existe un calendario "Personal" desactivado
   - Si existe: Lo **reactiva** (`enabled: true`)
   - Si no existe: **Crea** nuevo calendario "Personal" con:
     - `visibility: PRIVATE`
     - `isDefault: true`
     - `enabled: true`

### Escenario 2: Usuario abandona el grupo

1. Usuario sale del grupo (mediante `leaveGroup`)
2. La función ejecuta:
   - Desactiva la membresía (`enabled: false` en `group_members`)
   - **Desactiva todos los calendarios** del usuario en ese grupo
   - Los calendarios quedan con `enabled: false` pero NO se eliminan
   - Los eventos quedan intactos (solo ocultos por el calendario desactivado)

### Escenario 3: Usuario vuelve a unirse al mismo grupo

1. Usuario recibe nueva invitación al mismo grupo
2. Acepta la invitación
3. La función `accept-invitation` ejecuta:
   - **Busca** calendario "Personal" existente (incluso si está desactivado)
   - **Reactiva** el calendario anterior (`enabled: true`)
   - **NO crea duplicados**
   - El usuario recupera acceso a su calendario y eventos anteriores

## Ventajas de este Diseño

### 1. **Prevención de Duplicados**

- No se crean múltiples calendarios "Personal" si el usuario entra/sale varias veces
- Mantiene la integridad de los datos

### 2. **Preservación de Datos**

- Los eventos históricos no se pierden al salir del grupo
- Si el usuario regresa, recupera todo su historial

### 3. **Privacidad**

- Los calendarios PRIVATE nunca son visibles para otros miembros
- La visibilidad se controla a nivel de aplicación

### 4. **Limpieza Automática**

- Los calendarios de usuarios que salen quedan desactivados
- No contaminan la lista de calendarios activos del grupo

## Casos Especiales

### Usuario Propietario (Owner)

- El propietario **NO puede** abandonar el grupo
- Debe transferir la propiedad o eliminar el grupo completo
- Esto previene que el grupo quede sin dueño

### Múltiples Calendarios por Usuario

- Un usuario puede tener varios calendarios en un grupo
- Al salir, **TODOS** sus calendarios se desactivan
- Al regresar, solo el calendario "Personal" (isDefault=true) se reactiva automáticamente
- Los otros calendarios permanecen desactivados hasta que el usuario los reactive manualmente

## Queries Importantes

### Obtener calendarios visibles para un usuario

```javascript
getCalendars(groupId, currentProfileId);
```

### Buscar calendario Personal de un usuario

```javascript
Query.equal("groupId", groupId),
  Query.equal("ownerProfileId", profileId),
  Query.equal("name", "Personal"),
  Query.equal("isDefault", true);
```

### Desactivar calendarios al salir

```javascript
Query.equal("groupId", groupId),
  Query.equal("ownerProfileId", profileId),
  Query.equal("enabled", true);
// Luego: updateDocument({ enabled: false })
```

## Futuras Mejoras Posibles

1. **Reactivación Selectiva**: Permitir al usuario elegir qué calendarios reactivar al volver
2. **Eliminación Permanente**: Opción para eliminar permanentemente calendarios desactivados después de X días
3. **Transferencia de Calendarios**: Permitir transferir ownership de calendarios a otro miembro antes de salir
4. **Archivado**: Marcar calendarios como "archivados" en lugar de desactivados para mejor semántica

## Referencias

- [02_database.md](./02_database.md#i-calendars) - Esquema de base de datos
- [04_group_roles_permissions_RBAC.md](./04_group_roles_permissions_RBAC.md) - Permisos y roles
- `functions/accept-invitation/src/index.js` - Lógica de aceptación
- `front/src/lib/services/groupService.js` - Lógica de salida del grupo
- `front/src/lib/services/calendarService.js` - Filtrado de visibilidad
