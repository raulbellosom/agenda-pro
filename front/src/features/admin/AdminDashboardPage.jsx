import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Users,
  Key,
  Building2,
  Activity,
  TrendingUp,
  Shield,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Calendar,
  Clock,
  Zap,
  Eye,
  User,
  Plus,
  Edit,
  Trash2,
  LogIn,
} from "lucide-react";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import { useAllPermissions } from "../../lib/hooks/usePermissionsAdmin";
import {
  useAllUsers,
  useAllGroups,
  useRecentAuditLogs,
  usePlatformStats,
} from "../../lib/hooks/useAdminData";
import { Card } from "../../components/ui/Card";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

function StatCard({ icon: Icon, label, value, color, trend, to }) {
  const colorClasses = {
    violet: "from-violet-500 to-purple-600",
    blue: "from-blue-500 to-cyan-600",
    emerald: "from-emerald-500 to-teal-600",
    amber: "from-amber-500 to-orange-600",
    pink: "from-pink-500 to-rose-600",
    indigo: "from-indigo-500 to-blue-600",
  };

  const content = (
    <Card className="p-6 h-full hover:shadow-lg transition-all hover:scale-[1.02] cursor-pointer group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-[rgb(var(--text-muted))] mb-1">{label}</p>
          <p className="text-3xl font-bold text-[rgb(var(--text-primary))]">
            {value}
          </p>
          {trend && (
            <div className="flex items-center gap-1 mt-2 text-xs text-[rgb(var(--success))]">
              <TrendingUp className="w-3 h-3" />
              <span>{trend}</span>
            </div>
          )}
        </div>
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colorClasses[color]} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}
        >
          <Icon className="w-6 h-6 text-white" />
        </div>
      </div>
      {to && (
        <div className="mt-4 pt-4 border-t border-[rgb(var(--border-base))]/30">
          <span className="text-xs text-[rgb(var(--brand-primary))] flex items-center gap-1 group-hover:gap-2 transition-all">
            Ver detalles <ArrowRight className="w-3 h-3" />
          </span>
        </div>
      )}
    </Card>
  );

  if (to) {
    return (
      <motion.div variants={itemVariants}>
        <Link to={to}>{content}</Link>
      </motion.div>
    );
  }

  return <motion.div variants={itemVariants}>{content}</motion.div>;
}

function QuickAction({
  icon: Icon,
  label,
  description,
  to,
  disabled,
  color = "brand",
}) {
  const colorClasses = {
    brand: "bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))]",
    emerald: "bg-emerald-500/10 text-emerald-500",
    blue: "bg-blue-500/10 text-blue-500",
    amber: "bg-amber-500/10 text-amber-500",
  };

  const content = (
    <div
      className={`w-full p-4 rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] text-left transition-all ${
        disabled
          ? "opacity-50 cursor-not-allowed"
          : "hover:border-[rgb(var(--brand-primary))]/50 hover:shadow-md hover:scale-[1.02]"
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center shrink-0`}
        >
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1">
          <p className="font-medium text-[rgb(var(--text-primary))]">{label}</p>
          <p className="text-sm text-[rgb(var(--text-muted))] mt-0.5">
            {description}
          </p>
        </div>
        {!disabled && (
          <ArrowRight className="w-5 h-5 text-[rgb(var(--text-muted))] shrink-0" />
        )}
      </div>
    </div>
  );

  if (disabled) {
    return content;
  }

  return <Link to={to}>{content}</Link>;
}

// Action icons for audit logs
const ACTION_ICONS = {
  CREATE: Plus,
  UPDATE: Edit,
  DELETE: Trash2,
  LOGIN: LogIn,
  VIEW: Eye,
};

const ACTION_COLORS = {
  CREATE: "text-emerald-500 bg-emerald-500/10",
  UPDATE: "text-blue-500 bg-blue-500/10",
  DELETE: "text-red-500 bg-red-500/10",
  LOGIN: "text-violet-500 bg-violet-500/10",
  VIEW: "text-cyan-500 bg-cyan-500/10",
};

export function AdminDashboardPage() {
  const { profile } = useWorkspace();
  const { data: permissions = [] } = useAllPermissions();
  const { data: users = [], isLoading: loadingUsers } = useAllUsers();
  const { data: groups = [], isLoading: loadingGroups } = useAllGroups();
  const { data: recentLogs = [], isLoading: loadingLogs } =
    useRecentAuditLogs(8);

  // Calcular estadísticas
  const verifiedUsers = users.filter((u) => u.emailVerified === true).length;
  const activeGroups = groups.filter((g) => g.enabled !== false).length;

  return (
    <div className="p-4 sm:p-6 lg:p-8 h-full overflow-auto">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4 mb-2">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold text-[rgb(var(--text-primary))]">
                Panel de Administración
              </h1>
              <p className="text-[rgb(var(--text-muted))]">
                Bienvenido, {profile?.firstName}. Aquí puedes gestionar la
                plataforma.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <StatCard
            icon={Users}
            label="Usuarios totales"
            value={loadingUsers ? "..." : users.length}
            color="violet"
            to="/admin/users"
          />
          <StatCard
            icon={CheckCircle2}
            label="Verificados"
            value={loadingUsers ? "..." : verifiedUsers}
            color="emerald"
            to="/admin/users"
          />
          <StatCard
            icon={Building2}
            label="Espacios activos"
            value={loadingGroups ? "..." : activeGroups}
            color="blue"
            to="/admin/groups"
          />
          <StatCard
            icon={Key}
            label="Permisos"
            value={permissions.length}
            color="amber"
            to="/admin/permissions"
          />
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-4"
          >
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              Acciones rápidas
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <QuickAction
                icon={Users}
                label="Gestionar usuarios"
                description="Ver, crear y editar usuarios"
                to="/admin/users"
                color="brand"
              />
              <QuickAction
                icon={Key}
                label="Configurar permisos"
                description="Administrar permisos del sistema"
                to="/admin/permissions"
                color="amber"
              />
              <QuickAction
                icon={Building2}
                label="Ver espacios"
                description="Gestionar espacios de trabajo"
                to="/admin/groups"
                color="blue"
              />
              <QuickAction
                icon={Activity}
                label="Ver auditoría"
                description="Revisar logs de actividad"
                to="/admin/audit"
                color="emerald"
              />
            </div>
          </motion.div>

          {/* System Status */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              Estado del sistema
            </h2>
            <Card className="p-4 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgb(var(--success))]/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-[rgb(var(--success))]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                    Base de datos
                  </p>
                  <p className="text-xs text-[rgb(var(--text-muted))]">
                    Conectada
                  </p>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgb(var(--success))]/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-[rgb(var(--success))]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                    Funciones
                  </p>
                  <p className="text-xs text-[rgb(var(--text-muted))]">
                    Operativas
                  </p>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-[rgb(var(--success))]/10 flex items-center justify-center">
                  <CheckCircle2 className="w-4 h-4 text-[rgb(var(--success))]" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                    Storage
                  </p>
                  <p className="text-xs text-[rgb(var(--text-muted))]">
                    Disponible
                  </p>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] flex items-center gap-2">
              <Activity className="w-5 h-5 text-orange-500" />
              Actividad reciente
            </h2>
            <Link
              to="/admin/audit"
              className="text-sm text-[rgb(var(--brand-primary))] hover:underline flex items-center gap-1"
            >
              Ver todo <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {loadingLogs ? (
            <Card className="p-8 text-center">
              <div className="animate-spin w-8 h-8 border-2 border-[rgb(var(--brand-primary))] border-t-transparent rounded-full mx-auto" />
            </Card>
          ) : recentLogs.length === 0 ? (
            <Card className="p-8 text-center">
              <Activity className="w-12 h-12 mx-auto text-[rgb(var(--text-muted))] opacity-30 mb-3" />
              <p className="text-[rgb(var(--text-muted))]">
                No hay actividad reciente registrada
              </p>
            </Card>
          ) : (
            <Card className="divide-y divide-[rgb(var(--border-base))]/30">
              {recentLogs.map((log) => {
                const Icon = ACTION_ICONS[log.action] || Activity;
                const colorClass =
                  ACTION_COLORS[log.action] || "text-gray-500 bg-gray-500/10";

                return (
                  <div
                    key={log.$id}
                    className="p-4 flex items-center gap-4 hover:bg-[rgb(var(--bg-hover))] transition-colors"
                  >
                    <div
                      className={`w-9 h-9 rounded-lg ${colorClass} flex items-center justify-center shrink-0`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                        {log.action} en {log.entityType || "Sistema"}
                      </p>
                      <p className="text-xs text-[rgb(var(--text-muted))] truncate">
                        {log.entityName || log.entityId || "Acción del sistema"}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs text-[rgb(var(--text-muted))]">
                        {new Date(
                          log.createdAt || log.$createdAt
                        ).toLocaleString("es-ES", {
                          day: "2-digit",
                          month: "2-digit",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </motion.div>
      </div>
    </div>
  );
}
