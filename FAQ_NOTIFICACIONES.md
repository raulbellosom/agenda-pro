# ❓ FAQ - Preguntas Frecuentes sobre Notificaciones

## 🎯 General

### ¿Por qué solo funciona la notificación de aceptar/rechazar invitación?

**R:** Porque esa notificación va dirigida al **invitador**, quien YA es miembro del grupo y por lo tanto tiene permisos para leer/actualizar documentos de ese grupo.

Las otras notificaciones (invitación, abandono) van a usuarios que **NO son miembros del grupo aún** o **ya no lo son**, por eso el sistema de permisos basado en grupos no funciona para ellos.

**Solución:** Usar `accountId` en vez de permisos basados en grupo para las notificaciones.

---

### ¿Qué es accountId y por qué es diferente de profileId?

**R:**

- **accountId**: Es el ID que Appwrite Auth asigna cuando un usuario se registra. Es el identificador principal del usuario autenticado.
- **profileId**: Es el ID del documento en nuestra colección `users_profile` que creamos nosotros para almacenar datos adicionales del usuario.

Appwrite solo conoce el `accountId` para validar permisos. No puede resolver automáticamente el `profileId` porque es un campo custom de nuestra aplicación.

**Ejemplo:**

```javascript
// Usuario autenticado
account.$id = "64a1b2c3d4e5f6g7h8i9"  ← accountId (conocido por Appwrite)

// Nuestro documento de perfil
profile.$id = "profile_xyz123"          ← profileId (custom)
profile.accountId = "64a1b2c3d4e5f6g7h8i9"  ← Link entre ambos
```

---

### ¿Por qué necesito redesplegar las funciones?

**R:** Porque modificamos el código de las funciones para incluir el campo `accountId` al crear notificaciones. Sin redesplegar, las funciones siguen usando el código antiguo que no incluye este campo.

---

## 🔔 Push Notifications

### ¿Por qué las push notifications no se envían?

**R:** La causa más común es que la función `send-push-notification` **no tiene configurado el trigger de eventos** en Appwrite.

Sin el trigger, Appwrite no sabe que debe ejecutar la función cuando se crea una notificación.

**Solución:** Configurar el evento en Appwrite Console:

```
databases.[DATABASE_ID].collections.[NOTIFICATIONS_ID].documents.*.create
```

---

### ¿Cómo sé si el trigger está funcionando?

**R:**

1. Ve a Appwrite Console → Functions → send-push-notification → Executions
2. Debería haber una ejecución por cada notificación creada
3. Si no hay ejecuciones = el trigger NO está configurado

---

### ¿Qué pasa si el token FCM expira?

**R:** La función `send-push-notification` detecta tokens inválidos y los marca como `isActive: false` automáticamente. El usuario deberá volver a aceptar permisos de notificaciones para generar un nuevo token.

---

### ¿Puedo tener múltiples dispositivos con push notifications?

**R:** Sí, cada dispositivo/navegador genera su propio token FCM. La función envía push a todos los tokens activos del usuario.

---

### ¿Las push notifications funcionan en modo incógnito?

**R:** No persistentemente. El token FCM se genera en cada sesión de incógnito y se pierde al cerrar. Es mejor usar el modo normal para notificaciones persistentes.

---

## 🔒 Permisos

### ¿Por qué no puedo marcar como leída una notificación de invitación?

**R:** Porque la notificación no tiene el campo `accountId` o los permisos de la colección no están configurados con `update("user:{accountId}")`.

**Verificar:**

1. Ir a Databases → notifications → Ver última notificación creada
2. Debe tener campo `accountId` con un valor
3. En Settings → Permissions debe haber `update("user:{accountId}")`

---

### ¿Qué permisos necesita la API Key de las funciones?

**R:** La API Key debe tener permisos para:

- ✅ Leer/Escribir en todas las colecciones usadas
- ✅ Leer documentos de `users_profile`
- ✅ Crear/Actualizar documentos de `notifications`
- ✅ Leer/Actualizar documentos de `push_subscriptions`

**Recomendación:** Usar una API Key con scope "All" para funciones backend.

---

### ¿Por qué uso read("user:{accountId}") en vez de read("user:{profileId}")?

**R:** Porque Appwrite solo puede resolver variables de atributos que existen en el documento y que coinciden con información de la sesión del usuario.

```javascript
// ✅ FUNCIONA
read("user:{accountId}");
// Appwrite compara: session.userId === document.accountId

// ❌ NO FUNCIONA
read("user:{profileId}");
// Appwrite NO sabe qué es profileId, no está en la sesión
```

---

## ⚡ Tiempo Real

### ¿Por qué las notificaciones solo aparecen al recargar?

**R:** Porque el usuario no tiene permisos para recibir eventos de Realtime de documentos que no puede leer.

**Causas:**

1. Falta campo `accountId` en la notificación
2. Permisos incorrectos en la colección
3. Usuario no autenticado

---

### ¿Cómo funciona la suscripción de Realtime?

**R:** El frontend se suscribe a eventos de la colección `notifications`:

```javascript
client.subscribe(
  "databases.*.collections.[NOTIFICATIONS_ID].documents",
  (response) => {
    // Nuevo documento creado/actualizado/eliminado
  }
);
```

Appwrite solo envía eventos de documentos que el usuario tiene permiso para leer.

---

### ¿Puedo desactivar las notificaciones en tiempo real?

**R:** Sí, puedes modificar `useNotifications.js` para no suscribirte a Realtime. Pero perderás la funcionalidad de actualizaciones instantáneas.

---

## 🎵 Sonidos

### ¿Por qué no se reproduce el sonido?

**R:** Posibles causas:

1. El archivo `/sounds/notification.mp3` no existe
2. El navegador bloqueó la reproducción automática
3. `soundEnabled` está en `false` en localStorage

**Verificar:**

```javascript
// En DevTools Console
localStorage.getItem("notification_sound_enabled");
// Debe retornar null o "true"

// Para forzar activarlo:
localStorage.setItem("notification_sound_enabled", "true");
```

---

### ¿Cómo cambio el sonido de notificación?

**R:**

1. Coloca tu archivo de sonido en `public/sounds/notification.mp3`
2. O modifica la ruta en `useNotifications.js`:
   ```javascript
   const audio = new Audio("/sounds/tu-sonido.mp3");
   ```

---

## 🐛 Debugging

### ¿Cómo veo los logs de las funciones?

**R:**

1. Appwrite Console → Functions
2. Click en la función (ej: invite-to-group)
3. Pestaña "Executions"
4. Click en una ejecución específica
5. Ver logs en la sección "Logs"

---

### ¿Cómo veo los eventos de Realtime en el navegador?

**R:**

```javascript
// En DevTools Console
import { client } from "../shared/appwrite/client";

client.subscribe("databases.*.collections.*.documents", (response) => {
  console.log("📡 Realtime event:", response);
});
```

---

### ¿Cómo verifico si tengo tokens FCM guardados?

**R:**

1. Appwrite Console → Databases
2. Seleccionar tu database
3. Collection `push_subscriptions`
4. Buscar documentos con tu `profileId`
5. Verificar que `isActive: true`

---

### ¿Cómo pruebo las notificaciones manualmente?

**R:** Crear una notificación desde Appwrite Console:

1. Databases → notifications → Add Document
2. Agregar campos:
   ```json
   {
     "profileId": "tu_profile_id",
     "accountId": "tu_account_id",
     "groupId": "algun_group_id",
     "kind": "SYSTEM",
     "title": "Test",
     "body": "Prueba manual",
     "entityType": "test",
     "entityId": "test123",
     "enabled": true,
     "createdAt": "2024-01-06T00:00:00.000Z"
   }
   ```
3. Deberías ver:
   - Toast en la app
   - Sonido
   - Push notification
   - Nueva ejecución de send-push-notification

---

## 🔧 Configuración

### ¿Necesito Firebase para las notificaciones in-app?

**R:** No. Las notificaciones in-app (toast, sonido, badge) funcionan solo con Appwrite Realtime.

Firebase solo se necesita para **push notifications** (notificaciones del navegador cuando la app está cerrada).

---

### ¿Puedo usar otro servicio en vez de Firebase FCM?

**R:** Sí, podrías modificar la función `send-push-notification` para usar:

- OneSignal
- Pusher
- Web Push API nativo
- Etc.

Pero FCM es gratuito y funciona muy bien con navegadores modernos.

---

### ¿Qué pasa si no configuro el trigger de send-push-notification?

**R:** Las notificaciones in-app seguirán funcionando (toast, sonido, realtime), pero NO se enviarán push notifications del navegador.

---

## 🚀 Deployment

### ¿Necesito redesplegar después de cambiar variables de entorno?

**R:**

- **Funciones:** Sí, necesitas redesplegar para que los cambios tomen efecto
- **Frontend:** Sí, si cambias variables en `.env`

---

### ¿Puedo probar en local antes de desplegar?

**R:** Sí, pero necesitas:

1. Appwrite local con las mismas colecciones y permisos
2. Firebase configurado apuntando a tu proyecto
3. Las funciones ejecutándose localmente

Es más fácil probar directamente en staging/production si tienes cuidado.

---

### ¿Afecta a los usuarios existentes agregar el campo accountId?

**R:** No, porque el campo `accountId` es opcional. Las notificaciones existentes seguirán funcionando, pero las nuevas usarán el nuevo sistema de permisos.

**Recomendación:** Ejecutar el script de migración para actualizar notificaciones antiguas.

---

## 💡 Mejores Prácticas

### ¿Debería crear índices en la colección notifications?

**R:** Sí, índices recomendados:

- `profileId` (para queries rápidas)
- `accountId` (para permisos)
- `groupId` (si filtras por grupo)
- `readAt` (para obtener no leídas)
- `createdAt` (para ordenar)

---

### ¿Cuántas notificaciones debería mostrar en la lista?

**R:** Recomendaciones:

- Primeras 50 notificaciones (con pagination)
- Solo últimas 7-14 días
- Opción para "Ver todas"

---

### ¿Debería eliminar notificaciones antiguas automáticamente?

**R:** Sí, considera crear una función cron que:

1. Soft delete notificaciones de más de 30 días
2. Hard delete notificaciones de más de 90 días
3. Mantiene solo las importantes (invitaciones pendientes, recordatorios futuros)

---

### ¿Cómo manejo notificaciones de múltiples grupos?

**R:** El hook `useNotifications` acepta `groupId`:

```javascript
// Notificaciones de un grupo específico
useNotifications(groupId, profileId);

// Notificaciones de TODOS los grupos (pasar null)
useNotifications(null, profileId);
```

---

## 🔐 Seguridad

### ¿Es seguro almacenar tokens FCM en la base de datos?

**R:** Sí, los tokens FCM son seguros para almacenar. No son secretos y solo permiten enviar notificaciones a ese dispositivo específico.

---

### ¿Puedo enviar notificaciones a usuarios de otros grupos?

**R:** No, si configuras correctamente los permisos. Solo las funciones con API Key pueden crear notificaciones para cualquier usuario.

---

### ¿Qué pasa si alguien intenta marcar como leída una notificación de otro usuario?

**R:** Appwrite rechazará la petición por permisos insuficientes (gracias a `update("user:{accountId}")`).

---

## 📊 Monitoring

### ¿Cómo monitoreo el uso de notificaciones?

**R:** Opciones:

1. Appwrite Console → Functions → Executions (para ver push enviadas)
2. Query a la colección `notifications` por fechas
3. Implementar analytics custom en el frontend

---

### ¿Cómo sé si las push notifications están fallando?

**R:**

1. Ver logs de send-push-notification
2. Buscar tokens marcados como `isActive: false`
3. Revisar errores de Firebase en los logs

---

### ¿Puedo ver estadísticas de notificaciones leídas vs no leídas?

**R:** Sí, puedes crear queries:

```javascript
// No leídas
Query.isNull("readAt");

// Leídas
Query.isNotNull("readAt");

// Por tipo
Query.equal("kind", "INVITE");
```

---

## 🎯 Casos Específicos

### ¿Qué pasa si invito a un usuario que no existe?

**R:** La función `invite-to-group` envía un email en vez de crear una notificación in-app. El usuario recibirá el link de invitación por correo.

---

### ¿Qué pasa si un usuario desactiva los permisos de notificación del navegador?

**R:**

- ✅ Seguirá recibiendo notificaciones in-app (toast, sonido)
- ❌ NO recibirá push notifications del navegador

---

### ¿Puedo agrupar notificaciones similares?

**R:** Sí, puedes modificar el frontend para:

1. Detectar notificaciones similares (mismo entityType, mismo groupId)
2. Agruparlas visualmente
3. Mostrar "3 personas aceptaron tu invitación" en vez de 3 notificaciones separadas

---

### ¿Cómo manejo notificaciones de eventos/recordatorios?

**R:** La función `cron-generate-reminders` puede crear notificaciones de tipo `EVENT_REMINDER`. El sistema las manejará igual que las demás notificaciones.

**Asegúrate de incluir `accountId` también en esas notificaciones.**

---

## 🆘 Problemas Comunes

### Error: "Missing required attribute accountId"

**R:** Ocurre si marcaste el campo como requerido. Debe ser opcional para compatibilidad con notificaciones antiguas.

**Solución:**

1. Appwrite Console → Collections → notifications → Attributes
2. Click en `accountId` → Edit
3. Marcar como "Not Required"

---

### Error: "User (role: user) missing scope (documents.write)"

**R:** Los permisos de la colección están mal configurados.

**Solución:**

1. Verificar que exista `update("user:{accountId}")`
2. Verificar que la notificación tenga el campo `accountId`
3. Verificar que `accountId` coincida con el usuario autenticado

---

### Error: "Firebase: Invalid credentials"

**R:** Las credenciales de Firebase están mal configuradas.

**Solución:**

1. Regenerar la clave privada desde Firebase Console
2. Copiar TODA la clave (incluyendo `-----BEGIN` y `-----END`)
3. Actualizar `FIREBASE_PRIVATE_KEY` en Appwrite
4. Redesplegar la función

---

### Las notificaciones llegan duplicadas

**R:** Puede ocurrir si:

1. Tienes múltiples suscripciones de Realtime activas
2. La función send-push-notification se ejecuta múltiples veces

**Debugging:**

```javascript
// Ver suscripciones activas en el navegador
console.log("Subscriptions:", client._subscriptions);
```

**Solución:**

- Asegúrate de que `useNotifications` solo se use una vez en `NotificationProvider`
- Verifica que no tengas múltiples triggers configurados en send-push-notification

---

¿Tienes otra pregunta? Revisa los documentos de referencia:

- [CONFIGURAR_PUSH_NOTIFICATIONS.md](./CONFIGURAR_PUSH_NOTIFICATIONS.md)
- [SOLUCION_PERMISOS_NOTIFICACIONES.md](./SOLUCION_PERMISOS_NOTIFICACIONES.md)
- [RESUMEN_SOLUCION_NOTIFICACIONES.md](./RESUMEN_SOLUCION_NOTIFICACIONES.md)
- [DIAGRAMA_FLUJO_NOTIFICACIONES.md](./DIAGRAMA_FLUJO_NOTIFICACIONES.md)
