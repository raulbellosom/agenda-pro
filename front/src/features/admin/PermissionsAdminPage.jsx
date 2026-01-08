import React, { useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  Key,
  Shield,
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Check,
  AlertTriangle,
  Sparkles,
  Info,
  Loader2,
  ChevronDown,
  ChevronRight,
  Building2,
  Users,
  Calendar,
  CalendarDays,
  Bell,
} from "lucide-react";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Card } from "../../components/ui/Card";
import {
  useAllPermissions,
  useCreatePermission,
  useUpdatePermission,
  useDeletePermission,
  useSeedPermissions,
  useMissingPermissions,
} from "../../lib/hooks/usePermissionsAdmin";
import {
  SYSTEM_PERMISSIONS,
  PERMISSION_DESCRIPTIONS,
  PERMISSION_CATEGORIES,
} from "../../lib/permissions";

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

// Category icon mapping
const CATEGORY_ICONS = {
  group: Building2,
  members: Users,
  roles: Shield,
  calendars: Calendar,
  events: CalendarDays,
  notifications: Bell,
};

// Category colors
const CATEGORY_COLORS = {
  violet: "from-violet-500 to-purple-600",
  blue: "from-blue-500 to-cyan-600",
  amber: "from-amber-500 to-orange-600",
  emerald: "from-emerald-500 to-teal-600",
  cyan: "from-cyan-500 to-blue-600",
  pink: "from-pink-500 to-rose-600",
};

export function PermissionsAdminPage() {
  const { profile } = useWorkspace();
  const [searchTerm, setSearchTerm] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingKey, setEditingKey] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newKey, setNewKey] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [permToDelete, setPermToDelete] = useState(null);
  const [expandedCategories, setExpandedCategories] = useState(
    PERMISSION_CATEGORIES.map((c) => c.id)
  );

  // Check if user is platform admin
  // Soporta ambos nombres de campo por compatibilidad
  const isPlatformAdmin =
    profile?.isPlatformAdmin === true || profile?.adminplatform === true;

  // Queries
  const { data: permissions = [], isLoading, refetch } = useAllPermissions();
  const { missingPermissions, totalExpected, totalExisting } =
    useMissingPermissions();

  // Mutations
  const createMutation = useCreatePermission();
  const updateMutation = useUpdatePermission();
  const deleteMutation = useDeletePermission();
  const seedMutation = useSeedPermissions();

  // Filter permissions
  const filteredPermissions = useMemo(() => {
    if (!searchTerm) return permissions;
    const term = searchTerm.toLowerCase();
    return permissions.filter(
      (p) =>
        p.key.toLowerCase().includes(term) ||
        p.description?.toLowerCase().includes(term)
    );
  }, [permissions, searchTerm]);

  // Group permissions by category
  const permissionsByCategory = useMemo(() => {
    const permissionMap = new Map(permissions.map((p) => [p.key, p]));

    return PERMISSION_CATEGORIES.map((category) => {
      const categoryPerms = category.permissions
        .map((key) => permissionMap.get(key))
        .filter(Boolean);

      const missingKeys = category.permissions.filter(
        (key) => !permissionMap.has(key)
      );

      return {
        ...category,
        permissions: categoryPerms,
        missingKeys,
        total: category.permissions.length,
        existing: categoryPerms.length,
      };
    });
  }, [permissions]);

  // Handlers
  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const startEdit = (perm) => {
    setEditingId(perm.$id);
    setEditingKey(perm.key);
    setEditingDescription(perm.description || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingKey("");
    setEditingDescription("");
  };

  const saveEdit = async () => {
    if (!editingKey.trim()) return;

    try {
      await updateMutation.mutateAsync({
        permissionId: editingId,
        data: {
          key: editingKey.trim(),
          description: editingDescription.trim(),
        },
      });
      cancelEdit();
    } catch (err) {
      console.error("Error updating permission:", err);
    }
  };

  const handleCreate = async () => {
    if (!newKey.trim()) return;

    try {
      await createMutation.mutateAsync({
        key: newKey.trim(),
        description: newDescription.trim(),
      });
      setShowCreateModal(false);
      setNewKey("");
      setNewDescription("");
    } catch (err) {
      console.error("Error creating permission:", err);
    }
  };

  const handleDelete = async () => {
    if (!permToDelete) return;

    try {
      await deleteMutation.mutateAsync(permToDelete.$id);
      setPermToDelete(null);
    } catch (err) {
      console.error("Error deleting permission:", err);
    }
  };

  const handleSeedPermissions = async () => {
    try {
      const result = await seedMutation.mutateAsync();
      console.log("Seed result:", result);
    } catch (err) {
      console.error("Error seeding permissions:", err);
    }
  };

  // Redirect if not platform admin
  if (!isPlatformAdmin) {
    return <Navigate to="/" replace />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--brand-primary))]" />
      </div>
    );
  }

  return (
    <div className="min-h-full">
      <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
            Permisos del Sistema
          </h1>
          <p className="text-sm text-[rgb(var(--text-muted))] mt-1">
            Administra los permisos globales de la plataforma
          </p>
        </div>

        {/* Warning Banner - Missing Permissions */}
        <AnimatePresence>
          {missingPermissions.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mb-6"
            >
              <Card
                className={clsx(
                  "p-4 border-[rgb(var(--warning))]/50",
                  "bg-[rgb(var(--warning))]/5"
                )}
              >
                <div className="flex items-start gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgb(var(--warning))]/10 shrink-0">
                    <AlertTriangle className="h-5 w-5 text-[rgb(var(--warning))]" />
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold text-[rgb(var(--text-primary))]">
                      Permisos faltantes detectados
                    </h4>
                    <p className="mt-1 text-sm text-[rgb(var(--text-muted))]">
                      Hay{" "}
                      <span className="font-bold text-[rgb(var(--warning))]">
                        {missingPermissions.length}
                      </span>{" "}
                      permisos del sistema que no existen en la base de datos.
                    </p>
                    <Button
                      size="sm"
                      className="mt-3"
                      onClick={handleSeedPermissions}
                      disabled={seedMutation.isPending}
                      leftIcon={
                        seedMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Sparkles className="w-4 h-4" />
                        )
                      }
                    >
                      {seedMutation.isPending
                        ? "Creando..."
                        : "Crear permisos faltantes"}
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-3 mb-6">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgb(var(--brand-primary))]/10">
                <Key className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[rgb(var(--text-primary))]">
                  {permissions.length}
                </p>
                <p className="text-xs text-[rgb(var(--text-muted))]">
                  Total permisos
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgb(var(--success))]/10">
                <Check className="w-5 h-5 text-[rgb(var(--success))]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[rgb(var(--text-primary))]">
                  {totalExpected - missingPermissions.length}
                </p>
                <p className="text-xs text-[rgb(var(--text-muted))]">
                  Permisos activos
                </p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[rgb(var(--warning))]/10">
                <AlertTriangle className="w-5 h-5 text-[rgb(var(--warning))]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[rgb(var(--text-primary))]">
                  {missingPermissions.length}
                </p>
                <p className="text-xs text-[rgb(var(--text-muted))]">
                  Faltantes
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Main Content */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Permissions List */}
          <Card className="lg:col-span-3 overflow-hidden">
            {/* Header */}
            <div className="border-b border-[rgb(var(--border-base))] p-4">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgb(var(--brand-primary))]/10">
                    <Key className="w-4 h-4 text-[rgb(var(--brand-primary))]" />
                  </div>
                  <h3 className="font-semibold text-[rgb(var(--text-primary))]">
                    Permisos
                  </h3>
                  <span className="px-2 py-0.5 rounded-full bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))] text-xs font-medium">
                    {permissions.length}
                  </span>
                </div>
                <Button
                  size="sm"
                  onClick={() => setShowCreateModal(true)}
                  leftIcon={<Plus className="w-4 h-4" />}
                >
                  Nuevo
                </Button>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-[rgb(var(--text-muted))] w-4 h-4" />
                <Input
                  placeholder="Buscar permiso..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* List */}
            <div className="max-h-[500px] overflow-y-auto">
              {filteredPermissions.length === 0 ? (
                <div className="p-8 text-center">
                  <Key className="w-12 h-12 mx-auto mb-3 text-[rgb(var(--text-muted))]/50" />
                  <p className="text-[rgb(var(--text-muted))]">
                    {searchTerm
                      ? `No hay resultados para "${searchTerm}"`
                      : "No hay permisos en el sistema"}
                  </p>
                </div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="divide-y divide-[rgb(var(--border-base))]/30"
                >
                  {filteredPermissions.map((perm) => (
                    <motion.div
                      key={perm.$id}
                      variants={itemVariants}
                      className={clsx(
                        "p-4 hover:bg-[rgb(var(--bg-muted))]/50 transition-colors",
                        editingId === perm.$id && "bg-[rgb(var(--bg-muted))]"
                      )}
                    >
                      {editingId === perm.$id ? (
                        // Edit mode
                        <div className="space-y-3">
                          <Input
                            value={editingKey}
                            onChange={(e) => setEditingKey(e.target.value)}
                            placeholder="permission.key"
                            className="font-mono text-sm"
                          />
                          <Input
                            value={editingDescription}
                            onChange={(e) =>
                              setEditingDescription(e.target.value)
                            }
                            placeholder="Descripción del permiso"
                          />
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={saveEdit}
                              disabled={updateMutation.isPending}
                              leftIcon={
                                updateMutation.isPending ? (
                                  <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Check className="w-4 h-4" />
                                )
                              }
                            >
                              {updateMutation.isPending
                                ? "Guardando..."
                                : "Guardar"}
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={cancelEdit}
                              leftIcon={<X className="w-4 h-4" />}
                            >
                              Cancelar
                            </Button>
                          </div>
                        </div>
                      ) : (
                        // View mode
                        <div className="flex items-center justify-between gap-4">
                          <div className="min-w-0 flex-1">
                            <code className="text-sm font-mono text-[rgb(var(--brand-primary))]">
                              {perm.key}
                            </code>
                            <p className="text-sm text-[rgb(var(--text-muted))] mt-0.5 truncate">
                              {perm.description ||
                                PERMISSION_DESCRIPTIONS[perm.key] ||
                                "Sin descripción"}
                            </p>
                          </div>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => startEdit(perm)}
                              className="p-2 rounded-lg hover:bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition-colors"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setPermToDelete(perm)}
                              className="p-2 rounded-lg hover:bg-[rgb(var(--error))]/10 text-[rgb(var(--text-muted))] hover:text-[rgb(var(--error))] transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </div>
          </Card>

          {/* Categories Panel */}
          <Card className="lg:col-span-2 overflow-hidden">
            <div className="border-b border-[rgb(var(--border-base))] p-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[rgb(var(--brand-primary))]/10">
                  <Shield className="w-4 h-4 text-[rgb(var(--brand-primary))]" />
                </div>
                <h3 className="font-semibold text-[rgb(var(--text-primary))]">
                  Categorías
                </h3>
              </div>
            </div>

            <div className="max-h-[500px] overflow-y-auto p-4 space-y-3">
              {permissionsByCategory.map((category) => {
                const Icon = CATEGORY_ICONS[category.id] || Shield;
                const isExpanded = expandedCategories.includes(category.id);
                const colorClass =
                  CATEGORY_COLORS[category.color] || CATEGORY_COLORS.violet;

                return (
                  <div
                    key={category.id}
                    className={clsx(
                      "rounded-xl border border-[rgb(var(--border-base))] overflow-hidden",
                      "bg-[rgb(var(--bg-surface))]"
                    )}
                  >
                    {/* Category Header */}
                    <button
                      onClick={() => toggleCategory(category.id)}
                      className={clsx(
                        "w-full flex items-center gap-3 p-3",
                        "hover:bg-[rgb(var(--bg-muted))]/50 transition-colors"
                      )}
                    >
                      <div
                        className={clsx(
                          "w-8 h-8 rounded-lg flex items-center justify-center",
                          `bg-linear-to-br ${colorClass}`
                        )}
                      >
                        <Icon className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 text-left">
                        <p className="font-medium text-sm text-[rgb(var(--text-primary))]">
                          {category.label}
                        </p>
                        <p className="text-xs text-[rgb(var(--text-muted))]">
                          {category.existing}/{category.total} permisos
                        </p>
                      </div>
                      {category.missingKeys.length > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[rgb(var(--warning))]/10 text-[rgb(var(--warning))] text-xs">
                          {category.missingKeys.length} faltan
                        </span>
                      )}
                      {isExpanded ? (
                        <ChevronDown className="w-4 h-4 text-[rgb(var(--text-muted))]" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-[rgb(var(--text-muted))]" />
                      )}
                    </button>

                    {/* Category Content */}
                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden"
                        >
                          <div className="px-3 pb-3 space-y-1">
                            {category.permissions.map((perm) => (
                              <div
                                key={perm.$id}
                                className={clsx(
                                  "flex items-center gap-2 px-2 py-1.5 rounded-lg",
                                  "bg-[rgb(var(--bg-muted))]/50"
                                )}
                              >
                                <Check className="w-3 h-3 text-[rgb(var(--success))]" />
                                <code className="text-xs font-mono text-[rgb(var(--text-secondary))]">
                                  {perm.key}
                                </code>
                              </div>
                            ))}
                            {category.missingKeys.map((key) => (
                              <div
                                key={key}
                                className={clsx(
                                  "flex items-center gap-2 px-2 py-1.5 rounded-lg",
                                  "bg-[rgb(var(--warning))]/5"
                                )}
                              >
                                <X className="w-3 h-3 text-[rgb(var(--warning))]" />
                                <code className="text-xs font-mono text-[rgb(var(--text-muted))]">
                                  {key}
                                </code>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Create Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              onClick={() => setShowCreateModal(false)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={clsx(
                  "w-full max-w-md rounded-2xl overflow-hidden",
                  "bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border-base))]",
                  "shadow-xl"
                )}
              >
                {/* Modal Header */}
                <div className="p-4 border-b border-[rgb(var(--border-base))] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center">
                    <Plus className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-[rgb(var(--text-primary))]">
                      Crear Nuevo Permiso
                    </h2>
                    <p className="text-sm text-[rgb(var(--text-muted))]">
                      Agrega un nuevo permiso al sistema
                    </p>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-4 space-y-4">
                  <Input
                    label="Clave del permiso"
                    placeholder="ej: module.action"
                    value={newKey}
                    onChange={(e) => setNewKey(e.target.value)}
                    className="font-mono"
                  />
                  <Input
                    label="Descripción"
                    placeholder="Descripción del permiso"
                    value={newDescription}
                    onChange={(e) => setNewDescription(e.target.value)}
                  />

                  <div className="flex items-start gap-2 p-3 rounded-lg bg-[rgb(var(--bg-muted))]">
                    <Info className="w-4 h-4 text-[rgb(var(--text-muted))] mt-0.5" />
                    <p className="text-xs text-[rgb(var(--text-muted))]">
                      Usa el formato{" "}
                      <code className="text-[rgb(var(--brand-primary))]">
                        modulo.accion
                      </code>{" "}
                      para mantener consistencia (ej: events.create,
                      calendars.delete)
                    </p>
                  </div>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-[rgb(var(--border-base))] flex justify-end gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setShowCreateModal(false)}
                  >
                    Cancelar
                  </Button>
                  <Button
                    onClick={handleCreate}
                    disabled={!newKey.trim() || createMutation.isPending}
                    leftIcon={
                      createMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Plus className="w-4 h-4" />
                      )
                    }
                  >
                    {createMutation.isPending ? "Creando..." : "Crear Permiso"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Delete Confirmation Modal */}
        <AnimatePresence>
          {permToDelete && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
              onClick={() => setPermToDelete(null)}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className={clsx(
                  "w-full max-w-md rounded-2xl overflow-hidden",
                  "bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border-base))]",
                  "shadow-xl"
                )}
              >
                {/* Modal Header */}
                <div className="p-4 border-b border-[rgb(var(--border-base))] flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[rgb(var(--error))]/10 flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-[rgb(var(--error))]" />
                  </div>
                  <div>
                    <h2 className="font-semibold text-[rgb(var(--text-primary))]">
                      Eliminar permiso
                    </h2>
                    <p className="text-sm text-[rgb(var(--text-muted))]">
                      Esta acción no se puede deshacer
                    </p>
                  </div>
                </div>

                {/* Modal Body */}
                <div className="p-4">
                  <p className="text-[rgb(var(--text-secondary))]">
                    ¿Estás seguro de que deseas eliminar el permiso{" "}
                    <code className="px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))] text-[rgb(var(--brand-primary))] font-mono text-sm">
                      {permToDelete.key}
                    </code>
                    ?
                  </p>
                  <p className="text-sm text-[rgb(var(--text-muted))] mt-2">
                    Los roles que tengan este permiso lo perderán.
                  </p>
                </div>

                {/* Modal Footer */}
                <div className="p-4 border-t border-[rgb(var(--border-base))] flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setPermToDelete(null)}>
                    Cancelar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    leftIcon={
                      deleteMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )
                    }
                  >
                    {deleteMutation.isPending ? "Eliminando..." : "Eliminar"}
                  </Button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
