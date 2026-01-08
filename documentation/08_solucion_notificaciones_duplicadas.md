# Solución: Notificaciones Duplicadas

## Problema Identificado

Las notificaciones estaban llegando duplicadas por **tres razones principales**:

### 1. 🔄 Doble manejo: Realtime + FCM

El hook `useNotifications.js` estaba escuchando TANTO:

- **Appwrite Realtime**: Eventos de creación de documentos en la colección notifications
- **FCM Foreground Messages**: Mensajes push cuando la app está abierta

Ambos sistemas mostraban:

- Toast notifications
- Sonidos
- Browser notifications

**Resultado**: Cada notificación se mostraba 2 veces en el mismo dispositivo.

### 2. 📱 Múltiples dispositivos con la misma cuenta

Si un usuario tiene:

- Su teléfono móvil
- Su computadora
- Su tablet

Todos con la misma cuenta, la tabla `push_subscriptions` tiene 3 registros activos. La función `send-push-notification` envía la notificación push a **TODOS** los dispositivos registrados.

**Esto es correcto y esperado**: Es el comportamiento normal de notificaciones push.

### 3. 🔔 Notificaciones del navegador duplicadas

La función `showBrowserNotification()` mostraba notificaciones usando la Notification API del navegador, duplicando lo que FCM ya manejaba.

## Soluciones Implementadas

### ✅ 1. Separación de responsabilidades

**Archivo modificado**: `front/src/lib/hooks/useNotifications.js`

#### Antes:

```javascript
// Realtime subscription
if (response.events.includes("create")) {
  queryClient.invalidateQueries(["notifications"]);
  showBrowserNotification(notification); // ❌ Duplicado
  addToast({ title, message }); // ❌ Duplicado
  playSound(); // ❌ Duplicado
}
```

#### Después:

```javascript
// ============================================================================
// FCM FOREGROUND (líneas 76-111):
// - Maneja toasts
// - Reproduce sonidos
// - Muestra notificaciones visuales
// ============================================================================

// ============================================================================
// REALTIME SUBSCRIPTION (líneas 115-150):
// - SOLO actualiza la lista de notificaciones
// - NO muestra toasts ni sonidos
// ============================================================================
```

**Responsabilidades asignadas**:

- **FCM**: Maneja TODA la UI de notificaciones (toasts, sonidos, badges)
- **Realtime**: Solo mantiene la lista actualizada en tiempo real

### ✅ 2. Deduplicación por Tag

**Archivo modificado**: `front/public/firebase-messaging-sw.js`

```javascript
// Usar notificationId como tag único
const notificationTag = payload.data?.notificationId || `notif-${Date.now()}`;

const notificationOptions = {
  tag: notificationTag, // Mismo tag = reemplaza notificación anterior
  renotify: false, // No vibrar si ya existe
  // ...
};
```

**Cómo funciona**:

- Cada notificación tiene un `$id` único en Appwrite
- Se usa como `tag` en la notificación del navegador
- Si llegan 2 notificaciones con el mismo tag, el navegador solo muestra una

### ✅ 3. Eliminación de código redundante

**Eliminado**:

```javascript
// ❌ ELIMINADA - Ya no necesaria
function showBrowserNotification(notification) {
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(notification.title, {
      body: notification.body,
      // ...
    });
  }
}
```

FCM ya maneja esto automáticamente en foreground y background.

## Comportamiento Final

### 📱 Escenario 1: Usuario con 1 dispositivo

1. Se crea una notificación en Appwrite
2. `send-push-notification` envía FCM → 1 dispositivo recibe
3. **Foreground**: FCM listener muestra toast + sonido
4. **Background**: Service Worker muestra notificación del navegador
5. Realtime actualiza la lista (sin UI)

**Resultado**: ✅ 1 notificación visual por dispositivo

### 📱📱 Escenario 2: Usuario con múltiples dispositivos

1. Se crea una notificación en Appwrite
2. `send-push-notification` consulta `push_subscriptions`:
   ```
   - subscription_1: iPhone (token_abc)
   - subscription_2: Laptop (token_xyz)
   ```
3. Envía FCM a ambos tokens
4. **iPhone recibe**: 1 notificación
5. **Laptop recibe**: 1 notificación

**Resultado**: ✅ 1 notificación por dispositivo (comportamiento correcto)

### 🌐 Escenario 3: Múltiples pestañas/ventanas abiertas

1. Usuario tiene 2 tabs de la app abiertos
2. Llega notificación FCM
3. Ambos tabs tienen listener de FCM foreground
4. **Tag deduplication**: El navegador muestra solo 1 notificación
5. Ambos tabs actualizan su lista vía Realtime

**Resultado**: ✅ 1 notificación visual, ambas listas actualizadas

## Verificación

### Para probar que funciona correctamente:

1. **Enviar una notificación**:

   ```javascript
   // Desde Appwrite Console o tu código
   await databases.createDocument(
     databaseId,
     notificationsCollectionId,
     ID.unique(),
     {
       profileId: "user_123",
       groupId: "group_456",
       kind: "SYSTEM",
       title: "Prueba",
       body: "Verificando duplicados",
       priority: "normal",
     }
   );
   ```

2. **Observar comportamiento esperado**:

   - ✅ 1 toast aparece (no 2)
   - ✅ 1 sonido se reproduce (no 2)
   - ✅ Lista de notificaciones se actualiza
   - ✅ Si tienes múltiples dispositivos, cada uno recibe 1

3. **Verificar en consola**:
   ```
   ✅ FCM Foreground message received: {...}
   ✅ Message received in foreground: {...}
   ❌ NO debería aparecer: "Realtime notification received" con toast duplicado
   ```

## Múltiples Dispositivos es Normal

⚠️ **IMPORTANTE**: Si el mismo usuario recibe notificaciones en su teléfono Y computadora, **esto es correcto**.

- Cada dispositivo tiene su propio token FCM
- Cada token se guarda en `push_subscriptions`
- La función envía a TODOS los dispositivos activos del usuario
- Este es el comportamiento esperado de un sistema de notificaciones push

### Para limitar dispositivos (opcional):

Si quieres limitar a 1 dispositivo por usuario, puedes:

```javascript
// En notificationService.savePushToken()
// Antes de crear la nueva subscription:

// Opción 1: Desactivar todas las anteriores
const existingSubscriptions = await databases.listDocuments(
  databaseId,
  pushSubscriptionsCollectionId,
  [Query.equal("profileId", profileId)]
);

for (const sub of existingSubscriptions.documents) {
  await databases.updateDocument(
    databaseId,
    pushSubscriptionsCollectionId,
    sub.$id,
    { isActive: false }
  );
}

// Luego crear la nueva (solo 1 activa a la vez)
```

Pero normalmente NO quieres hacer esto. Los usuarios esperan recibir notificaciones en todos sus dispositivos.

## Archivos Modificados

1. ✏️ `front/src/lib/hooks/useNotifications.js`

   - Eliminada lógica de toast/sonido en Realtime
   - Agregados comentarios explicativos
   - Eliminada función `showBrowserNotification()`

2. ✏️ `front/public/firebase-messaging-sw.js`
   - Agregado `renotify: false`
   - Mejorado uso de `tag` para deduplicación

## Monitoreo

### Logs útiles para debuggear:

```javascript
// En useNotifications.js
console.log("FCM Token initialized:", fcmToken);

// En firebase-messaging-sw.js
console.log("[Service Worker] Background message:", payload);

// En send-push-notification
log?.(`Found ${subscriptions.documents.length} push subscriptions`);
log?.(`Push sent successfully to token ${token.substring(0, 20)}...`);
```

### Métricas a revisar:

- Número de `push_subscriptions` activas por usuario
- Tasa de éxito/fallo en `send-push-notification`
- Tokens inválidos que se marcan como `isActive: false`

---

**Fecha**: Enero 2026  
**Estado**: ✅ Resuelto  
**Impacto**: Alta mejora en UX - notificaciones ahora llegan 1 vez por dispositivo
