// Firebase Cloud Messaging Service Worker
// This file handles push notifications when the app is in the background

importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js"
);

// Initialize Firebase in the service worker
// Note: These values will be loaded from environment variables
// You need to update these with your actual Firebase config
firebase.initializeApp({
  apiKey: "AIzaSyDLTQBiy9VAiU8y6gOwPltsE137HnrrVsI",
  authDomain: "agendapro-cbcd2.firebaseapp.com",
  projectId: "agendapro-cbcd2",
  storageBucket: "agendapro-cbcd2.appspot.com",
  messagingSenderId: "303582144850",
  appId: "1:303582144850:web:7647f6b95ca1db1e45728b",
  measurementId: "G-WJ93BWY46Q",
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log(
    "[firebase-messaging-sw.js] Received background message:",
    payload
  );

  // Customize notification here
  const notificationTitle =
    payload.notification?.title || payload.data?.title || "Nueva notificación";

  // Use notificationId as tag to prevent duplicate notifications
  const notificationTag = payload.data?.notificationId || `notif-${Date.now()}`;

  const notificationOptions = {
    body:
      payload.notification?.body ||
      payload.data?.body ||
      "Tienes una nueva notificación",
    icon: payload.notification?.icon || "/web/android-chrome-192x192.png",
    badge: "/web/android-chrome-96x96.png",
    tag: notificationTag, // Using notificationId ensures same notification doesn't show twice
    data: {
      url: payload.data?.url || "/notifications",
      notificationId: payload.data?.notificationId,
      ...payload.data,
    },
    requireInteraction: false,
    silent: false,
    renotify: false, // Don't vibrate/sound if notification with same tag already exists
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

// Handle notification click
self.addEventListener("notificationclick", (event) => {
  console.log("[Service Worker] Notification click received.");

  event.notification.close();

  // Get URL from notification data or default to notifications page
  const urlToOpen = event.notification.data?.url || "/notifications";

  // This looks to see if the current is already open and focuses if it is
  event.waitUntil(
    clients
      .matchAll({
        type: "window",
        includeUncontrolled: true,
      })
      .then((clientList) => {
        // Check if there's already a window/tab open
        for (const client of clientList) {
          if (client.url.includes(self.location.origin) && "focus" in client) {
            return client.focus().then((client) => {
              // Navigate to the URL
              if ("navigate" in client) {
                return client.navigate(urlToOpen);
              }
            });
          }
        }
        // If no window is open, open a new one
        if (clients.openWindow) {
          return clients.openWindow(urlToOpen);
        }
      })
  );
});

// Handle push event (alternative to onBackgroundMessage)
self.addEventListener("push", (event) => {
  if (event.data) {
    console.log("[Service Worker] Push received:", event.data.text());

    try {
      const data = event.data.json();
      const title = data.title || "Nueva notificación";
      const options = {
        body: data.body || "",
        icon: data.icon || "/web/android-chrome-192x192.png",
        badge: "/web/android-chrome-96x96.png",
        tag: data.tag || "notification",
        data: data.data || {},
      };

      event.waitUntil(self.registration.showNotification(title, options));
    } catch (error) {
      console.error("[Service Worker] Error parsing push data:", error);
    }
  }
});

// Log service worker installation
self.addEventListener("install", (event) => {
  console.log("[Service Worker] Installing firebase-messaging-sw.js");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("[Service Worker] Activating firebase-messaging-sw.js");
  event.waitUntil(self.clients.claim());
});

// Handle messages from the main thread
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    console.log("[Service Worker] Received SKIP_WAITING message");
    self.skipWaiting();
  }
});
