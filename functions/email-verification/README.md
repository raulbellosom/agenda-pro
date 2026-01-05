# Email Verification Function

Esta función maneja el flujo completo de verificación de email:
- **send**: Enviar email de verificación al registrarse
- **verify**: Verificar el token del link (sin autenticación)
- **resend**: Reenviar email de verificación

## ⚠️ CONFIGURACIÓN CRÍTICA

### 1. Hacer la función pública (permitir ejecución sin autenticación)

La acción **"verify"** DEBE ser accesible sin autenticación porque:
- El usuario NO tiene sesión activa hasta verificar su email
- El link de verificación se abre en el navegador sin estar logueado
- La función usa `APPWRITE_API_KEY` para actualizar la base de datos (no depende de la sesión del usuario)

**En Appwrite Console:**
1. Ve a Functions → `email-verification`
2. Settings → Execute Access
3. Añade el rol: **`any`** o **`guests`**
4. Guarda los cambios

### 2. Variables de entorno requeridas

```env
# Appwrite Core
APPWRITE_FUNCTION_PROJECT_ID=your-project-id
APPWRITE_API_KEY=your-api-key-with-db-write-permissions
APPWRITE_DATABASE_ID=your-database-id

# Collections
PROFILES_COLLECTION_ID=users_profile
EMAIL_VERIFICATIONS_COLLECTION_ID=email_verifications

# Frontend URL (sin trailing slash)
FRONTEND_URL=https://agendapro.racoondevs.com

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Email Settings
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Agenda Pro
```

### 3. Endpoints

**Enviar verificación (requiere autenticación en el contexto de registro):**
```json
POST /v1/functions/{functionId}/executions
{
  "body": "{\"action\":\"send\",\"userAuthId\":\"...\",\"email\":\"user@example.com\"}"
}
```

**Verificar token (público, sin autenticación):**
```json
POST /v1/functions/{functionId}/executions
{
  "body": "{\"action\":\"verify\",\"token\":\"695be612002065925ac6\"}"
}
```

**Reenviar email (requiere autenticación):**
```json
POST /v1/functions/{functionId}/executions
{
  "body": "{\"action\":\"resend\",\"email\":\"user@example.com\"}"
}
```

## Flujo de verificación

1. Usuario se registra → `create-user-with-profile` crea usuario con `emailVerified: false`
2. Se llama a esta función con `action: "send"` → envía email con token
3. Usuario hace click en el link del email → abre `/verify-email?token=...`
4. Frontend llama a la función con `action: "verify"` (fetch público, sin sesión)
5. Función valida el token y actualiza `emailVerified: true` en el perfil
6. Usuario puede hacer login

## Solución de problemas

### Error 401 al verificar email
**Causa:** La función no está configurada como pública  
**Solución:** Añade rol `any` o `guests` en Execute Access

### Email no se envía
**Verifica:**
- Variables SMTP correctas (sin protocolos en SMTP_HOST)
- App password de Gmail (no contraseña normal)
- Logs de la función en Appwrite Console

### Link de verificación da 404
**Verifica:**
- `FRONTEND_URL` configurado correctamente (sin trailing slash)
- Ruta `/verify-email` existe en el frontend
- El token está en la URL: `?token=...`

### Login permite entrar sin verificar
**Causa:** El perfil no tiene `emailVerified: false` al crearse  
**Solución:** Actualiza `create-user-with-profile` para incluir este campo
