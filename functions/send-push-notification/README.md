# Send Push Notification Function

Esta función de Appwrite envía notificaciones push a través de Firebase Cloud Messaging (FCM) cuando se crea una nueva notificación en la base de datos.

## 📋 Descripción

La función se activa automáticamente cuando se crea un nuevo documento en la colección de notificaciones. Lee los tokens FCM almacenados para el usuario y envía una notificación push a todos sus dispositivos registrados.

## 🔧 Configuración

### 1. Variables de Entorno

Copia `.env.example` a `.env` y configura:

```bash
# Appwrite
APPWRITE_ENDPOINT=https://appwrite.racoondevs.com/v1
APPWRITE_PROJECT_ID=your_project_id
APPWRITE_API_KEY=your_api_key_with_full_access

# Database
APPWRITE_DATABASE_ID=your_database_id

# Collections
COLLECTION_PUSH_SUBSCRIPTIONS_ID=your_push_subscriptions_collection_id
COLLECTION_NOTIFICATIONS_ID=your_notifications_collection_id

# Firebase
FIREBASE_PROJECT_ID=your_firebase_project_id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com

# App
APP_URL=https://your-app-url.com
```

### 2. Obtener Credenciales de Firebase

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Project Settings** (⚙️) → **Service Accounts**
4. Click en **Generate New Private Key**
5. Se descargará un archivo JSON con:
   - `project_id` → `FIREBASE_PROJECT_ID`
   - `private_key` → `FIREBASE_PRIVATE_KEY`
   - `client_email` → `FIREBASE_CLIENT_EMAIL`

### 3. Crear la Función en Appwrite

#### Opción A: Desde la Consola de Appwrite

1. Ve a **Functions** en tu proyecto de Appwrite
2. Click en **Create Function**
3. Nombre: `send-push-notification`
4. Runtime: `Node.js 18.0`
5. Trigger: **Event**
6. Events: `databases.*.collections.[NOTIFICATIONS_COLLECTION_ID].documents.*.create`
7. Sube el código desde esta carpeta

#### Opción B: Usando Appwrite CLI

```bash
cd functions/send-push-notification
appwrite init function
appwrite deploy function
```

### 4. Configurar el Trigger

La función debe configurarse para ejecutarse cuando se **crea** un documento en la colección de **notificaciones**:

- **Event Pattern**: `databases.*.collections.[YOUR_NOTIFICATIONS_COLLECTION_ID].documents.*.create`
- **Timeout**: 30 segundos
- **Execute Access**: `any` (la función se ejecuta automáticamente)

## 🚀 Flujo de Trabajo

1. **Se crea una notificación** en la base de datos (por ejemplo, desde `invite-to-group`)
2. **Appwrite dispara el evento** automáticamente
3. **Esta función se ejecuta**:
   - Lee la notificación del evento
   - Busca todos los tokens FCM del usuario
   - Envía push a cada dispositivo vía Firebase
   - Marca tokens inválidos como inactivos
   - Actualiza `lastUsedAt` de tokens válidos

## 📝 Estructura de la Notificación

La función espera que la notificación tenga estos campos:

```javascript
{
  "$id": "notification_id",
  "profileId": "user_profile_id",     // Requerido
  "groupId": "group_id",              // Opcional
  "kind": "INVITE",                   // INVITE|EVENT_REMINDER|SYSTEM
  "title": "Invitación a Equipo",     // Requerido
  "body": "Has sido invitado...",     // Opcional
  "entityType": "group_invitations",  // Opcional
  "entityId": "invitation_id",        // Opcional
  "metadata": "{...}",                // Opcional JSON string
  "createdAt": "2024-01-01T00:00:00Z"
}
```

## 🔐 Permisos Requeridos

La función necesita una API Key con permisos para:

- ✅ Leer documentos de `push_subscriptions`
- ✅ Actualizar documentos de `push_subscriptions` (para marcar tokens inválidos)
- ✅ Leer eventos de la colección de `notifications`

## 🧪 Testing

### Test Manual desde Appwrite Console

1. Ve a la función en Appwrite Console
2. Click en **Execute**
3. Payload de prueba:

```json
{
  "$id": "test_notification_123",
  "profileId": "user_profile_id",
  "groupId": "group_id",
  "kind": "SYSTEM",
  "title": "Test Notification",
  "body": "This is a test push notification",
  "entityType": "test",
  "entityId": "test_123",
  "createdAt": "2024-01-01T00:00:00Z"
}
```

### Test desde el Frontend

Simplemente crea una notificación normalmente:

```javascript
await databases.createDocument(
  databaseId,
  notificationsCollectionId,
  ID.unique(),
  {
    profileId: "user_id",
    groupId: "group_id",
    kind: "SYSTEM",
    title: "Test",
    body: "Testing push",
    enabled: true,
    createdAt: new Date().toISOString()
  }
);
```

La función se ejecutará automáticamente.

## 📊 Logs

Los logs de la función mostrarán:

- ✅ Inicialización de Firebase
- ✅ Notificación procesada
- ✅ Subscripciones encontradas
- ✅ Envíos exitosos/fallidos
- ✅ Tokens marcados como inválidos

## 🐛 Troubleshooting

### "No push subscriptions found"

- Verifica que el usuario haya dado permiso para notificaciones
- Verifica que el token se haya guardado en `push_subscriptions`

### "Firebase initialization failed"

- Verifica las credenciales de Firebase
- Asegúrate de escapar correctamente el `private_key` (debe tener `\n` real, no literal)

### "Token invalid"

- El token ha expirado o fue revocado
- La función automáticamente marcará el token como inactivo

### Notificaciones no llegan

1. Verifica que el Service Worker esté registrado (`/firebase-messaging-sw.js`)
2. Verifica permisos del navegador
3. Revisa los logs de la función en Appwrite
4. Verifica que el evento esté configurado correctamente

## 🔄 Integración con Realtime

Esta función complementa el sistema de Realtime del frontend:

- **Realtime (Appwrite)**: Actualiza la UI instantáneamente cuando el usuario está en la app
- **Push (Firebase)**: Notifica al usuario incluso cuando la app está cerrada/background

Ambos sistemas funcionan en conjunto para una experiencia completa de notificaciones.

## 📦 Dependencias

- `node-appwrite`: Cliente de Appwrite para Node.js
- `firebase-admin`: SDK de Firebase Admin para enviar push

## 🔗 Referencias

- [Appwrite Functions](https://appwrite.io/docs/functions)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)
- [Appwrite Events](https://appwrite.io/docs/events)
