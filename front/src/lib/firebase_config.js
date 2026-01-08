// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import { getMessaging, getToken, onMessage } from "firebase/messaging";
import { env } from "../shared/appwrite/env";

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: env.firebaseApiKey,
  authDomain: env.firebaseAuthDomain,
  projectId: env.firebaseProjectId,
  storageBucket: env.firebaseStorageBucket,
  messagingSenderId: env.firebaseMessagingSenderId,
  appId: env.firebaseAppId,
  measurementId: env.firebaseMeasurementId,
};

// Initialize Firebase
let app;
let analytics;
let messaging;

try {
  app = initializeApp(firebaseConfig);
  if (typeof window !== "undefined" && env.firebaseMeasurementId) {
    analytics = getAnalytics(app);
  }
  if (typeof window !== "undefined" && "serviceWorker" in navigator) {
    messaging = getMessaging(app);
  }
} catch (error) {
  console.error("Error initializing Firebase:", error);
}

export { app, analytics, messaging };

/**
 * Request notification permission and get FCM token
 * @returns {Promise<string|null>} FCM token or null if permission denied
 */
export async function requestNotificationPermission() {
  if (!messaging) {
    console.warn("Firebase Messaging not available");
    return null;
  }

  try {
    const permission = await Notification.requestPermission();
    if (permission === "granted") {
      console.log("Notification permission granted.");

      // Get registration token
      const currentToken = await getToken(messaging, {
        vapidKey: env.firebaseVapidKey,
      });

      if (currentToken) {
        console.log("FCM Token:", currentToken);
        return currentToken;
      } else {
        console.log(
          "No registration token available. Request permission to generate one."
        );
        return null;
      }
    } else {
      console.log("Unable to get permission to notify.");
      return null;
    }
  } catch (err) {
    console.error("An error occurred while retrieving token:", err);
    return null;
  }
}

/**
 * Listen to foreground messages
 * @param {Function} callback - Callback function to handle messages
 * @returns {Function} Unsubscribe function
 */
export function listenToForegroundMessages(callback) {
  if (!messaging) {
    console.warn("Firebase Messaging not available");
    return () => {};
  }

  return onMessage(messaging, (payload) => {
    console.log("Message received in foreground:", payload);
    callback(payload);
  });
}
