import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Building2,
  Search,
  Filter,
  Users,
  Calendar,
  CalendarDays,
  MoreVertical,
  Eye,
  Trash2,
  Shield,
  RefreshCw,
  AlertTriangle,
  Crown,
  Clock,
  ChevronDown,
  X,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
import { useAllGroups, useGroupStats } from "../../lib/hooks/useAdminData";
import { useAllUsers } from "../../lib/hooks/useAdminData";
import { Card } from "../../components/ui/Card";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

// Status badge component
function StatusBadge({ enabled }) {
  if (enabled !== false) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-500">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
        Activo
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-500/10 text-red-500">
      <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
      Desactivado
    </span>
  );
}

// Group Stats Component
function GroupStatsRow({ groupId }) {
  const { data: stats, isLoading } = useGroupStats(groupId);

  if (isLoading) {
    return (
      <div className="flex gap-4 text-xs text-[rgb(var(--text-muted))]">
        <span>Cargando...</span>
      </div>
    );
  }

  return (
    <div className="flex gap-4 text-xs text-[rgb(var(--text-muted))]">
      <span className="flex items-center gap-1">
        <Users className="w-3.5 h-3.5" />
        {stats?.membersCount || 0} miembros
      </span>
      <span className="flex items-center gap-1">
        <Calendar className="w-3.5 h-3.5" />
        {stats?.calendarsCount || 0} calendarios
      </span>
      <span className="flex items-center gap-1">
        <CalendarDays className="w-3.5 h-3.5" />
        {stats?.eventsCount || 0} eventos
      </span>
    </div>
  );
}

// Group detail modal
function GroupDetailModal({ group, users, onClose }) {
  const { data: stats } = useGroupStats(group.$id);
  const owner = users?.find((u) => u.authId === group.ownerAuthId);

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
        className="w-full max-w-lg mx-4 bg-[rgb(var(--bg-surface))] rounded-2xl shadow-xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative p-6 border-b border-[rgb(var(--border-base))]">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: `linear-gradient(135deg, ${
                group.color || "#8B5CF6"
              } 0%, transparent 70%)`,
            }}
          />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-white font-bold text-xl"
                style={{ backgroundColor: group.color || "#8B5CF6" }}
              >
                {group.name?.charAt(0)?.toUpperCase() || "G"}
              </div>
              <div>
                <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">
                  {group.name}
                </h2>
                <p className="text-sm text-[rgb(var(--text-muted))]">
                  {group.description || "Sin descripción"}
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
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 sm:gap-4">
            <div className="p-3 sm:p-4 rounded-xl bg-[rgb(var(--bg-muted))]">
              <div className="flex items-center gap-1 sm:gap-2 text-[rgb(var(--text-muted))] mb-1">
                <Users className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-xs">Miembros</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-[rgb(var(--text-primary))]">
                {stats?.membersCount || 0}
              </p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-[rgb(var(--bg-muted))]">
              <div className="flex items-center gap-1 sm:gap-2 text-[rgb(var(--text-muted))] mb-1">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-xs">Calendarios</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-[rgb(var(--text-primary))]">
                {stats?.calendarsCount || 0}
              </p>
            </div>
            <div className="p-3 sm:p-4 rounded-xl bg-[rgb(var(--bg-muted))]">
              <div className="flex items-center gap-1 sm:gap-2 text-[rgb(var(--text-muted))] mb-1">
                <CalendarDays className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="text-[10px] sm:text-xs">Eventos</span>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-[rgb(var(--text-primary))]">
                {stats?.eventsCount || 0}
              </p>
            </div>
          </div>

          {/* Info */}
          <div className="space-y-3">
            <div className="flex items-center justify-between py-2 border-b border-[rgb(var(--border-base))]/30">
              <span className="text-sm text-[rgb(var(--text-muted))]">
                Propietario
              </span>
              <div className="flex items-center gap-2">
                <Crown className="w-4 h-4 text-amber-500" />
                <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                  {owner
                    ? `${owner.firstName} ${owner.lastName}`
                    : "Desconocido"}
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[rgb(var(--border-base))]/30">
              <span className="text-sm text-[rgb(var(--text-muted))]">
                Estado
              </span>
              <StatusBadge enabled={group.enabled} />
            </div>
            <div className="flex items-center justify-between py-2 border-b border-[rgb(var(--border-base))]/30">
              <span className="text-sm text-[rgb(var(--text-muted))]">
                ID del espacio
              </span>
              <code className="text-xs px-2 py-1 rounded bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-secondary))]">
                {group.$id}
              </code>
            </div>
            <div className="flex items-center justify-between py-2">
              <span className="text-sm text-[rgb(var(--text-muted))]">
                Fecha de creación
              </span>
              <span className="text-sm text-[rgb(var(--text-primary))]">
                {new Date(group.$createdAt).toLocaleDateString("es-ES", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))]">
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
export function GroupsAdminPage() {
  const {
    data: groups = [],
    isLoading,
    refetch,
    isRefetching,
  } = useAllGroups();
  const { data: users = [] } = useAllUsers();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("all"); // all, active, disabled
  const [selectedGroup, setSelectedGroup] = useState(null);

  // Filter and search groups
  const filteredGroups = useMemo(() => {
    let result = groups;

    // Apply status filter
    if (filter === "active") {
      result = result.filter((g) => g.enabled !== false);
    } else if (filter === "disabled") {
      result = result.filter((g) => g.enabled === false);
    }

    // Apply search
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      result = result.filter(
        (g) =>
          g.name?.toLowerCase().includes(searchLower) ||
          g.description?.toLowerCase().includes(searchLower)
      );
    }

    return result;
  }, [groups, filter, search]);

  // Get owner name
  const getOwnerName = (ownerAuthId) => {
    const owner = users.find((u) => u.authId === ownerAuthId);
    return owner ? `${owner.firstName} ${owner.lastName}` : "Desconocido";
  };

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
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              Gestión de Espacios
            </h1>
            <p className="text-[rgb(var(--text-muted))] mt-1">
              Visualiza y gestiona todos los espacios de la plataforma
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
              placeholder="Buscar espacios..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            {["all", "active", "disabled"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === f
                    ? "bg-[rgb(var(--brand-primary))] text-white"
                    : "bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))]"
                }`}
              >
                {f === "all" && "Todos"}
                {f === "active" && "Activos"}
                {f === "disabled" && "Desactivados"}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6"
        >
          <Card className="p-4">
            <p className="text-sm text-[rgb(var(--text-muted))]">
              Total espacios
            </p>
            <p className="text-2xl font-bold text-[rgb(var(--text-primary))]">
              {groups.length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-[rgb(var(--text-muted))]">Activos</p>
            <p className="text-2xl font-bold text-emerald-500">
              {groups.filter((g) => g.enabled !== false).length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-[rgb(var(--text-muted))]">
              Desactivados
            </p>
            <p className="text-2xl font-bold text-red-500">
              {groups.filter((g) => g.enabled === false).length}
            </p>
          </Card>
          <Card className="p-4">
            <p className="text-sm text-[rgb(var(--text-muted))]">Este mes</p>
            <p className="text-2xl font-bold text-blue-500">
              {
                groups.filter((g) => {
                  const created = new Date(g.$createdAt);
                  const now = new Date();
                  return (
                    created.getMonth() === now.getMonth() &&
                    created.getFullYear() === now.getFullYear()
                  );
                }).length
              }
            </p>
          </Card>
        </motion.div>

        {/* Groups list */}
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <RefreshCw className="w-8 h-8 animate-spin text-[rgb(var(--brand-primary))]" />
          </div>
        ) : filteredGroups.length === 0 ? (
          <Card className="p-12 text-center">
            <Building2 className="w-16 h-16 mx-auto text-[rgb(var(--text-muted))] opacity-30 mb-4" />
            <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">
              No se encontraron espacios
            </h3>
            <p className="text-[rgb(var(--text-muted))]">
              {search
                ? "Intenta con otros términos de búsqueda"
                : "No hay espacios en la plataforma"}
            </p>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid gap-4"
          >
            {filteredGroups.map((group) => (
              <motion.div key={group.$id} variants={itemVariants}>
                <Card className="p-3 sm:p-4 hover:shadow-md transition-shadow overflow-hidden">
                  <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                    {/* Avatar */}
                    <div
                      className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center text-white font-bold text-base sm:text-lg shrink-0"
                      style={{ backgroundColor: group.color || "#8B5CF6" }}
                    >
                      {group.name?.charAt(0)?.toUpperCase() || "G"}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold text-[rgb(var(--text-primary))] truncate text-sm sm:text-base">
                          {group.name}
                        </h3>
                        <StatusBadge enabled={group.enabled} />
                      </div>
                      <p className="text-xs sm:text-sm text-[rgb(var(--text-muted))] truncate mb-2">
                        {group.description || "Sin descripción"}
                      </p>
                      <div className="hidden sm:block">
                        <GroupStatsRow groupId={group.$id} />
                      </div>
                    </div>

                    {/* Owner */}
                    <div className="hidden lg:block text-right">
                      <p className="text-xs text-[rgb(var(--text-muted))]">
                        Propietario
                      </p>
                      <p className="text-sm font-medium text-[rgb(var(--text-primary))] flex items-center gap-1 justify-end">
                        <Crown className="w-3.5 h-3.5 text-amber-500" />
                        {getOwnerName(group.ownerAuthId)}
                      </p>
                    </div>

                    {/* Date */}
                    <div className="hidden md:block text-right">
                      <p className="text-xs text-[rgb(var(--text-muted))]">
                        Creado
                      </p>
                      <p className="text-sm text-[rgb(var(--text-secondary))] flex items-center gap-1 justify-end">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(group.$createdAt).toLocaleDateString(
                          "es-ES",
                          {
                            day: "numeric",
                            month: "short",
                          }
                        )}
                      </p>
                    </div>

                    {/* Actions */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setSelectedGroup(group)}
                      className="shrink-0"
                    >
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* Group detail modal */}
        <AnimatePresence>
          {selectedGroup && (
            <GroupDetailModal
              group={selectedGroup}
              users={users}
              onClose={() => setSelectedGroup(null)}
            />
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
