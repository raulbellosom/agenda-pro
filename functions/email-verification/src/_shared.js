import nodemailer from "nodemailer";

/**
 * Obtiene una variable de entorno obligatoria.
 * Lanza un error si no está definida.
 */
export function must(key) {
  const val = process.env[key];
  if (!val) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return val;
}

/**
 * Parsea el body como JSON de forma segura
 */
export function safeBodyJson(req) {
  try {
    if (typeof req.body === "string") {
      return JSON.parse(req.body);
    }
    return req.body || {};
  } catch {
    return {};
  }
}

/**
 * Responde con JSON
 */
export function json(res, status, data) {
  return res.json(data, status, {
    "Content-Type": "application/json",
  });
}

/**
 * Template HTML para el email de verificación
 */
function normalizeFrontendUrl(frontendUrl) {
  if (!frontendUrl) return "";
  return frontendUrl.replace(/\/$/, "");
}

export function getVerificationEmailHtml(token, frontendUrl) {
  const base = normalizeFrontendUrl(frontendUrl);
  const verifyUrl = `${base}/verify-email?token=${encodeURIComponent(token)}`;
  
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verifica tu email</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 40px auto;
      background: white;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    }
    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      text-align: center;
    }
    .header h1 {
      color: white;
      margin: 0;
      font-size: 28px;
      font-weight: 600;
    }
    .content {
      padding: 40px 30px;
    }
    .content p {
      color: #374151;
      font-size: 16px;
      line-height: 1.6;
      margin: 0 0 20px 0;
    }
    .button {
      display: inline-block;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      text-decoration: none;
      padding: 14px 32px;
      border-radius: 8px;
      font-weight: 600;
      font-size: 16px;
      margin: 20px 0;
      color: #ffffff !important;
    }
    .button:hover {
      opacity: 0.9;
    }
    .footer {
      background: #f9fafb;
      padding: 30px;
      text-align: center;
      border-top: 1px solid #e5e7eb;
    }
    .footer p {
      color: #6b7280;
      font-size: 14px;
      margin: 5px 0;
    }
    .expiry {
      background: #fef3c7;
      border-left: 4px solid #f59e0b;
      padding: 12px 16px;
      margin: 20px 0;
      border-radius: 4px;
    }
    .expiry p {
      color: #92400e;
      font-size: 14px;
      margin: 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>✉️ Verifica tu email</h1>
    </div>
    <div class="content">
      <p>¡Hola!</p>
      <p>Gracias por registrarte en Agenda Pro. Para completar tu registro y poder iniciar sesión, necesitamos verificar tu dirección de email.</p>
      <p>Haz clic en el botón de abajo para verificar tu cuenta:</p>
      <center>
        <a href="${verifyUrl}" class="button">Verificar mi email</a>
      </center>
      <div class="expiry">
        <p>⏰ Este link expira en 2 horas por seguridad.</p>
      </div>
      <p>Si no creaste esta cuenta, puedes ignorar este email de forma segura.</p>
      <p style="font-size: 14px; color: #6b7280;">Si el botón no funciona, copia y pega este link en tu navegador:<br>
        <a href="${verifyUrl}" style="color: #667eea; word-break: break-all;">${verifyUrl}</a>
      </p>
    </div>
    <div class="footer">
      <p>Agenda Pro - Organiza tu tiempo</p>
      <p>Este es un email automático, por favor no respondas.</p>
    </div>
  </div>
</body>
</html>`;
}

/**
 * Envía email usando Nodemailer con SMTP
 */
export async function sendEmailWithNodemailer(to, subject, html) {
  // Obtener y limpiar variables
  const SMTP_HOST_RAW = process.env.SMTP_HOST || "";
  const SMTP_PORT_RAW = process.env.SMTP_PORT || "587";
  const SMTP_SECURE_RAW = process.env.SMTP_SECURE || "false";
  const SMTP_USER_RAW = process.env.SMTP_USER || "";
  const SMTP_PASS_RAW = process.env.SMTP_PASS || "";
  const EMAIL_FROM_RAW = process.env.EMAIL_FROM || "";
  const EMAIL_FROM_NAME = process.env.EMAIL_FROM_NAME || "Agenda Pro";
  
  // Limpiar el host - remover cualquier protocolo, espacios, etc
  let smtpHost = SMTP_HOST_RAW.trim();
  smtpHost = smtpHost.replace(/^https?:\/\//i, ''); // Remover http:// o https://
  smtpHost = smtpHost.replace(/\/.*$/, ''); // Remover cualquier path
  
  const smtpPort = parseInt(SMTP_PORT_RAW.trim());
  const smtpSecure = SMTP_SECURE_RAW.trim().toLowerCase() === "true";
  const smtpUser = SMTP_USER_RAW.trim();
  const smtpPass = SMTP_PASS_RAW;
  const emailFrom = EMAIL_FROM_RAW.trim();
  
  // Validar que tenemos los datos necesarios
  if (!smtpHost || !smtpUser || !smtpPass || !emailFrom) {
    throw new Error(`Missing SMTP configuration: host=${smtpHost}, user=${smtpUser}, from=${emailFrom}`);
  }
  
  // Log de configuración (sin contraseña)
  console.log('SMTP Config:', {
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    user: smtpUser,
    from: emailFrom
  });

  // Configuración SMTP simple y directa
  const config = {
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  };
  
  // Agregar configuración TLS solo si no es secure
  if (!smtpSecure) {
    config.requireTLS = true;
    config.tls = {
      rejectUnauthorized: false,
      minVersion: 'TLSv1.2'
    };
  }

  // Crear transportador
  const transporter = nodemailer.createTransport(config);

  // Enviar email
  const mailOptions = {
    from: `"${EMAIL_FROM_NAME}" <${emailFrom}>`,
    to: to,
    subject: subject,
    html: html,
  };
  
  console.log('Sending email to:', to);
  const info = await transporter.sendMail(mailOptions);
  console.log('Email sent successfully:', info.messageId);

  return info;
}
