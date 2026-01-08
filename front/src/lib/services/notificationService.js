import { Query, ID } from "appwrite";
import { databases } from "../../shared/appwrite/client";

const databaseId = import.meta.env.VITE_APPWRITE_DATABASE_ID;
const notificationsCollectionId = import.meta.env
  .VITE_APPWRITE_COLLECTION_NOTIFICATIONS_ID;
const pushSubscriptionsCollectionId = import.meta.env
  .VITE_APPWRITE_COLLECTION_PUSH_SUBSCRIPTIONS_ID;

export const notificationService = {
  /**
   * Obtener notificaciones del usuario
   */
  async getNotifications(groupId, profileId, limit = 50) {
    const queries = [
      Query.equal("profileId", profileId),
      Query.equal("enabled", true),
      Query.orderDesc("createdAt"),
      Query.limit(limit),
    ];

    if (groupId) {
      queries.push(Query.equal("groupId", groupId));
    }

    const response = await databases.listDocuments(
      databaseId,
      notificationsCollectionId,
      queries
    );
    return response.documents;
  },

  /**
   * Obtener solo no leídas
   */
  async getUnreadNotifications(groupId, profileId) {
    const queries = [
      Query.equal("profileId", profileId),
      Query.equal("enabled", true),
      Query.isNull("readAt"),
      Query.orderDesc("createdAt"),
    ];

    if (groupId) {
      queries.push(Query.equal("groupId", groupId));
    }

    const response = await databases.listDocuments(
      databaseId,
      notificationsCollectionId,
      queries
    );
    return response.documents;
  },

  /**
   * Marcar como leída
   */
  async markAsRead(notificationId) {
    return await databases.updateDocument(
      databaseId,
      notificationsCollectionId,
      notificationId,
      { readAt: new Date().toISOString() }
    );
  },

  /**
   * Marcar todas como leídas
   */
  async markAllAsRead(groupId, profileId) {
    const unread = await this.getUnreadNotifications(groupId, profileId);

    const promises = unread.map((n) => this.markAsRead(n.$id));

    return await Promise.all(promises);
  },

  /**
   * Eliminar notificación (soft delete)
   */
  async deleteNotification(notificationId) {
    return await databases.updateDocument(
      databaseId,
      notificationsCollectionId,
      notificationId,
      { enabled: false }
    );
  },

  /**
   * Obtener contador de no leídas
   */
  async getUnreadCount(groupId, profileId) {
    const response = await databases.listDocuments(
      databaseId,
      notificationsCollectionId,
      [
        Query.equal("groupId", groupId),
        Query.equal("profileId", profileId),
        Query.equal("enabled", true),
        Query.isNull("readAt"),
        Query.limit(1), // Solo necesitamos el count
      ]
    );
    return response.total;
  },

  /**
   * Guardar token FCM (suscripciones push son globales del usuario, no por grupo)
   */
  async savePushToken(profileId, token, deviceInfo = {}) {
    try {
      // Para FCM, usamos el campo 'endpoint' para almacenar el token
      // y dejamos p256dh y auth vacíos (son para Web Push nativo)

      // Check if token already exists using endpoint field
      const existing = await databases.listDocuments(
        databaseId,
        pushSubscriptionsCollectionId,
        [Query.equal("endpoint", token), Query.equal("profileId", profileId)]
      );

      const now = new Date().toISOString();

      if (existing.documents.length > 0) {
        // Update existing subscription
        return await databases.updateDocument(
          databaseId,
          pushSubscriptionsCollectionId,
          existing.documents[0].$id,
          {
            lastUsedAt: now,
            userAgent: deviceInfo.userAgent || "",
            isActive: true,
          }
        );
      }

      // Create new subscription (sin groupId, las suscripciones son globales)
      const response = await databases.createDocument(
        databaseId,
        pushSubscriptionsCollectionId,
        ID.unique(),
        {
          profileId,
          endpoint: token, // FCM token stored as endpoint
          p256dh: "fcm", // Marker to indicate this is FCM, not Web Push
          auth: "fcm", // Marker to indicate this is FCM
          userAgent: deviceInfo.userAgent || "",
          isActive: true,
          createdAt: now,
          lastUsedAt: now,
          enabled: true,
        }
      );
      return response;
    } catch (error) {
      console.error("Error saving push token:", error);
      throw error;
    }
  },

  /**
   * Eliminar token FCM
   */
  async removePushToken(token) {
    try {
      const subscriptions = await databases.listDocuments(
        databaseId,
        pushSubscriptionsCollectionId,
        [Query.equal("endpoint", token)]
      );

      const promises = subscriptions.documents.map((sub) =>
        databases.deleteDocument(
          databaseId,
          pushSubscriptionsCollectionId,
          sub.$id
        )
      );

      await Promise.all(promises);
    } catch (error) {
      console.error("Error removing push token:", error);
      throw error;
    }
  },
};
