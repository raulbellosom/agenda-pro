# Sistema de Verificación de Email

## Resumen

Este sistema implementa verificación de email obligatoria para nuevos usuarios. Los usuarios deben verificar su correo electrónico antes de poder iniciar sesión en la plataforma.

## Características

- ✅ Email de verificación enviado automáticamente al registrarse
- ✅ Token con expiración de 2 horas
- ✅ Bloqueo de sesión para usuarios no verificados
- ✅ Modal para reenviar email de verificación
- ✅ Página dedicada para verificar el token
- ✅ Envío de emails con Nodemailer (SMTP propio, sin servicios externos)
- ✅ Una sola función de Appwrite con 3 acciones

## Arquitectura

### Función Unificada

En lugar de 3 funciones separadas, se usa **una sola función** que maneja 3 acciones según el parámetro `action`:

1. **`action: "send"`** - Enviar email de verificación
2. **`action: "verify"`** - Verificar token del email
3. **`action: "resend"`** - Reenviar email de verificación

**Ubicación:** `functions/email-verification/`  
**Runtime:** Node.js 16.0

## Base de Datos

### Nueva Colección: `email_verifications`

Debes crear esta colección en Appwrite Console:

**Attributes:**

| Campo      | Tipo       | Required | Default | Notas                           |
| ---------- | ---------- | -------- | ------- | ------------------------------- |
| userAuthId | String(64) | ✅       |         | ID del usuario en Appwrite Auth |
| email      | Email      | ✅       |         | Email del usuario               |
| token      | String(64) | ✅       |         | Token UUID de verificación      |
| expiresAt  | Datetime   | ✅       |         | Fecha de expiración (2 horas)   |
| verified   | Boolean    | ❌       | false   | Si el token ya fue usado        |
| createdAt  | Datetime   | ❌       |         | Fecha de creación del token     |

**Indexes:**

- `uq_email_verifications_token` (unique) → `token`
- `idx_email_verifications_userAuthId` → `userAuthId`
- `idx_email_verifications_verified` → `verified`
- `idx_email_verifications_expiresAt` → `expiresAt`

### Campo Actualizado: `users_profile`

El campo `emailVerified` ya está documentado en `02_database.md`:

```markdown
| emailVerified | Boolean | ❌ | false | verificado con token |
```

## Función de Appwrite

### email-verification

**Ubicación:** `functions/email-verification/`  
**Runtime:** Node.js 16.0

**Variables de Entorno Requeridas:**

```env
# Appwrite Core
APPWRITE_FUNCTION_API_ENDPOINT=https://cloud.appwrite.io/v1
APPWRITE_FUNCTION_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key
APPWRITE_DATABASE_ID=your-database-id

# Collections
PROFILES_COLLECTION_ID=users_profile
EMAIL_VERIFICATIONS_COLLECTION_ID=email_verifications

# Frontend
FRONTEND_URL=https://yourapp.com

# SMTP (Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Settings
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Agenda Pro
```

### Acción 1: Enviar Email (`send`)

**Body:**

```json
{
  "action": "send",
  "userAuthId": "user-auth-id",
  "email": "user@example.com"
}
```

**Respuesta:**

```json
{
  "ok": true,
  "message": "Verification email sent successfully"
}
```

### Acción 2: Verificar Token (`verify`)

**Body:**

```json
{
  "action": "verify",
  "token": "verification-token"
}
```

**Respuesta exitosa:**

```json
{
  "ok": true,
  "message": "Email verified successfully"
}
```

**Respuesta error (token expirado):**

```json
{
  "ok": false,
  "error": "Token has expired",
  "expired": true
}
```

### Acción 3: Reenviar Email (`resend`)

**Body:**

```json
{
  "action": "resend",
  "email": "user@example.com"
}
```

**Respuesta:**

```json
{
  "ok": true,
  "message": "Verification email sent successfully"
}
```

## Configuración Frontend

### Variables de Entorno

Agregar al archivo `.env` del frontend:

```env
VITE_APPWRITE_FN_EMAIL_VERIFICATION_ID=function-id
```

### Rutas Agregadas

- `/verify-email?token=xxx` - Página para verificar el email con el token

## Flujo de Usuario

### 1. Registro

1. Usuario completa el formulario de registro
2. Se crea la cuenta en Appwrite Auth y `users_profile` con `emailVerified: false`
3. Se llama a la función con `action: "send"`
4. Se genera un token de verificación que expira en 2 horas
5. Se envía email con link de verificación usando Nodemailer
6. Se muestra modal indicando que debe verificar su email
7. **El usuario NO puede iniciar sesión hasta verificar**

### 2. Verificación

1. Usuario hace clic en el link del email
2. Se redirige a `/verify-email?token=xxx`
3. Se llama a la función con `action: "verify"`
4. El token se valida automáticamente
5. Si es válido:
   - Se actualiza `emailVerified: true` en `users_profile`
   - Se marca el token como usado
   - Se muestra mensaje de éxito
   - Se redirige a login
6. Si expiró:
   - Se muestra error
   - Se ofrece opción de reenviar email

### 3. Intento de Login sin Verificar

1. Usuario intenta hacer login
2. `AuthProvider` crea la sesión temporalmente
3. Verifica el campo `emailVerified` en `users_profile`
4. Si es `false`:
   - Cierra la sesión inmediatamente
   - Muestra modal de verificación
   - Permite reenviar email (con `action: "resend"`)
5. Si es `true`:
   - Continúa con el login normal

### 4. Reenviar Email

Desde el modal de verificación:

1. Usuario hace clic en "Reenviar email de verificación"
2. Se llama a la función con `action: "resend"`
3. Se invalidan tokens anteriores
4. Se genera nuevo token con 2 horas de expiración
5. Se envía nuevo email
6. Se muestra confirmación

## Configuración de SMTP

### Opción 1: Gmail

1. Habilitar verificación en 2 pasos en tu cuenta de Gmail
2. Generar contraseña de aplicación: https://myaccount.google.com/apppasswords
3. Configurar variables en Appwrite:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@gmail.com
SMTP_PASS=tu-app-password-generada
EMAIL_FROM=tu-email@gmail.com
EMAIL_FROM_NAME=Agenda Pro
```

### Opción 2: Outlook/Hotmail

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=tu-email@outlook.com
SMTP_PASS=tu-contraseña
EMAIL_FROM=tu-email@outlook.com
EMAIL_FROM_NAME=Agenda Pro
```

### Opción 3: SMTP Personalizado

```env
SMTP_HOST=mail.tudominio.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=noreply@tudominio.com
SMTP_PASS=tu-contraseña-smtp
EMAIL_FROM=noreply@tudominio.com
EMAIL_FROM_NAME=Agenda Pro
```

### Opción 4: SSL/TLS (Puerto 465)

```env
SMTP_HOST=smtp.tuservidor.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=tu-usuario
SMTP_PASS=tu-contraseña
EMAIL_FROM=noreply@tudominio.com
EMAIL_FROM_NAME=Agenda Pro
```

## Seguridad

### Consideraciones

1. **Token Único por Usuario**: Los tokens anteriores se invalidan al generar uno nuevo
2. **Expiración**: Tokens expiran en 2 horas
3. **Uso Único**: Cada token solo puede usarse una vez
4. **Credenciales SMTP**: Nunca expongas las credenciales SMTP en el código
5. **Variables de Entorno**: Todas las credenciales se configuran en Appwrite Console

### Mejoras Sugeridas

1. **Rate Limiting**: Limitar reenvíos de email (ej: máximo 3 por hora)
2. **Logs de Auditoría**: Registrar intentos de verificación
3. **DKIM/SPF**: Configurar autenticación de email en tu dominio
4. **Captcha**: Agregar en formulario de registro y reenvío

## Testing

### Desarrollo Local

Para testing sin configurar SMTP, puedes usar servicios como:

- **Mailtrap** (https://mailtrap.io) - SMTP de prueba
- **Ethereal** (https://ethereal.email) - Emails temporales

Configuración de ejemplo con Ethereal:

```env
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=usuario-generado@ethereal.email
SMTP_PASS=contraseña-generada
EMAIL_FROM=usuario-generado@ethereal.email
EMAIL_FROM_NAME=Agenda Pro
```

### Producción

1. Configurar SMTP real (Gmail, Outlook, o servidor propio)
2. Verificar dominio del sender si usas servidor propio
3. Probar flujo completo end-to-end
4. Verificar carpeta de spam

## Troubleshooting

### Email no llega

1. Verificar credenciales SMTP en variables de entorno de Appwrite
2. Revisar logs de la función en Appwrite Console
3. Verificar carpeta de spam
4. Confirmar que el puerto SMTP no esté bloqueado por firewall
5. Gmail: Verificar que la contraseña de aplicación sea correcta
6. Verificar que `EMAIL_FROM` coincida con `SMTP_USER`

### Error de autenticación SMTP

1. Verificar que `SMTP_USER` y `SMTP_PASS` sean correctos
2. Gmail: Asegurarse de usar contraseña de aplicación, no la contraseña normal
3. Verificar que la cuenta permita "aplicaciones menos seguras" si aplica
4. Outlook: Verificar que no haya restricciones de seguridad

### Token inválido

1. Verificar que no haya expirado (2 horas)
2. Confirmar que no fue usado previamente
3. Revisar que el token en la URL esté completo
4. Verificar que el índice único `uq_email_verifications_token` exista

### Usuario no puede iniciar sesión

1. Verificar que `emailVerified: true` en `users_profile`
2. Revisar logs del `AuthProvider` en el navegador
3. Confirmar que la colección `email_verifications` existe
4. Verificar que el FUNCTION_ID esté configurado en el frontend

### Función no se ejecuta

1. Verificar que el runtime sea Node.js 16.0
2. Confirmar que todas las variables de entorno estén configuradas
3. Revisar logs de ejecución en Appwrite Console
4. Verificar que `package.json` incluya `nodemailer`

## Checklist de Implementación

- [ ] Crear colección `email_verifications` en Appwrite Console
- [ ] Agregar 4 índices a la colección
- [ ] Crear función `email-verification` en Appwrite
- [ ] Seleccionar runtime Node.js 16.0
- [ ] Subir código de `functions/email-verification/`
- [ ] Configurar variables de entorno en Appwrite Console:
  - [ ] APPWRITE_FUNCTION_API_ENDPOINT
  - [ ] APPWRITE_FUNCTION_PROJECT_ID
  - [ ] APPWRITE_API_KEY
  - [ ] APPWRITE_DATABASE_ID
  - [ ] PROFILES_COLLECTION_ID
  - [ ] EMAIL_VERIFICATIONS_COLLECTION_ID
  - [ ] FRONTEND_URL
  - [ ] SMTP_HOST
  - [ ] SMTP_PORT
  - [ ] SMTP_SECURE
  - [ ] SMTP_USER
  - [ ] SMTP_PASS
  - [ ] EMAIL_FROM
  - [ ] EMAIL_FROM_NAME
- [ ] Activar la función y copiar el FUNCTION_ID
- [ ] Agregar `VITE_APPWRITE_FN_EMAIL_VERIFICATION_ID` al `.env` del frontend
- [ ] Configurar cuenta SMTP (Gmail, Outlook, o servidor propio)
- [ ] Probar flujo completo: registro → email → verificación → login
- [ ] Verificar que los emails lleguen correctamente
- [ ] Probar reenvío de email
- [ ] (Opcional) Configurar DKIM/SPF en dominio

## Archivos del Sistema

### Backend

- `functions/email-verification/src/index.js` - Lógica principal (3 acciones)
- `functions/email-verification/src/_shared.js` - Helpers, template HTML y Nodemailer
- `functions/email-verification/package.json` - Dependencias (node-appwrite, nodemailer)
- `functions/email-verification/.env.example` - Ejemplo de variables de entorno

### Frontend

- `front/src/app/providers/AuthProvider.jsx` - Lógica de verificación y llamadas a la función
- `front/src/components/EmailVerificationModal.jsx` - Modal de verificación
- `front/src/features/auth/VerifyEmailPage.jsx` - Página de verificación del token
- `front/src/shared/appwrite/env.js` - Variables de entorno (FUNCTION_ID)
- `front/.env.example` - Ejemplo de variables necesarias

## Recursos

- [Nodemailer Docs](https://nodemailer.com/about/)
- [Gmail App Passwords](https://support.google.com/accounts/answer/185833)
- [Appwrite Functions](https://appwrite.io/docs/products/functions)
- [Appwrite Auth](https://appwrite.io/docs/products/auth)
- [Mailtrap - SMTP Testing](https://mailtrap.io)
