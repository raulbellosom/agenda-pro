import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "../../shared/appwrite/client";
import { notificationService } from "../services/notificationService";
import { useToast } from "../../app/providers/ToastProvider";
import {
  requestNotificationPermission,
  listenToForegroundMessages,
  isIOS,
  isIOSStandalone,
  isIOSNotificationSupported,
} from "../firebase_config";

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const notificationsCollectionId = import.meta.env
  .VITE_APPWRITE_COLLECTION_NOTIFICATIONS_ID;

/**
 * Hook para obtener notificaciones con soporte Realtime y FCM
 */
export function useNotifications(groupId, profileId, options = {}) {
  const queryClient = useQueryClient();
  const [unreadCount, setUnreadCount] = useState(0);
  const [fcmToken, setFcmToken] = useState(null);
  const { addToast } = useToast();

  // Estado para sonidos (podría moverse a un contexto global o persistirse)
  const [soundEnabled, setSoundEnabled] = useState(() => {
    return localStorage.getItem("notification_sound_enabled") !== "false";
  });

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const newValue = !prev;
      localStorage.setItem("notification_sound_enabled", newValue);
      return newValue;
    });
  };

  // Query para cargar notificaciones
  const query = useQuery({
    queryKey: ["notifications", groupId, profileId],
    queryFn: () => notificationService.getNotifications(groupId, profileId),
    enabled: !!profileId,
    ...options,
  });

  // Initialize FCM on mount
  useEffect(() => {
    if (!profileId) return;

    let unsubscribeForeground;

    async function initializeFCM() {
      try {
        // Check iOS compatibility
        if (isIOS()) {
          if (!isIOSNotificationSupported()) {
            console.warn(
              "iOS version does not support Web Push (requires 16.4+)"
            );
            return;
          }
          if (!isIOSStandalone()) {
            console.warn(
              "iOS requires app to be installed as PWA for notifications"
            );
            return;
          }
        }

        // Register service worker
        if ("serviceWorker" in navigator) {
          // For iOS, ensure we wait for the service worker to be ready
          let registration;

          try {
            // Check if already registered
            registration = await navigator.serviceWorker.getRegistration(
              "/firebase-messaging-sw.js"
            );

            if (!registration) {
              registration = await navigator.serviceWorker.register(
                "/firebase-messaging-sw.js",
                {
                  scope: "/",
                  updateViaCache: "none", // Important for iOS
                }
              );
            } else {
            }

            // Wait for the service worker to be active
            if (registration.installing) {
              await new Promise((resolve) => {
                registration.installing.addEventListener("statechange", (e) => {
                  if (e.target.state === "activated") {
                    resolve();
                  }
                });
              });
            } else if (registration.waiting) {
              // If there's a waiting worker, activate it
              registration.waiting.postMessage({ type: "SKIP_WAITING" });
              await new Promise((resolve) => {
                navigator.serviceWorker.addEventListener(
                  "controllerchange",
                  resolve,
                  { once: true }
                );
              });
            }
          } catch (swError) {
            console.error("Service Worker registration failed:", swError);
            return;
          }

          // Request permission and get token
          const token = await requestNotificationPermission();
          if (token) {
            setFcmToken(token);

            // Save token to Appwrite using the existing notificationService
            const deviceInfo = {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              language: navigator.language,
              isIOS: isIOS(),
              isIOSPWA: isIOSStandalone(),
            };

            // Save push subscription (global, not group-specific)
            await notificationService.savePushToken(
              profileId,
              token,
              deviceInfo
            );
          }
        }

        // Listen to foreground messages
        unsubscribeForeground = listenToForegroundMessages((payload) => {
          // Show toast with FCM message
          addToast({
            title:
              payload.notification?.title ||
              payload.data?.title ||
              "Nueva notificación",
            message: payload.notification?.body || payload.data?.body || "",
            type: "info",
          });

          // Play sound if enabled
          if (soundEnabled) {
            const audio = new Audio("/sounds/notification.mp3");
            audio.play().catch((e) => console.error("Error playing sound:", e));
          }

          // Invalidate queries to refetch notifications
          queryClient.invalidateQueries(["notifications", groupId, profileId]);
        });
      } catch (error) {
        console.error("Error initializing FCM:", error);
      }
    }

    initializeFCM();

    return () => {
      if (unsubscribeForeground) {
        unsubscribeForeground();
      }
    };
  }, [profileId, soundEnabled, queryClient, groupId, addToast]);

  // ============================================================================
  // REALTIME SUBSCRIPTION (SOLO para actualizar lista)
  // ============================================================================
  // Importante: NO duplicar la lógica de toasts/sonidos aquí
  // Las notificaciones visuales y sonidos se manejan ÚNICAMENTE en FCM foreground
  // Realtime solo sirve para mantener la lista actualizada en tiempo real
  // ============================================================================
  // Suscripción Realtime a la colección de notificaciones
  // SOLO para actualizar la lista, NO para mostrar toasts (eso lo hace FCM)
  useEffect(() => {
    if (!profileId) return;

    const channelPattern = `databases.${databaseId}.collections.${notificationsCollectionId}.documents`;

    const unsubscribe = client.subscribe(channelPattern, (response) => {
      const notification = response.payload;

      // Solo procesar si es para este usuario
      // Si se especificó un groupId, filtrar también por grupo
      // Si NO se especificó groupId (es null), aceptar notificaciones de cualquier grupo
      if (notification.profileId !== profileId) {
        return;
      }

      // Si se especificó un groupId específico, verificar que coincida
      if (groupId !== null && notification.groupId !== groupId) {
        return;
      }

      // Cualquier cambio en las notificaciones: solo refrescar la lista
      // NO mostrar toasts ni sonidos aquí - eso lo maneja FCM
      if (
        response.events.includes(
          "databases.*.collections.*.documents.*.create"
        ) ||
        response.events.includes(
          "databases.*.collections.*.documents.*.update"
        ) ||
        response.events.includes("databases.*.collections.*.documents.*.delete")
      ) {
        queryClient.invalidateQueries(["notifications", groupId, profileId]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [groupId, profileId, queryClient]);

  // Calcular notificaciones no leídas
  useEffect(() => {
    if (query.data) {
      const count = query.data.filter((n) => !n.readAt).length;
      setUnreadCount(count);
    }
  }, [query.data]);

  return {
    ...query,
    unreadCount,
    soundEnabled,
    toggleSound,
    fcmToken,
  };
}

/**
 * Hook para solicitar permiso de notificaciones del navegador y FCM
 */
export function useRequestNotificationPermission() {
  const [permission, setPermission] = useState(
    "Notification" in window ? Notification.permission : "denied"
  );
  const [isRequesting, setIsRequesting] = useState(false);
  const [fcmToken, setFcmToken] = useState(null);

  const requestPermission = async () => {
    if (!("Notification" in window)) {
      console.log("This browser does not support notifications");
      return "denied";
    }

    setIsRequesting(true);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);

      if (result === "granted") {
        // Get FCM token
        const token = await requestNotificationPermission();
        if (token) {
          setFcmToken(token);
          console.log("FCM Token obtained:", token);
        }
      }

      return result;
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return "denied";
    } finally {
      setIsRequesting(false);
    }
  };

  return {
    permission,
    requestPermission,
    hasPermission: permission === "granted",
    isDenied: permission === "denied",
    isRequesting,
    fcmToken,
  };
}
