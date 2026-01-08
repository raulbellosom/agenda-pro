# Configuración de Firebase Cloud Messaging (FCM) para Notificaciones Push

## 🔧 Configuración Completa

### 1. Obtener el VAPID Key de Firebase

Para habilitar las notificaciones push, necesitas obtener el **VAPID Key** de tu proyecto Firebase:

1. Ve a [Firebase Console](https://console.firebase.google.com)
2. Selecciona tu proyecto: `agendapro-cbcd2`
3. En el menú lateral, ve a **Project Settings** (⚙️ > Project settings)
4. Ve a la pestaña **Cloud Messaging**
5. Baja hasta la sección **Web configuration**
6. En **Web Push certificates**, busca el **Key pair**
7. Si no existe, haz clic en **Generate key pair**
8. Copia el valor que comienza con `B...` (ejemplo: `BNxxxxxx...`)

### 2. Configurar la Variable de Entorno

Agrega el VAPID Key al archivo `.env`:

```bash
# En front/.env
VITE_FIREBASE_VAPID_KEY=TU_VAPID_KEY_AQUI
```

### 3. Verificar la Configuración

Ya están configurados todos los archivos necesarios:

- ✅ `front/src/shared/appwrite/env.js` - Variables de entorno exportadas
- ✅ `front/src/lib/firebase_config.js` - Inicialización de Firebase y FCM
- ✅ `front/public/firebase-messaging-sw.js` - Service Worker para notificaciones en background
- ✅ `front/src/lib/hooks/useNotifications.js` - Hook para gestionar notificaciones
- ✅ `front/src/lib/services/notificationService.js` - Servicio de notificaciones
- ✅ `front/src/app/providers/NotificationProvider.jsx` - Provider de notificaciones
- ✅ `front/src/app/providers/AppProviders.jsx` - Integración del NotificationProvider

## 🚀 Cómo Funciona

### Flujo de Notificaciones

```
┌─────────────────────────────────────────────────┐
│  Usuario autoriza notificaciones en el browser │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  Se obtiene el FCM token del navegador         │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  Se guarda el token en Appwrite                 │
│  Collection: push_subscriptions                │
└────────────────────┬────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────┐
│  Appwrite Function envía notificación via FCM  │
└────────────────────┬────────────────────────────┘
                     │
          ┌──────────┴──────────┐
          ▼                     ▼
┌──────────────────┐  ┌──────────────────┐
│ App en Foreground│  │App en Background │
│ onMessage()      │  │Service Worker    │
└──────────────────┘  └──────────────────┘
```

### Canales de Notificación Implementados

1. **In-App (Appwrite Realtime)**

   - Notificaciones instantáneas cuando la app está abierta
   - Usa WebSockets de Appwrite
   - Se muestran como Toast + sonido

2. **Push (Firebase Cloud Messaging)**

   - Notificaciones incluso con la app cerrada
   - Requiere permiso del usuario
   - Funciona en Chrome, Firefox, Edge, Safari (macOS 13+)

3. **Browser Notifications API**
   - Notificaciones nativas del sistema operativo
   - Se muestra cuando la app no está enfocada

## 📱 Uso en el Código

### Solicitar Permisos

```javascript
import { useRequestNotificationPermission } from "@/lib/hooks/useNotifications";

function MyComponent() {
  const { requestPermission, hasPermission, fcmToken } =
    useRequestNotificationPermission();

  const handleEnableNotifications = async () => {
    const result = await requestPermission();
    if (result === "granted") {
      console.log("Notificaciones habilitadas!", fcmToken);
    }
  };

  return (
    <button onClick={handleEnableNotifications}>
      Habilitar Notificaciones
    </button>
  );
}
```

### Usar el Hook de Notificaciones

```javascript
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useWorkspace } from "@/app/providers/WorkspaceProvider";

function NotificationsComponent() {
  const { profile, activeGroup } = useWorkspace();
  const { data, unreadCount, soundEnabled, toggleSound, fcmToken } =
    useNotifications(activeGroup?.$id, profile?.$id);

  return (
    <div>
      <h2>Notificaciones ({unreadCount} sin leer)</h2>
      <button onClick={toggleSound}>
        Sonido: {soundEnabled ? "ON" : "OFF"}
      </button>
      {fcmToken && <p>FCM Token registrado ✓</p>}
    </div>
  );
}
```

## 🧪 Testing

### Probar Notificaciones en Desarrollo

1. **Iniciar el servidor de desarrollo:**

   ```bash
   cd front
   npm run dev
   ```

2. **Abrir en navegador:**

   - Ve a `https://localhost:5173` (debe ser HTTPS para que funcione)
   - Si no tienes HTTPS local, usa ngrok o similar

3. **Autorizar notificaciones:**

   - El navegador te pedirá permiso
   - Acepta el permiso

4. **Verificar en consola:**

   ```
   FCM Service Worker registered
   FCM token saved successfully
   FCM Token: eXXX...
   ```

5. **Enviar notificación de prueba desde Firebase Console:**
   - Ve a Firebase Console > Cloud Messaging
   - "Send your first message"
   - Selecciona tu app web
   - Envía un mensaje de prueba

### Probar con Appwrite Function

Crea una notificación en Appwrite desde cualquier función:

```javascript
// En cualquier Appwrite Function
const sdk = require("node-appwrite");

// Crear notificación en Appwrite
await databases.createDocument(
  databaseId,
  notificationsCollectionId,
  "unique()",
  {
    profileId: userId,
    groupId: groupId,
    kind: "EVENT_REMINDER",
    title: "Recordatorio: Reunión en 15 minutos",
    body: 'Tu reunión "Daily Standup" comienza pronto',
    entityType: "event",
    entityId: eventId,
    createdAt: new Date().toISOString(),
  }
);

// El frontend recibirá la notificación automáticamente via Realtime
// Y si tienes el backend configurado, también via FCM
```

## ⚠️ Requisitos y Limitaciones

### Requisitos del Navegador

- ✅ Chrome 50+
- ✅ Firefox 44+
- ✅ Edge 79+
- ✅ Safari 16+ (macOS 13+)
- ❌ Safari iOS (no soporta Web Push aún)

### Requisitos para FCM

1. **HTTPS obligatorio** (o localhost para dev)
2. **Service Worker** (ya implementado)
3. **Permiso del usuario** (se solicita automáticamente)

### Limitaciones de PWA

- En iOS, las notificaciones push solo funcionan si:
  - El usuario agrega la PWA a la pantalla de inicio
  - Está en iOS 16.4+ (Safari 16.4+)
  - Abre la app desde el home screen, no desde Safari

## 🔐 Seguridad

### Variables Sensibles

El `VAPID_KEY` es público y puede estar en el frontend. Sin embargo:

- ✅ NO expongas el **Firebase Server Key** (backend only)
- ✅ Las notificaciones solo se pueden enviar desde:
  - Appwrite Functions (con API Key)
  - Backend con Firebase Admin SDK

### Permisos de Appwrite

La colección `push_subscriptions` debe tener:

```
- Create: Users (cualquier usuario autenticado)
- Read: User (solo el propietario del documento)
- Update: User (solo el propietario)
- Delete: User (solo el propietario)
```

## 📚 Próximos Pasos

### Backend: Enviar Notificaciones Push

Para enviar notificaciones push desde el backend (Appwrite Functions):

1. Crear función `send-push` que:

   - Recibe `profileId`, `title`, `body`, etc.
   - Busca los tokens FCM del usuario en `push_subscriptions`
   - Envía push via Firebase Admin SDK

2. Usar esa función desde otras funciones:
   - `cron-generate-reminders` → envía push de recordatorios
   - `invite-to-group` → envía push de invitaciones
   - `event-update-webhook` → envía push de cambios en eventos

### Referencias

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Web Push Notifications](https://web.dev/push-notifications-overview/)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Notifications API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)

---

## ✅ Checklist de Implementación

- [x] Variables de entorno configuradas en `.env`
- [x] Firebase inicializado en `firebase_config.js`
- [x] Service Worker creado en `public/firebase-messaging-sw.js`
- [x] Hook `useNotifications` con soporte FCM
- [x] Servicio para guardar tokens en Appwrite
- [x] Provider de notificaciones integrado
- [ ] **Obtener VAPID Key de Firebase Console**
- [ ] **Agregar VAPID Key al `.env`**
- [ ] Reiniciar el servidor de desarrollo
- [ ] Probar solicitud de permisos
- [ ] Verificar que se guarda el token en Appwrite
- [ ] Enviar notificación de prueba

---

¡Todo está listo! Solo falta obtener el VAPID Key de Firebase y agregarlo al `.env`. 🎉
