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
  // Appwrite Functions 1.6+ formato directo
  return res.json(body, statusCode);
}

function splitName(fullName = "") {
  const parts = String(fullName).trim().split(" ").filter(Boolean);
  return {
    firstName: parts[0] || "",
    lastName: parts.slice(1).join(" "),
  };
}

// Base permissions for Agenda Pro (keys)
const BASE_PERMISSIONS = [
  // Groups
  "groups.view",
  "groups.edit",
  "groups.delete",
  "groups.settings",

  // Members
  "members.view",
  "members.invite",
  "members.remove",
  "members.editRoles",

  // Calendars
  "calendars.view",
  "calendars.create",
  "calendars.edit",
  "calendars.delete",

  // Events
  "events.view",
  "events.create",
  "events.edit",
  "events.delete",
  "events.editAll", // Edit events created by others

  // Notifications
  "notifications.view",
  "notifications.manage",
];

// Default role permissions mapping
const ROLE_PERMISSION_MAP = {
  Admin: [
    "groups.view",
    "groups.edit",
    "groups.settings",
    "members.view",
    "members.invite",
    "members.remove",
    "members.editRoles",
    "calendars.view",
    "calendars.create",
    "calendars.edit",
    "calendars.delete",
    "events.view",
    "events.create",
    "events.edit",
    "events.delete",
    "events.editAll",
    "notifications.view",
    "notifications.manage",
  ],
  Editor: [
    "groups.view",
    "members.view",
    "calendars.view",
    "calendars.create",
    "calendars.edit",
    "events.view",
    "events.create",
    "events.edit",
    "events.delete",
    "notifications.view",
  ],
  Viewer: [
    "groups.view",
    "members.view",
    "calendars.view",
    "events.view",
    "notifications.view",
  ],
};

export {
  must,
  safeBodyJson,
  json,
  splitName,
  Client,
  Databases,
  Users,
  ID,
  Query,
  BASE_PERMISSIONS,
  ROLE_PERMISSION_MAP,
};
