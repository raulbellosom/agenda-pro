# Agenda Pro — Base de Datos (Appwrite Console) v0.2 (Sin relaciones two-way)

> Objetivo: mantener el mismo modelo **multi-tenant + RBAC + auditoría + agenda**, pero **sin relaciones two-way** y evitando relaciones en Appwrite (solo IDs escalares).

---

## 0) Reglas (se mantienen)

1. **Índices**

- ✅ Solo en campos escalares (String/Integer/Datetime/Boolean/Enum).
- ❌ NO índices sobre Relationship attributes.
- ❌ NO usar `$id` como índice de su misma colección.

2. **Required vs Default**

- Si es required, **sin default**.
- Defaults importantes (ej. `enabled=true`) se ponen como **not required + default** (y se refuerzan en Functions/API).

3. **Soft delete**

- Entidades clave llevan `enabled: Boolean (default true)`.

4. **Multi-tenant**

- `groupId` = `$id` del documento en `groups`.
- Todo “dato de negocio” incluye `groupId`.

5. **Relaciones**

- ✅ Se guardan **solo IDs** (ej. `ownerProfileId`, `calendarId`, `eventId`, etc.) en String.
- ✅ La “navegación” se resuelve por queries (List Documents) usando esos IDs e índices.
- ❌ Evitamos **relationships en Appwrite**, especialmente **two-way**.
- (Opcional) Si alguna relación llegara a ser necesaria, que sea **one-way y solo en colecciones pequeñas**, pero por defecto: **NONE**.

---

## 1) Colecciones (lista)

### Identidad / Tenancy

- `users_profile`
- `groups`
- `group_members`
- `group_invitations`
- `email_verifications` (verificación de email)

### RBAC

- `permissions`
- `roles`
- `role_permissions`
- `user_roles`

### Agenda (Core)

- `calendars`
- `calendar_shares` (opcional en MVP)
- `events`
- `event_attendees`
- `event_reminders`
- `event_tags`
- `event_tag_links`

### Notificaciones

- `notifications`
- `notification_deliveries` (tracking)

### Configuración de Usuario

- `user_settings`
- `push_subscriptions`

### Auditoría

- `audit_logs`

### Suscripciones / Entitlements (preparado, opcional)

- `plans`
- `subscriptions`
- `entitlements`

---

## 2) Detalle por colección (SIN relaciones Appwrite)

> Convención:
>
> - todos los `...Id` son **String(64)** (o 36/128 si lo decides, pero 64 está bien).
> - No se crean relationship attributes.
> - Los “joins” los haces por queries: `equal("fieldId", "...")` o compuestos.

---

# A) users_profile

## A.1 Attributes (sin cambios)

| Field           | Type        | Required | Default | Notes                    |
| --------------- | ----------- | -------: | ------- | ------------------------ |
| userAuthId      | String(64)  |       ✅ |         | `$id` de Appwrite Auth   |
| email           | String(254) |       ✅ |         | copia para búsquedas     |
| emailVerified   | Boolean     |       ❌ | false   | verificado con token     |
| username        | String(36)  |       ❌ |         | opcional                 |
| firstName       | String(80)  |       ✅ |         |                          |
| lastName        | String(80)  |       ✅ |         |                          |
| phone           | String(30)  |       ❌ |         |                          |
| avatarFileId    | String(64)  |       ❌ |         | Storage fileId           |
| isPlatformAdmin | Boolean     |       ❌ | false   | admin global             |
| status          | Enum        |       ❌ | ACTIVE  | ACTIVE/SUSPENDED/DELETED |
| enabled         | Boolean     |       ❌ | true    | soft delete              |

## A.2 Indexes (sin cambios)

- `uq_users_profile_userAuthId` (unique) → `userAuthId`
- `uq_users_profile_email` (unique) → `email`
- `idx_users_profile_enabled` → `enabled`

## A.3 Relationships

- **NONE**

---

# B) groups

## B.1 Attributes (sin cambios)

| Field          | Type        | Required | Default             | Notes               |
| -------------- | ----------- | -------: | ------------------- | ------------------- |
| name           | String(120) |       ✅ |                     |                     |
| description    | String(500) |       ❌ |                     |                     |
| ownerProfileId | String(64)  |       ✅ |                     | `users_profile.$id` |
| logoFileId     | String(64)  |       ❌ |                     | Storage fileId      |
| timezone       | String(64)  |       ❌ | America/Mexico_City | IANA tz             |
| enabled        | Boolean     |       ❌ | true                |                     |

## B.2 Indexes (sin cambios)

- `idx_groups_ownerProfileId` → `ownerProfileId`
- `idx_groups_enabled` → `enabled`
- `idx_groups_name` → `name` (opcional)

## B.3 Relationships

- **NONE**

---

# C) group_members

## C.1 Attributes (sin cambios)

| Field          | Type        | Required | Default | Notes               |
| -------------- | ----------- | -------: | ------- | ------------------- |
| groupId        | String(64)  |       ✅ |         | `groups.$id`        |
| profileId      | String(64)  |       ✅ |         | `users_profile.$id` |
| membershipRole | Enum        |       ✅ |         | OWNER / MEMBER      |
| enabled        | Boolean     |       ❌ | true    |                     |
| joinedAt       | Datetime    |       ❌ |         | set API/Function    |
| notes          | String(500) |       ❌ |         |                     |

## C.2 Indexes (sin cambios)

- `idx_group_members_groupId` → `groupId`
- `idx_group_members_profileId` → `profileId`
- `idx_group_members_group_profile` → (`groupId`, `profileId`)
- `idx_group_members_enabled` → `enabled`

## C.3 Relationships

- **NONE**

---

# D) group_invitations

## D.1 Attributes (sin cambios)

| Field               | Type         | Required | Default | Notes                                       |
| ------------------- | ------------ | -------: | ------- | ------------------------------------------- |
| groupId             | String(64)   |       ✅ |         | tenant                                      |
| invitedEmail        | Email        |       ✅ |         | normalizado                                 |
| invitedProfileId    | String(64)   |       ❌ |         | si ya existe                                |
| invitedByProfileId  | String(64)   |       ✅ |         | quien invita                                |
| invitedRoleId       | String(64)   |       ✅ |         | rol asignado al aceptar                     |
| status              | Enum         |       ❌ | PENDING | PENDING/ACCEPTED/REJECTED/EXPIRED/CANCELLED |
| token               | String(64)   |       ✅ |         | UUID                                        |
| message             | String(500)  |       ❌ |         |                                             |
| expiresAt           | Datetime     |       ✅ |         |                                             |
| respondedAt         | Datetime     |       ❌ |         |                                             |
| permissionsSnapshot | String(2000) |       ❌ |         | JSON snapshot de permisos (opcional)        |
| enabled             | Boolean      |       ❌ | true    |                                             |

(elimine el campo de role enum, ya que ahora se asigna por invitedRoleId)

## D.2 Indexes (sin cambios)

- `idx_group_invitations_groupId` → `groupId`
- `uq_group_invitations_token` (unique) → `token`
- `idx_group_invitations_group_email_status` → (`groupId`, `invitedEmail`, `status`)
- `idx_group_invitations_enabled` → `enabled`
- `idx_group_invitations_group_status` → (`groupId`, `status`)
- `idx_group_invi_group_invitedProfile` → (`groupId`, `invitedProfileId`)

## D.3 Relationships

- **NONE**

---

# D.5) email_verifications

## D.5.1 Attributes

| Field      | Type       | Required | Default | Notes                           |
| ---------- | ---------- | -------: | ------- | ------------------------------- |
| userAuthId | String(64) |       ✅ |         | `users_profile.userAuthId`      |
| email      | Email      |       ✅ |         | email del usuario (normalizado) |
| token      | String(64) |       ✅ |         | UUID único de verificación      |
| expiresAt  | Datetime   |       ✅ |         | fecha de expiración (2 horas)   |
| verified   | Boolean    |       ❌ | false   | si el token ya fue usado        |
| createdAt  | Datetime   |       ❌ |         | fecha de creación del token     |

## D.5.2 Indexes

- `uq_email_verifications_token` (unique) → `token`
- `idx_email_verifications_userAuthId` → `userAuthId`
- `idx_email_verifications_verified` → `verified`
- `idx_email_verifications_expiresAt` → `expiresAt`

## D.5.3 Relationships

- **NONE**

---

# E) permissions

## E.1 Attributes (sin cambios)

| Field       | Type        | Required | Default | Notes               |
| ----------- | ----------- | -------: | ------- | ------------------- |
| key         | String(120) |       ✅ |         | ej: `events.create` |
| description | String(500) |       ❌ |         |                     |
| enabled     | Boolean     |       ❌ | true    |                     |

## E.2 Indexes (sin cambios)

- `uq_permissions_key` (unique) → `key`
- `idx_permissions_enabled` → `enabled`

## E.3 Relationships

- **NONE**

---

# F) roles

## F.1 Attributes (sin cambios)

| Field       | Type        | Required | Default | Notes                 |
| ----------- | ----------- | -------: | ------- | --------------------- |
| groupId     | String(64)  |       ✅ |         | tenant                |
| name        | String(80)  |       ✅ |         | Admin, Editor, Viewer |
| description | String(500) |       ❌ |         |                       |
| isSystem    | Boolean     |       ❌ | false   | roles base            |
| enabled     | Boolean     |       ❌ | true    |                       |

## F.2 Indexes (sin cambios)

- `idx_roles_groupId` → `groupId`
- `idx_roles_group_name` → (`groupId`, `name`)
- `idx_roles_enabled` → `enabled`

## F.3 Relationships

- **NONE**

---

# G) role_permissions

## G.1 Attributes (sin cambios)

| Field        | Type       | Required | Default |
| ------------ | ---------- | -------: | ------- |
| groupId      | String(64) |       ✅ |         |
| roleId       | String(64) |       ✅ |         |
| permissionId | String(64) |       ✅ |         |
| enabled      | Boolean    |       ❌ | true    |

## G.2 Indexes (sin cambios)

- `idx_role_permissions_group_role` → (`groupId`, `roleId`)
- `idx_role_permissions_group_permission` → (`groupId`, `permissionId`)
- `idx_role_permissions_enabled` → `enabled`

## G.3 Relationships

- **NONE**

---

# H) user_roles

## H.1 Attributes (sin cambios)

| Field      | Type       | Required | Default |
| ---------- | ---------- | -------: | ------- |
| groupId    | String(64) |       ✅ |         |
| profileId  | String(64) |       ✅ |         |
| roleId     | String(64) |       ✅ |         |
| enabled    | Boolean    |       ❌ | true    |
| assignedAt | Datetime   |       ❌ |         |

## H.2 Indexes (sin cambios)

- `idx_user_roles_group_profile` → (`groupId`, `profileId`)
- `idx_user_roles_group_role` → (`groupId`, `roleId`)
- `idx_user_roles_enabled` → `enabled`

## H.3 Relationships

- **NONE**

---

# I) calendars

## I.1 Attributes

| Field          | Type        | Required | Default  | Notes                                  |
| -------------- | ----------- | -------: | -------- | -------------------------------------- |
| groupId        | String(64)  |       ✅ |          | tenant                                 |
| ownerProfileId | String(64)  |       ✅ |          | creador                                |
| name           | String(120) |       ✅ |          |                                        |
| color          | String(20)  |       ❌ | violet   | token de color (violet/blue/green/etc) |
| icon           | String(96)  |       ❌ | calendar | nombre del icono (lucide icon name)    |
| visibility     | Enum        |       ❌ | GROUP    | PRIVATE/GROUP                          |
| isDefault      | Boolean     |       ❌ | false    | personal por defecto                   |
| enabled        | Boolean     |       ❌ | true     | soft delete                            |

## I.2 Indexes

- `idx_calendars_groupId` → `groupId`
- `idx_calendars_group_owner` → (`groupId`, `ownerProfileId`)
- `idx_calendars_group_visibility` → (`groupId`, `visibility`)
- `idx_calendars_enabled` → `enabled`

## I.3 Relationships

- **NONE**

---

# J) events

## J.1 Attributes (sin cambios)

| Field           | Type         | Required | Default   | Notes                     |
| --------------- | ------------ | -------: | --------- | ------------------------- |
| groupId         | String(64)   |       ✅ |           |                           |
| calendarId      | String(64)   |       ✅ |           | `calendars.$id`           |
| ownerProfileId  | String(64)   |       ✅ |           |                           |
| title           | String(200)  |       ✅ |           |                           |
| description     | String(3000) |       ❌ |           |                           |
| locationText    | String(300)  |       ❌ |           |                           |
| startAt         | Datetime     |       ✅ |           |                           |
| endAt           | Datetime     |       ✅ |           |                           |
| allDay          | Boolean      |       ❌ | false     |                           |
| timezone        | String(64)   |       ❌ |           | IANA                      |
| status          | Enum         |       ❌ | CONFIRMED | DRAFT/CONFIRMED/CANCELLED |
| visibility      | Enum         |       ❌ | INHERIT   | INHERIT/PRIVATE/GROUP     |
| recurrenceRule  | String(500)  |       ❌ |           | RRULE (iCal)              |
| recurrenceUntil | Datetime     |       ❌ |           |                           |
| enabled         | Boolean      |       ❌ | true      |                           |
| createdAt       | Datetime     |       ❌ |           | set API/Function          |
| updatedAt       | Datetime     |       ❌ |           | set API/Function          |

## J.2 Indexes (sin cambios)

- `idx_events_group_calendar_start` → (`groupId`, `calendarId`, `startAt`)
- `idx_events_group_owner_start` → (`groupId`, `ownerProfileId`, `startAt`)
- `idx_events_group_status` → (`groupId`, `status`)
- `idx_events_enabled` → `enabled`

## J.3 Relationships

- **NONE**

---

# K) event_attendees

## K.1 Attributes (sin cambios)

| Field          | Type        | Required | Default      | Notes                                    |
| -------------- | ----------- | -------: | ------------ | ---------------------------------------- |
| groupId        | String(64)  |       ✅ |              |                                          |
| eventId        | String(64)  |       ✅ |              |                                          |
| profileId      | String(64)  |       ❌ |              | invitado interno                         |
| email          | Email       |       ❌ |              | invitado externo                         |
| displayName    | String(120) |       ❌ |              |                                          |
| role           | Enum        |       ❌ | REQUIRED     | REQUIRED/OPTIONAL                        |
| responseStatus | Enum        |       ❌ | NEEDS_ACTION | NEEDS_ACTION/ACCEPTED/DECLINED/TENTATIVE |
| enabled        | Boolean     |       ❌ | true         |                                          |

## K.2 Indexes (sin cambios)

- `idx_event_attendees_group_event` → (`groupId`, `eventId`)
- `idx_event_attendees_group_profile` → (`groupId`, `profileId`)
- `idx_event_attendees_group_email` → (`groupId`, `email`)
- `idx_event_attendees_enabled` → `enabled`

## K.3 Relationships

- **NONE**

---

# L) event_reminders

## L.1 Attributes (sin cambios)

| Field         | Type       | Required | Default | Notes                                       |
| ------------- | ---------- | -------: | ------- | ------------------------------------------- |
| groupId       | String(64) |       ✅ |         |                                             |
| eventId       | String(64) |       ✅ |         |                                             |
| type          | Enum       |       ✅ |         | MINUTES_BEFORE / AT_TIME                    |
| minutesBefore | Integer    |       ❌ |         | si aplica                                   |
| atTime        | Datetime   |       ❌ |         | si aplica                                   |
| channel       | Enum Array |       ❌ | IN_APP  | IN_APP / PUSH / EMAIL - (multiple opciones) |
| enabled       | Boolean    |       ❌ | true    |                                             |

## L.2 Indexes (sin cambios)

- `idx_event_reminders_group_event` → (`groupId`, `eventId`)
- `idx_event_reminders_enabled` → `enabled`

## L.3 Relationships

- **NONE**

---

# M) notifications

## M.1 Attributes (sin cambios)

| Field      | Type         | Required | Default | Notes                            |
| ---------- | ------------ | -------: | ------- | -------------------------------- |
| groupId    | String(64)   |       ✅ |         |                                  |
| profileId  | String(64)   |       ✅ |         | destinatario                     |
| kind       | Enum         |       ✅ |         | EVENT_REMINDER / INVITE / SYSTEM |
| title      | String(140)  |       ✅ |         |                                  |
| body       | String(1000) |       ❌ |         |                                  |
| entityType | String(80)   |       ❌ |         | events, groups, etc              |
| entityId   | String(64)   |       ❌ |         |                                  |
| readAt     | Datetime     |       ❌ |         |                                  |
| createdAt  | Datetime     |       ✅ |         | set API/Function                 |
| enabled    | Boolean      |       ❌ | true    |                                  |

## M.2 Indexes (sin cambios)

- `idx_notifi_group_profile_created` → (`groupId`, `profileId`, `createdAt`)
- `idx_notifi_group_profile_unread` → (`groupId`, `profileId`, `readAt`)
- `idx_notifications_enabled` → `enabled`

## M.3 Relationships

- **NONE**

---

# N) user_settings

## N.1 Attributes

| Field                     | Type       | Required | Default             | Notes                                     |
| ------------------------- | ---------- | -------: | ------------------- | ----------------------------------------- |
| groupId                   | String(64) |       ✅ |                     | tenant                                    |
| profileId                 | String(64) |       ✅ |                     | usuario                                   |
| timezone                  | String(64) |       ❌ | America/Mexico_City | IANA tz - preferencia usuario             |
| dateFormat                | String(30) |       ❌ | DD/MM/YYYY          | preferencia formato fecha                 |
| timeFormat                | String(30) |       ❌ | 24h                 | 12h / 24h                                 |
| weekStartsOn              | Integer    |       ❌ | 0                   | 0=Sunday, 1=Monday, etc                   |
| defaultCalendarId         | String(64) |       ❌ |                     | calendario por defecto para crear eventos |
| notificationsEnabled      | Boolean    |       ❌ | true                | habilitar notificaciones in-app           |
| emailNotificationsEnabled | Boolean    |       ❌ | true                | habilitar notificaciones email            |
| pushNotificationsEnabled  | Boolean    |       ❌ | false               | habilitar notificaciones push             |
| defaultReminderMinutes    | Integer    |       ❌ | 15                  | recordatorio por defecto (minutos antes)  |
| soundEnabled              | Boolean    |       ❌ | true                | sonido para notificaciones                |
| language                  | String(10) |       ❌ | es                  | código idioma (es, en, etc)               |
| theme                     | Enum       |       ❌ | SYSTEM              | LIGHT / DARK / SYSTEM                     |
| enabled                   | Boolean    |       ❌ | true                |                                           |

## N.2 Indexes

- `uq_user_settings_group_profile` (unique) → (`groupId`, `profileId`)
- `idx_user_settings_groupId` → `groupId`
- `idx_user_settings_profileId` → `profileId`
- `idx_user_settings_enabled` → `enabled`

## N.3 Relationships

- **NONE**

---

# O) push_subscriptions

## O.1 Attributes

| Field      | Type        | Required | Default | Notes                      |
| ---------- | ----------- | -------: | ------- | -------------------------- |
| groupId    | String(64)  |       ✅ |         | tenant                     |
| profileId  | String(64)  |       ✅ |         | usuario                    |
| endpoint   | String(512) |       ✅ |         | Push API endpoint          |
| p256dh     | String(128) |       ✅ |         | clave pública p256dh       |
| auth       | String(64)  |       ✅ |         | clave auth                 |
| userAgent  | String(500) |       ❌ |         | navegador/dispositivo      |
| ipAddress  | IP          |       ❌ |         | IP de registro             |
| isActive   | Boolean     |       ❌ | true    | si suscripción está activa |
| lastUsedAt | Datetime    |       ❌ |         | última vez que se usó      |
| createdAt  | Datetime    |       ✅ |         | set API/Function           |
| enabled    | Boolean     |       ❌ | true    |                            |

## O.2 Indexes

- `uq_push_subscriptions_endpoint` (unique) → `endpoint`
- `idx_push_subscriptions_group_profile` → (`groupId`, `profileId`)
- `idx_push_subscriptions_group_active` → (`groupId`, `isActive`)
- `idx_push_subscriptions_enabled` → `enabled`

## O.3 Relationships

- **NONE**

---

# P) audit_logs

## P.1 Attributes (sin cambios)

| Field      | Type         | Required | Default | Notes                                        |
| ---------- | ------------ | -------: | ------- | -------------------------------------------- |
| groupId    | String(64)   |       ✅ |         | puede ser null si es global                  |
| profileId  | String(64)   |       ✅ |         | actor                                        |
| action     | Enum         |       ✅ |         | CREATE/UPDATE/DELETE/LOGIN/LOGOUT/VIEW/OTHER |
| entityType | String(80)   |       ✅ |         | events/calendars/roles/...                   |
| entityId   | String(64)   |       ❌ |         |                                              |
| entityName | String(200)  |       ❌ |         |                                              |
| details    | String(2000) |       ❌ |         | JSON string                                  |
| ipAddress  | IP           |       ❌ |         |                                              |
| userAgent  | String(500)  |       ❌ |         |                                              |
| createdAt  | Datetime     |       ✅ |         | set API/Function                             |
| enabled    | Boolean      |       ❌ | true    |                                              |

## P.2 Indexes (sin cambios)

- `idx_audit_logs_groupId` → `groupId`
- `idx_audit_logs_profileId` → `profileId`
- `idx_audit_logs_group_action` → (`groupId`, `action`)
- `idx_audit_logs_group_entityType` → (`groupId`, `entityType`)
- `idx_audit_logs_group_createdAt` → (`groupId`, `createdAt`)
- `idx_audit_logs_enabled` → `enabled`

## P.3 Relationships

- **NONE**

# Q) calendar_shares

## Q.1 Attributes (opcional, sin cambios)

| Field       | Type       | Required | Default | Notes           |
| ----------- | ---------- | -------- | ------- | --------------- |
| groupId     | String(64) | ✅       |         | tenant          |
| calendarId  | String(64) | ✅       |         | `calendars.$id` |
| profileId   | String(64) | ✅       |         |                 |
| accessLevel | Enum       | ✅       | VIEW    | VIEW/EDIT/OWNER |
| enabled     | Boolean    | ❌       | true    |                 |

## Q.2 Indexes (opcional, sin cambios)

- `idx_calendar_shares_group_calendar` → (`groupId`, `calendarId`)
- `idx_calendar_shares_group_profile` → (`groupId`, `profileId`)
- `idx_calendar_shares_enabled` → `enabled`

## Q.3 Relationships

- **NONE**

---

## 3) Orden recomendado de creación (Console)

1. `users_profile`
2. `email_verifications` (nueva - verificación de email)
3. `groups`
4. `group_members`
5. `group_invitations`
6. `permissions`
7. `roles`
8. `role_permissions`
9. `user_roles`
10. `calendars`
11. `events`
12. `event_attendees`
13. `event_reminders`
14. `notifications`
15. `user_settings`
16. `push_subscriptions`
17. `audit_logs`

---

## 4) Consecuencia práctica (joins sin relaciones)

- “Eventos del calendario X” → query `events` con `groupId` + `calendarId`.
- “Calendarios del usuario” → `calendars` con `groupId` + `ownerProfileId`.
- “Miembros del grupo” → `group_members` con `groupId`.
- “Roles del usuario” → `user_roles` con `groupId` + `profileId`, luego cargar `roles` por `roleId`.
- “Permisos efectivos” → `role_permissions` por `groupId` + `roleId`, luego cargar `permissions` por ids.

---

## 5) Set de permisos recomendado (keys)

Tu colección `permissions` debe tener un set base. Ejemplo:

### 5.1 Grupo/Espacio

- `group.read`
- `group.update` (editar nombre/branding/timezone)
- `group.delete` (soft delete)
- `group.billing.read` _(futuro suscripciones)_
- `group.billing.manage` _(futuro)_

### 5.2 Miembros e invitaciones

- `members.read`
- `members.invite`
- `members.resend_invite`
- `members.cancel_invite`
- `members.remove`
- `members.update_roles` (asignar/quitar roles)
- `members.manage` (atajo: equivale a varios)

### 5.3 Roles y permisos

- `roles.read`
- `roles.manage` (crear/editar roles)
- `permissions.read` (normalmente todos pueden leer “qué permisos existen”)

### 5.4 Calendarios

- `calendars.read`
- `calendars.create`
- `calendars.update`
- `calendars.delete`
- `calendars.manage` (atajo)

### 5.5 Eventos

- `events.read`
- `events.create`
- `events.update`
- `events.delete`
- `events.manage` (atajo)
- `events.invite_attendees` (si quieres separar esta acción)

### 5.6 Notificaciones

- `notifications.read`

> Importante: los permisos son por **grupo** (tenant).  
> Si después haces permisos por calendario, se combinan.

---

## 6) Roles base por grupo (system roles)

En `roles` crea por cada group:

- **Owner/Admin** (isSystem=true)
  - todo: group + members + roles + calendars + events
- **Editor** (isSystem=true)
  - calendars.read + events.manage (create/update/delete)
  - sin members.manage ni roles.manage
- **Viewer** (isSystem=true)
  - calendars.read + events.read
- _(Opcional)_ **Manager** (isSystem=true)
  - members.manage pero sin acceso a billing ni delete

> Nota: aunque exista un “Owner” en `group_members`, en RBAC puedes seguir asignando el rol Admin al owner.

---
