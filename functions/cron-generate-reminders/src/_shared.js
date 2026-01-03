import { Client, Databases, ID, Query } from "node-appwrite";

function must(key) {
  const v = process.env[key];
  if (!v) throw new Error(`Missing env var: ${key}`);
  return v;
}

function json(res, statusCode, body) {
  return res.json(body, statusCode);
}

/**
 * Calculate the reminder trigger time based on event start and reminder config
 */
function calculateTriggerTime(eventStartAt, reminder) {
  if (reminder.type === "AT_TIME" && reminder.atTime) {
    return new Date(reminder.atTime);
  }

  if (reminder.type === "MINUTES_BEFORE" && reminder.minutesBefore) {
    const triggerTime = new Date(eventStartAt);
    triggerTime.setMinutes(triggerTime.getMinutes() - reminder.minutesBefore);
    return triggerTime;
  }

  return null;
}

export { must, json, calculateTriggerTime, Client, Databases, ID, Query };
