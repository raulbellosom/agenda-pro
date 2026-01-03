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
};
