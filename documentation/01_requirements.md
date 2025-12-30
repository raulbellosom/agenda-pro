# Agenda Pro — Requerimientos y Arquitectura (v0.1)

> Proyecto: **agenda-pro**  
> Enfoque inicial: **Agenda / Calendario + eventos + notificaciones en tiempo real**  
> Evolución futura: **módulos habilitables por suscripción** (feature flags / entitlements)

---

## 1) Objetivo del producto

Construir una **aplicación de agenda** “premium” (UI sofisticada, innovadora, con excelente UX táctil) que funcione:

- 100% **responsiva** (teléfono → tablet → laptop → desktop).
- Como **PWA** (instalable, offline-first para lectura, sincronización cuando haya internet).
- Con **tiempo real** (cambios reflejados al instante, colaboración y notificaciones).

El backend será una **instancia self-hosted de Appwrite** (API endpoint): `https://appwrite.racoondevs.com/v1`.

---

## 2) Principios clave (no negociables)

### 2.1 UX / Diseño
- UI moderna, limpia, con **paleta corporativa** basada en **naranja** (brand).
- Motion “con intención” (transiciones suaves, microinteracciones).
- Gestos nativos: swipe, long-press, drag & drop (cuando aplique).
- Accesibilidad: teclado, contraste, tamaños táctiles, “reduce motion”.

### 2.2 Robustez / Datos
- **Soft delete** por default (campo `enabled`).
- Auditoría de acciones sensibles.
- Multi-tenant por **Group (tenant)**.
- **RBAC** (roles / permisos) desacoplado de Teams de Appwrite.

### 2.3 Performance
- Virtualización donde aplique (listas grandes).
- Caching inteligente con React Query.
- Carga rápida, skeletons, imágenes optimizadas.

---

## 3) Roles, permisos y seguridad (RBAC)

### 3.1 Conceptos
- **User (Auth)**: usuario en Appwrite Auth.
- **Profile (users_profile)**: datos extendidos del usuario.
- **Group (tenant)**: “espacio” donde viven calendarios y eventos.
- **Membership**: relación usuario ↔ group (owner/member).
- **Role**: conjunto de permisos dentro de un group.
- **Permission**: capacidad granular (ej: `events.create`, `calendar.share`).

### 3.2 Acceso por defecto
- Un usuario puede:
  - Tener múltiples grupos.
  - Tener roles distintos por grupo.
- El “platform admin” existe (flag `isPlatformAdmin`), pero se usa solo para operaciones globales.

### 3.3 Requisitos funcionales de seguridad
- Invitar usuarios por email a un group (invitación con token y expiración).
- Cambiar roles por usuario dentro de un group.
- Bloquear acceso a módulos por “entitlements” (futuro).

---

## 4) Módulos (MVP + Roadmap)

### 4.1 Módulo 01 — Autenticación
**MVP**
- Registro / Login / Logout (Appwrite Auth).
- Recuperación de contraseña (Appwrite).
- Creación automática de `users_profile` al registrarse.
- Selector de grupo (si pertenece a varios).
- Preferencias: tema (light/dark), idioma, zona horaria.

**Roadmap**
- SSO (Google/Apple), passkeys, 2FA.

---

### 4.2 Módulo 02 — Grupos (Tenancy)
**MVP**
- Crear grupo.
- Ver grupos del usuario.
- Cambiar grupo activo.
- Gestión de miembros (alta/baja lógica).

**Roadmap**
- Branding por grupo (logo, colores).
- Políticas por grupo (por ejemplo: invitaciones abiertas/cerradas).

---

### 4.3 Módulo 03 — Invitaciones
**MVP**
- Invitar por email a un group (rol inicial).
- Aceptar/Rechazar invitación (con token).
- Expiración automática (por fecha).
- Reenviar invitación.

**Roadmap**
- Invitaciones por link único.
- Invitaciones con “dominio permitido”.

---

### 4.4 Módulo 04 — Calendarios
**MVP**
- Crear/editar/eliminar (soft) calendarios.
- Colores por calendario.
- Compartir dentro del group según permisos.
- “Calendario personal” por defecto para cada usuario dentro del grupo.

**Roadmap**
- Calendarios externos (ICS/Google) (solo si aplica).

---

### 4.5 Módulo 05 — Eventos
**MVP**
- CRUD de eventos.
- Tipos: *single* y *recurrente*.
- Campos base:
  - título, descripción, ubicación, fecha/hora inicio-fin, todo el día
  - calendarioId, ownerProfileId
  - participantes internos (members), invitados externos (emails)
  - recordatorios
  - etiquetas (tags)
- Vistas:
  - **Agenda (lista)**
  - **Día**
  - **Semana**
  - **Mes**
- Búsqueda rápida (por título/descripción).

**Roadmap**
- Adjuntos por evento.
- Plantillas de eventos.
- “Event AI assist” (futuro).

---

### 4.6 Módulo 06 — Recordatorios y Notificaciones
**MVP**
- Recordatorios: *N minutos antes*, *a una hora exacta*, *un día antes*.
- Notificaciones in-app en tiempo real.
- Cola de notificaciones (persistencia).

**Roadmap**
- Push Notifications (Web Push / Android).
- “Snooze” y acciones rápidas.

> Nota: la ejecución confiable de recordatorios y push se hará en **Functions** (más adelante).

---

### 4.7 Módulo 07 — Tiempo real / Colaboración
**MVP**
- Suscripción a cambios del grupo (calendarios, eventos, invitaciones).
- Actualización instantánea de UI (React Query cache updates).

**Roadmap**
- Co-edición / locking optimista.
- Comentarios por evento.

---

### 4.8 Módulo 08 — Auditoría
**MVP**
- Log de acciones sensibles:
  - auth (login/logout)
  - cambios de roles
  - cambios en eventos (create/update/delete)
  - invitaciones
- Capturar: actor, entidad, timestamps, metadata.

**Roadmap**
- Exportación a CSV.
- Retención configurable.

---

### 4.9 Módulo 09 — Configuración y Preferencias
**MVP**
- Preferencias de usuario: tema, semana inicia en lunes/domingo, formato 12/24h.
- Preferencias por grupo: zona horaria default del grupo.

**Roadmap**
- Preferencias por calendario.
- Configuración avanzada de notificaciones.

---

### 4.10 Módulo 10 — Suscripciones y Feature Flags (preparado)
**No se vende en MVP**, pero se deja listo:
- `plans` / `subscriptions` / `entitlements`.
- En frontend: guardas de rutas/vistas por entitlement.
- En backend: validación de permisos + entitlements.

---

## 5) Stack tecnológico (frontend)

Basado en tu stack actual (y lo que ya te funciona):

- **React 19 + Vite**
- **TailwindCSS 4.1** (tokens CSS con variables + dark variant manual)
- **Framer Motion**
- **Lucide Icons**
- **@tanstack/react-query**
- **Recharts** (métricas y analítica futura)
- **date-fns** (fechas)
- **Appwrite SDK** (`appwrite`)
- **Axios** (si se requieren llamadas custom)
- **@use-gesture/react** (gestos)
- Calendario: evaluación entre:
  - `react-big-calendar` (rápido para empezar)
  - o UI propia (para “nunca antes vista”) con base en date-fns + gestos

PWA:
- `vite-plugin-pwa` con `registerType: autoUpdate` y manifest con theme color brand.

---

## 6) Requisitos no funcionales

- **Offline**: lectura de agenda y últimos eventos cacheados (React Query persist + service worker).
- **Sincronización**: al reconectar, resolver conflictos (estrategia: “last write wins” en MVP).
- **Seguridad**: validaciones server-side con Appwrite permissions y RBAC propio.
- **Observabilidad**: logs de errores (Sentry o similar futuro).
- **Internacionalización**: listo para i18n (es-MX primero).

---

## 7) Entregables (este sprint de documentación)

1. `documentation/01_requirements.md` ✅ (este archivo)
2. `documentation/02_database.md` ✅ (siguiente archivo: modelo de datos Appwrite)

---

## 8) Criterios de aceptación para iniciar frontend (cuando tú digas “listo”)

- BD definida con:
  - identidad, groups, memberships, RBAC, invitations, audit
  - calendario + eventos + recordatorios + notificaciones
- Lista de endpoints/queries objetivo (Appwrite SDK).
- Wireframe de navegación (básico): sidebar/bottom-nav, views Day/Week/Month/Agenda.
