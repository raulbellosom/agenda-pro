import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Activity,
  Search,
  Filter,
  RefreshCw,
  Eye,
  User,
  Building2,
  Calendar,
  Key,
  Edit,
  Trash2,
  LogIn,
  LogOut,
  Plus,
  ChevronDown,
  X,
  Clock,
  FileText,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import {
  useAuditLogs,
  useAllUsers,
  useAllGroups,
} from "../../lib/hooks/useAdminData";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

// Action icons mapping
const ACTION_ICONS = {
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
  LOGIN: LogIn,
  LOGOUT: LogOut,
  VIEW: Eye,
  OTHER: Activity,
};

// Action colors mapping
const ACTION_COLORS = {
  CREATE: "emerald",
  UPDATE: "blue",
  DELETE: "red",
  LOGIN: "violet",
  LOGOUT: "amber",
  VIEW: "cyan",
  OTHER: "gray",
};

// Entity type labels
const ENTITY_LABELS = {
  events: "Evento",
  calendars: "Calendario",
  groups: "Espacio",
  users: "Usuario",
  roles: "Rol",
  permissions: "Permiso",
  invitations: "Invitación",
  members: "Miembro",
};

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, x: -10 },
  show: { opacity: 1, x: 0 },
};

// Action badge component
function ActionBadge({ action }) {
  const Icon = ACTION_ICONS[action] || Activity;
  const color = ACTION_COLORS[action] || "gray";

  const colorClasses = {
    emerald: "bg-emerald-500/10 text-emerald-500",
    blue: "bg-blue-500/10 text-blue-500",
    red: "bg-red-500/10 text-red-500",
    violet: "bg-violet-500/10 text-violet-500",
    amber: "bg-amber-500/10 text-amber-500",
    cyan: "bg-cyan-500/10 text-cyan-500",
    gray: "bg-gray-500/10 text-gray-500",
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${colorClasses[color]}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {action}
    </span>
  );
}

// Entity type badge
function EntityBadge({ entityType }) {
  const label =
    ENTITY_LABELS[entityType?.toLowerCase()] || entityType || "Otro";

  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-secondary))]">
      {label}
    </span>
  );
}

// Log detail modal
function LogDetailModal({ log, users, groups, onClose }) {
  const actor = users?.find((u) => u.$id === log.profileId);
  const group = groups?.find((g) => g.$id === log.groupId);
  let parsedDetails = null;

  try {
    if (log.details) {
      parsedDetails = JSON.parse(log.details);
    }
  } catch (e) {
    parsedDetails = log.details;
  }

  // Manejo correcto del click fuera del modal para evitar cerrar al arrastrar texto
  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      const mouseDownTarget = e.target;

      const handleMouseUp = (upEvent) => {
        if (upEvent.target === mouseDownTarget) {
          onClose();
        }
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mouseup", handleMouseUp);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onMouseDown={handleOverlayMouseDown}
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-lg mx-4 bg-[rgb(var(--bg-surface))] rounded-2xl shadow-xl overflow-hidden max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-6 border-b border-[rgb(var(--border-base))] flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center">
              <FileText className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[rgb(var(--text-primary))]">
                Detalle del Log
              </h2>
              <p className="text-xs text-[rgb(var(--text-muted))]">
                ID: {log.$id}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] transition-colors"
          >
            <X className="w-5 h-5 text-[rgb(var(--text-muted))]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4 overflow-auto flex-1">
          {/* Action & Entity */}
          <div className="flex items-center gap-3">
            <ActionBadge action={log.action} />
            <EntityBadge entityType={log.entityType} />
          </div>

          {/* Info grid */}
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[rgb(var(--border-subtle))]">
              <span className="text-sm text-[rgb(var(--text-muted))]">
                Usuario actor
              </span>
              <span className="text-sm font-medium text-[rgb(var(--text-primary))] flex items-center gap-2">
                <User className="w-4 h-4 text-[rgb(var(--text-muted))]" />
                {actor
                  ? `${actor.firstName} ${actor.lastName}`
                  : log.profileId || "Sistema"}
              </span>
            </div>

            {log.groupId && (
              <div className="flex items-center justify-between py-2 border-b border-[rgb(var(--border-subtle))]">
                <span className="text-sm text-[rgb(var(--text-muted))]">
                  Espacio
                </span>
                <span className="text-sm font-medium text-[rgb(var(--text-primary))] flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[rgb(var(--text-muted))]" />
                  {group?.name || log.groupId}
                </span>
              </div>
            )}

            {log.entityName && (
              <div className="flex items-center justify-between py-2 border-b border-[rgb(var(--border-subtle))]">
                <span className="text-sm text-[rgb(var(--text-muted))]">
                  Entidad
                </span>
                <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                  {log.entityName}
                </span>
              </div>
            )}

            <div className="flex items-center justify-between py-2 border-b border-[rgb(var(--border-subtle))]">
              <span className="text-sm text-[rgb(var(--text-muted))]">
                Fecha y hora
              </span>
              <span className="text-sm text-[rgb(var(--text-primary))] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[rgb(var(--text-muted))]" />
                {new Date(log.createdAt || log.$createdAt).toLocaleString(
                  "es-ES",
                  {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  }
                )}
              </span>
            </div>

            {log.ipAddress && (
              <div className="flex items-center justify-between py-2 border-b border-[rgb(var(--border-subtle))]">
                <span className="text-sm text-[rgb(var(--text-muted))]">
                  IP Address
                </span>
                <code className="text-xs px-2 py-1 rounded bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-secondary))]">
                  {log.ipAddress}
                </code>
              </div>
            )}
          </div>

          {/* Details */}
          {parsedDetails && (
            <div className="mt-4">
              <p className="text-sm font-medium text-[rgb(var(--text-primary))] mb-2">
                Detalles adicionales
              </p>
              <pre className="p-4 rounded-lg bg-[rgb(var(--bg-muted))] text-xs text-[rgb(var(--text-secondary))] overflow-auto max-h-40">
                {typeof parsedDetails === "string"
                  ? parsedDetails
                  : JSON.stringify(parsedDetails, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))] shrink-0">
          <div className="flex gap-3 justify-end">
            <Button variant="outline" onClick={onClose}>
              Cerrar
            </Button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Main page component
export function AuditAdminPage() {
  const [filters, setFilters] = useState({});
  const {
    data: logs = [],
    isLoading,
    refetch,
    isRefetching,
  } = useAuditLogs(filters);
  const { data: users = [] } = useAllUsers();
  const { data: groups = [] } = useAllGroups();
  const [search, setSearch] = useState("");
  const [actionFilter, setActionFilter] = useState("all");
  const [selectedLog, setSelectedLog] = useState(null);

  // Filtered logs
  const filteredLogs = useMemo(() => {
    let result = logs;

    // Filter by action
    if (actionFilter !== "all") {
      result = result.filter((l) => l.action === actionFilter);
    }

    // Filter by search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (l) =>
          l.entityName?.toLowerCase().includes(searchLower) ||
          l.entityType?.toLowerCase().includes(searchLower) ||
          l.profileId?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [logs, actionFilter, search]);

  // Get actor name
  const getActorName = (profileId) => {
    const user = users.find((u) => u.$id === profileId);
    return user ? `${user.firstName} ${user.lastName}` : "Sistema";
  };

  // Get group name
  const getGroupName = (groupId) => {
    const group = groups.find((g) => g.$id === groupId);
    return group?.name || null;
  };

  // Actions for filter
  const actions = [
    "CREATE",
    "UPDATE",
    "DELETE",
    "LOGIN",
    "LOGOUT",
    "VIEW",
    "OTHER",
  ];

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6"
        >
          <div>
            <h1 className="text-2xl lg:text-3xl font-bold text-[rgb(var(--text-primary))] flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
                <Activity className="w-5 h-5 text-white" />
              </div>
              Auditoría del Sistema
            </h1>
            <p className="text-[rgb(var(--text-muted))] mt-1">
              Registro de todas las acciones realizadas en la plataforma
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isRefetching}
            leftIcon={
              <RefreshCw
                className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`}
              />
            }
          >
            Actualizar
          </Button>
        </motion.div>

        {/* Filters */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex flex-col sm:flex-row gap-3 mb-6"
        >
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-muted))]" />
            <Input
              type="text"
              placeholder="Buscar en logs..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-2 sm:pb-0">
            <button
              onClick={() => setActionFilter("all")}
              className={`px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                actionFilter === "all"
                  ? "bg-[rgb(var(--brand-primary))] text-white"
                  : "bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))]"
              }`}
            >
              Todos
            </button>
            {actions.map((action) => (
              <button
                key={action}
                onClick={() => setActionFilter(action)}
                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
                  actionFilter === action
                    ? "bg-[rgb(var(--brand-primary))] text-white"
                    : "bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))]"
                }`}
              >
                {action}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6"
        >
          <Card className="p-4">
            <p className="text-sm text-[rgb(var(--text-muted))]">Total logs</p>
            <p className="text-2xl font-bold text-[rgb(var(--text-primary))]">
              {logs.length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-[rgb(var(--text-muted))]">Creaciones</p>
            <p className="text-2xl font-bold text-emerald-500">
              {logs.filter((l) => l.action === "CREATE").length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-[rgb(var(--text-muted))]">
              Modificaciones
            </p>
            <p className="text-2xl font-bold text-blue-500">
              {logs.filter((l) => l.action === "UPDATE").length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-[rgb(var(--text-muted))]">
              Eliminaciones
            </p>
            <p className="text-2xl font-bold text-red-500">
              {logs.filter((l) => l.action === "DELETE").length}
            </p>
          </Card>
        </motion.div>

        {/* Logs list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-[rgb(var(--brand-primary))]" />
          </div>
        ) : filteredLogs.length === 0 ? (
          <Card className="p-12 text-center">
            <Activity className="w-16 h-16 mx-auto text-[rgb(var(--text-muted))] opacity-30 mb-4" />
            <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">
              No hay logs de auditoría
            </h3>
            <p className="text-[rgb(var(--text-muted))]">
              {search || actionFilter !== "all"
                ? "No se encontraron logs con los filtros aplicados"
                : "Las acciones del sistema aparecerán aquí"}
            </p>
          </Card>
        ) : (
          <Card className="overflow-hidden p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-[rgb(var(--bg-muted))] border-b border-[rgb(var(--border-base))]/40">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider">
                      Acción
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider">
                      Tipo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider">
                      Entidad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider">
                      Actor
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider hidden lg:table-cell">
                      Espacio
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <motion.tbody
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                >
                  {filteredLogs.map((log) => (
                    <motion.tr
                      key={log.$id}
                      variants={itemVariants}
                      className="border-b border-[rgb(var(--border-base))]/40 last:border-b-0 hover:bg-[rgb(var(--bg-hover))] transition-colors"
                    >
                      <td className="px-4 py-3">
                        <ActionBadge action={log.action} />
                      </td>
                      <td className="px-4 py-3">
                        <EntityBadge entityType={log.entityType} />
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-sm text-[rgb(var(--text-primary))] truncate block max-w-[150px]">
                          {log.entityName || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center">
                            <User className="w-3.5 h-3.5 text-[rgb(var(--brand-primary))]" />
                          </div>
                          <span className="text-sm text-[rgb(var(--text-secondary))] truncate max-w-[120px]">
                            {getActorName(log.profileId)}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3 hidden lg:table-cell">
                        <span className="text-sm text-[rgb(var(--text-muted))]">
                          {getGroupName(log.groupId) || "-"}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs text-[rgb(var(--text-muted))] whitespace-nowrap">
                          {new Date(
                            log.createdAt || log.$createdAt
                          ).toLocaleString("es-ES", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setSelectedLog(log)}
                          className="shrink-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </motion.tbody>
              </table>
            </div>
          </Card>
        )}

        {/* Log detail modal */}
        <AnimatePresence>
          {selectedLog && (
            <LogDetailModal
              log={selectedLog}
              users={users}
              groups={groups}
              onClose={() => setSelectedLog(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
