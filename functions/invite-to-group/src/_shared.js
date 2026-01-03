import { Client, Databases, Users, ID, Query } from "node-appwrite";

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

  if (member.total > 0 && member.documents[0].role === "OWNER") {
    return true;
  }

  return false;
}

export {
  must,
  safeBodyJson,
  json,
  generateToken,
  hasPermission,
  isOwnerOrAdmin,
  Client,
  Databases,
  Users,
  ID,
  Query,
};
