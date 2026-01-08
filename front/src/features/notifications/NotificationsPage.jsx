import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import {
  Bell,
  CalendarCheck,
  UserPlus,
  MessageSquare,
  AlertCircle,
  Check,
  CheckCheck,
  Trash2,
  Filter,
  Search,
  Loader2,
  X,
} from "lucide-react";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import { useNotifications } from "../../lib/hooks/useNotifications";
import { notificationService } from "../../lib/services/notificationService";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Segmented } from "../../components/ui/Segmented";
import { NotificationDetailsModal } from "./NotificationDetailsModal";
import { useNavigate } from "react-router-dom";

// Tipos de notificación
const NOTIFICATION_KINDS = {
  EVENT_REMINDER: { label: "Recordatorios", icon: CalendarCheck },
  INVITE: { label: "Invitaciones", icon: UserPlus },
  SYSTEM: { label: "Sistema", icon: Bell },
  COMMENT: { label: "Comentarios", icon: MessageSquare },
  ALERT: { label: "Alertas", icon: AlertCircle },
};

export function NotificationsPage() {
  const { profile, activeGroup } = useWorkspace();
  const navigate = useNavigate();
  const {
    data: notifications = [],
    isLoading,
    unreadCount,
  } = useNotifications(null, profile?.$id, {
    staleTime: 30 * 1000,
  });

  // Estados para filtros y búsqueda
  const [filter, setFilter] = useState("all"); // all, unread, read
  const [kindFilter, setKindFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Filtrar y buscar notificaciones
  const filteredNotifications = useMemo(() => {
    let result = [...notifications];

    // Filtro por estado de lectura
    if (filter === "unread") {
      result = result.filter((n) => !n.readAt);
    } else if (filter === "read") {
      result = result.filter((n) => !!n.readAt);
    }

    // Filtro por tipo
    if (kindFilter !== "all") {
      result = result.filter((n) => n.kind === kindFilter);
    }

    // Búsqueda por texto
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (n) =>
          n.title?.toLowerCase().includes(query) ||
          n.body?.toLowerCase().includes(query)
      );
    }

    return result;
  }, [notifications, filter, kindFilter, searchQuery]);

  // Marcar como leída
  const handleMarkAsRead = async (notificationId) => {
    try {
      await notificationService.markAsRead(notificationId);
    } catch (error) {
      console.error("Error marking as read:", error);
    }
  };

  // Marcar todas como leídas
  const handleMarkAllAsRead = async () => {
    try {
      await notificationService.markAllAsRead(activeGroup?.$id, profile?.$id);
    } catch (error) {
      console.error("Error marking all as read:", error);
    }
  };

  // Eliminar notificación
  const handleDelete = async (notificationId) => {
    try {
      await notificationService.deleteNotification(notificationId);
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Click en notificación
  const handleNotificationClick = async (notification) => {
    // Marcar como leída
    if (!notification.readAt) {
      await handleMarkAsRead(notification.$id);
    }

    // Modal para sistema
    if (notification.kind === "SYSTEM") {
      setSelectedNotification(notification);
      return;
    }

    // Navegar a la entidad
    if (notification.entityType && notification.entityId) {
      // Si es una invitación, extraer el token del metadata
      if (
        notification.entityType === "group_invitations" &&
        notification.metadata
      ) {
        try {
          const metadata =
            typeof notification.metadata === "string"
              ? JSON.parse(notification.metadata)
              : notification.metadata;

          if (metadata.token) {
            navigate(`/invite/${metadata.token}`);
            return;
          }
        } catch (err) {
          console.error("Error parsing notification metadata:", err);
        }
      }

      const entityTypeToPath = {
        events: "/calendar",
        group_invitations: "/groups",
        calendars: "/calendar",
        groups: "/groups",
      };

      const path = entityTypeToPath[notification.entityType] || "/";
      navigate(path);
    }
  };

  return (
    <div className="h-full flex flex-col bg-[rgb(var(--bg-base))]">
      {/* Header */}
      <div className="flex-none border-b border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
                Notificaciones
              </h1>
              <p className="text-sm text-[rgb(var(--text-muted))] mt-1">
                {unreadCount > 0
                  ? `${unreadCount} ${
                      unreadCount === 1
                        ? "notificación no leída"
                        : "notificaciones no leídas"
                    }`
                  : "No hay notificaciones pendientes"}
              </p>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleMarkAllAsRead}
                leftIcon={<CheckCheck className="w-4 h-4" />}
              >
                Marcar todas como leídas
              </Button>
            )}
          </div>

          {/* Filtros */}
          <div className="space-y-4">
            {/* Búsqueda */}
            <div className="relative">
              <Input
                placeholder="Buscar notificaciones..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                icon={Search}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))]"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Filtros por estado y tipo */}
            <div className="flex flex-wrap items-center gap-4">
              <Segmented
                value={filter}
                onChange={setFilter}
                options={[
                  { value: "all", label: "Todas" },
                  { value: "unread", label: "No leídas" },
                  { value: "read", label: "Leídas" },
                ]}
              />

              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-[rgb(var(--text-muted))]" />
                <select
                  value={kindFilter}
                  onChange={(e) => setKindFilter(e.target.value)}
                  className="px-3 py-1.5 rounded-lg bg-[rgb(var(--bg-base))] border border-[rgb(var(--border-base))] text-[rgb(var(--text-primary))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))]"
                >
                  <option value="all">Todos los tipos</option>
                  {Object.entries(NOTIFICATION_KINDS).map(
                    ([key, { label }]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de notificaciones */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--text-muted))]" />
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-12">
              <Bell className="w-16 h-16 mx-auto text-[rgb(var(--text-muted))] mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">
                {searchQuery || kindFilter !== "all" || filter !== "all"
                  ? "No se encontraron notificaciones"
                  : "No hay notificaciones"}
              </h3>
              <p className="text-[rgb(var(--text-muted))]">
                {searchQuery || kindFilter !== "all" || filter !== "all"
                  ? "Intenta ajustar los filtros"
                  : "Recibirás notificaciones sobre eventos, invitaciones y más"}
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {filteredNotifications.map((notification) => (
                  <NotificationCard
                    key={notification.$id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onMarkAsRead={() => handleMarkAsRead(notification.$id)}
                    onDelete={() => handleDelete(notification.$id)}
                  />
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
        <NotificationDetailsModal
          notification={selectedNotification}
          onClose={() => setSelectedNotification(null)}
        />
      </div>
    </div>
  );
}

// Componente de tarjeta de notificación
function NotificationCard({ notification, onClick, onMarkAsRead, onDelete }) {
  const isUnread = !notification.readAt;
  const [showActions, setShowActions] = useState(false);

  // Icono según tipo
  const iconConfig = NOTIFICATION_KINDS[notification.kind] || {
    icon: Bell,
    label: "Notificación",
  };
  const Icon = iconConfig.icon;

  // Color según tipo
  const colorMap = {
    EVENT_REMINDER: "text-blue-500",
    INVITE: "text-violet-500",
    SYSTEM: "text-gray-500",
    COMMENT: "text-emerald-500",
    ALERT: "text-amber-500",
  };
  const iconColor = colorMap[notification.kind] || "text-gray-500";

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
      className={`
        relative p-4 rounded-xl border transition-all cursor-pointer
        ${
          isUnread
            ? "bg-[rgb(var(--brand-primary))]/5 border-[rgb(var(--brand-primary))]/20"
            : "bg-[rgb(var(--bg-surface))] border-[rgb(var(--border-base))]"
        }
        hover:border-[rgb(var(--brand-primary))]/40 hover:shadow-sm
      `}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Icono */}
        <div
          className={`
          flex-none w-10 h-10 rounded-xl flex items-center justify-center
          ${
            isUnread
              ? "bg-[rgb(var(--brand-primary))]/10"
              : "bg-[rgb(var(--bg-muted))]"
          }
        `}
        >
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>

        {/* Contenido */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3
              className={`font-semibold ${
                isUnread
                  ? "text-[rgb(var(--text-primary))]"
                  : "text-[rgb(var(--text-secondary))]"
              }`}
            >
              {notification.title}
            </h3>
            {isUnread && (
              <div className="flex-none w-2 h-2 rounded-full bg-[rgb(var(--brand-primary))]" />
            )}
          </div>
          {notification.body && (
            <p className="text-sm text-[rgb(var(--text-muted))] mb-2 line-clamp-2">
              {notification.body}
            </p>
          )}
          <p className="text-xs text-[rgb(var(--text-muted))]">
            {formatDistanceToNow(new Date(notification.createdAt), {
              addSuffix: true,
              locale: es,
            })}
          </p>
        </div>

        {/* Acciones (hover) */}
        <AnimatePresence>
          {showActions && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex-none flex items-center gap-1"
              onClick={(e) => e.stopPropagation()}
            >
              {isUnread && (
                <button
                  onClick={onMarkAsRead}
                  className="p-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))]"
                  title="Marcar como leída"
                >
                  <Check className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={onDelete}
                className="p-2 rounded-lg hover:bg-[rgb(var(--error))]/10 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--error))]"
                title="Eliminar"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
