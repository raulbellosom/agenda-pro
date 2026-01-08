# 🔄 Flujo de Notificaciones - Diagrama Completo

## 📊 Arquitectura del Sistema de Notificaciones

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         SISTEMA DE NOTIFICACIONES                        │
│                                                                          │
│  Frontend (React)          Appwrite Backend         Firebase            │
│  ─────────────────         ───────────────────      ────────            │
│                                                                          │
│  1. Acción del Usuario                                                   │
│     - Invitar a grupo                                                    │
│     - Aceptar invitación                                                 │
│     - Rechazar invitación                                                │
│     - Abandonar grupo                                                    │
│           │                                                              │
│           ▼                                                              │
│  2. Llamada a Función                                                    │
│     o Servicio                                                           │
│           │                                                              │
│           ▼                                                              │
│  ┌────────────────────┐                                                  │
│  │  Appwrite Function │                                                  │
│  │  o groupService.js │                                                  │
│  └────────────────────┘                                                  │
│           │                                                              │
│           ▼                                                              │
│  3. Crear Documento en                                                   │
│     collection "notifications"                                           │
│     con accountId ✨ NUEVO                                               │
│           │                                                              │
│           ├─────────────────────────┬──────────────────────┐             │
│           ▼                         ▼                      ▼             │
│  4a. Trigger Realtime       4b. Trigger Event      4c. Permisos         │
│                                                     accountId ✨          │
│      ┌──────────┐              ┌───────────────┐                        │
│      │ Frontend │              │ send-push-    │   Usuario puede:        │
│      │ Subscrito│              │ notification  │   - Leer sus notifs     │
│      └──────────┘              │ Function      │   - Actualizar sus      │
│           │                    └───────────────┘     notifs (readAt)     │
│           ▼                            │                                 │
│  5a. useNotifications                  ▼                                 │
│      detecta cambio            5b. Obtener tokens FCM                    │
│           │                         del usuario                          │
│           ▼                            │                                 │
│  6a. Actualiza UI:                     ▼                                 │
│      - Toast ✅                5c. Enviar a Firebase                     │
│      - Sonido 🔔                   Cloud Messaging                       │
│      - Badge 🔴                        │                                 │
│      - Lista de notifs                 ▼                                 │
│           │                    ┌─────────────────┐                       │
│           ▼                    │ Firebase FCM    │                       │
│  7a. Usuario hace click        └─────────────────┘                       │
│      en notificación                   │                                 │
│           │                            ▼                                 │
│           ▼                    6b. Push Notification                     │
│  8a. markAsRead()                  enviada al navegador                  │
│      (actualiza readAt)                │                                 │
│           │                            ▼                                 │
│           ▼                    7b. Usuario ve push                       │
│  9a. Actualización                 (incluso con app                      │
│      realtime automática           cerrada) 🌐                           │
│      (por permisos                     │                                 │
│       accountId)                       ▼                                 │
│                                8b. Click en push                         │
│                                    → Abre la app                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 🎯 Flujos Específicos por Tipo de Notificación

### 1️⃣ Invitación a Grupo

```
Usuario A (Invitador)                     Usuario B (Invitado)
──────────────────                        ────────────────────

1. Click "Invitar"
   │
   ▼
2. Función invite-to-group
   │
   ├─ Crea invitation
   │
   └─ Crea notification
       - profileId: B                     ← Usuario B
       - accountId: B.accountId ✨        ← Permisos
       - kind: INVITE
       - groupId: G
       │
       ├──────────────────────────────────▶ 3. Realtime event
       │                                      │
       │                                      ▼
       └─────────────────────────────────▶ 4. Push FCM
                                              │
                                              ▼
                                          5. Usuario B ve:
                                             - Toast ✅
                                             - Sonido 🔔
                                             - Push 🌐
                                             - Badge +1 🔴
                                              │
                                              ▼
                                          6. Click en notif
                                              │
                                              ▼
                                          7. markAsRead()
                                             (funciona por
                                              accountId ✨)
                                              │
                                              ▼
                                          8. Badge -1 🔴
```

### 2️⃣ Aceptar Invitación

```
Usuario B (Acepta)                        Usuario A (Invitador)
──────────────                            ─────────────────────

1. Click "Aceptar"
   │
   ▼
2. Función accept-invitation
   │
   ├─ Crea group_member
   │
   ├─ Actualiza invitation → ACCEPTED
   │
   └─ Crea notification
       - profileId: A                     ← Usuario A
       - accountId: A.accountId ✨        ← Permisos
       - kind: SYSTEM
       - title: "Invitación aceptada"
       │
       ├──────────────────────────────────▶ 3. Realtime event
       │                                      │
       │                                      ▼
       └─────────────────────────────────▶ 4. Push FCM
                                              │
                                              ▼
                                          5. Usuario A ve:
                                             - Toast ✅
                                             - Sonido 🔔
                                             - Push 🌐
                                             - Badge +1 🔴
```

### 3️⃣ Rechazar Invitación

```
Usuario B (Rechaza)                       Usuario A (Invitador)
───────────────────                       ─────────────────────

1. Click "Rechazar"
   │
   ▼
2. Función accept-invitation
   │
   ├─ Actualiza invitation → REJECTED
   │
   └─ Crea notification
       - profileId: A                     ← Usuario A
       - accountId: A.accountId ✨        ← Permisos
       - kind: SYSTEM
       - title: "Invitación rechazada"
       │
       ├──────────────────────────────────▶ 3. Realtime event
       │                                      │
       │                                      ▼
       └─────────────────────────────────▶ 4. Push FCM
                                              │
                                              ▼
                                          5. Usuario A ve:
                                             - Toast ✅
                                             - Sonido 🔔
                                             - Push 🌐
```

### 4️⃣ Abandono de Grupo

```
Usuario B (Miembro)                       Usuario A (Owner)
───────────────────                       ─────────────────

1. Click "Abandonar grupo"
   │
   ▼
2. groupService.leaveGroup()
   │
   ├─ Soft delete group_member
   │
   ├─ Desactiva calendarios
   │
   └─ Crea notification
       - profileId: A                     ← Owner
       - accountId: A.accountId ✨        ← Permisos
       - kind: SYSTEM
       - title: "Miembro abandonó..."
       │
       ├──────────────────────────────────▶ 3. Realtime event
       │                                      │
       │                                      ▼
       └─────────────────────────────────▶ 4. Push FCM
                                              │
                                              ▼
                                          5. Owner ve:
                                             - Toast ✅
                                             - Sonido 🔔
                                             - Push 🌐
                                             - Badge +1 🔴
```

---

## 🔑 El Rol del accountId

### ❌ ANTES (No funcionaba)

```
Notification Document:
{
  "$id": "notif_123",
  "profileId": "profile_xyz",  ← Solo esto
  "groupId": "group_abc",
  "title": "Invitación...",
  ...
}

Permisos de la colección:
- read("user:{profileId}")     ← ❌ Appwrite no sabe qué es profileId
- update("user:{profileId}")   ← ❌ No funciona

Resultado:
❌ Usuario invitado NO puede leer la notificación
❌ Usuario invitado NO puede marcarla como leída
❌ Realtime NO funciona hasta que sea miembro del grupo
```

### ✅ AHORA (Funciona)

```
Notification Document:
{
  "$id": "notif_123",
  "profileId": "profile_xyz",
  "accountId": "account_123",  ← ✨ NUEVO - ID de Appwrite Auth
  "groupId": "group_abc",
  "title": "Invitación...",
  ...
}

Permisos de la colección:
- read("user:{accountId}")     ← ✅ Appwrite entiende accountId
- update("user:{accountId}")   ← ✅ Funciona perfectamente

Resultado:
✅ Usuario invitado PUEDE leer sus notificaciones
✅ Usuario invitado PUEDE marcarlas como leídas
✅ Realtime funciona INMEDIATAMENTE
✅ Funciona incluso si NO es miembro del grupo aún
```

---

## 🚀 Trigger de send-push-notification

### Configuración del Evento

```
Event Pattern:
databases.695322a500102a008edb.collections.6953a80900040a88d2a3.documents.*.create
│         │                        │          │                    │       │  │
│         └─ Database ID           └─ Collections                 │       │  └─ Action
└─ Resource type                      └─ Notifications Collection  │       └─ Any document
                                                                   └─ Documents
```

### Flujo del Trigger

```
1. Notification creada
   │
   ▼
2. Appwrite detecta evento
   (match con el pattern)
   │
   ▼
3. Ejecuta send-push-notification
   │
   ├─ Lee la notification del payload
   │
   ├─ Query: Obtiene push_subscriptions
   │   WHERE profileId = notification.profileId
   │   AND isActive = true
   │
   ├─ Para cada subscription:
   │   │
   │   ├─ Extrae FCM token
   │   │
   │   ├─ Construye mensaje FCM
   │   │   - notification.title
   │   │   - notification.body
   │   │   - data metadata
   │   │
   │   ├─ Envía a Firebase
   │   │
   │   ├─ Si success:
   │   │   └─ Actualiza lastUsedAt
   │   │
   │   └─ Si error (token inválido):
   │       └─ Marca isActive = false
   │
   └─ Retorna summary:
       - sent: X
       - failed: Y
```

---

## 🎨 UI/UX Flow

```
┌────────────────────────────────────────────────────────────┐
│                    Navegador del Usuario                   │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │                    App React                         │ │
│  │                                                      │ │
│  │  ┌────────────────────────────────────────────────┐ │ │
│  │  │  NotificationProvider                          │ │ │
│  │  │  - useNotifications hook                       │ │ │
│  │  │  - Realtime subscription ⚡                    │ │ │
│  │  └────────────────────────────────────────────────┘ │ │
│  │         │                                            │ │
│  │         ├─ Toast (react-toastify) 📬                │ │
│  │         │  └─ Muestra título + mensaje              │ │
│  │         │                                            │ │
│  │         ├─ Audio (<audio> tag) 🔔                   │ │
│  │         │  └─ Reproduce /sounds/notification.mp3    │ │
│  │         │                                            │ │
│  │         ├─ Browser Notification API 🌐              │ │
│  │         │  └─ new Notification(...)                 │ │
│  │         │                                            │ │
│  │         └─ UI Updates                                │ │
│  │            ├─ Badge counter (+1) 🔴                  │ │
│  │            └─ Notification list refresh              │ │
│  │                                                      │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  ┌──────────────────────────────────────────────────────┐ │
│  │           Service Worker                             │ │
│  │           firebase-messaging-sw.js                   │ │
│  │                                                      │ │
│  │  - Escucha mensajes FCM en background               │ │
│  │  - Muestra push notifications                       │ │
│  │  - Maneja clicks en push                            │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

---

## 🔒 Seguridad y Permisos

### Matriz de Permisos

| Colección              | Read                       | Create              | Update                       | Delete              |
| ---------------------- | -------------------------- | ------------------- | ---------------------------- | ------------------- |
| **notifications**      | `read("user:{accountId}")` | API Key (funciones) | `update("user:{accountId}")` | N/A                 |
| **push_subscriptions** | `read("user:{profileId}")` | Usuario autenticado | Usuario autenticado          | Usuario autenticado |

### Por qué usar accountId en notifications

```
Usuario autenticado en Appwrite:
- accountId: "64a1b2c3d4e5f6g7h8i9"     ← Conocido por Appwrite Auth
- profileId: "profile_xyz123"           ← Solo en nuestra base de datos

Cuando el usuario hace una petición:
- Appwrite sabe: accountId
- Appwrite NO sabe automáticamente: profileId

Por eso los permisos deben usar accountId:
- read("user:{accountId}") ✅ Funciona
- read("user:{profileId}") ❌ No funciona (Appwrite no resuelve esto)
```

---

## 📱 Push Notifications - Estados

```
Estado 1: App Abierta (Foreground)
──────────────────────────────────
Notificación creada
    │
    ├─▶ Realtime event
    │   └─ useNotifications detecta
    │      └─ Toast + Sonido ✅
    │
    └─▶ FCM message
        └─ listenToForegroundMessages
           └─ Toast adicional (opcional)


Estado 2: App en Background
───────────────────────────
Notificación creada
    │
    └─▶ FCM message
        └─ Service Worker recibe
           └─ Browser push notification 🌐
              └─ Click → Abre app


Estado 3: App Cerrada
─────────────────────
Notificación creada
    │
    └─▶ FCM message
        └─ Service Worker recibe
           └─ Browser push notification 🌐
              └─ Click → Abre app en /notifications
```

---

## 🐛 Puntos de Falla y Soluciones

### Problema: Notificaciones no llegan en tiempo real

**Causas posibles:**

1. ❌ Falta campo `accountId` en la notificación
2. ❌ Permisos incorrectos en la colección
3. ❌ Usuario no está autenticado
4. ❌ Subscripción de Realtime no está activa

**Debugging:**

```javascript
// En DevTools Console
client.subscribe("databases.*.collections.*.documents", (response) => {
  console.log("Realtime event:", response);
});
```

### Problema: Push notifications no funcionan

**Causas posibles:**

1. ❌ Trigger no configurado en Appwrite
2. ❌ Variables de Firebase incorrectas
3. ❌ Usuario no tiene tokens FCM guardados
4. ❌ Tokens expirados/inválidos

**Debugging:**

```
1. Appwrite Console → Functions → send-push-notification → Executions
   - ¿Hay ejecuciones?
   - ¿Qué dicen los logs?

2. Databases → push_subscriptions
   - ¿Hay tokens para el usuario?
   - ¿isActive = true?

3. DevTools Console
   - ¿FCM token se obtiene?
   - ¿Hay errores de Firebase?
```

### Problema: No se puede marcar como leída

**Causas posibles:**

1. ❌ Falta `accountId` en la notificación
2. ❌ Permisos de update incorrectos
3. ❌ Usuario no autenticado

**Debugging:**

```javascript
// En DevTools Console
try {
  await databases.updateDocument(
    databaseId,
    notificationsCollectionId,
    notificationId,
    { readAt: new Date().toISOString() }
  );
  console.log("✅ Actualización exitosa");
} catch (error) {
  console.error("❌ Error:", error.message);
}
```

---

## ✅ Checklist de Funcionamiento Correcto

- [x] Notificación creada tiene campo `accountId`
- [x] Permisos de colección usan `user:{accountId}`
- [x] Trigger de send-push-notification configurado
- [x] Variables de Firebase correctas
- [x] Realtime subscription activa en el frontend
- [x] Service Worker registrado
- [x] Usuario tiene permisos de notificaciones del navegador
- [x] Tokens FCM guardados en push_subscriptions
- [x] Funciones backend desplegadas con código actualizado
- [x] Frontend desplegado con código actualizado

Si TODOS los puntos están ✅, el sistema debería funcionar perfectamente! 🎉
