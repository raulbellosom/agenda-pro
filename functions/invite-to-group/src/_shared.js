import { Client, Databases, Users, ID, Query } from "node-appwrite";
import nodemailer from "nodemailer";

function must(key) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

// Appwrite sometimes exposes req.bodyJson as a getter that throws if body is empty.
// This helper makes it safe and always returns an object.
function safeBodyJson(req) {
  try {
    // Try bodyJson first (Appwrite Functions 1.6+)
    const val = req?.bodyJson;
    if (val && typeof val === "object") return val;

    // Fallback: try to parse body as string
    if (req?.body) {
      if (typeof req.body === "object") return req.body;
      if (typeof req.body === "string" && req.body.trim()) {
        try {
          return JSON.parse(req.body);
        } catch {
          // Not valid JSON
        }
      }
    }

    // Fallback: try bodyText
    if (
      req?.bodyText &&
      typeof req.bodyText === "string" &&
      req.bodyText.trim()
    ) {
      try {
        return JSON.parse(req.bodyText);
      } catch {
        // Not valid JSON
      }
    }

    return {};
  } catch {
    return {};
  }
}

function json(res, statusCode, body) {
  return res.json(body, statusCode);
}

/**
 * Generate a random token for invitation
 */
function generateToken(length = 32) {
  const chars =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Check if user has a specific permission in the group
 */
async function hasPermission(
  databases,
  databaseId,
  collections,
  groupId,
  profileId,
  permissionKey
) {
  // Get user roles in this group
  const userRoles = await databases.listDocuments(
    databaseId,
    collections.userRoles,
    [
      Query.equal("groupId", groupId),
      Query.equal("profileId", profileId),
      Query.equal("enabled", true),
      Query.limit(10),
    ]
  );

  if (userRoles.total === 0) return false;

  const roleIds = userRoles.documents.map((ur) => ur.roleId);

  // Get the permission ID for the key
  const perms = await databases.listDocuments(
    databaseId,
    collections.permissions,
    [
      Query.equal("key", permissionKey),
      Query.equal("enabled", true),
      Query.limit(1),
    ]
  );

  if (perms.total === 0) return false;
  const permissionId = perms.documents[0].$id;

  // Check if any of the user's roles has this permission
  const rolePerms = await databases.listDocuments(
    databaseId,
    collections.rolePermissions,
    [
      Query.equal("groupId", groupId),
      Query.equal("permissionId", permissionId),
      Query.equal("enabled", true),
      Query.limit(100),
    ]
  );

  // Check if any rolePermission matches user's roles
  return rolePerms.documents.some((rp) => roleIds.includes(rp.roleId));
}

/**
 * Check if user is owner or admin of the group (bypass permission check)
 */
async function isOwnerOrAdmin(
  databases,
  databaseId,
  collections,
  groupId,
  profileId
) {
  // Check if user is OWNER in group_members
  const member = await databases.listDocuments(
    databaseId,
    collections.groupMembers,
    [
      Query.equal("groupId", groupId),
      Query.equal("profileId", profileId),
      Query.equal("enabled", true),
      Query.limit(1),
    ]
  );

  if (member.total > 0 && member.documents[0].membershipRole === "OWNER") {
    return true;
  }

  return false;
}

/**
 * Create email transporter using SMTP configuration
 */
function createEmailTransporter() {
  // Obtener y limpiar variables
  const SMTP_HOST_RAW = process.env.SMTP_HOST || "";
  const SMTP_PORT_RAW = process.env.SMTP_PORT || "587";
  const SMTP_SECURE_RAW = process.env.SMTP_SECURE || "false";
  const SMTP_USER_RAW = process.env.SMTP_USER || "";
  const SMTP_PASS_RAW = process.env.SMTP_PASS || "";

  // Limpiar el host - remover cualquier protocolo, espacios, etc
  let smtpHost = SMTP_HOST_RAW.trim();
  smtpHost = smtpHost.replace(/^https?:\/\//i, ""); // Remover http:// o https://
  smtpHost = smtpHost.replace(/\/.*$/, ""); // Remover cualquier path

  const smtpPort = parseInt(SMTP_PORT_RAW.trim());
  const smtpSecure = SMTP_SECURE_RAW.trim().toLowerCase() === "true";
  const smtpUser = SMTP_USER_RAW.trim();
  const smtpPass = SMTP_PASS_RAW;

  if (!smtpHost || !smtpUser || !smtpPass) {
    return null;
  }

  // Configuración SMTP
  const config = {
    host: smtpHost,
    port: smtpPort,
    secure: smtpSecure,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  };

  // Agregar configuración TLS para STARTTLS (puerto 587)
  if (!smtpSecure) {
    config.requireTLS = true;
    config.tls = {
      rejectUnauthorized: false,
      minVersion: "TLSv1.2",
    };
  }

  return nodemailer.createTransport(config);
}

/**
 * Generate HTML email template for invitation
 */
function generateInvitationEmailHtml({
  inviterName,
  groupName,
  roleName,
  message,
  inviteLink,
  expiresAt,
  isNewUser,
}) {
  const expiresDate = new Date(expiresAt).toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const registerNote = isNewUser
    ? `<p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
        ℹ️ Si aún no tienes una cuenta, podrás registrarte al hacer clic en el botón.
      </p>`
    : "";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Invitación a ${groupName}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, sans-serif; background-color: #f3f4f6;">
  <div style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <!-- Header -->
    <div style="text-align: center; margin-bottom: 32px;">
      <div style="display: inline-block; padding: 12px 24px; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border-radius: 12px;">
        <span style="color: white; font-size: 24px; font-weight: bold;">Agenda Pro</span>
      </div>
    </div>

    <!-- Main Card -->
    <div style="background: white; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);">
      <!-- Greeting -->
      <h1 style="color: #111827; font-size: 24px; font-weight: 600; margin: 0 0 8px 0;">
        ¡Te han invitado! 🎉
      </h1>
      <p style="color: #6b7280; font-size: 16px; margin: 0 0 32px 0;">
        ${inviterName} te ha invitado a unirte a su espacio de trabajo
      </p>

      <!-- Group Card -->
      <div style="background: #f9fafb; border-radius: 12px; padding: 24px; margin-bottom: 24px;">
        <div style="display: flex; align-items: center; gap: 12px;">
          <div style="width: 48px; height: 48px; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); border-radius: 12px; display: flex; align-items: center; justify-content: center;">
            <span style="color: white; font-size: 20px; font-weight: bold;">${groupName
              .charAt(0)
              .toUpperCase()}</span>
          </div>
          <div>
            <div style="font-size: 18px; font-weight: 600; color: #111827;">${groupName}</div>
            <div style="font-size: 14px; color: #6b7280;">Rol: <strong style="color: #8b5cf6;">${roleName}</strong></div>
          </div>
        </div>
      </div>

      ${
        message
          ? `
      <!-- Message -->
      <div style="background: #eff6ff; border-left: 4px solid #3b82f6; border-radius: 0 8px 8px 0; padding: 16px; margin-bottom: 24px;">
        <p style="color: #1e40af; font-size: 14px; margin: 0; font-style: italic;">"${message}"</p>
        <p style="color: #6b7280; font-size: 12px; margin: 8px 0 0 0;">— ${inviterName}</p>
      </div>
      `
          : ""
      }

      <!-- CTA Button -->
      <div style="text-align: center; margin: 32px 0;">
        <a href="${inviteLink}" style="display: inline-block; padding: 16px 48px; background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%); color: white; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 12px; box-shadow: 0 4px 14px 0 rgba(139, 92, 246, 0.4);">
          Aceptar invitación
        </a>
      </div>

      ${registerNote}

      <!-- Expiry Notice -->
      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
        Esta invitación expira el ${expiresDate}
      </p>
    </div>

    <!-- Footer -->
    <div style="text-align: center; margin-top: 32px;">
      <p style="color: #9ca3af; font-size: 12px; margin: 0;">
        Si no esperabas esta invitación, puedes ignorar este correo.
      </p>
      <p style="color: #9ca3af; font-size: 12px; margin: 8px 0 0 0;">
        © ${new Date().getFullYear()} Agenda Pro. Todos los derechos reservados.
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

/**
 * Generate plain text email for invitation
 */
function generateInvitationEmailText({
  inviterName,
  groupName,
  roleName,
  message,
  inviteLink,
  expiresAt,
  isNewUser,
}) {
  const expiresDate = new Date(expiresAt).toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let text = `
¡Te han invitado a Agenda Pro!

${inviterName} te ha invitado a unirte al espacio "${groupName}" con el rol de ${roleName}.
`;

  if (message) {
    text += `
Mensaje de ${inviterName}:
"${message}"
`;
  }

  text += `
Para aceptar la invitación, haz clic en el siguiente enlace:
${inviteLink}

${
  isNewUser
    ? "Si aún no tienes cuenta, podrás registrarte al hacer clic en el enlace."
    : ""
}

Esta invitación expira el ${expiresDate}.

---
Si no esperabas esta invitación, puedes ignorar este correo.
© ${new Date().getFullYear()} Agenda Pro
  `.trim();

  return text;
}

/**
 * Send invitation email via SMTP
 * Returns true if sent successfully, false otherwise
 */
async function sendInvitationEmail({
  to,
  inviterName,
  inviterEmail,
  groupName,
  roleName,
  message,
  inviteLink,
  expiresAt,
  isNewUser,
}) {
  const transporter = createEmailTransporter();

  if (!transporter) {
    // SMTP not configured - skip email sending
    return false;
  }

  const fromName = process.env.SMTP_FROM_NAME || "Agenda Pro";
  const fromEmail = process.env.SMTP_FROM_EMAIL || process.env.SMTP_USER;

  const emailData = {
    inviterName,
    groupName,
    roleName,
    message,
    inviteLink,
    expiresAt,
    isNewUser,
  };

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to,
    replyTo: inviterEmail,
    subject: `${inviterName} te ha invitado a ${groupName} - Agenda Pro`,
    text: generateInvitationEmailText(emailData),
    html: generateInvitationEmailHtml(emailData),
  };

  await transporter.sendMail(mailOptions);
  return true;
}

export {
  must,
  safeBodyJson,
  json,
  generateToken,
  hasPermission,
  isOwnerOrAdmin,
  sendInvitationEmail,
  Client,
  Databases,
  Users,
  ID,
  Query,
};
