# agenda-pro-js/functions

Aquí se encuentran todas las Appwrite Functions (Node.js) del proyecto:

## Funciones Core

- **create-user-with-profile** - Crea usuario en Auth y perfil en DB
- **ensure-profile** - Asegura que un usuario tenga perfil (trigger users.create)
- **create-group-with-defaults** - Crea grupo con roles y permisos por defecto

## Funciones de Grupos e Invitaciones

- **invite-to-group** - Envía invitación a un usuario para unirse a un grupo
- **accept-invitation** - Procesa la aceptación de una invitación

## Funciones de Email Verification

- **send-verification-email** - Envía email de verificación al registrarse
- **verify-email-token** - Verifica el token del email
- **resend-verification-email** - Reenvía email de verificación

📖 Ver [EMAIL_VERIFICATION.md](./EMAIL_VERIFICATION.md) para documentación completa

## Funciones CRON

- **cron-expire-invitations** - Expira invitaciones vencidas
- **cron-generate-reminders** - Genera recordatorios de eventos

## Migración

- **migration-email-verified.js** - Script para migrar usuarios existentes

---

Ver la documentación en `/documentation` para más detalles de cada función.
