# Agenda Pro — Functions, Realtime y Webhooks (Appwrite) v0.1

> Este documento describe **qué usar de Appwrite** (Functions, Realtime, Webhooks, Events, Scheduled/CRON) para que Agenda Pro tenga:
>
> - **Notificaciones y actualizaciones en tiempo real**
> - **Recordatorios confiables** (minutos antes / a hora exacta)
> - **Automatizaciones** (limpieza, expiración de invitaciones, auditoría)
> - Base para **push notifications** (futuro)

---

## 1) Conceptos clave de Appwrite (lo que sí vas a ocupar)

### 1.1 Functions (Appwrite Functions)

Son ejecuciones backend (Node.js) que sirven para:

- Validaciones server-side
- “Orquestación” (crear varios docs, asignar roles, etc.)
- Jobs programados (CRON) como recordatorios, expiración, limpieza
- Integraciones con servicios externos (email/push/analytics)

**En Agenda Pro las Functions serán críticas** para recordatorios y tareas “siempre fiables”.

---

### 1.2 Realtime (Appwrite Realtime)

Appwrite emite eventos en tiempo real cuando cambian documentos/archivos.

**Se usa en frontend** para:

- Refrescar “caché” (React Query) inmediatamente cuando:
  - se crea/edita/borra un evento
  - se agregan miembros al grupo
  - se aceptan invitaciones
  - llega una notificación in-app

---

### 1.3 Webhooks (Appwrite Webhooks)

Appwrite puede enviar eventos (HTTP POST) a tu endpoint cuando ocurren cambios.
Se usa para:

- Integración con terceros
- Pipelines / automatizaciones externas
- Auditoría avanzada fuera de Appwrite
- Disparar servicios internos (por ejemplo: un microservicio de push)

> Importante: **Webhooks ≠ Realtime**.  
> Realtime es para la UI; Webhooks son para integraciones backend-to-backend.

---

### 1.4 Events (qué eventos escuchar)

Los eventos típicos que usarás:

- **Database**
  - `databases.*.collections.*.documents.*.create`
  - `...update`
  - `...delete`
- **Users**
  - `users.*.create`
  - `users.*.sessions.*.create` (login)
- **Storage** (si usas attachments)
  - `storage.*.files.*.create/delete`

---

## 2) Arquitectura recomendada para Agenda Pro (simple, profesional)

### 2.1 Frontend (React + React Query)

- La UI **NO calcula recordatorios**: solo crea/edita reglas.
- La UI **se suscribe a realtime**:
  - por `groupId` y colecciones relevantes.
- La UI usa React Query como fuente de verdad local:
  - Realtime → invalida/refresca queries o actualiza cache.

### 2.2 Backend (Appwrite DB + Functions)

- La DB guarda reglas de recordatorios.
- Functions:
  - generan `notifications`
  - marcan invitaciones expiradas
  - registran `audit_logs`
  - limpian basura (opcional)
- (Futuro) microservicio de push:
  - recibe webhook o llamado desde Function

---

## 3) ¿Qué Functions necesita Agenda Pro? (MVP)

> Todas en **Node.js** y usando el SDK oficial de Appwrite (`node-appwrite`).
> Dependencias adicionales: `axios` para integraciones HTTP externas (email, push, webhooks).

---

### 3.1 `createUserWithProfile` ✅ IMPLEMENTADA

**Invocación**: HTTP function (desde UI - Register)  
**Ubicación**: `functions/create-user-with-profile/`

**Hace**:

1. Crear usuario en Appwrite Auth (`users.create`)
2. Crear documento en `users_profile` con:
   - `userAuthId`, `email` (normalizado), `firstName`, `lastName`
   - `phone` (validado formato E.164: +XXXXXXXXX)
   - `status: ACTIVE`, `enabled: true`
3. (Opcional) Si se envía `groupId`:
   - Crear `group_members` con rol asignado
   - Crear `user_roles` con rol por defecto

**Payload esperado**:

```json
{
  "email": "user@example.com",
  "password": "securePassword123",
  "name": "Juan Pérez",
  "firstName": "Juan", // opcional si name incluye nombre completo
  "lastName": "Pérez", // opcional si name incluye apellido
  "phone": "+521234567890", // opcional, formato E.164
  "groupId": "group_abc123", // opcional, para asignar a grupo existente
  "roleId": "role_xyz789" // opcional, rol específico en el grupo
}
```

**Respuesta exitosa** (201):

```json
{
  "ok": true,
  "user": { "$id": "auth_user_id", ... },
  "profile": { "$id": "profile_id", ... },
  "groupMember": { "$id": "member_id", ... },  // si groupId enviado
  "userRole": { "$id": "role_id", ... }        // si groupId enviado
}
```

**Variables de entorno requeridas**:

- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DATABASE_ID`
- `COLLECTION_USERS_PROFILE_ID`
- `COLLECTION_GROUP_MEMBERS_ID` (opcional)
- `COLLECTION_USER_ROLES_ID` (opcional)
- `DEFAULT_GROUP_ROLE` (opcional, default: `MEMBER`)
- `DEFAULT_ROLE_ID` (opcional)

---

### 3.2 `ensureProfile` ✅ IMPLEMENTADA

**Trigger**: Event `users.*.create` o HTTP function  
**Ubicación**: `functions/ensure-profile/`

**Hace**:

1. Recibe `userAuthId` en el payload
2. Busca si ya existe `users_profile` con ese `userAuthId`
3. Si existe → retorna el profile existente
4. Si no existe → obtiene datos del Auth user y crea el profile

**Uso principal**:

- Como **trigger automático** cuando se crea un usuario (backup de `createUserWithProfile`)
- Como **función de validación** para garantizar que un usuario tenga profile
- Útil para usuarios creados por otros métodos (OAuth, admin, etc.)

**Payload esperado**:

```json
{
  "userAuthId": "auth_user_id",
  "firstName": "Juan", // opcional, se infiere de Auth user.name
  "lastName": "Pérez" // opcional, se infiere de Auth user.name
}
```

**Respuesta exitosa**:

```json
{
  "ok": true,
  "created": true,          // false si ya existía
  "profile": { "$id": "profile_id", ... }
}
```

**Variables de entorno requeridas**:

- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY`
- `APPWRITE_DATABASE_ID`
- `COLLECTION_USERS_PROFILE_ID`

---

### 3.3 `createGroupWithDefaults`

**Invocación**: HTTP function (desde UI)  
**Hace**:

- Crear `groups`
- Crear `group_members` owner
- Crear roles base (Admin/Editor/Viewer)
- Insertar permisos base (si aún no existen)
- Crear calendarios default:
  - “Personal” del owner
  - “Team” (opcional)

---

### 3.3 `inviteToGroup`

**Invocación**: HTTP function  
**Hace**:

- Validar permiso `members.invite`
- Crear `group_invitations` con token + expiración
- (Opcional) enviar email por SMTP / proveedor
- Registrar auditoría

---

### 3.4 `acceptInvitation`

**Invocación**: HTTP function  
**Hace**:

- Validar token + status + expiración
- Crear `group_members` si no existe
- Asignar roles en `user_roles`
- Marcar invitación como ACCEPTED
- Crear notificación al inviter
- Registrar auditoría

---

### 3.5 `auditLogger` (opción A: por Function)

**Trigger**: database document events (create/update/delete) para colecciones sensibles  
**Hace**:

- Escribe en `audit_logs` lo mínimo (actor, acción, entidad, metadata)

> Alternativa (opción B): registrar auditoría desde tus propias Functions “de negocio”.  
> Es más controlable y evita ruido.

---

## 4) Scheduled Functions (CRON) — lo importante para agenda

### 4.1 `cron_expireInvitations`

- Corre cada X minutos u horas.
- Marca como `EXPIRED` si `expiresAt < now` y status PENDING.
- Registra auditoría si aplica.

---

### 4.2 `cron_generateReminders`

- Corre cada 1 minuto (o cada 2 min si quieres ahorrar).
- Busca recordatorios “pendientes” y crea `notifications`.

#### Estrategia de recordatorios (recomendada)

Para que sea confiable, agrega (en DB) un campo que indique que un reminder ya se disparó:

- Opción 1 (simple): en `event_reminders`
  - `lastTriggeredAt: Datetime?`
  - `nextTriggerAt: Datetime?` (precalcular)
- Opción 2 (más robusta): tabla `reminder_jobs`
  - Se generan jobs al crear/editar un evento
  - El cron solo ejecuta jobs vencidos

**Para MVP**: Opción 1 suele bastar y es simple de mantener.

---

### 4.3 `cron_cleanupOrphans` (opcional)

- Limpieza de archivos subidos y nunca enlazados (si usas attachments).
- Similar a tu approach de “staged uploads”.

---

## 5) Realtime en el Frontend (cómo lo vas a usar)

### 5.1 Qué suscribirse (MVP)

Por grupo activo, suscribirse a cambios en:

- `events`
- `calendars`
- `group_members`
- `group_invitations` (solo si el usuario puede verlas)
- `notifications`

### 5.2 Qué hacer cuando llega un evento realtime

- Si es `events.*` → invalidar:
  - `["events", groupId, view, range]`
- Si es `notifications.*` → invalidar:
  - `["notifications", groupId, profileId]`
- Si es `calendars.*` → invalidar:
  - `["calendars", groupId]`

> Con React Query, lo más efectivo es **invalidateQueries** y, en casos críticos, “patch” del cache.

### 5.3 Buenas prácticas

- Suscripción se monta/desmonta por `groupId`.
- Evitar escuchar “todo” si no hace falta.
- Debounce de invalidaciones si hay muchas actualizaciones.

---

## 6) Webhooks — ¿cuándo sí y cuándo no?

### 6.1 Sí usar webhooks cuando:

- Quieras disparar un servicio externo (push provider, slack, analytics).
- Quieras auditar fuera de Appwrite (SIEM, logs centralizados).
- Quieras mantener integraciones desacopladas.

### 6.2 No necesitas webhooks si:

- Solo buscas refrescar UI → usa Realtime.
- La lógica se queda dentro de Appwrite Functions.

---

## 7) Push Notifications (preparación, no MVP)

Para push en PWA normalmente necesitas:

- Service Worker + VAPID keys (Web Push)
- Guardar suscripciones por usuario:
  - colección `push_subscriptions`:
    - `profileId`, `endpoint`, `p256dh`, `auth`, `userAgent`, `enabled`
- Function `sendPush` para enviar a endpoints

**Disparador**:

- `cron_generateReminders` crea `notifications` y si user tiene push habilitado, llama `sendPush`.

---

## 8) Seguridad y permisos para Functions

### 8.1 Reglas

- Nunca confiar en el frontend.
- Validar:
  - miembro del group (`group_members`)
  - rol/permisos (`user_roles` + `role_permissions`)
- Limitar acceso a Function:
  - por API key (server-to-server) o por JWT/session del usuario

### 8.2 Variables (.env) para Functions (recomendado)

- `APPWRITE_ENDPOINT`
- `APPWRITE_PROJECT_ID`
- `APPWRITE_API_KEY` (server)
- `DATABASE_ID`
- `COLLECTION_*_ID` (ids de colecciones)
- `BUCKET_*_ID` (si aplica)

---

## 9) Checklist de implementación (cuando iniciemos Functions)

- [x] Definir IDs (DB + Collections) y guardarlos en `.env`
- [x] Crear Function `createUserWithProfile` (HTTP - registro)
- [x] Crear Function `ensureProfile` (trigger users create / HTTP)
- [ ] Crear HTTP Functions:
  - [ ] createGroupWithDefaults
  - [ ] inviteToGroup
  - [ ] acceptInvitation
- [ ] Crear CRON:
  - [ ] expireInvitations
  - [ ] generateReminders
- [ ] Implementar Realtime hooks en frontend
- [ ] (Opcional) auditoría centralizada
- [ ] Integrar `createUserWithProfile` en RegisterPage.jsx
- [ ] Integrar `ensureProfile` como trigger en Appwrite Console

---

## 10) Resumen (decisión rápida)

**Para Agenda Pro (MVP):**

- ✅ Realtime para UI (actualización instantánea)
- ✅ Functions HTTP para flujos críticos (grupo, invitación, aceptar)
- ✅ CRON Functions para recordatorios y expiraciones
- ❌ Webhooks solo si integras servicios externos (futuro)
- ✅ Push preparado, no obligatorio al inicio
