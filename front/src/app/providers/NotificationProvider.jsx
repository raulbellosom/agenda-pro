import React, { createContext, useContext, useEffect } from "react";
import { useAuth } from "./AuthProvider";
import { useNotifications } from "../../lib/hooks/useNotifications";

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

  // Don't render notifications for unauthenticated users
  if (!user || !profile) {
    return <>{children}</>;
  }

  return (
    <NotificationContext.Provider value={notificationState}>
      {children}
    </NotificationContext.Provider>
  );
}
