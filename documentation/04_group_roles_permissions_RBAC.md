# Agenda Pro — Roles, Permisos, Invitaciones y Gestión de Usuarios (Spaces/Groups)

> Contexto: En Agenda Pro, un **Group** funciona como **Espacio (Space / Workspace)** multi‑tenant.  
> Objetivo: permitir que un usuario normal cree su espacio, invite por email, y que los miembros queden limitados por **RBAC por espacio**.

---

## 1) Lo que ya tienes en la BD (y sí sirve para este modelo)

Basado en tu modelo v0.2 (sin relaciones two‑way, usando solo IDs escalares), ya cuentas con los bloques correctos para un esquema “tipo Notion/Slack”:

### Tenancy

- **`groups`**: representa el “espacio” (workspace).
- **`group_members`**: membresía _perfil ↔ grupo_ (quién pertenece).
- **`group_invitations`**: invitaciones por email con token + expiración.

### RBAC por grupo

- **`permissions`**: catálogo global de permisos (por `key`).
- **`roles`**: roles **por grupo** (`groupId`).
- **`role_permissions`**: permisos asignados a cada rol (por grupo).
- **`user_roles`**: roles asignados a cada usuario **dentro** de un grupo.

✅ Con esto puedes: “soy owner en Group A con rol Admin, pero en Group B soy viewer”.

---

## 2) El “problema” real: no es tanto la BD, es el contrato de negocio

Tu BD está cerca, pero para que funcione perfecto con usuarios “generales” (no admins de plataforma) necesitas **dos ajustes clave**:

1. **Separar “membresía” de “autorización”**

- `group_members.role = OWNER/MEMBER` debería ser **solo** “tipo de membresía” (owner vs miembro) o incluso cambiarlo a `membershipRole`.
- La autorización real debe venir de **`user_roles` + `role_permissions` + `permissions`**.

2. **Invitación debe asignar roles reales (por roleId), no solo un enum**

- Hoy `group_invitations.role` es un enum (en v0.2: OWNER/MEMBER).
- En tu caso, lo correcto es que la invitación defina **qué rol(es)** tendrá el invitado al aceptar.

---

## 3) ¿Estás listo hoy? ✅ Parcial (80%)

### Lo que sí puedes hacer ya mismo (con cambios mínimos)

- Crear un grupo/espacio.
- Invitar por email (token + expiración).
- Si el email ya existe → notificación in‑app.
- Aceptar invitación y crear la membresía.

### Lo que te faltará para hacerlo “pro”

- Asignación de permisos/roles granular al invitar (ej: “puede editar eventos pero no calendarios”).
- Delegar gestión de invitaciones/permisos (“permitir que alguien gestione miembros”).
- (Opcional) Reglas por **calendario** (no solo por grupo).

---

## 4) Cambios recomendados en la BD (mínimos pero importantes)

### 4.1 `group_members` (ajuste semántico)

**Estado actual:**

- `role: Enum (OWNER/MEMBER)`

**Recomendación:**

- Renombrar mentalmente/funcionalmente a:
  - `membershipRole: Enum (OWNER/MEMBER)`
- Y **NO usarlo** como el sistema de permisos fino.

> Si prefieres no renombrar en consola ahora, está bien: mantén `role`, pero en código trátalo como `membershipRole`.

## Edit mio: si lo renombre en la BD, mejor. asi que habra que actualizar los docs y codigo en consecuencia.

### 4.2 `group_invitations` — agregar roles reales por grupo

Hoy tienes:

- `role: Enum` (no alcanza)

Agrega (recomendado):

- `invitedRoleId: String(64)` **(simple, 1 rol al aceptar)**  
  **También recomendado:**

- `permissionsSnapshot: String(2000)` (JSON opcional)  
  Para “congelar” permisos al momento de invitar si lo deseas (no obligatorio). pero si lo agregue a la db.

Índices sugeridos:

- `idx_group_invitations_group_status` → (`groupId`, `status`)
- `idx_group_invitations_group_invitedProfile` → (`groupId`, `invitedProfileId`) (si lo usas mucho)

---

### 4.3 (Opcional) Permisos por calendario: `calendar_shares` o `calendar_acl`

Si **te basta** con permisos por espacio (grupo), no lo necesitas.

Pero si quieres:

- “En este grupo puedo crear eventos, pero solo en el calendario X”
- “Puedo ver todos los calendarios, pero solo editar el mío”

Entonces crea una colección (una de estas dos):

**Opción A — `calendar_shares` (ACL por calendario)**

- `groupId`
- `calendarId`
- `profileId`
- `access: Enum` (OWNER/EDITOR/VIEWER)
- `enabled`

Y en código, la autorización final sería:

- permiso del rol **y** (si aplica) ACL del calendario.

**Opción B — `calendar_permissions` (permiso granular por calendario)**

- más potente, más compleja (yo no lo haría en MVP).

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

## 7) Flujos de negocio (lo que deben hacer tus Functions / API)

### 7.1 Registro (Auth) → ensureProfile

1. Usuario crea cuenta en Appwrite Auth.
2. Trigger `ensureProfile` crea `users_profile` si no existe.

---

### 7.2 Crear espacio (Group) — `createGroupWithDefaults`

**Reglas**

- Cualquier usuario autenticado puede crear 1+ grupos (por ahora sin suscripción).

**Acciones**

1. Crear `groups` con `ownerProfileId = currentProfileId`.
2. Crear `group_members` con `membershipRole=OWNER`.
3. Seed de RBAC:
   - insertar permisos base si faltan en `permissions`
   - crear roles base (Admin/Editor/Viewer) en `roles` con `groupId`
   - poblar `role_permissions`
4. Asignar rol Admin al owner:
   - insertar en `user_roles` (`groupId`, `profileId`, `roleId=Admin`)

---

### 7.3 Invitar por correo — `inviteToGroup`

**Entrada:**

- `groupId`
- `invitedEmail`
- `invitedRoleId` (o `invitedRoleIds`)
- mensaje opcional

**Validaciones:**

- El actor debe ser miembro del grupo.
- Debe tener `members.invite` (o `members.manage`).

**Acciones:**

1. Normalizar email (trim + lowercase).
2. Ver si existe `users_profile` activo con ese email:
   - si existe → set `invitedProfileId`
3. Crear `group_invitations`:
   - token UUID
   - expiresAt (ej: +7 días)
   - status = PENDING
   - guardar `invitedRoleId(s)`
4. Notificación:
   - si invitedProfileId existe → crear `notifications` tipo INVITE (in‑app)
   - si no existe → enviar email con link / token
5. Auditoría: `audit_logs` (INVITE_SENT)

---

### 7.4 Aceptar invitación — `acceptInvitation`

**Entrada:**

- token

**Validaciones:**

- invitación existe, enabled=true
- status=PENDING
- expiresAt > now
- el email de la sesión coincide con invitedEmail _(recomendado)_

**Acciones:**

1. upsert `group_members` (enabled=true, joinedAt=now)
2. asignar roles:
   - crear `user_roles` con `invitedRoleId(s)`
3. marcar invitación ACCEPTED + respondedAt
4. notificar al inviter (notifications)
5. auditoría: INVITE_ACCEPTED

---

### 7.5 Rechazar / Cancelar / Reenviar

- Rechazar: el invitado cambia status=REJECTED
- Cancelar: el inviter (o quien tenga permiso) cambia status=CANCELLED
- Reenviar: genera nuevo token/expiresAt (o reusa token) y re‑envía correo

---

## 8) Autorización efectiva (cómo calcular permisos de un usuario en un grupo)

Para un `profileId` y `groupId`:

1. Verificar membresía:

- `group_members` where `groupId` + `profileId` + enabled=true

2. Cargar roles:

- `user_roles` where `groupId` + `profileId` + enabled=true

3. Cargar permisos por rol:

- `role_permissions` where `groupId` + roleId + enabled=true

4. Resolver keys:

- `permissions` by permissionId (o cache en memoria)

Resultado:

- `Set<string>` con permission keys (ej: `events.update`)

**Atajo:**

- Si `users_profile.isPlatformAdmin=true` → bypass global (solo para tu usuario/soporte).

---

## 9) Edge cases y reglas importantes

### Email ya existe pero usuario está deshabilitado

- Si `users_profile.enabled=false` o status=SUSPENDED:
  - permitir invitar, pero el sistema debe bloquear aceptación hasta que re‑habilites el perfil.

### Invitaciones duplicadas

- Antes de crear una nueva, buscar:
  - same `groupId` + `invitedEmail` + status=PENDING + enabled=true  
    y decidir:
  - “reutilizar” o “cancelar la anterior y crear nueva”.

### Owner y administración

- Owner (membershipRole=OWNER) debería **siempre** tener:
  - `members.manage` y `roles.manage` (aunque accidentalmente le quiten roles)
- Esto se puede reforzar:
  - (a) en el código de validación, o
  - (b) asignando un rol Admin “bloqueado” al owner.

---

## 10) Checklist: lo mínimo para quedar “listo” con tu modelo

- [ ] En `permissions`, tener un set base completo (keys).
- [ ] En `createGroupWithDefaults`, sembrar roles + role_permissions.
- [ ] En `group_invitations`, guardar `invitedRoleId` (o array).
- [ ] En `acceptInvitation`, asignar roles en `user_roles`.
- [ ] En frontend, UI para:
  - elegir rol al invitar
  - ver miembros + roles
  - gestionar invitaciones (si tiene permiso)
- [ ] (Opcional) si quieres granular por calendario: crear `calendar_shares`.

---

## 11) Resumen de decisión

✅ **Sí puedes implementar tu modelo de “espacios + invitaciones + roles/permisos” con tu BD actual.**  
Pero para que funcione como tú lo describes (roles/permisos al invitar y delegación de gestión), necesitas:

1. **Invitación con roleId(s)** (no enum).
2. **Usar RBAC real** para todo (no el enum de group_members).
3. (Opcional) **ACL por calendario** si quieres permisos ultra granulares.
