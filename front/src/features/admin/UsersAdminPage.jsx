import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  Users,
  Search,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Mail,
  Shield,
  ShieldCheck,
  ShieldOff,
  UserPlus,
  Loader2,
  MoreVertical,
  Eye,
  Ban,
  RefreshCw,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import { ConfirmModal } from "../../shared/ui/ConfirmModal";
import { Avatar } from "../../components/ui/Avatar";
import {
  useAllUsers,
  useCreateUser,
  useUpdateUser,
  useToggleUserStatus,
  useTogglePlatformAdmin,
} from "../../lib/hooks/useAdminData";
import { getAvatarUrl } from "../../lib/services/profileService";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.03 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

// Status badge component
function StatusBadge({ status, verified }) {
  const isActive = status === "ACTIVE";
  const isSuspended = status === "SUSPENDED";

  return (
    <div className="flex items-center gap-2">
      <span
        className={clsx(
          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
          isActive
            ? "bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]"
            : isSuspended
            ? "bg-[rgb(var(--warning))]/10 text-[rgb(var(--warning))]"
            : "bg-[rgb(var(--error))]/10 text-[rgb(var(--error))]"
        )}
      >
        {isActive ? (
          <CheckCircle2 className="w-3 h-3" />
        ) : isSuspended ? (
          <AlertCircle className="w-3 h-3" />
        ) : (
          <XCircle className="w-3 h-3" />
        )}
        {isActive ? "Activo" : isSuspended ? "Suspendido" : "Eliminado"}
      </span>
      {verified && (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-[rgb(var(--info))]/10 text-[rgb(var(--info))]">
          <Mail className="w-3 h-3" />
          Verificado
        </span>
      )}
    </div>
  );
}

// Create User Modal
function CreateUserModal({ isOpen, onClose, onSuccess }) {
  const createUser = useCreateUser();
  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    isPlatformAdmin: false,
  });
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.email || !formData.firstName || !formData.password) {
      setError("Email, nombre y contraseña son requeridos");
      return;
    }

    try {
      await createUser.mutateAsync(formData);
      onSuccess?.();
      onClose();
      setFormData({
        email: "",
        firstName: "",
        lastName: "",
        password: "",
        isPlatformAdmin: false,
      });
    } catch (err) {
      setError(err.message || "Error al crear usuario");
    }
  };

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

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onMouseDown={handleOverlayMouseDown}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md mx-4 bg-[rgb(var(--bg-surface))] rounded-2xl border border-[rgb(var(--border-base))] shadow-xl overflow-hidden"
      >
        <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border-base))]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
            </div>
            <div>
              <h3 className="font-semibold text-[rgb(var(--text-primary))]">
                Crear usuario
              </h3>
              <p className="text-xs text-[rgb(var(--text-muted))]">
                Nuevo usuario en la plataforma
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

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-[rgb(var(--error))]/10 border border-[rgb(var(--error))]/20">
              <p className="text-sm text-[rgb(var(--error))]">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Nombre"
              value={formData.firstName}
              onChange={(e) =>
                setFormData({ ...formData, firstName: e.target.value })
              }
              placeholder="Juan"
              required
            />
            <Input
              label="Apellido"
              value={formData.lastName}
              onChange={(e) =>
                setFormData({ ...formData, lastName: e.target.value })
              }
              placeholder="Pérez"
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) =>
              setFormData({ ...formData, email: e.target.value })
            }
            placeholder="correo@ejemplo.com"
            required
          />

          <Input
            label="Contraseña"
            type="password"
            value={formData.password}
            onChange={(e) =>
              setFormData({ ...formData, password: e.target.value })
            }
            placeholder="••••••••"
            required
          />

          <label className="flex items-center gap-3 p-3 rounded-lg bg-[rgb(var(--bg-muted))]/50 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.isPlatformAdmin}
              onChange={(e) =>
                setFormData({ ...formData, isPlatformAdmin: e.target.checked })
              }
              className="w-4 h-4 rounded border-[rgb(var(--border-base))] text-[rgb(var(--brand-primary))]"
            />
            <div className="flex-1">
              <p className="text-sm font-medium text-[rgb(var(--text-primary))]">
                Administrador de plataforma
              </p>
              <p className="text-xs text-[rgb(var(--text-muted))]">
                Acceso total a la administración
              </p>
            </div>
            <Shield className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose} type="button">
              Cancelar
            </Button>
            <Button
              type="submit"
              loading={createUser.isPending}
              leftIcon={!createUser.isPending && <Check className="w-4 h-4" />}
            >
              Crear usuario
            </Button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

// User Row Component
function UserRow({ user, onEdit, onToggleStatus, onToggleAdmin }) {
  const [showMenu, setShowMenu] = useState(false);
  const isPlatformAdmin = user.isPlatformAdmin || user.adminplatform;

  return (
    <motion.div
      variants={itemVariants}
      className="flex items-center gap-3 sm:gap-4 p-3 sm:p-4 rounded-xl bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border-base))] hover:border-[rgb(var(--brand-primary))]/30 transition-all"
    >
      <Avatar
        src={getAvatarUrl(user.avatarFileId, 48)}
        name={`${user.firstName || ""} ${user.lastName || ""}`}
        size={48}
        className="shrink-0"
      />

      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          <p className="font-medium text-[rgb(var(--text-primary))] truncate">
            {user.firstName} {user.lastName}
          </p>
          {isPlatformAdmin && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gradient-to-r from-violet-500/10 to-purple-500/10 text-violet-600 dark:text-violet-400 shrink-0">
              <Shield className="w-3 h-3" />
              Admin
            </span>
          )}
        </div>
        <p className="text-sm text-[rgb(var(--text-muted))] truncate">
          {user.email}
        </p>
        <div className="mt-1.5">
          <StatusBadge status={user.status} verified={user.emailVerified} />
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <p className="text-xs text-[rgb(var(--text-muted))] hidden md:block">
          {new Date(user.$createdAt).toLocaleDateString("es-ES")}
        </p>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] transition-colors shrink-0"
          >
            <MoreVertical className="w-5 h-5 text-[rgb(var(--text-muted))]" />
          </button>

          <AnimatePresence>
            {showMenu && (
              <>
                {/* Backdrop para cerrar el menú */}
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowMenu(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="absolute right-0 top-full mt-1 w-48 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border-base))] shadow-xl overflow-hidden z-20"
                >
                  <div className="p-1">
                    <button
                      onClick={() => {
                        onToggleAdmin(user);
                        setShowMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
                    >
                      {isPlatformAdmin ? (
                        <>
                          <ShieldOff className="w-4 h-4" />
                          Quitar admin
                        </>
                      ) : (
                        <>
                          <ShieldCheck className="w-4 h-4" />
                          Hacer admin
                        </>
                      )}
                    </button>
                    <button
                      onClick={() => {
                        onToggleStatus(user);
                        setShowMenu(false);
                      }}
                      className={clsx(
                        "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors",
                        user.status === "ACTIVE"
                          ? "text-[rgb(var(--warning))] hover:bg-[rgb(var(--warning))]/10"
                          : "text-[rgb(var(--success))] hover:bg-[rgb(var(--success))]/10"
                      )}
                    >
                      {user.status === "ACTIVE" ? (
                        <>
                          <Ban className="w-4 h-4" />
                          Suspender
                        </>
                      ) : (
                        <>
                          <RefreshCw className="w-4 h-4" />
                          Reactivar
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}

export function UsersAdminPage() {
  const { profile } = useWorkspace();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);

  // Queries & Mutations
  const { data: users = [], isLoading, refetch } = useAllUsers();
  const toggleStatus = useToggleUserStatus();
  const toggleAdmin = useTogglePlatformAdmin();

  // Filter users
  const filteredUsers = useMemo(() => {
    let result = users;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (u) =>
          u.email?.toLowerCase().includes(term) ||
          u.firstName?.toLowerCase().includes(term) ||
          u.lastName?.toLowerCase().includes(term)
      );
    }

    if (statusFilter !== "all") {
      result = result.filter((u) => u.status === statusFilter);
    }

    return result;
  }, [users, searchTerm, statusFilter]);

  // Stats
  const stats = useMemo(() => {
    const active = users.filter((u) => u.status === "ACTIVE").length;
    const suspended = users.filter((u) => u.status === "SUSPENDED").length;
    const admins = users.filter(
      (u) => u.isPlatformAdmin || u.adminplatform
    ).length;
    return { active, suspended, admins, total: users.length };
  }, [users]);

  const handleToggleStatus = async (user) => {
    const newStatus = user.status === "ACTIVE" ? "SUSPENDED" : "ACTIVE";
    try {
      await toggleStatus.mutateAsync({ userId: user.$id, status: newStatus });
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const handleToggleAdmin = async (user) => {
    const newValue = !(user.isPlatformAdmin || user.adminplatform);
    try {
      await toggleAdmin.mutateAsync({
        userId: user.$id,
        isPlatformAdmin: newValue,
      });
    } catch (error) {
      console.error("Error toggling admin:", error);
    }
  };

  return (
    <div className="h-full overflow-auto">
      <div className="max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6"
        >
          <div className="flex-1 min-w-0">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[rgb(var(--text-primary))]">
              Gestión de Usuarios
            </h1>
            <p className="text-sm text-[rgb(var(--text-muted))] mt-1">
              {stats.total} usuarios · {stats.active} activos · {stats.admins}{" "}
              administradores
            </p>
          </div>
          <Button
            onClick={() => setShowCreateModal(true)}
            className="shrink-0"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Nuevo usuario
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
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-muted))] pointer-events-none" />
            <Input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre o email..."
              className="pl-10"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-lg border border-(--border) bg-(--card) text-(--fg) text-sm focus:outline-none focus:ring-2 focus:ring-(--brand) shrink-0"
          >
            <option value="all">Todos los estados</option>
            <option value="ACTIVE">Activos</option>
            <option value="SUSPENDED">Suspendidos</option>
            <option value="DELETED">Eliminados</option>
          </select>
        </motion.div>

        {/* Users List */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--brand-primary))]" />
          </div>
        ) : filteredUsers.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="w-12 h-12 mx-auto text-[rgb(var(--text-muted))] opacity-30 mb-3" />
            <p className="text-[rgb(var(--text-muted))]">
              {searchTerm
                ? "No se encontraron usuarios"
                : "No hay usuarios registrados"}
            </p>
          </Card>
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="space-y-3"
          >
            {filteredUsers.map((user) => (
              <UserRow
                key={user.$id}
                user={user}
                onToggleStatus={handleToggleStatus}
                onToggleAdmin={handleToggleAdmin}
              />
            ))}
          </motion.div>
        )}
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreateModal && (
          <CreateUserModal
            isOpen={showCreateModal}
            onClose={() => setShowCreateModal(false)}
            onSuccess={refetch}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
