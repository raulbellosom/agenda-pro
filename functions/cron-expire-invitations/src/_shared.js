import { Client, Databases, ID, Query } from "node-appwrite";

function must(key) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

function json(res, statusCode, body) {
  return res.json(body, statusCode);
}

export { must, json, Client, Databases, ID, Query };
