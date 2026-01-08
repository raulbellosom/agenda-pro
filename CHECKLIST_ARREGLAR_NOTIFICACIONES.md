# ✅ CHECKLIST - Arreglar Notificaciones Completo

## 📋 Pre-requisitos

- [x] Acceso a Appwrite Console (https://appwrite.racoondevs.com/console)
- [x] Acceso a Firebase Console (https://console.firebase.google.com/)
- [ ] Appwrite CLI instalado (opcional pero recomendado)
- [x] Node.js y npm instalados

---

## 🔧 PARTE 1: Configuración en Appwrite Console

### Paso 1.1: Agregar campo accountId a notifications

- [x] Ir a Appwrite Console → Databases
- [x] Seleccionar database `695322a500102a008edb`
- [x] Seleccionar collection `notifications` (`6953a80900040a88d2a3`)
- [x] Click en "Attributes" → "Create Attribute"
- [x] Configurar:
  - Type: `String`
  - Key: `accountId`
  - Size: `36`
  - Required: `No` ⚠️ IMPORTANTE
  - Array: `No`
  - Default: `null`
- [x] Click "Create"
- [x] Esperar a que se complete la creación

### Paso 1.2: Actualizar permisos de notifications

- [x] En la misma collection, ir a "Settings" → "Permissions"
- [x] **Read Permissions**:
  - [x] Eliminar cualquier permiso existente tipo `read("user:...")`
  - [x] Click "Add Role"
  - [x] Seleccionar "User (with ID variable)"
  - [x] Escribir en el campo: `accountId`
  - [x] El resultado debe ser: `read("user:{accountId}")`
- [x] **Update Permissions**:
  - [x] Eliminar cualquier permiso existente tipo `update("user:...")`
  - [x] Click "Add Role"
  - [x] Seleccionar "User (with ID variable)"
  - [x] Escribir: `accountId`
  - [x] El resultado debe ser: `update("user:{accountId}")`
- [x] Click "Update"

### Paso 1.3: Configurar trigger de send-push-notification

- [x] Ir a "Functions" en el menú lateral
- [x] Click en función `send-push-notification` (ID: `695dd5c800393c7b6b26`)
- [x] Ir a "Settings"
- [x] En la sección "Events":
  - [x] Click "Add Event"
  - [x] Escribir exactamente: `databases.695322a500102a008edb.collections.6953a80900040a88d2a3.documents.*.create`
  - [x] Verificar que no haya espacios adicionales
- [x] Verificar otras configuraciones:
  - [x] Timeout: `30` segundos (o más)
  - [x] Execute Access: `any`
  - [x] Enabled: ✅ Activado
- [x] Click "Update"

### Paso 1.4: Verificar variables de entorno de send-push-notification

- [x] En la misma función, ir a "Environment Variables"
- [x] Verificar que existan TODAS estas variables:

```
✅ APPWRITE_ENDPOINT = https://appwrite.racoondevs.com/v1
✅ APPWRITE_PROJECT_ID = 693c22770010b1d271c3
✅ APPWRITE_API_KEY = (tu API key con permisos completos)
✅ APPWRITE_DATABASE_ID = 695322a500102a008edb
✅ COLLECTION_PUSH_SUBSCRIPTIONS_ID = 6953ab7d003b54afb9c4
✅ COLLECTION_NOTIFICATIONS_ID = 6953a80900040a88d2a3
✅ FIREBASE_PROJECT_ID = agendapro-cbcd2
✅ FIREBASE_PRIVATE_KEY = (clave privada completa de Firebase)
✅ FIREBASE_CLIENT_EMAIL = (email del service account)
✅ APP_URL = (tu URL de producción)
```

- [x] Si falta alguna, agregarla
- [x] Click "Update" si hiciste cambios

---

## 🚀 PARTE 2: Obtener Credenciales de Firebase (si no las tienes)

### Paso 2.1: Acceder a Firebase Console

- [x] Ir a https://console.firebase.google.com/
- [x] Seleccionar proyecto `agendapro-cbcd2`

### Paso 2.2: Generar Service Account Key

- [x] Click en ⚙️ (Settings) → "Project Settings"
- [x] Ir a la pestaña "Service Accounts"
- [x] Click "Generate New Private Key"
- [x] Confirmar en el modal
- [x] Se descargará un archivo JSON

### Paso 2.3: Extraer credenciales del JSON

Del archivo JSON descargado, copiar:

- [x] `project_id` → Variable `FIREBASE_PROJECT_ID`
- [x] `private_key` → Variable `FIREBASE_PRIVATE_KEY` (incluir TODO, con `-----BEGIN PRIVATE KEY-----` y `-----END PRIVATE KEY-----`)
- [x] `client_email` → Variable `FIREBASE_CLIENT_EMAIL`

### Paso 2.4: Agregar a Appwrite

- [x] Volver a Appwrite Console → Functions → send-push-notification → Environment Variables
- [x] Agregar/actualizar las 3 variables de Firebase
- [x] Click "Update"

---

## 💻 PARTE 3: Redesplegar Funciones Backend

### Opción A: Usando Appwrite CLI (Recomendado)

```bash
# En tu terminal, desde la raíz del proyecto

cd functions/invite-to-group
appwrite deploy function

cd ../accept-invitation
appwrite deploy function

cd ../..
```

- [ ] Ejecutar los comandos anteriores
- [ ] Verificar que se desplieguen sin errores

### Opción B: Upload Manual desde Console

Si no tienes Appwrite CLI:

#### Para invite-to-group:

- [x] Ir a Appwrite Console → Functions → invite-to-group
- [x] Click en "Deployments" → "Create Deployment"
- [x] Seleccionar "Manual" → "Tarball"
- [x] Comprimir la carpeta `functions/invite-to-group` (todo el contenido)
- [x] Subir el archivo .tar.gz
- [x] Esperar a que se active el deployment

#### Para accept-invitation:

- [x] Repetir el proceso para `functions/accept-invitation`

---

## 🌐 PARTE 4: Redesplegar Frontend

### Paso 4.1: Build del frontend

```bash
cd front
npm run build
```

- [x] Ejecutar el comando
- [x] Verificar que el build se complete sin errores

### Paso 4.2: Deploy a tu servidor

Dependiendo de tu hosting (Vercel, Netlify, etc.):

```bash
# Ejemplo para Vercel
vercel --prod

# Ejemplo para hosting propio
scp -r dist/* usuario@servidor:/ruta/
```

- [x] Desplegar el frontend
- [x] Verificar que se acceda correctamente

---

## 🔄 PARTE 5: Migrar Notificaciones Existentes (OPCIONAL)

⚠️ Solo si ya tienes notificaciones en la base de datos

### Paso 5.1: Abrir DevTools en el navegador

- [ ] Abrir tu aplicación en el navegador
- [ ] Presionar F12 para abrir DevTools
- [ ] Ir a la pestaña "Console"

### Paso 5.2: Ejecutar script de migración

- [ ] Copiar el siguiente código:

```javascript
// Script de migración de notificaciones
(async function migrateNotifications() {
  const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
  const notificationsCollectionId = import.meta.env
    .VITE_APPWRITE_COLLECTION_NOTIFICATIONS_ID;
  const usersProfileCollectionId = import.meta.env
    .VITE_APPWRITE_COLLECTION_USERS_PROFILE_ID;

  const { databases } = await import("../shared/appwrite/client");
  const { Query } = await import("appwrite");

  console.log("🔍 Buscando notificaciones sin accountId...");

  const notifications = await databases.listDocuments(
    databaseId,
    notificationsCollectionId,
    [Query.isNull("accountId"), Query.limit(100)]
  );

  console.log(
    `📊 Encontradas ${notifications.documents.length} notificaciones para migrar`
  );

  let success = 0;
  let failed = 0;

  for (const notification of notifications.documents) {
    try {
      const profile = await databases.getDocument(
        databaseId,
        usersProfileCollectionId,
        notification.profileId
      );

      await databases.updateDocument(
        databaseId,
        notificationsCollectionId,
        notification.$id,
        { accountId: profile.accountId }
      );

      success++;
      console.log(
        `✅ [${success}/${notifications.documents.length}] Migrada: ${notification.$id}`
      );
    } catch (error) {
      failed++;
      console.error(`❌ Error migrando ${notification.$id}:`, error.message);
    }
  }

  console.log(
    `\n🎉 Migración completada: ${success} exitosas, ${failed} fallidas`
  );
})();
```

- [ ] Pegar en la consola del navegador
- [ ] Presionar Enter
- [ ] Esperar a que termine (verás el progreso en la consola)

---

## 🧪 PARTE 6: Testing Completo

### Test 6.1: Invitación a Grupo

- [ ] Usuario A invita a Usuario B a un grupo
- [ ] Usuario B debería ver:
  - [ ] Notificación aparece inmediatamente (sin reload) ⚡
  - [ ] Toast con título "Invitación a [Grupo]" 📬
  - [ ] Sonido de notificación 🔔
  - [ ] Push notification del navegador (si está en segundo plano) 🌐
  - [ ] Contador de notificaciones aumenta (+1) 🔴
  - [ ] Click en notificación → se marca como leída ✅

### Test 6.2: Aceptar Invitación

- [ ] Usuario B acepta la invitación
- [ ] Usuario A (quien invitó) debería ver:
  - [ ] Notificación "Invitación aceptada" inmediatamente ⚡
  - [ ] Toast con nombre de Usuario B 📬
  - [ ] Sonido 🔔
  - [ ] Push notification 🌐
  - [ ] Click → se marca como leída ✅

### Test 6.3: Rechazar Invitación

- [ ] Usuario C es invitado y rechaza
- [ ] Usuario A (quien invitó) debería ver:
  - [ ] Notificación "Invitación rechazada" inmediatamente ⚡
  - [ ] Toast con nombre de Usuario C 📬
  - [ ] Sonido 🔔
  - [ ] Push notification 🌐
  - [ ] Click → se marca como leída ✅

### Test 6.4: Abandono de Grupo

- [ ] Usuario B (miembro) abandona el grupo
- [ ] Owner del grupo debería ver:
  - [ ] Notificación "Miembro abandonó [Grupo]" inmediatamente ⚡
  - [ ] Toast con nombre de Usuario B 📬
  - [ ] Sonido 🔔
  - [ ] Push notification 🌐
  - [ ] Click → se marca como leída ✅

### Test 6.5: Push Notifications con App Cerrada

- [ ] Cerrar completamente la app (cerrar pestaña/ventana)
- [ ] Desde otra cuenta, crear una acción que genere notificación (invitar, aceptar, etc.)
- [ ] Debería aparecer:
  - [ ] Push notification del navegador (incluso con app cerrada) 🌐
  - [ ] Click en la push → abre la app en la sección correcta 🔗

### Test 6.6: Verificar Ejecuciones de send-push-notification

- [ ] Ir a Appwrite Console → Functions → send-push-notification → Executions
- [ ] Verificar que haya ejecuciones recientes (una por cada notificación creada)
- [ ] Click en una ejecución → Ver logs
- [ ] Verificar que diga "Push sent successfully" o similar
- [ ] No debe haber errores de Firebase

---

## 🐛 PARTE 7: Debugging (Si algo no funciona)

### Si notificaciones NO llegan en tiempo real:

- [ ] Revisar consola del navegador (F12 → Console)
  - Buscar errores relacionados con Realtime o subscriptions
- [ ] Verificar permisos de la colección notifications:
  - Debe tener `read("user:{accountId}")` y `update("user:{accountId}")`
- [ ] Verificar que las nuevas notificaciones tengan `accountId`:
  - Ir a Databases → notifications → ver último documento creado
  - Debe tener el campo `accountId` con un valor

### Si NO se pueden marcar como leídas:

- [ ] Verificar permisos de update en la colección
- [ ] Revisar consola del navegador para errores de permisos
- [ ] Verificar que la notificación tenga `accountId` del usuario actual

### Si push notifications NO funcionan:

- [ ] Verificar que la función send-push-notification tenga el trigger configurado
- [ ] Ir a Appwrite Console → Functions → send-push-notification → Executions
  - Debe haber ejecuciones cada vez que se crea una notificación
- [ ] Click en una ejecución → Ver logs
  - Buscar errores de Firebase (credenciales, tokens, etc.)
- [ ] Verificar que el usuario tenga tokens FCM guardados:
  - Databases → push_subscriptions
  - Debe haber al menos un documento con el `profileId` del usuario
- [ ] Verificar Firebase Console:
  - Cloud Messaging debe estar habilitado
  - No debe haber cuotas excedidas

### Si hay errores de Firebase en los logs:

- [ ] Verificar que `FIREBASE_PRIVATE_KEY` incluya TODO (con `-----BEGIN` y `-----END`)
- [ ] Verificar que `FIREBASE_CLIENT_EMAIL` sea correcto
- [ ] Regenerar la clave privada desde Firebase Console y actualizar

---

## ✅ COMPLETADO

Si todos los tests pasaron:

- [x] ✅ Notificaciones de invitación funcionan
- [x] ✅ Notificaciones de aceptación/rechazo funcionan
- [x] ✅ Notificaciones de abandono funcionan
- [x] ✅ Push notifications de Firebase funcionan
- [x] ✅ Todas las notificaciones se pueden marcar como leídas
- [x] ✅ Sonidos se reproducen correctamente
- [x] ✅ Todo funciona en tiempo real

---

## 📚 Documentación de Referencia

- [CONFIGURAR_PUSH_NOTIFICATIONS.md](./CONFIGURAR_PUSH_NOTIFICATIONS.md) - Guía detallada de push notifications
- [SOLUCION_PERMISOS_NOTIFICACIONES.md](./SOLUCION_PERMISOS_NOTIFICACIONES.md) - Explicación de permisos
- [RESUMEN_SOLUCION_NOTIFICACIONES.md](./RESUMEN_SOLUCION_NOTIFICACIONES.md) - Resumen completo

---

## 🎯 Tiempo Estimado

- Parte 1 (Appwrite Config): ~15-20 minutos
- Parte 2 (Firebase): ~5-10 minutos (si no tienes credenciales)
- Parte 3 (Backend Deploy): ~5-10 minutos
- Parte 4 (Frontend Deploy): ~5-10 minutos
- Parte 5 (Migración): ~5 minutos (opcional)
- Parte 6 (Testing): ~15-20 minutos

**Total: ~45-75 minutos** ⏱️

---

## ⚠️ IMPORTANTE

**NO saltes pasos**. Todos son necesarios para que el sistema funcione correctamente.

Si tienes dudas en algún paso, revisa la documentación de referencia antes de continuar.

**¡Buena suerte! 🚀**
