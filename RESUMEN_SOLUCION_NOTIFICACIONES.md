# 📋 Resumen de Problemas y Soluciones de Notificaciones

## 🔴 Problemas Reportados

### 1. ✅ Notificación de Aceptar/Rechazar Invitación FUNCIONA

- Llega en tiempo real
- Se reproduce sonido
- Se puede marcar como leída

### 2. ❌ Notificación de Invitación a Grupo NO FUNCIONA

- **Síntoma**: No llega en tiempo real, solo al recargar
- **Síntoma**: Al hacer click no se marca como leída
- **Síntoma**: No hay peticiones registradas

### 3. ❌ Notificación de Abandono de Grupo NO FUNCIONA

- **Síntoma**: No se actualiza en tiempo real cuando un miembro abandona
- **Síntoma**: No llega notificación al dueño del grupo
- **Síntoma**: No se reproduce sonido

### 4. ❌ Push Notifications de Firebase NO FUNCIONAN

- **Síntoma**: Ya está configurado Firebase
- **Síntoma**: Ya subió la función send-push-notification
- **Síntoma**: Ya agregó el ID al .env
- **Síntoma**: No se registra nada

---

## 🔍 Causas Raíz Identificadas

### Problema #1: Falta Configuración del Trigger en Appwrite

**Causa**: La función `send-push-notification` NO está configurada para recibir eventos cuando se crea una notificación.

**Impacto**:

- ❌ Las push notifications NUNCA se envían
- ❌ No hay ejecuciones registradas de la función
- ❌ Firebase nunca recibe las peticiones

**Solución**: Configurar el evento en Appwrite Console:

```
databases.695322a500102a008edb.collections.6953a80900040a88d2a3.documents.*.create
```

Ver: [CONFIGURAR_PUSH_NOTIFICATIONS.md](./CONFIGURAR_PUSH_NOTIFICATIONS.md)

---

### Problema #2: Permisos de la Colección de Notificaciones

**Causa**: Las notificaciones usan `profileId` para determinar el destinatario, pero los permisos de Appwrite solo reconocen `accountId` (el ID del usuario autenticado).

**Impacto**:

- ❌ Usuario invitado NO puede leer notificaciones de grupos a los que NO pertenece aún
- ❌ Usuario invitado NO puede actualizar (marcar como leída) sus notificaciones de invitación
- ❌ Eventos realtime NO llegan al usuario invitado hasta que recarga la página

**Solución**: Agregar campo `accountId` a todas las notificaciones y actualizar permisos:

- Read: `read("user:{accountId}")`
- Update: `update("user:{accountId}")`

Ver: [SOLUCION_PERMISOS_NOTIFICACIONES.md](./SOLUCION_PERMISOS_NOTIFICACIONES.md)

---

### Problema #3: Missing accountId en Notificaciones

**Causa**: Las funciones que crean notificaciones NO incluyen el campo `accountId`.

**Impacto**:

- ❌ Aunque se agregue el campo a la colección, las notificaciones nuevas no funcionarán sin este campo

**Solución**: Actualizar TODAS las funciones que crean notificaciones para incluir `accountId`.

**Archivos Modificados**:

- ✅ `functions/invite-to-group/src/index.js`
- ✅ `functions/accept-invitation/src/index.js` (2 lugares)
- ✅ `front/src/lib/services/groupService.js` (función leaveGroup)

---

## ✅ Soluciones Implementadas

### Cambio 1: Actualizar invite-to-group

**Archivo**: `functions/invite-to-group/src/index.js`

**Cambio**: Agregar `accountId` al crear la notificación de invitación

```javascript
// Obtener el accountId del usuario invitado
const invitedUserProfile = profileByEmail.documents[0];

await databases.createDocument(
  databaseId,
  notificationsCollectionId,
  ID.unique(),
  {
    groupId,
    profileId: invitedProfileId,
    accountId: invitedUserProfile.accountId, // ← NUEVO
    kind: "INVITE",
    title: `Invitación a ${group.name}`,
    // ... resto de campos
  }
);
```

**Resultado**:

- ✅ Notificaciones de invitación llegarán en tiempo real
- ✅ Se podrán marcar como leídas

---

### Cambio 2: Actualizar accept-invitation (Rechazo)

**Archivo**: `functions/accept-invitation/src/index.js`

**Cambio**: Agregar `accountId` al notificar rechazo de invitación

```javascript
// Obtener el perfil del invitador para el accountId
const inviterProfile = await databases.getDocument(
  databaseId,
  usersProfileCollectionId,
  invitation.invitedByProfileId
);

await databases.createDocument(
  databaseId,
  notificationsCollectionId,
  ID.unique(),
  {
    groupId,
    profileId: invitation.invitedByProfileId,
    accountId: inviterProfile.accountId, // ← NUEVO
    kind: "SYSTEM",
    title: "Invitación rechazada",
    // ... resto de campos
  }
);
```

---

### Cambio 3: Actualizar accept-invitation (Aceptación)

**Archivo**: `functions/accept-invitation/src/index.js`

**Cambio**: Agregar `accountId` al notificar aceptación de invitación

```javascript
// Obtener el perfil del invitador para el accountId
const inviterProfile = await databases.getDocument(
  databaseId,
  usersProfileCollectionId,
  invitation.invitedByProfileId
);

await databases.createDocument(
  databaseId,
  notificationsCollectionId,
  ID.unique(),
  {
    groupId,
    profileId: invitation.invitedByProfileId,
    accountId: inviterProfile.accountId, // ← NUEVO
    kind: "SYSTEM",
    title: "Invitación aceptada",
    // ... resto de campos
  }
);
```

---

### Cambio 4: Actualizar leaveGroup

**Archivo**: `front/src/lib/services/groupService.js`

**Cambio**: Agregar `accountId` al notificar abandono de grupo

```javascript
// Obtener el perfil del owner para el accountId
const ownerProfile = await databases.getDocument(
  databaseId,
  COLLECTIONS.USERS_PROFILE,
  ownerProfileId
);

await databases.createDocument(
  databaseId,
  COLLECTIONS.NOTIFICATIONS,
  ID.unique(),
  {
    groupId,
    profileId: ownerProfileId,
    accountId: ownerProfile.accountId, // ← NUEVO
    kind: "SYSTEM",
    title: `Miembro abandonó ${group.name}`,
    // ... resto de campos
  }
);
```

**Resultado**:

- ✅ Notificaciones de abandono llegarán en tiempo real al owner
- ✅ Se reproducirá sonido
- ✅ Se podrán marcar como leídas

---

## 📝 Pasos para Implementar TODO

### 1. Configurar Appwrite

#### A) Agregar campo accountId a la colección notifications

1. Ve a: https://appwrite.racoondevs.com/console
2. Databases → Tu database (`695322a500102a008edb`)
3. Collections → notifications (`6953a80900040a88d2a3`)
4. Attributes → Create Attribute
   - **Type**: String
   - **Key**: `accountId`
   - **Size**: 36
   - **Required**: No
   - **Array**: No
   - **Default**: null

#### B) Actualizar permisos de la colección notifications

1. En la misma colección, ve a Settings → Permissions
2. **Read Permissions**:
   - Eliminar permisos existentes relacionados con `profileId`
   - Agregar: `read("user:{accountId}")`
3. **Update Permissions**:
   - Eliminar permisos existentes relacionados con `profileId`
   - Agregar: `update("user:{accountId}")`

#### C) Configurar el trigger de send-push-notification

1. Functions → send-push-notification (`695dd5c800393c7b6b26`)
2. Settings → Events
3. Agregar evento:
   ```
   databases.695322a500102a008edb.collections.6953a80900040a88d2a3.documents.*.create
   ```
4. Verificar:
   - Timeout: 30 segundos mínimo
   - Execute Access: `any`
   - Enabled: ✅

#### D) Verificar variables de entorno de send-push-notification

1. En la misma función, ve a Environment Variables
2. Asegúrate de tener TODAS estas variables:

```bash
APPWRITE_ENDPOINT=https://appwrite.racoondevs.com/v1
APPWRITE_PROJECT_ID=693c22770010b1d271c3
APPWRITE_API_KEY=<tu_api_key>

APPWRITE_DATABASE_ID=695322a500102a008edb

COLLECTION_PUSH_SUBSCRIPTIONS_ID=6953ab7d003b54afb9c4
COLLECTION_NOTIFICATIONS_ID=6953a80900040a88d2a3

FIREBASE_PROJECT_ID=agendapro-cbcd2
FIREBASE_PRIVATE_KEY=<clave_privada_completa>
FIREBASE_CLIENT_EMAIL=<service_account_email>

APP_URL=<tu_dominio>
```

---

### 2. Redesplegar Funciones

Las funciones ya están modificadas en el código. Solo necesitas redesplegarlas:

```bash
# Opción A: Desde Appwrite CLI
cd functions/invite-to-group
appwrite deploy function

cd ../accept-invitation
appwrite deploy function

# Opción B: Desde la consola de Appwrite
# Sube manualmente los archivos modificados de cada función
```

---

### 3. Redesplegar Frontend

El archivo `groupService.js` ya está modificado. Redespliega el frontend:

```bash
cd front
npm run build

# Luego despliega a tu servidor/hosting
```

---

### 4. Migrar Notificaciones Existentes (Opcional)

Si ya tienes notificaciones en la base de datos sin `accountId`, puedes migrarlas ejecutando este script desde la consola del navegador (solo una vez):

```javascript
// Obtener todas las notificaciones sin accountId
const { databases, Query } = window.appwrite;
const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const notificationsCollectionId = import.meta.env
  .VITE_APPWRITE_COLLECTION_NOTIFICATIONS_ID;
const usersProfileCollectionId = import.meta.env
  .VITE_APPWRITE_COLLECTION_USERS_PROFILE_ID;

async function migrateNotifications() {
  const notifications = await databases.listDocuments(
    databaseId,
    notificationsCollectionId,
    [Query.isNull("accountId"), Query.limit(100)]
  );

  console.log(`Migrando ${notifications.documents.length} notificaciones...`);

  for (const notification of notifications.documents) {
    try {
      // Obtener el perfil para obtener el accountId
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

      console.log(`✅ Migrada: ${notification.$id}`);
    } catch (error) {
      console.error(`❌ Error migrando ${notification.$id}:`, error);
    }
  }

  console.log("✅ Migración completada");
}

migrateNotifications();
```

---

## 🧪 Testing Completo

### Test 1: Invitación a Grupo

1. **Usuario A** invita a **Usuario B** a un grupo
2. **Verificar en Usuario B**:
   - ✅ Recibe notificación inmediatamente (sin reload)
   - ✅ Ve toast con título y mensaje
   - ✅ Escucha sonido de notificación
   - ✅ Ve push notification del navegador
   - ✅ Contador de notificaciones aumenta
   - ✅ Puede hacer click y se marca como leída

### Test 2: Aceptar Invitación

1. **Usuario B** acepta la invitación
2. **Verificar en Usuario A** (el que invitó):
   - ✅ Recibe notificación de aceptación inmediatamente
   - ✅ Ve toast
   - ✅ Escucha sonido
   - ✅ Ve push notification
   - ✅ Puede marcarla como leída

### Test 3: Rechazar Invitación

1. **Usuario B** rechaza la invitación
2. **Verificar en Usuario A**:
   - ✅ Recibe notificación de rechazo inmediatamente
   - ✅ Ve toast
   - ✅ Escucha sonido
   - ✅ Ve push notification
   - ✅ Puede marcarla como leída

### Test 4: Abandono de Grupo

1. **Usuario B** (miembro) abandona el grupo
2. **Verificar en Owner del grupo**:
   - ✅ Recibe notificación de abandono inmediatamente
   - ✅ Ve toast con nombre del usuario que se fue
   - ✅ Escucha sonido
   - ✅ Ve push notification
   - ✅ Puede marcarla como leída

### Test 5: Push Notifications de Firebase

1. Cierra la pestaña/ventana de la app
2. Desde otra cuenta, invita al usuario
3. **Verificar**:
   - ✅ Recibe push notification del navegador (incluso con app cerrada)
   - ✅ Al hacer click en la push, abre la app
   - ✅ La notificación aparece en el listado

---

## 🔍 Debugging

### Si las notificaciones aún no llegan en tiempo real:

1. **Revisar permisos de la colección notifications**:

   - Debe tener `read("user:{accountId}")` y `update("user:{accountId}")`

2. **Revisar que accountId se esté guardando**:

   - Crear una notificación de prueba y verificar que tenga `accountId`

3. **Revisar consola del navegador**:
   - Buscar errores de permisos o subscripciones de Realtime

### Si las push notifications no funcionan:

1. **Revisar ejecuciones de send-push-notification**:

   - Appwrite Console → Functions → send-push-notification → Executions
   - Debe haber una ejecución por cada notificación creada

2. **Revisar logs de la función**:

   - Ver si hay errores de Firebase (credenciales inválidas, tokens expirados, etc.)

3. **Revisar que el usuario tenga tokens FCM guardados**:

   - Databases → push_subscriptions
   - Debe haber al menos un registro con `profileId` del usuario

4. **Revisar Firebase Console**:
   - Cloud Messaging debe estar habilitado
   - No debe haber errores en el dashboard

---

## 📊 Estado Final Esperado

Después de implementar TODOS los cambios:

| Notificación        | Tiempo Real | Toast + Sonido | Push (Firebase) | Marcar Leída |
| ------------------- | ----------- | -------------- | --------------- | ------------ |
| Invitación a grupo  | ✅          | ✅             | ✅              | ✅           |
| Aceptar invitación  | ✅          | ✅             | ✅              | ✅           |
| Rechazar invitación | ✅          | ✅             | ✅              | ✅           |
| Abandono de grupo   | ✅          | ✅             | ✅              | ✅           |

---

## 📞 Soporte

Si después de implementar TODO sigues teniendo problemas:

1. Revisa los logs de ejecución de las funciones en Appwrite Console
2. Revisa la consola del navegador para errores
3. Verifica que TODOS los pasos de configuración se hayan completado
4. Prueba con usuarios nuevos (sin notificaciones antiguas que puedan causar conflictos)

---

## 🎯 Conclusión

El problema principal era **falta de configuración del trigger de eventos** en Appwrite y **permisos incorrectos** por no usar `accountId`.

Con los cambios implementados:

- ✅ Todas las notificaciones llegarán en tiempo real
- ✅ Se reproducirá sonido para todas
- ✅ Se enviarán push notifications de Firebase
- ✅ Se podrán marcar como leídas
- ✅ Funcionará incluso para usuarios invitados que no son miembros del grupo aún

**IMPORTANTE**: Debes completar TODOS los pasos de la sección "Pasos para Implementar TODO" para que funcione correctamente.
