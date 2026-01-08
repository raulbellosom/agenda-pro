import React, { createContext, useContext, useEffect, useState } from "react";
import { useAuth } from "./AuthProvider";
import { useNotifications } from "../../lib/hooks/useNotifications";
import { NotificationPermissionPrompt } from "../../features/notifications/NotificationPermissionPrompt";

const NotificationContext = createContext({});

export function useNotificationContext() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error(
      "useNotificationContext must be used within NotificationProvider"
    );
  }
  return context;
}

export function NotificationProvider({ children }) {
  const { user, profile } = useAuth();
  const [showPermissionPrompt, setShowPermissionPrompt] = useState(false);

  const notificationState = useNotifications(null, profile?.$id, {
    staleTime: 30 * 1000,
  });

  // Log notification state for debugging
  useEffect(() => {
    if (notificationState.fcmToken) {
      console.log("FCM Token initialized:", notificationState.fcmToken);
    }
  }, [notificationState.fcmToken]);

  useEffect(() => {
    if (notificationState.unreadCount > 0) {
      console.log("Unread notifications:", notificationState.unreadCount);
    }
  }, [notificationState.unreadCount]);

  // Auto-request notification permission on first visit
  useEffect(() => {
    if (!user || !profile) return;

    // Check if we've already asked before
    const hasAskedBefore = localStorage.getItem(
      "notification_permission_asked"
    );
    const notificationPermission =
      "Notification" in window ? Notification.permission : "denied";

    // If we haven't asked and permission is default (not granted/denied), show prompt after a delay
    if (!hasAskedBefore && notificationPermission === "default") {
      const timer = setTimeout(() => {
        setShowPermissionPrompt(true);
        localStorage.setItem("notification_permission_asked", "true");
      }, 3000); // Show after 3 seconds

      return () => clearTimeout(timer);
    }
  }, [user, profile]);

  // Don't render notifications for unauthenticated users
  if (!user || !profile) {
    return <>{children}</>;
  }

  return (
    <NotificationContext.Provider value={notificationState}>
      {/* Show permission prompt if needed */}
      {showPermissionPrompt && (
        <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 max-w-2xl w-full px-4">
          <NotificationPermissionPrompt
            onClose={() => setShowPermissionPrompt(false)}
          />
        </div>
      )}
      {children}
    </NotificationContext.Provider>
  );
}
