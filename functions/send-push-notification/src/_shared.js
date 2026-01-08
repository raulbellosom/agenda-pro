export { Client, Databases, Query, ID } from "node-appwrite";
export { initializeApp, cert } from "firebase-admin/app";
export { getMessaging } from "firebase-admin/messaging";

/**
 * Helper para obtener env vars requeridas
 */
export function must(key) {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value;
}

/**
 * Helper para parsear body JSON
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
 * Helper para enviar respuestas JSON
 */
export function json(res, status, data) {
  return res.json(data, status);
}
