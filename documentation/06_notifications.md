# Agenda Pro — Sistema de Notificaciones v1.0

> **Objetivo**: Implementar un sistema completo de notificaciones multi-canal (in-app, email, push) con Appwrite Realtime y Firebase Cloud Messaging, preparado para eventos de calendario y otras entidades.

---

## 📋 Tabla de Contenidos

1. [Arquitectura General](#1-arquitectura-general)
2. [Canales de Notificación](#2-canales-de-notificación)
3. [Appwrite Realtime Setup](#3-appwrite-realtime-setup)
4. [Firebase Cloud Messaging (FCM) Setup](#4-firebase-cloud-messaging-fcm-setup)
5. [Backend: Funciones de Notificación](#5-backend-funciones-de-notificación)
6. [Frontend: UI de Notificaciones](#6-frontend-ui-de-notificaciones)
7. [Tipos de Notificaciones](#7-tipos-de-notificaciones)
8. [Roadmap de Implementación](#8-roadmap-de-implementación)
9. [Testing y Validación](#9-testing-y-validación)

---

## 1. Arquitectura General

### 1.1 Flujo de Notificaciones

```
┌─────────────────────────────────────────────────────────────────────┐
│                         EVENTO DISPARADOR                            │
│  (Nuevo evento, recordatorio, invitación, actualización, etc.)      │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                    APPWRITE FUNCTION/WEBHOOK                         │
│  • cron-generate-reminders (recordatorios automáticos)              │
│  • invite-to-group (invitaciones)                                   │
│  • event-update-webhook (cambios en eventos)                        │
│  • etc.                                                             │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────────────┐
│                 CREAR DOCUMENTO EN `notifications`                   │
│  • groupId, profileId, kind, title, body, entityType, entityId      │
│  • createdAt = now()                                                │
│  • readAt = null (sin leer)                                         │
└────────────────────────────┬────────────────────────────────────────┘
                             │
                             ├──────────────────┬────────────────────┐
                             ▼                  ▼                    ▼
                    ┌─────────────────┐ ┌──────────────┐  ┌──────────────────┐
                    │  IN-APP         │ │   EMAIL      │  │   PUSH (FCM)     │
                    │  (Realtime)     │ │   (SMTP)     │  │   (Firebase)     │
                    └─────────────────┘ └──────────────┘  └──────────────────┘
                             │                  │                    │
                             ▼                  ▼                    ▼
                    Usuario ve la       Email enviado      Notificación push
                    notificación en     al correo del      en navegador/móvil
                    tiempo real         usuario            (incluso app cerrada)
```

### 1.2 Componentes del Sistema

#### Backend (Appwrite Functions)

- **send-notification** (nueva): Función universal para enviar notificaciones
- **cron-generate-reminders** (existente): Genera recordatorios de eventos
- **invite-to-group** (existente): Maneja invitaciones
- **event-update-webhook** (nueva): Notifica cambios en eventos

#### Frontend (React)

- **notificationService.js**: Servicio para CRUD de notificaciones
- **useNotifications** hook: React Query hook para datos en tiempo real
- **NotificationDropdown**: Componente UI en AppShell
- **NotificationCenter**: Página completa de notificaciones (`/notifications`)
- **PWA Service Worker**: Manejo de push notifications

#### Infraestructura

- **Appwrite Realtime**: Suscripciones a colección `notifications`
- **Firebase Cloud Messaging**: Push notifications
- **SMTP (Appwrite)**: Email notifications

---

## 2. Canales de Notificación

### 2.1 In-App Notifications (Realtime)

**Ventajas:**

- ✅ Instantáneas (sub-segundo)
- ✅ No requiere permisos del usuario
- ✅ Integradas en la UI
- ✅ Sin configuración extra

**Cuándo usar:**

- Usuario está activo en la aplicación
- Notificaciones de baja/media prioridad
- Actualizaciones de estado en tiempo real

**Implementación:**

```javascript
// Frontend: Suscripción Realtime
import { client } from "./appwrite";

client.subscribe(
  `databases.${databaseId}.collections.${notificationsCollectionId}.documents`,
  (response) => {
    if (
      response.events.includes("databases.*.collections.*.documents.*.create")
    ) {
      const notification = response.payload;
      // Mostrar notificación in-app
      showInAppNotification(notification);
    }
  }
);
```

### 2.2 Email Notifications

**Ventajas:**

- ✅ Funciona con usuario offline
- ✅ Registro permanente
- ✅ Alta tasa de apertura
- ✅ No requiere app instalada

**Cuándo usar:**

- Invitaciones a espacios
- Recordatorios importantes (eventos próximos)
- Resúmenes diarios/semanales
- Confirmaciones de acciones críticas

**Implementación:**

```javascript
// Backend Function: Usar SMTP de Appwrite
const sdk = require("node-appwrite");

async function sendEmailNotification({ to, subject, body, html }) {
  // Appwrite Messaging API o SMTP directo
  // Ya implementado en invite-to-group/src/index.js
}
```

### 2.3 Push Notifications (FCM)

**Ventajas:**

- ✅ Usuario recibe notificación incluso con app cerrada
- ✅ Alta visibilidad (badge, sonido, vibración)
- ✅ Funciona en PWA y móvil
- ✅ Soporta acciones (botones en notificación)

**Cuándo usar:**

- Recordatorios urgentes (evento en 5 min)
- Invitaciones de alta prioridad
- Alertas críticas
- Actualizaciones importantes de eventos

**Limitaciones:**

- ❌ Requiere permiso del usuario
- ❌ Setup con Firebase
- ❌ Service Worker necesario

---

## 3. Appwrite Realtime Setup

### 3.1 Habilitar Realtime en Colección

**Appwrite Console → Database → `notifications`**

- ✅ Realtime: **Enabled**
- Permissions:
  - Read: `user:[profileId]` (solo el destinatario)
  - Create: `team:admins` o Functions API Key

### 3.2 Frontend: Hook de Notificaciones Realtime

**Archivo**: `front/src/lib/hooks/useNotifications.js`

```javascript
import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "../appwrite";
import { notificationService } from "../services/notificationService";

export function useNotifications(groupId, profileId, options = {}) {
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);

  // Query para cargar notificaciones
  const query = useQuery({
    queryKey: ["notifications", groupId, profileId],
    queryFn: () => notificationService.getNotifications(groupId, profileId),
    enabled: !!groupId && !!profileId,
    ...options,
  });

  // Suscripción Realtime
  useEffect(() => {
    if (!groupId || !profileId) return;

    const channelPattern = `databases.${
      import.meta.env.VITE_APPWRITE_DATABASE_ID
    }.collections.${
      import.meta.env.VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID
    }.documents`;

    const unsubscribe = client.subscribe(channelPattern, (response) => {
      const notification = response.payload;

      // Solo procesar si es para este usuario y grupo
      if (
        notification.profileId !== profileId ||
        notification.groupId !== groupId
      ) {
        return;
      }

      if (
        response.events.includes("databases.*.collections.*.documents.*.create")
      ) {
        // Nueva notificación - invalidar query y mostrar
        queryClient.invalidateQueries(["notifications", groupId, profileId]);

        // Mostrar notificación in-app
        showInAppNotification(notification);

        // Reproducir sonido si está habilitado
        playSoundIfEnabled();
      } else if (
        response.events.includes("databases.*.collections.*.documents.*.update")
      ) {
        // Actualización (ej: marcada como leída)
        queryClient.invalidateQueries(["notifications", groupId, profileId]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [groupId, profileId, queryClient]);

  // Calcular no leídas
  useEffect(() => {
    if (query.data) {
      const count = query.data.filter((n) => !n.readAt).length;
      setUnreadCount(count);
    }
  }, [query.data]);

  return {
    ...query,
    unreadCount,
  };
}

function showInAppNotification(notification) {
  // Usar Toast o Notification API
  if ("Notification" in window && Notification.permission === "granted") {
    new Notification(notification.title, {
      body: notification.body,
      icon: "/android/res/mipmap-xxxhdpi/ic_launcher.png",
      tag: notification.$id,
    });
  }
}

function playSoundIfEnabled() {
  // Reproducir sonido si user_settings.soundEnabled === true
  const audio = new Audio("/sounds/notification.mp3");
  audio.play().catch(() => {});
}
```

### 3.3 Optimización: Filtrado Server-Side

En lugar de suscribirse a toda la colección, usar filtros:

```javascript
// Suscribirse solo a notificaciones del usuario actual
const channel = `databases.${databaseId}.collections.${notificationsCollectionId}.documents`;

client.subscribe([channel], (response) => {
  // Appwrite no soporta filtros en subscriptions,
  // así que filtrar client-side es necesario
  const notification = response.payload;
  if (notification.profileId === currentProfileId) {
    // Procesar
  }
});
```

**Limitación Appwrite**: No hay filtros server-side en subscriptions. Todos los documentos nuevos se envían al cliente. Para mitigar:

- Usar permisos de documento para que solo el destinatario pueda leer
- Filtrar client-side por `profileId`

---

## 4. Firebase Cloud Messaging (FCM) Setup

### 4.1 Crear Proyecto Firebase

1. **Firebase Console** → [console.firebase.google.com](https://console.firebase.google.com)
2. Crear nuevo proyecto: `agenda-pro`
3. **Project Settings** → **General** → Agregar app web
4. Nombre: `Agenda Pro PWA`
5. ✅ Habilitar **Firebase Hosting** (opcional para PWA)
6. Copiar **Firebase Config**:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "agenda-pro.firebaseapp.com",
  projectId: "agenda-pro",
  storageBucket: "agenda-pro.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
};
```

### 4.2 Habilitar Cloud Messaging

1. **Firebase Console** → **Cloud Messaging**
2. **Server Key** (Legacy) → Copiar para backend
3. **Web Push Certificates** → Generar Key Pair
   - Copiar **VAPID Public Key** para frontend

**Variables de entorno:**

```bash
# Backend (.env en Functions)
FIREBASE_SERVER_KEY=AAAAxxxxxx...

# Frontend (.env)
VITE_FIREBASE_VAPID_PUBLIC_KEY=BNxxxxxx...
```

### 4.3 Frontend: Inicializar Firebase

**Archivo**: `front/src/lib/firebase.js`

```javascript
import { initializeApp } from "firebase/app";
import { getMessaging, getToken, onMessage } from "firebase/messaging";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);

export { messaging };

// Solicitar permiso y obtener token
export async function requestNotificationPermission() {
  try {
    const permission = await Notification.requestPermission();

    if (permission === "granted") {
      const token = await getToken(messaging, {
        vapidKey: import.meta.env.VITE_FIREBASE_VAPID_PUBLIC_KEY,
      });

      console.log("FCM Token:", token);
      return token;
    } else {
      console.log("Notification permission denied");
      return null;
    }
  } catch (error) {
    console.error("Error getting FCM token:", error);
    return null;
  }
}

// Escuchar mensajes cuando la app está en foreground
export function listenToForegroundMessages(callback) {
  return onMessage(messaging, (payload) => {
    console.log("Foreground message:", payload);
    callback(payload);
  });
}
```

### 4.4 Service Worker para Background Messages

**Archivo**: `front/public/firebase-messaging-sw.js`

```javascript
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIza...",
  authDomain: "agenda-pro.firebaseapp.com",
  projectId: "agenda-pro",
  storageBucket: "agenda-pro.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123",
});

const messaging = firebase.messaging();

// Background message handler
messaging.onBackgroundMessage((payload) => {
  console.log("Background message:", payload);

  const notificationTitle = payload.notification?.title || "Nueva notificación";
  const notificationOptions = {
    body: payload.notification?.body || "",
    icon: "/android/res/mipmap-xxxhdpi/ic_launcher.png",
    badge: "/android/res/mipmap-xxxhdpi/ic_launcher.png",
    tag: payload.data?.notificationId || "default",
    data: payload.data,
    actions: [
      { action: "open", title: "Abrir" },
      { action: "close", title: "Cerrar" },
    ],
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// Click handler
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "open" || !event.action) {
    const urlToOpen = event.notification.data?.url || "/";
    event.waitUntil(clients.openWindow(urlToOpen));
  }
});
```

### 4.5 Registrar Service Worker

**Archivo**: `front/src/main.jsx`

```javascript
// Registrar Service Worker para PWA y FCM
if ("serviceWorker" in navigator) {
  navigator.serviceWorker
    .register("/firebase-messaging-sw.js")
    .then((registration) => {
      console.log("Service Worker registered:", registration);
    })
    .catch((error) => {
      console.error("Service Worker registration failed:", error);
    });
}
```

### 4.6 Guardar Token FCM en Appwrite

Cuando el usuario otorga permiso, guardar el token en `push_subscriptions`:

```javascript
import { requestNotificationPermission } from "./firebase";
import { databases } from "./appwrite";

async function subscribeToPushNotifications(groupId, profileId) {
  const token = await requestNotificationPermission();

  if (token) {
    // Guardar en push_subscriptions
    await databases.createDocument(
      databaseId,
      "push_subscriptions",
      ID.unique(),
      {
        groupId,
        profileId,
        endpoint: token, // FCM token
        p256dh: "", // No usado con FCM
        auth: "", // No usado con FCM
        userAgent: navigator.userAgent,
        isActive: true,
        createdAt: new Date().toISOString(),
      }
    );

    console.log("Push subscription saved");
  }
}
```

---

## 5. Backend: Funciones de Notificación

### 5.1 Nueva Función: `send-notification`

**Propósito**: Función universal para crear notificaciones y enviarlas por todos los canales habilitados.

**Input**:

```json
{
  "groupId": "group123",
  "profileId": "profile456",
  "kind": "EVENT_REMINDER",
  "title": "Recordatorio: Reunión en 15 minutos",
  "body": "La reunión con el cliente ABC comienza a las 3:00 PM",
  "entityType": "events",
  "entityId": "event789",
  "metadata": {
    "eventStartTime": "2026-01-05T15:00:00Z",
    "calendarName": "Trabajo"
  }
}
```

**Lógica**:

1. Obtener `user_settings` del usuario para saber canales habilitados
2. Crear documento en `notifications` (in-app)
3. Si `emailNotificationsEnabled === true` → Enviar email
4. Si `pushNotificationsEnabled === true` → Enviar push via FCM
5. Crear audit log

**Archivo**: `functions/send-notification/src/index.js`

```javascript
const sdk = require("node-appwrite");
const axios = require("axios");

module.exports = async function ({ req, res, log, error }) {
  const client = new sdk.Client()
    .setEndpoint(process.env.APPWRITE_ENDPOINT)
    .setProject(process.env.APPWRITE_PROJECT_ID)
    .setKey(process.env.APPWRITE_API_KEY);

  const databases = new sdk.Databases(client);
  const databaseId = process.env.APPWRITE_DATABASE_ID;

  try {
    const {
      groupId,
      profileId,
      kind,
      title,
      body,
      entityType,
      entityId,
      metadata = {},
    } = JSON.parse(req.bodyRaw || "{}");

    // 1. Obtener user_settings
    const settingsList = await databases.listDocuments(
      databaseId,
      "user_settings",
      [
        sdk.Query.equal("groupId", groupId),
        sdk.Query.equal("profileId", profileId),
        sdk.Query.limit(1),
      ]
    );

    const settings = settingsList.documents[0] || {
      notificationsEnabled: true,
      emailNotificationsEnabled: true,
      pushNotificationsEnabled: false,
      soundEnabled: true,
    };

    if (!settings.notificationsEnabled) {
      return res.json({
        ok: false,
        message: "Notifications disabled for user",
      });
    }

    // 2. Crear notificación in-app
    const notification = await databases.createDocument(
      databaseId,
      "notifications",
      sdk.ID.unique(),
      {
        groupId,
        profileId,
        kind,
        title,
        body,
        entityType,
        entityId,
        metadata: JSON.stringify(metadata),
        createdAt: new Date().toISOString(),
        enabled: true,
      }
    );

    log(`In-app notification created: ${notification.$id}`);

    // 3. Email notification
    if (settings.emailNotificationsEnabled) {
      await sendEmailNotification({ profileId, title, body, metadata });
      log(`Email sent to profileId: ${profileId}`);
    }

    // 4. Push notification (FCM)
    if (settings.pushNotificationsEnabled) {
      await sendPushNotification({
        profileId,
        title,
        body,
        entityType,
        entityId,
      });
      log(`Push notification sent to profileId: ${profileId}`);
    }

    return res.json({ ok: true, notification });
  } catch (e) {
    error(e.message);
    return res.json({ ok: false, error: e.message }, 500);
  }
};

async function sendEmailNotification({ profileId, title, body, metadata }) {
  // Obtener perfil para email
  // Enviar via SMTP (ya implementado en invite-to-group)
  // ...
}

async function sendPushNotification({
  profileId,
  title,
  body,
  entityType,
  entityId,
}) {
  const databaseId = process.env.APPWRITE_DATABASE_ID;
  const databases = new sdk.Databases(client);

  // Obtener push_subscriptions del usuario
  const subscriptions = await databases.listDocuments(
    databaseId,
    "push_subscriptions",
    [sdk.Query.equal("profileId", profileId), sdk.Query.equal("isActive", true)]
  );

  const fcmServerKey = process.env.FIREBASE_SERVER_KEY;

  for (const sub of subscriptions.documents) {
    const fcmToken = sub.endpoint; // FCM token guardado en endpoint

    try {
      await axios.post(
        "https://fcm.googleapis.com/fcm/send",
        {
          to: fcmToken,
          notification: {
            title,
            body,
            icon: "/android/res/mipmap-xxxhdpi/ic_launcher.png",
          },
          data: {
            entityType,
            entityId,
            notificationId: notification.$id,
            url: `/${entityType}/${entityId}`,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `key=${fcmServerKey}`,
          },
        }
      );

      // Actualizar lastUsedAt
      await databases.updateDocument(
        databaseId,
        "push_subscriptions",
        sub.$id,
        { lastUsedAt: new Date().toISOString() }
      );
    } catch (error) {
      console.error(`Failed to send FCM to ${fcmToken}:`, error.message);

      // Si token inválido, desactivar suscripción
      if (error.response?.data?.error === "NotRegistered") {
        await databases.updateDocument(
          databaseId,
          "push_subscriptions",
          sub.$id,
          { isActive: false }
        );
      }
    }
  }
}
```

### 5.2 Actualizar `cron-generate-reminders`

Modificar para usar `send-notification` en lugar de crear directamente:

```javascript
// En cron-generate-reminders/src/index.js
// Reemplazar creación directa de notificación con:

const functions = new sdk.Functions(client);
await functions.createExecution(
  "send-notification", // Function ID
  JSON.stringify({
    groupId: event.groupId,
    profileId: attendee.profileId,
    kind: "EVENT_REMINDER",
    title: `Recordatorio: ${event.title}`,
    body: `El evento comienza en ${reminder.minutesBefore} minutos`,
    entityType: "events",
    entityId: event.$id,
    metadata: {
      eventStartTime: event.startTime,
      calendarName: calendar.name,
    },
  }),
  false, // No async
  "/",
  "POST"
);
```

### 5.3 Nueva Función: `event-update-webhook`

**Trigger**: Webhook en colección `events` (UPDATE)

**Lógica**:

- Si cambió `startTime` o `endTime` → Notificar a todos los asistentes
- Si cambió `title` → Notificar
- Si se canceló (`enabled=false`) → Notificar cancelación

```javascript
module.exports = async function ({ req, res, log, error }) {
  const event = JSON.parse(req.bodyRaw);

  if (event.$collection === "events" && event.events.includes("update")) {
    const eventData = event.payload;

    // Obtener event_attendees
    const attendees = await databases.listDocuments(
      databaseId,
      "event_attendees",
      [sdk.Query.equal("eventId", eventData.$id)]
    );

    // Notificar a cada asistente
    for (const attendee of attendees.documents) {
      await functions.createExecution(
        "send-notification",
        JSON.stringify({
          groupId: eventData.groupId,
          profileId: attendee.profileId,
          kind: "SYSTEM",
          title: `Actualización: ${eventData.title}`,
          body: "El evento ha sido modificado",
          entityType: "events",
          entityId: eventData.$id,
        })
      );
    }
  }

  return res.json({ ok: true });
};
```

---

## 6. Frontend: UI de Notificaciones

### 6.1 notificationService.js

**Archivo**: `front/src/lib/services/notificationService.js`

```javascript
import { databases, Query } from "../appwrite";

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const notificationsCollectionId = import.meta.env
  .VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID;

export const notificationService = {
  /**
   * Obtener notificaciones del usuario
   */
  async getNotifications(groupId, profileId, limit = 50) {
    const response = await databases.listDocuments(
      databaseId,
      notificationsCollectionId,
      [
        Query.equal("groupId", groupId),
        Query.equal("profileId", profileId),
        Query.orderDesc("createdAt"),
        Query.limit(limit),
      ]
    );
    return response.documents;
  },

  /**
   * Obtener solo no leídas
   */
  async getUnreadNotifications(groupId, profileId) {
    const response = await databases.listDocuments(
      databaseId,
      notificationsCollectionId,
      [
        Query.equal("groupId", groupId),
        Query.equal("profileId", profileId),
        Query.isNull("readAt"),
        Query.orderDesc("createdAt"),
      ]
    );
    return response.documents;
  },

  /**
   * Marcar como leída
   */
  async markAsRead(notificationId) {
    return await databases.updateDocument(
      databaseId,
      notificationsCollectionId,
      notificationId,
      { readAt: new Date().toISOString() }
    );
  },

  /**
   * Marcar todas como leídas
   */
  async markAllAsRead(groupId, profileId) {
    const unread = await this.getUnreadNotifications(groupId, profileId);

    const promises = unread.map((n) => this.markAsRead(n.$id));

    return await Promise.all(promises);
  },

  /**
   * Eliminar notificación (soft delete)
   */
  async deleteNotification(notificationId) {
    return await databases.updateDocument(
      databaseId,
      notificationsCollectionId,
      notificationId,
      { enabled: false }
    );
  },

  /**
   * Obtener contador de no leídas
   */
  async getUnreadCount(groupId, profileId) {
    const response = await databases.listDocuments(
      databaseId,
      notificationsCollectionId,
      [
        Query.equal("groupId", groupId),
        Query.equal("profileId", profileId),
        Query.isNull("readAt"),
        Query.limit(1), // Solo necesitamos el count
      ]
    );
    return response.total;
  },
};
```

### 6.2 useNotifications Hook

Ya documentado en sección 3.2.

### 6.3 Mejorar AppShell - Dropdown de Notificaciones

**Cambios**:

1. Remover mock data
2. Usar `useNotifications` hook
3. Mostrar notificaciones reales
4. Marcar como leídas al hacer click

```javascript
// En AppShell.jsx
import { useNotifications } from "../../lib/hooks/useNotifications";

function AppShell() {
  const { activeGroup, profile } = useWorkspace();

  const {
    data: notifications = [],
    unreadCount,
    isLoading: notificationsLoading,
  } = useNotifications(activeGroup?.$id, profile?.$id);

  // Mostrar solo las 5 más recientes en dropdown
  const recentNotifications = notifications.slice(0, 5);

  const handleNotificationClick = async (notification) => {
    // Marcar como leída
    await notificationService.markAsRead(notification.$id);

    // Navegar a la entidad
    if (notification.entityType && notification.entityId) {
      navigate(`/${notification.entityType}/${notification.entityId}`);
    }

    setShowNotifications(false);
  };

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead(activeGroup.$id, profile.$id);
  };

  return (
    // ... JSX
    <div className="relative">
      <button onClick={() => setShowNotifications(!showNotifications)}>
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full" />
        )}
      </button>

      {showNotifications && (
        <div className="dropdown">
          <div className="header">
            <h3>Notificaciones</h3>
            <button onClick={handleMarkAllAsRead}>
              Marcar todas como leídas
            </button>
          </div>

          <div className="notifications-list">
            {notificationsLoading ? (
              <Loader2 className="animate-spin" />
            ) : recentNotifications.length === 0 ? (
              <p>No tienes notificaciones</p>
            ) : (
              recentNotifications.map((notification) => (
                <NotificationItem
                  key={notification.$id}
                  notification={notification}
                  onClick={() => handleNotificationClick(notification)}
                />
              ))
            )}
          </div>

          <button onClick={() => navigate("/notifications")}>
            Ver todas las notificaciones
          </button>
        </div>
      )}
    </div>
  );
}

function NotificationItem({ notification, onClick }) {
  const isUnread = !notification.readAt;

  // Mapeo de iconos por kind
  const iconMap = {
    EVENT_REMINDER: CalendarCheck,
    INVITE: UserPlus,
    SYSTEM: Info,
  };

  const Icon = iconMap[notification.kind] || Bell;

  return (
    <div
      onClick={onClick}
      className={clsx("notification-item", isUnread && "unread")}
    >
      <div className="icon">
        <Icon className="w-4 h-4" />
      </div>
      <div className="content">
        <p className="title">{notification.title}</p>
        {notification.body && <p className="body">{notification.body}</p>}
        <p className="time">
          {formatDistanceToNow(new Date(notification.createdAt))}
        </p>
      </div>
      {isUnread && <div className="unread-dot" />}
    </div>
  );
}
```

### 6.4 Página Completa de Notificaciones

**Archivo**: `front/src/features/notifications/NotificationCenterPage.jsx`

```javascript
import React, { useState } from "react";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import { useNotifications } from "../../lib/hooks/useNotifications";
import { notificationService } from "../../lib/services/notificationService";
import { Button } from "../../shared/ui/Button";
import { Bell, Check, Trash2, Filter } from "lucide-react";

export function NotificationCenterPage() {
  const { activeGroup, profile } = useWorkspace();
  const {
    data: notifications = [],
    unreadCount,
    refetch,
  } = useNotifications(activeGroup?.$id, profile?.$id);

  const [filter, setFilter] = useState("all"); // all | unread | read

  const filteredNotifications = notifications.filter((n) => {
    if (filter === "unread") return !n.readAt;
    if (filter === "read") return !!n.readAt;
    return true;
  });

  const handleMarkAllAsRead = async () => {
    await notificationService.markAllAsRead(activeGroup.$id, profile.$id);
    refetch();
  };

  const handleDelete = async (notificationId) => {
    await notificationService.deleteNotification(notificationId);
    refetch();
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Notificaciones</h1>
          <p className="text-muted">
            {unreadCount > 0 ? `${unreadCount} sin leer` : "Todo al día"}
          </p>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            leftIcon={<Filter />}
            onClick={() => {
              /* Toggle filter dropdown */
            }}
          >
            Filtrar
          </Button>
          <Button
            variant="outline"
            leftIcon={<Check />}
            onClick={handleMarkAllAsRead}
            disabled={unreadCount === 0}
          >
            Marcar todas leídas
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {filteredNotifications.map((notification) => (
          <NotificationCard
            key={notification.$id}
            notification={notification}
            onDelete={() => handleDelete(notification.$id)}
          />
        ))}

        {filteredNotifications.length === 0 && (
          <div className="text-center py-12">
            <Bell className="w-12 h-12 mx-auto text-muted mb-4" />
            <p className="text-muted">No hay notificaciones</p>
          </div>
        )}
      </div>
    </div>
  );
}
```

---

## 7. Tipos de Notificaciones

### 7.1 EVENT_REMINDER

**Cuándo**: X minutos antes de un evento (configurado en `event_reminders`)

**Canales**:

- ✅ In-app (siempre)
- ✅ Email (si habilitado)
- ✅ Push (alta prioridad)

**Ejemplo**:

```json
{
  "kind": "EVENT_REMINDER",
  "title": "Recordatorio: Reunión con cliente",
  "body": "El evento comienza en 15 minutos",
  "entityType": "events",
  "entityId": "event123",
  "metadata": {
    "eventStartTime": "2026-01-05T15:00:00Z",
    "calendarName": "Trabajo",
    "location": "Oficina central"
  }
}
```

### 7.2 INVITE

**Cuándo**: Alguien invita al usuario a un espacio

**Canales**:

- ✅ In-app
- ✅ Email (siempre - crítico)
- ✅ Push

**Ejemplo**:

```json
{
  "kind": "INVITE",
  "title": "Invitación a Equipo Marketing",
  "body": "Juan Pérez te invitó a unirte al espacio Equipo Marketing como Editor",
  "entityType": "group_invitations",
  "entityId": "invitation123",
  "metadata": {
    "inviterName": "Juan Pérez",
    "groupName": "Equipo Marketing",
    "roleName": "Editor",
    "inviteLink": "https://app.com/invite/token123"
  }
}
```

### 7.3 SYSTEM

**Cuándo**: Cambios en eventos, calendarios, permisos, etc.

**Canales**:

- ✅ In-app
- ❌ Email (generalmente no)
- ⚠️ Push (solo si es urgente)

**Ejemplos**:

```json
// Evento actualizado
{
  "kind": "SYSTEM",
  "title": "Actualización: Reunión movida",
  "body": "El evento 'Reunión con cliente' cambió de 3:00 PM a 4:00 PM",
  "entityType": "events",
  "entityId": "event123"
}

// Evento cancelado
{
  "kind": "SYSTEM",
  "title": "Evento cancelado",
  "body": "El evento 'Workshop de React' ha sido cancelado",
  "entityType": "events",
  "entityId": "event456"
}

// Nuevo rol asignado
{
  "kind": "SYSTEM",
  "title": "Nuevo rol asignado",
  "body": "Ahora eres Administrador en Equipo Marketing",
  "entityType": "user_roles",
  "entityId": "role789"
}
```

### 7.4 Futuros Tipos (Roadmap)

- **MENTION**: Alguien te menciona en comentarios
- **SHARE**: Alguien comparte un calendario contigo
- **RECURRING_EVENT**: Recordatorio de evento recurrente
- **DIGEST**: Resumen diario/semanal de eventos

---

## 8. Roadmap de Implementación

### Phase 1: In-App Notifications (Realtime) ✅ Prioritario

**Tiempo estimado**: 1-2 días

**Tareas**:

1. ✅ Crear `notificationService.js`
2. ✅ Crear `useNotifications.js` hook con Realtime
3. ✅ Actualizar `AppShell.jsx` (quitar mock data)
4. ✅ Crear `NotificationCenterPage.jsx`
5. ✅ Agregar ruta `/notifications` en router
6. ✅ Testing básico

**Resultado**: Notificaciones funcionando en tiempo real dentro de la app.

---

### Phase 2: Email Notifications

**Tiempo estimado**: 1 día

**Tareas**:

1. ✅ SMTP ya configurado en `invite-to-group`
2. Crear templates HTML para emails de notificaciones
3. Actualizar `send-notification` para enviar emails
4. Respetar `user_settings.emailNotificationsEnabled`
5. Testing con emails reales

**Resultado**: Usuarios reciben emails cuando están offline.

---

### Phase 3: Firebase Cloud Messaging (Push)

**Tiempo estimado**: 2-3 días

**Tareas**:

1. Crear proyecto Firebase
2. Configurar Firebase en frontend (`firebase.js`)
3. Crear Service Worker (`firebase-messaging-sw.js`)
4. Implementar solicitud de permisos
5. Guardar FCM tokens en `push_subscriptions`
6. Actualizar `send-notification` para enviar via FCM
7. Testing en navegador y PWA
8. Testing en segundo plano (app cerrada)

**Resultado**: Usuarios reciben notificaciones push incluso con app cerrada.

---

### Phase 4: Webhooks y Notificaciones Automáticas

**Tiempo estimado**: 2 días

**Tareas**:

1. Crear función `event-update-webhook`
2. Configurar webhook en colección `events`
3. Actualizar `cron-generate-reminders` para usar `send-notification`
4. Agregar notificaciones en otras acciones (asignar rol, etc.)
5. Testing end-to-end

**Resultado**: Notificaciones automáticas en todas las acciones relevantes.

---

### Phase 5: Optimizaciones y UX

**Tiempo estimado**: 1-2 días

**Tareas**:

1. Agregar sonidos de notificación
2. Implementar badges (número de no leídas)
3. Notificaciones agrupadas (ej: "3 nuevos eventos")
4. Filtros avanzados en NotificationCenter
5. Preferencias granulares (notificar solo eventos importantes)
6. Animaciones y transiciones
7. Dark mode compatibility

**Resultado**: Experiencia de usuario pulida y profesional.

---

## 9. Testing y Validación

### 9.1 Testing In-App Notifications

**Escenario 1**: Usuario A invita a Usuario B

- [ ] Usuario B recibe notificación en tiempo real (sin refresh)
- [ ] Badge de notificaciones se actualiza
- [ ] Click en notificación navega a `/invite/[token]`
- [ ] Marcar como leída funciona

**Escenario 2**: Recordatorio de evento

- [ ] 15 min antes del evento, notificación aparece
- [ ] Notificación muestra título y hora del evento
- [ ] Click navega al evento

### 9.2 Testing Email Notifications

**Escenario 1**: Email de invitación

- [ ] Email recibido en inbox (no spam)
- [ ] Contenido HTML renderiza correctamente
- [ ] Link de invitación funciona
- [ ] Respeta `emailNotificationsEnabled=false`

**Escenario 2**: Email de recordatorio

- [ ] Email recibido X minutos antes
- [ ] Incluye detalles del evento
- [ ] Link al evento funciona

### 9.3 Testing Push Notifications

**Escenario 1**: Permiso denegado

- [ ] App funciona normalmente
- [ ] No se intenta enviar push
- [ ] UI muestra estado de permiso

**Escenario 2**: Push con app abierta (foreground)

- [ ] Notificación aparece en OS
- [ ] Click abre la app en la URL correcta

**Escenario 3**: Push con app cerrada (background)

- [ ] Notificación aparece
- [ ] Click abre la app
- [ ] Service Worker funciona

**Escenario 4**: Token inválido

- [ ] Suscripción se marca como `isActive=false`
- [ ] No se reintenta envío

### 9.4 Testing Multi-Device

- [ ] Usuario con 3 dispositivos recibe push en todos
- [ ] Marcar como leída en Device A sincroniza con Device B (Realtime)
- [ ] Logout invalida suscripciones del dispositivo

---

## 10. Variables de Entorno

### Backend (Appwrite Functions)

```bash
# .env en todas las functions
APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key
APPWRITE_DATABASE_ID=your_db_id

# Solo en send-notification
FIREBASE_SERVER_KEY=AAAAxxxxxx...
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=noreply@agendapro.com
SMTP_PASSWORD=your_password
```

### Frontend

```bash
# .env
VITE_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
VITE_APPWRITE_PROJECT_ID=your_project_id
VITE_APPWRITE_DATABASE_ID=your_db_id
VITE_APPWRITE_NOTIFICATIONS_COLLECTION_ID=notifications

# Firebase
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_AUTH_DOMAIN=agenda-pro.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=agenda-pro
VITE_FIREBASE_STORAGE_BUCKET=agenda-pro.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:abc123
VITE_FIREBASE_VAPID_PUBLIC_KEY=BNxxxxxx...
```

---

## 11. Recursos y Referencias

### Appwrite

- [Appwrite Realtime Docs](https://appwrite.io/docs/realtime)
- [Appwrite Functions](https://appwrite.io/docs/functions)
- [Appwrite Webhooks](https://appwrite.io/docs/webhooks)

### Firebase

- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [FCM Web Setup](https://firebase.google.com/docs/cloud-messaging/js/client)
- [Service Worker Guide](https://firebase.google.com/docs/cloud-messaging/js/receive)

### Web APIs

- [Notification API](https://developer.mozilla.org/en-US/docs/Web/API/Notifications_API)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

---

## Notas Finales

- **Permisos**: Siempre pedir permisos de notificación de forma contextual, no en el primer load
- **Fallback**: Si push falla, siempre tener in-app + email como backup
- **Privacy**: Nunca enviar contenido sensible en push (solo títulos genéricos)
- **Batching**: Agrupar notificaciones similares para no spam
- **Cleanup**: Eliminar notificaciones viejas (>30 días) con cron job
- **Testing**: Siempre probar en diferentes navegadores (Chrome, Firefox, Safari tienen diferencias)

**Status**: 📝 Documento de planificación - Pendiente implementación
