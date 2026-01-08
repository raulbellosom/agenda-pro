# Sistema de Notificaciones en Tiempo Real - Agenda Pro

Este documento explica cómo funciona el sistema completo de notificaciones en la plataforma, tanto en tiempo real (Realtime) como con push notifications (FCM).

## 🎯 Arquitectura del Sistema

El sistema de notificaciones tiene **3 capas** que trabajan en conjunto:

### 1. **Appwrite Realtime** (Actualizaciones instantáneas en la app)

- Cuando el usuario está **activo en la aplicación**
- Actualiza la UI en tiempo real sin recargar
- Muestra toasts y reproduce sonidos
- Actualiza el contador de notificaciones

### 2. **Firebase Cloud Messaging** (Notificaciones push)

- Cuando el usuario **NO está en la aplicación**
- Muestra notificaciones del sistema operativo
- Funciona incluso con el navegador cerrado (si tiene service worker)

### 3. **Notificaciones en base de datos** (Persistencia)

- Almacena todas las notificaciones
- Permite historial y lectura posterior
- Base para ambos sistemas anteriores

## 🔄 Flujo Completo de una Notificación

### Ejemplo: Invitación a un Grupo

```
1. Usuario A invita a Usuario B
   ↓
2. Frontend llama a la función `invite-to-group`
   ↓
3. La función crea:
   - Invitación en `group_invitations`
   - Notificación en `notifications` ← 🎯 EVENTO CLAVE
   ↓
4. Appwrite dispara 2 eventos en paralelo:

   a) Realtime Event (subscripción del frontend)
      → Usuario B (si está en la app) recibe:
        - Toast: "Te han invitado a Equipo X"
        - Sonido de notificación
        - Actualización del ícono de campana

   b) Database Create Event (trigger de función)
      → `send-push-notification` se ejecuta:
        - Lee tokens FCM de Usuario B
        - Envía push vía Firebase
        → Usuario B (si NO está en la app) recibe:
          - Notificación del navegador/sistema
          - Badge en el ícono de la app (PWA)
```

## 📡 Configuración del Realtime (Frontend)

### Hook `useNotifications`

```javascript
// En AppShell o cualquier componente raíz
const {
  data: notifications,
  unreadCount,
  soundEnabled,
  toggleSound,
} = useNotifications(null, profile?.$id); // null = recibir de todos los grupos
```

**Cómo funciona:**

1. **Suscripción al canal de Realtime:**

   ```javascript
   const channelPattern = `databases.${databaseId}.collections.${notificationsCollectionId}.documents`;
   client.subscribe(channelPattern, (response) => {
     // Maneja eventos CREATE, UPDATE, DELETE
   });
   ```

2. **Filtrado inteligente:**

   - ✅ Solo notificaciones para el usuario actual (`profileId`)
   - ✅ Si se pasa `groupId`, filtra por grupo específico
   - ✅ Si se pasa `null`, acepta notificaciones de todos los grupos

3. **Efectos secundarios:**
   - Invalida cache de React Query (refresca lista)
   - Muestra toast con título y cuerpo
   - Reproduce sonido (si está habilitado)
   - Muestra notificación del navegador (Web Notifications API)

## 🔥 Configuración de Firebase Push

### 1. Service Worker (`public/firebase-messaging-sw.js`)

```javascript
// Escucha mensajes cuando la app está en background
messaging.onBackgroundMessage((payload) => {
  self.registration.showNotification(payload.notification.title, {
    body: payload.notification.body,
    icon: "/logo.png",
    badge: "/logo.png",
    data: payload.data,
  });
});
```

### 2. Hook `useNotifications` - Inicialización FCM

```javascript
useEffect(() => {
  async function initializeFCM() {
    // 1. Registrar Service Worker
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');

    // 2. Pedir permiso al usuario
    const token = await requestNotificationPermission();

    // 3. Guardar token en Appwrite
    await notificationService.savePushToken(groupId, profileId, token, deviceInfo);

    // 4. Escuchar mensajes en foreground
    listenToForegroundMessages((payload) => {
      addToast({ title: payload.notification.title, ... });
    });
  }

  initializeFCM();
}, [profileId]);
```

### 3. Función de Appwrite `send-push-notification`

**Trigger:** `databases.*.collections.[NOTIFICATIONS_ID].documents.*.create`

**Proceso:**

1. Lee la notificación del evento
2. Busca tokens FCM del usuario en `push_subscriptions`
3. Envía mensaje a Firebase:
   ```javascript
   await messaging.send({
     token: fcmToken,
     notification: {
       title: notification.title,
       body: notification.body
     },
     data: {
       notificationId: notification.$id,
       profileId: profileId,
       kind: notification.kind,
       ...
     }
   });
   ```
4. Actualiza `lastUsedAt` del token
5. Marca tokens inválidos como inactivos

## 🔧 Solución de Problemas Comunes

### ❌ "No recibo notificaciones en tiempo real"

**Problema:** El filtro de `useNotifications` bloqueaba notificaciones de grupos diferentes

**Solución aplicada:**

```javascript
// ANTES (❌ bloqueaba notificaciones)
if (
  notification.profileId !== profileId ||
  (groupId && notification.groupId !== groupId) // ← Esto bloqueaba todo
) {
  return;
}

// DESPUÉS (✅ acepta notificaciones globales)
if (notification.profileId !== profileId) {
  return;
}

// Solo filtrar por grupo si se especificó uno
if (groupId !== null && notification.groupId !== groupId) {
  return;
}
```

### ❌ "No recibo notificaciones push de Firebase"

**Checklist:**

1. ✅ **Service Worker registrado:**

   ```javascript
   navigator.serviceWorker.getRegistrations().then((registrations) => {
     console.log("SW:", registrations);
   });
   ```

2. ✅ **Permiso concedido:**

   ```javascript
   console.log("Notification permission:", Notification.permission);
   // Debe ser "granted"
   ```

3. ✅ **Token guardado:**

   - Revisa la colección `push_subscriptions` en Appwrite
   - Debe existir un documento con `profileId` del usuario
   - `endpoint` debe contener el token FCM
   - `p256dh` debe ser `"fcm"` (nuestro marcador)

4. ✅ **Función `send-push-notification` configurada:**

   - Existe en Appwrite Functions
   - Trigger configurado correctamente
   - Variables de entorno de Firebase configuradas
   - Logs no muestran errores

5. ✅ **Credenciales de Firebase correctas:**
   - `FIREBASE_PROJECT_ID`
   - `FIREBASE_PRIVATE_KEY` (con `\n` real escapados)
   - `FIREBASE_CLIENT_EMAIL`

### ❌ "Las notificaciones llegan tarde"

- Appwrite Realtime: **Instantáneo** (milisegundos)
- Firebase Push: **Variable** (segundos a minutos, depende de Firebase/red)

Si Realtime está lento, revisa:

- Conexión del cliente con Appwrite
- Logs del navegador (errores de WebSocket)

## 🎨 Personalización

### Cambiar el sonido de notificación

```javascript
// En useNotifications.js
const audio = new Audio("/sounds/notification.mp3"); // ← Cambia aquí
audio.play();
```

### Desactivar sonido globalmente

```javascript
const { soundEnabled, toggleSound } = useNotifications(null, profileId);

// En tu UI
<button onClick={toggleSound}>{soundEnabled ? "🔔" : "🔕"}</button>;
```

### Personalizar el toast

```javascript
addToast({
  title: notification.title,
  message: notification.body,
  type: "info", // "success" | "error" | "info"
  duration: 5000, // ms
});
```

### Personalizar la notificación push

En `send-push-notification/src/index.js`:

```javascript
const message = {
  token,
  notification: {
    title: notificationTitle,
    body: notificationBody,
    icon: "/custom-icon.png", // ← Personaliza
  },
  data: {
    // Datos adicionales
    customField: "value",
  },
};
```

## 📊 Monitoreo y Debugging

### Logs del Frontend

```javascript
// useNotifications.js
console.log("Realtime event received:", response);
console.log("FCM message received:", payload);
console.log("Token saved:", fcmToken);
```

### Logs de la Función

En Appwrite Console → Functions → send-push-notification → Logs:

```
✅ Firebase Admin initialized
✅ Processing notification abc123 for user xyz789
✅ Found 2 push subscriptions
✅ Push sent successfully to token AIzaSy...
✅ Push notification sending complete: 2 sent, 0 failed
```

### Test Manual

#### 1. Test Realtime (sin función):

```javascript
// Desde la consola del navegador
await databases.createDocument(
  databaseId,
  notificationsCollectionId,
  ID.unique(),
  {
    profileId: "TU_PROFILE_ID",
    groupId: null,
    kind: "SYSTEM",
    title: "Test Realtime",
    body: "Si ves esto, Realtime funciona! 🎉",
    enabled: true,
    createdAt: new Date().toISOString(),
  }
);
```

**Resultado esperado:**

- Toast aparece inmediatamente
- Sonido se reproduce
- Contador de notificaciones se actualiza

#### 2. Test Push (con función):

La función se ejecuta automáticamente al crear la notificación arriba.

**Resultado esperado:**

- Notificación del navegador aparece (si estás en otra pestaña)
- Logs de la función muestran el envío
- Badge aparece en el ícono de la app (PWA)

## 🚀 Próximos Pasos

### Para eventos y recordatorios:

1. **Crear notificación en `cron-generate-reminders`:**

   ```javascript
   await databases.createDocument(
     databaseId,
     notificationsCollectionId,
     ID.unique(),
     {
       profileId: attendee.profileId,
       groupId: event.groupId,
       kind: "EVENT_REMINDER",
       title: `Recordatorio: ${event.title}`,
       body: `El evento comienza en ${minutesBefore} minutos`,
       entityType: "events",
       entityId: event.$id,
       enabled: true,
       createdAt: new Date().toISOString(),
     }
   );
   ```

2. **¡Listo!** El sistema automáticamente:
   - Envía Realtime si el usuario está en la app
   - Envía Push si el usuario NO está en la app

### Para cualquier otro tipo de notificación:

Simplemente crea un documento en `notifications`:

- ✅ Realtime funciona automáticamente
- ✅ Push funciona automáticamente (si la función está desplegada)

## 📝 Checklist de Implementación

- [x] Hook `useNotifications` con Realtime
- [x] Filtrado correcto de notificaciones
- [x] Toast y sonido en foreground
- [x] FCM inicialización y registro de token
- [x] Service Worker para mensajes en background
- [x] Función `send-push-notification` creada
- [x] Credenciales de Firebase configuradas
- [ ] Desplegar función en Appwrite
- [ ] Configurar trigger de la función
- [ ] Probar flujo completo
- [ ] Documentar para el equipo

## 🔗 Referencias

- [Appwrite Realtime](https://appwrite.io/docs/realtime)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Web Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
