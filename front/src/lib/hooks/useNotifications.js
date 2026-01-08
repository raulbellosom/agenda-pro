import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { client } from "../../shared/appwrite/client";
import { notificationService } from "../services/notificationService";
import { useToast } from "../../app/providers/ToastProvider";
import {
  requestNotificationPermission,
  listenToForegroundMessages,
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
        // Register service worker
        if ("serviceWorker" in navigator) {
          const registration = await navigator.serviceWorker.register(
            "/firebase-messaging-sw.js",
            { scope: "/" }
          );
          console.log("FCM Service Worker registered:", registration);

          // Request permission and get token
          const token = await requestNotificationPermission();
          if (token) {
            setFcmToken(token);

            // Save token to Appwrite using the existing notificationService
            const deviceInfo = {
              userAgent: navigator.userAgent,
              platform: navigator.platform,
              language: navigator.language,
            };

            // Use the local notificationService
            await notificationService.savePushToken(
              groupId,
              profileId,
              token,
              deviceInfo
            );

            console.log("FCM token saved successfully");
          }
        }

        // Listen to foreground messages
        unsubscribeForeground = listenToForegroundMessages((payload) => {
          console.log("FCM Foreground message received:", payload);

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

  // Suscripción Realtime a la colección de notificaciones
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

      // Nueva notificación creada
      if (
        response.events.includes("databases.*.collections.*.documents.*.create")
      ) {
        // Invalidar query para recargar
        queryClient.invalidateQueries(["notifications", groupId, profileId]);

        // Mostrar notificación del navegador si tiene permisos
        showBrowserNotification(notification);

        // Mostrar Toast
        addToast({
          title: notification.title,
          message: notification.body,
          type: "info",
        });

        // Reproducir sonido si está habilitado
        if (soundEnabled) {
          const audio = new Audio("/sounds/notification.mp3");
          audio.play().catch((e) => console.error("Error playing sound:", e));
        }
      }
      // Notificación actualizada (ej: marcada como leída)
      else if (
        response.events.includes("databases.*.collections.*.documents.*.update")
      ) {
        queryClient.invalidateQueries(["notifications", groupId, profileId]);
      }
      // Notificación eliminada
      else if (
        response.events.includes("databases.*.collections.*.documents.*.delete")
      ) {
        queryClient.invalidateQueries(["notifications", groupId, profileId]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [groupId, profileId, queryClient, addToast, soundEnabled]);

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
 * Mostrar notificación del navegador usando Notification API
 */
function showBrowserNotification(notification) {
  if ("Notification" in window && Notification.permission === "granted") {
    try {
      new Notification(notification.title, {
        body: notification.body || "",
        icon: "/android/res/mipmap-xxxhdpi/ic_launcher.png",
        badge: "/android/res/mipmap-xxxhdpi/ic_launcher.png",
        tag: notification.$id,
        requireInteraction: false,
        silent: false,
      });
    } catch (error) {
      console.error("Error showing notification:", error);
    }
  }
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
    isRequesting,
    fcmToken,
  };
}
