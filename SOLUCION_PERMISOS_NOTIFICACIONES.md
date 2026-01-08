# 🔐 Solución al Problema de Permisos de Notificaciones

## Problema

Los usuarios invitados a un grupo NO pueden:

1. Ver notificaciones de invitación en tiempo real (requieren reload)
2. Marcar como leídas las notificaciones de invitación

**Causa**: Las notificaciones usan `profileId` para permisos, pero Appwrite solo conoce el `accountId` del usuario autenticado. No hay una relación automática entre `accountId` y `profileId` en los permisos.

## ✅ Solución 1: Agregar accountId a las Notificaciones (RECOMENDADO)

### Cambios Requeridos

#### 1. Actualizar el Schema de Notifications Collection

Agregar un nuevo atributo a la colección `notifications`:

- **Nombre**: `accountId`
- **Tipo**: String
- **Tamaño**: 36
- **Requerido**: No (para compatibilidad con notificaciones existentes)
- **Array**: No
- **Default**: null

#### 2. Actualizar Permisos de la Colección

En Appwrite Console → Collections → notifications → Settings → Permissions:

**Read Permissions:**

```
read("user:{accountId}")
```

**Update Permissions:**

```
update("user:{accountId}")
```

Esto permite que cada usuario pueda leer y actualizar sus propias notificaciones usando su ID de cuenta de Appwrite.

#### 3. Actualizar todas las Funciones que crean Notificaciones

Necesitas modificar estas funciones para incluir `accountId`:

##### a) `invite-to-group/src/index.js`

```javascript
// Línea ~301-325, cuando se crea la notificación:

// Primero, obtener el accountId del perfil invitado
const invitedProfile = profileByEmail.documents[0];

await databases.createDocument(
  databaseId,
  notificationsCollectionId,
  ID.unique(),
  {
    groupId,
    profileId: invitedProfileId,
    accountId: invitedProfile.accountId, // ← AGREGAR ESTO
    kind: "INVITE",
    title: `Invitación a ${group.name}`,
    body: message || `Has sido invitado a unirte al grupo "${group.name}"`,
    entityType: "group_invitations",
    entityId: invitation.$id,
    metadata: JSON.stringify({
      token,
      inviteLink,
      inviterName: `${inviterProfile.firstName} ${inviterProfile.lastName}`,
      roleName: invitedRole.name,
    }),
    createdAt: new Date().toISOString(),
    enabled: true,
  }
);
```

##### b) `accept-invitation/src/index.js`

```javascript
// Línea ~195-210 (notificación de rechazo)
await databases.createDocument(
  databaseId,
  notificationsCollectionId,
  ID.unique(),
  {
    groupId,
    profileId: invitation.invitedByProfileId,
    accountId: inviterProfile.accountId, // ← AGREGAR (necesitas obtener inviterProfile antes)
    kind: "SYSTEM",
    title: "Invitación rechazada",
    body: `${userProfile.firstName} ${userProfile.lastName} ha rechazado la invitación al grupo "${group.name}"`,
    entityType: "group_invitations",
    entityId: invitation.$id,
    createdAt: now,
    enabled: true,
  }
);

// Línea ~468-483 (notificación de aceptación)
await databases.createDocument(
  databaseId,
  notificationsCollectionId,
  ID.unique(),
  {
    groupId,
    profileId: invitation.invitedByProfileId,
    accountId: inviterProfile.accountId, // ← AGREGAR (necesitas obtener inviterProfile antes)
    kind: "SYSTEM",
    title: "Invitación aceptada",
    body: `${userProfile.firstName} ${userProfile.lastName} ha aceptado la invitación al grupo "${group.name}"`,
    entityType: "group_members",
    entityId: member.$id,
    createdAt: now,
    enabled: true,
  }
);
```

##### c) `groupService.js` (Frontend - leaveGroup)

```javascript
// Línea ~337-357
await databases.createDocument(
  databaseId,
  COLLECTIONS.NOTIFICATIONS,
  ID.unique(),
  {
    groupId,
    profileId: ownerProfileId,
    accountId: ownerProfile.accountId, // ← AGREGAR (necesitas obtener ownerProfile)
    kind: "SYSTEM",
    title: `Miembro abandonó ${group.name}`,
    body: `${memberName} ha salido del espacio "${group.name}"`,
    entityType: "groups",
    entityId: groupId,
    metadata: JSON.stringify({
      action: "member_left",
      memberProfileId: profileId,
      memberName,
    }),
    createdAt: new Date().toISOString(),
    enabled: true,
  }
);
```

#### 4. Obtener el accountId del Perfil

En cada función donde crees notificaciones, asegúrate de obtener el `accountId` del perfil del destinatario:

```javascript
// Obtener el perfil con accountId
const recipientProfile = await databases.getDocument(
  databaseId,
  usersProfileCollectionId,
  recipientProfileId
);

const accountId = recipientProfile.accountId;
```

---

## 🔄 Solución 2: Función de Backend para markAsRead (Alternativa)

Si no quieres modificar todas las funciones, puedes crear una función de backend que maneje el `markAsRead` con API Key.

### Crear nueva función: `mark-notification-read`

```javascript
// functions/mark-notification-read/src/index.js
import { Client, Databases } from "node-appwrite";

export default async ({ req, res, log, error }) => {
  try {
    const client = new Client()
      .setEndpoint(process.env.APPWRITE_ENDPOINT)
      .setProject(process.env.APPWRITE_PROJECT_ID)
      .setKey(process.env.APPWRITE_API_KEY);

    const databases = new Databases(client);

    const { notificationId, profileId } = JSON.parse(req.body);

    // Verificar que la notificación pertenece al usuario
    const notification = await databases.getDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.COLLECTION_NOTIFICATIONS_ID,
      notificationId
    );

    if (notification.profileId !== profileId) {
      return res.json(
        {
          ok: false,
          error: "Unauthorized",
        },
        403
      );
    }

    // Marcar como leída
    await databases.updateDocument(
      process.env.APPWRITE_DATABASE_ID,
      process.env.COLLECTION_NOTIFICATIONS_ID,
      notificationId,
      { readAt: new Date().toISOString() }
    );

    return res.json({ ok: true });
  } catch (err) {
    error(err.message);
    return res.json({ ok: false, error: err.message }, 500);
  }
};
```

Luego actualizar el frontend para llamar a esta función en vez de actualizar directamente.

---

## 📊 Comparación de Soluciones

| Aspecto            | Solución 1 (accountId) | Solución 2 (Función Backend) |
| ------------------ | ---------------------- | ---------------------------- |
| Complejidad        | Media                  | Baja                         |
| Cambios requeridos | Múltiples funciones    | 1 nueva función + frontend   |
| Performance        | ✅ Mejor (directo)     | ⚠️ Llamada extra             |
| Seguridad          | ✅ Permisos nativos    | ✅ Validación custom         |
| Mantenimiento      | ✅ Más limpio          | ⚠️ Lógica duplicada          |
| Tiempo real        | ✅ Funciona            | ✅ Funciona                  |
| Escalabilidad      | ✅ Mejor               | ⚠️ Más llamadas              |

**Recomendación**: Usar **Solución 1** para una arquitectura más limpia y mejor performance.

---

## 🚀 Pasos de Implementación (Solución 1)

1. [ ] Agregar atributo `accountId` a la colección `notifications` en Appwrite
2. [ ] Actualizar permisos de lectura: `read("user:{accountId}")`
3. [ ] Actualizar permisos de escritura: `update("user:{accountId}")`
4. [ ] Modificar `invite-to-group/src/index.js` para incluir `accountId`
5. [ ] Modificar `accept-invitation/src/index.js` (2 lugares) para incluir `accountId`
6. [ ] Modificar `groupService.js` en el frontend para incluir `accountId`
7. [ ] Redesplegar las funciones modificadas
8. [ ] Testing:
   - Invitar usuario → Debería ver notificación en tiempo real
   - Click en notificación → Debería marcarla como leída
   - Usuario abandona grupo → Owner debería recibir notificación

---

## 🧪 Testing

### Test 1: Notificación de Invitación

1. Usuario A invita a Usuario B a un grupo
2. Usuario B debería:
   - ✅ Ver la notificación inmediatamente (sin reload)
   - ✅ Ver el toast + sonido
   - ✅ Poder hacer click y marcarla como leída
   - ✅ Ver el contador de notificaciones actualizado

### Test 2: Notificación de Aceptación/Rechazo

1. Usuario B acepta/rechaza la invitación
2. Usuario A debería:
   - ✅ Ver la notificación inmediatamente
   - ✅ Ver el toast + sonido
   - ✅ Poder marcarla como leída

### Test 3: Notificación de Abandono

1. Usuario B (miembro) abandona el grupo
2. Owner del grupo debería:
   - ✅ Ver la notificación inmediatamente
   - ✅ Ver el toast + sonido
   - ✅ Poder marcarla como leída

---

## ⚠️ Migración de Datos Existentes

Si ya tienes notificaciones en la base de datos sin `accountId`, necesitas migrarlas:

```javascript
// Script de migración (ejecutar una vez)
const notifications = await databases.listDocuments(
  databaseId,
  notificationsCollectionId,
  [Query.isNull("accountId")]
);

for (const notification of notifications.documents) {
  // Obtener el profile
  const profile = await databases.getDocument(
    databaseId,
    usersProfileCollectionId,
    notification.profileId
  );

  // Actualizar con accountId
  await databases.updateDocument(
    databaseId,
    notificationsCollectionId,
    notification.$id,
    { accountId: profile.accountId }
  );
}
```

Este script lo puedes ejecutar desde la consola del navegador o crear una función temporal en Appwrite para migrarlo.
