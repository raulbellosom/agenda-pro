# 🚨 CONFIGURACIÓN URGENTE - Notificaciones Push

## Problema Actual

Las notificaciones push de Firebase NO se están enviando porque la función `send-push-notification` NO está configurada para recibir eventos de Appwrite.

## ✅ Solución - Configurar el Trigger de Eventos

### Paso 1: Ir a la Consola de Appwrite

1. Ve a: https://appwrite.racoondevs.com/console
2. Selecciona el proyecto `Agenda Pro` (ID: `693c22770010b1d271c3`)
3. Ve a **Functions** en el menú lateral
4. Busca la función `send-push-notification` (ID: `695dd5c800393c7b6b26`)

### Paso 2: Configurar el Trigger de Eventos

1. Click en la función `send-push-notification`
2. Ve a la pestaña **Settings**
3. En la sección **Events**, asegúrate de tener configurado:

```
databases.695322a500102a008edb.collections.6953a80900040a88d2a3.documents.*.create
```

**Explicación:**

- `databases.695322a500102a008edb` = Tu database ID
- `collections.6953a80900040a88d2a3` = Collection de NOTIFICATIONS
- `documents.*.create` = Cuando se CREA cualquier documento

### Paso 3: Verificar Otras Configuraciones

En la misma pantalla de Settings, verifica:

- **Timeout**: 30 segundos (mínimo)
- **Execute Access**: `any` (para que se ejecute automáticamente)
- **Enabled**: ✅ Activado

### Paso 4: Verificar Variables de Entorno

Ve a la pestaña **Environment Variables** y asegúrate de tener:

```bash
APPWRITE_ENDPOINT=https://appwrite.racoondevs.com/v1
APPWRITE_PROJECT_ID=693c22770010b1d271c3
APPWRITE_API_KEY=<tu_api_key_con_permisos_completos>

APPWRITE_DATABASE_ID=695322a500102a008edb

COLLECTION_PUSH_SUBSCRIPTIONS_ID=6953ab7d003b54afb9c4
COLLECTION_NOTIFICATIONS_ID=6953a80900040a88d2a3

FIREBASE_PROJECT_ID=agendapro-cbcd2
FIREBASE_PRIVATE_KEY=<tu_clave_privada_de_firebase>
FIREBASE_CLIENT_EMAIL=<tu_email_de_service_account>

APP_URL=https://tu-dominio.com
```

## 🔍 Cómo Obtener las Credenciales de Firebase

### Opción 1: Desde Firebase Console (RECOMENDADO)

1. Ve a: https://console.firebase.google.com/
2. Selecciona el proyecto `agendapro-cbcd2`
3. Click en el ícono de ⚙️ → **Project Settings**
4. Ve a la pestaña **Service Accounts**
5. Click en **Generate New Private Key**
6. Se descargará un archivo JSON

Del archivo JSON descargado, copia:

- `project_id` → `FIREBASE_PROJECT_ID`
- `private_key` → `FIREBASE_PRIVATE_KEY` (incluye TODO, incluyendo `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`)
- `client_email` → `FIREBASE_CLIENT_EMAIL`

### Opción 2: Usar el Comando de Firebase CLI

```bash
firebase init
firebase projects:list
```

## 🧪 Testing

### Test 1: Verificar que la función se ejecute

1. Crea una notificación manualmente desde la consola de Appwrite:

   - Ve a **Databases** → Tu database → Collection `notifications`
   - Click en **Add Document**
   - Agrega:
     ```json
     {
       "profileId": "<tu_profile_id>",
       "groupId": "<algun_group_id>",
       "kind": "SYSTEM",
       "title": "Test de Push",
       "body": "Esta es una notificación de prueba",
       "entityType": "test",
       "entityId": "test123",
       "enabled": true
     }
     ```

2. Ve a la función `send-push-notification` → **Executions**
3. Deberías ver una nueva ejecución automática
4. Click en ella para ver los logs

### Test 2: Verificar desde la App

1. Abre la aplicación en el navegador
2. Asegúrate de que Firebase esté inicializado (revisa la consola del navegador)
3. Acepta los permisos de notificaciones cuando se te pidan
4. Crea una invitación a un grupo
5. Deberías ver:
   - Notificación in-app (toast + sonido)
   - Push notification del navegador
   - Badge de notificaciones actualizado

## ⚠️ Problemas Comunes

### "La función no se ejecuta"

**Causa**: El evento no está configurado correctamente

**Solución**:

- Verifica que el patrón del evento coincida EXACTAMENTE con tu database ID y collection ID
- El formato debe ser: `databases.[DATABASE_ID].collections.[COLLECTION_ID].documents.*.create`

### "Firebase error: Invalid credentials"

**Causa**: Las credenciales de Firebase están mal configuradas

**Solución**:

- Regenera la clave privada desde Firebase Console
- Asegúrate de copiar TODO el contenido, incluyendo los saltos de línea
- En Appwrite, pega la clave CON las comillas: `"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"`

### "No push subscriptions found"

**Causa**: El usuario no ha registrado su token FCM

**Solución**:

- Asegúrate de que el usuario haya aceptado permisos de notificaciones
- Revisa la consola del navegador para ver si hay errores de Firebase
- Verifica que `useNotifications.js` esté registrando el token correctamente

### "Token inválido"

**Causa**: El token FCM expiró o es inválido

**Solución**:

- La función automáticamente marca tokens inválidos como `isActive: false`
- El usuario debe volver a aceptar permisos de notificaciones
- Se generará un nuevo token automáticamente

## 📊 Monitoreo

Para monitorear el funcionamiento:

1. **Logs de la función**: Ve a Appwrite Console → Functions → send-push-notification → Executions
2. **Console del navegador**: Abre DevTools → Console para ver logs de FCM
3. **Network tab**: Revisa las peticiones a Firebase para ver si se están enviando

## 🔐 Permisos de la Colección Notifications

**IMPORTANTE**: La colección de notificaciones debe tener permisos que permitan:

1. **Create**:

   - Cualquier función con API Key puede crear notificaciones
   - Usuarios autenticados pueden crear sus propias notificaciones (opcional)

2. **Read**:

   - Cada usuario puede leer sus propias notificaciones: `read("user:[profileId]")`
   - **PROBLEMA ACTUAL**: Los usuarios invitados no pueden leer notificaciones de grupos a los que NO pertenecen

3. **Update**:
   - Cada usuario puede actualizar sus propias notificaciones: `update("user:[profileId]")`

### Solución al Problema de Permisos

Tenemos dos opciones:

#### Opción A: Usar el Account ID en vez del Profile ID

Cambiar las notificaciones para usar `accountId` (el ID de Appwrite Auth) en vez de `profileId`. Así los permisos `read("user:[accountId]")` funcionarán automáticamente.

#### Opción B: Crear una función intermedia

Crear una función que maneje el `markAsRead` con API Key, evitando el problema de permisos del frontend.

**RECOMENDACIÓN**: Implementar Opción A para simplificar y evitar problemas futuros.

---

## 📝 Checklist de Configuración

- [ ] Función `send-push-notification` desplegada en Appwrite
- [ ] Evento configurado: `databases.*.collections.[NOTIFICATIONS_ID].documents.*.create`
- [ ] Variables de entorno de Appwrite configuradas
- [ ] Variables de entorno de Firebase configuradas
- [ ] Permisos de la colección `notifications` correctos
- [ ] Permisos de la colección `push_subscriptions` correctos
- [ ] Frontend configurado con Firebase (VAPID key, etc.)
- [ ] Service Worker registrado (`firebase-messaging-sw.js`)
- [ ] Tested: Crear notificación → Se ejecuta función → Se envía push

---

## 🆘 Si nada funciona

1. Revisa los logs de ejecución de la función en Appwrite Console
2. Revisa la consola del navegador para errores de Firebase
3. Verifica que el usuario tenga tokens FCM guardados en `push_subscriptions`
4. Prueba crear una notificación manualmente desde Appwrite Console
5. Verifica que Firebase tenga configurado Cloud Messaging habilitado
