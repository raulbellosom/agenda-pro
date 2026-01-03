import React, { useState, useMemo, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  Users,
  Plus,
  Settings,
  Trash2,
  LogOut,
  Crown,
  UserCheck,
  Building2,
  MoreHorizontal,
  Pencil,
  Globe,
  Calendar,
  Sparkles,
} from "lucide-react";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import {
  useDeleteGroup,
  useLeaveGroup,
  getGroupLogoUrl,
} from "../../lib/hooks/useGroups";
import { GroupModal } from "./GroupModal";
import { ConfirmModal } from "../../shared/ui/ConfirmModal";

// Animation variants
const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

// Menu Portal Component - renders menu in a portal to avoid z-index issues
function MenuPortal({
  isOpen,
  onClose,
  isOwner,
  group,
  onEdit,
  onDelete,
  onLeave,
}) {
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, right: 0 });

  useEffect(() => {
    if (!isOpen) return;

    // Find the button that triggered the menu
    const button = document.querySelector(`[data-group-menu="${group.$id}"]`);
    if (button) {
      const rect = button.getBoundingClientRect();
      setPosition({
        top: rect.bottom + 8,
        right: window.innerWidth - rect.right,
      });
    }

    // Close on click outside
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose();
      }
    };

    // Close on escape
    const handleEscape = (e) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    // Add listeners with a small delay to avoid immediate close
    const timer = setTimeout(() => {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }, 10);

    return () => {
      clearTimeout(timer);
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen, group.$id, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={menuRef}
        initial={{ opacity: 0, scale: 0.95, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -10 }}
        style={{
          position: "fixed",
          top: position.top,
          right: position.right,
          zIndex: 9999,
        }}
        className="w-52 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border-base))] shadow-2xl overflow-hidden"
      >
        <div className="p-1">
          {isOwner ? (
            <>
              <button
                onClick={() => {
                  onClose();
                  onEdit(group);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] transition-colors"
              >
                <Pencil className="w-4 h-4" />
                Editar espacio
              </button>
              <div className="my-1 border-t border-[rgb(var(--border-base))]" />
              <button
                onClick={() => {
                  onClose();
                  onDelete(group);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[rgb(var(--error))] hover:bg-[rgb(var(--error))]/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Eliminar espacio
              </button>
            </>
          ) : (
            <button
              onClick={() => {
                onClose();
                onLeave(group);
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[rgb(var(--error))] hover:bg-[rgb(var(--error))]/10 transition-colors"
            >
              <LogOut className="w-4 h-4" />
              Salir del espacio
            </button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// Group Card Component
function GroupCard({
  group,
  isActive,
  onSwitch,
  onEdit,
  onDelete,
  onLeave,
  profile,
}) {
  const [showMenu, setShowMenu] = useState(false);
  const isOwner =
    group.ownerProfileId === profile?.$id || group.membershipRole === "OWNER";
  const logoUrl = group.logoFileId
    ? getGroupLogoUrl(group.logoFileId, 120, 120)
    : null;

  return (
    <motion.div
      variants={itemVariants}
      whileHover={{ y: -2 }}
      className={clsx(
        "group relative bg-[rgb(var(--bg-surface))] rounded-2xl",
        "border-2 transition-all duration-300",
        "hover:shadow-lg hover:shadow-[rgb(var(--brand-primary))]/5",
        isActive
          ? "border-[rgb(var(--brand-primary))] shadow-md shadow-[rgb(var(--brand-primary))]/10"
          : "border-[rgb(var(--border-base))] hover:border-[rgb(var(--brand-primary))]/30"
      )}
    >
      {/* Active indicator bar */}
      {isActive && (
        <div className="absolute top-0 left-6 right-6 h-1 bg-gradient-to-r from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-secondary))] rounded-b-full" />
      )}

      <div className="p-5">
        <div className="flex items-start gap-4">
          {/* Logo or Icon */}
          <div
            className={clsx(
              "w-16 h-16 rounded-2xl flex-shrink-0 flex items-center justify-center overflow-hidden",
              "transition-transform duration-300 group-hover:scale-105",
              logoUrl
                ? "ring-2 ring-[rgb(var(--border-base))]"
                : "bg-gradient-to-br from-[rgb(var(--brand-primary))]/10 to-[rgb(var(--brand-secondary))]/10"
            )}
          >
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={group.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Building2 className="w-8 h-8 text-[rgb(var(--brand-primary))]" />
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5 flex-wrap">
              <h3 className="font-semibold text-lg text-[rgb(var(--text-primary))] truncate">
                {group.name}
              </h3>
              {isOwner ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 text-amber-600 dark:text-amber-400 text-xs font-semibold">
                  <Crown className="w-3 h-3" />
                  Propietario
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))] text-xs font-semibold">
                  <UserCheck className="w-3 h-3" />
                  Miembro
                </span>
              )}
            </div>

            {group.description && (
              <p className="text-sm text-[rgb(var(--text-muted))] line-clamp-2 mb-3">
                {group.description}
              </p>
            )}

            <div className="flex items-center gap-4 text-xs text-[rgb(var(--text-muted))]">
              <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-[rgb(var(--bg-muted))]">
                <Globe className="w-3.5 h-3.5" />
                {group.timezone || "America/Mexico_City"}
              </span>
              {group.joinedAt && !isOwner && (
                <span className="inline-flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5" />
                  Desde{" "}
                  {new Date(group.joinedAt).toLocaleDateString("es-ES", {
                    month: "short",
                    year: "numeric",
                  })}
                </span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {!isActive ? (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => onSwitch(group.$id)}
                className="px-4 py-2 rounded-xl bg-[rgb(var(--brand-primary))] text-white text-sm font-medium hover:opacity-90 transition-all shadow-sm"
              >
                Activar
              </motion.button>
            ) : (
              <span className="px-4 py-2 rounded-xl bg-gradient-to-r from-[rgb(var(--brand-primary))]/10 to-[rgb(var(--brand-secondary))]/10 text-[rgb(var(--brand-primary))] text-sm font-semibold flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[rgb(var(--brand-primary))] animate-pulse" />
                Activo
              </span>
            )}

            {/* Menu button */}
            <div className="relative">
              <button
                data-group-menu={group.$id}
                onClick={(e) => {
                  e.stopPropagation();
                  setShowMenu(!showMenu);
                }}
                className={clsx(
                  "w-9 h-9 rounded-xl flex items-center justify-center transition-colors",
                  showMenu
                    ? "bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-primary))]"
                    : "hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))]"
                )}
              >
                <MoreHorizontal className="w-5 h-5" />
              </button>

              <MenuPortal
                isOpen={showMenu}
                onClose={() => setShowMenu(false)}
                isOwner={isOwner}
                group={group}
                onEdit={onEdit}
                onDelete={onDelete}
                onLeave={onLeave}
              />
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Empty State Component
function EmptyState({ onCreateGroup }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-[rgb(var(--bg-surface))] to-[rgb(var(--bg-muted))]/30 border-2 border-dashed border-[rgb(var(--border-base))] text-center overflow-hidden"
    >
      {/* Decorative elements */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[rgb(var(--brand-primary))]/10 to-transparent rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-[rgb(var(--brand-secondary))]/10 to-transparent rounded-full blur-2xl" />

      <div className="relative">
        <div className="w-20 h-20 mx-auto mb-6 rounded-3xl bg-gradient-to-br from-[rgb(var(--brand-primary))]/10 to-[rgb(var(--brand-secondary))]/10 flex items-center justify-center">
          <Building2 className="w-10 h-10 text-[rgb(var(--brand-primary))]" />
        </div>
        <h3 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-2">
          No tienes espacios propios
        </h3>
        <p className="text-sm text-[rgb(var(--text-muted))] mb-6 max-w-sm mx-auto">
          Crea tu primer espacio de trabajo para empezar a organizar tus
          calendarios y eventos
        </p>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={onCreateGroup}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[rgb(var(--brand-primary))] text-white font-medium hover:opacity-90 transition-all shadow-lg shadow-[rgb(var(--brand-primary))]/25"
        >
          <Plus className="w-5 h-5" />
          Crear mi primer espacio
        </motion.button>
      </div>
    </motion.div>
  );
}

// Section Header Component
function SectionHeader({ icon: Icon, title, count, color = "amber" }) {
  const colorClasses = {
    amber: "from-amber-500/10 to-orange-500/10 text-amber-500",
    brand:
      "from-[rgb(var(--brand-primary))]/10 to-[rgb(var(--brand-secondary))]/10 text-[rgb(var(--brand-primary))]",
  };

  return (
    <div className="flex items-center gap-3 mb-4">
      <div
        className={clsx(
          "w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center",
          colorClasses[color]
        )}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
          {title}
        </h2>
      </div>
      <span className="ml-auto px-3 py-1 rounded-full bg-[rgb(var(--bg-muted))] text-xs font-semibold text-[rgb(var(--text-muted))]">
        {count}
      </span>
    </div>
  );
}

// Info Banner Component
function InfoBanner() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-gradient-to-r from-[rgb(var(--info))]/5 to-[rgb(var(--info))]/10 border border-[rgb(var(--info))]/20"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-lg bg-[rgb(var(--info))]/10 flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4 text-[rgb(var(--info))]" />
        </div>
        <div>
          <p className="text-sm font-medium text-[rgb(var(--info))]">
            Espacios compartidos
          </p>
          <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">
            Estos son espacios a los que te han invitado. Puedes ver sus
            calendarios y eventos según los permisos otorgados.
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export function GroupsPage() {
  const { profile, groups, activeGroup, switchGroup, refetchGroups } =
    useWorkspace();

  // Modal states
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [confirmDelete, setConfirmDelete] = useState(null);
  const [confirmLeave, setConfirmLeave] = useState(null);

  // Mutations
  const deleteGroup = useDeleteGroup();
  const leaveGroup = useLeaveGroup();

  // Separate groups by ownership
  const { ownedGroups, memberGroups } = useMemo(() => {
    const owned = [];
    const member = [];

    groups.forEach((group) => {
      if (
        group.ownerProfileId === profile?.$id ||
        group.membershipRole === "OWNER"
      ) {
        owned.push(group);
      } else {
        member.push(group);
      }
    });

    return { ownedGroups: owned, memberGroups: member };
  }, [groups, profile?.$id]);

  const handleCreateGroup = () => {
    setEditingGroup(null);
    setShowGroupModal(true);
  };

  const handleEditGroup = (group) => {
    setEditingGroup(group);
    setShowGroupModal(true);
  };

  const handleDeleteGroup = async () => {
    if (!confirmDelete) return;

    try {
      await deleteGroup.mutateAsync(confirmDelete.$id);
      setConfirmDelete(null);
      // If we deleted the active group, switch to another one
      if (confirmDelete.$id === activeGroup?.$id && groups.length > 1) {
        const nextGroup = groups.find((g) => g.$id !== confirmDelete.$id);
        if (nextGroup) switchGroup(nextGroup.$id);
      }
    } catch (error) {
      console.error("Error deleting group:", error);
    }
  };

  const handleLeaveGroup = async () => {
    if (!confirmLeave || !profile?.$id) return;

    try {
      await leaveGroup.mutateAsync({
        groupId: confirmLeave.$id,
        profileId: profile.$id,
      });
      setConfirmLeave(null);
      // If we left the active group, switch to another one
      if (confirmLeave.$id === activeGroup?.$id && groups.length > 1) {
        const nextGroup = groups.find((g) => g.$id !== confirmLeave.$id);
        if (nextGroup) switchGroup(nextGroup.$id);
      }
      refetchGroups();
    } catch (error) {
      console.error("Error leaving group:", error);
    }
  };

  const handleGroupSuccess = () => {
    refetchGroups();
    setShowGroupModal(false);
    setEditingGroup(null);
  };

  return (
    <div className="min-h-full p-4 lg:p-6 xl:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <div className="flex items-center gap-4 flex-1">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[rgb(var(--brand-primary))]/10 to-[rgb(var(--brand-secondary))]/10 flex items-center justify-center">
                <Building2 className="w-7 h-7 text-[rgb(var(--brand-primary))]" />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
                  Mis espacios
                </h1>
                <p className="text-sm text-[rgb(var(--text-muted))] mt-0.5">
                  Gestiona tus espacios de trabajo y colaboración
                </p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleCreateGroup}
              className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[rgb(var(--brand-primary))] text-white font-medium hover:opacity-90 transition-all shadow-lg shadow-[rgb(var(--brand-primary))]/20"
            >
              <Plus className="w-5 h-5" />
              <span className="hidden sm:inline">Nuevo espacio</span>
              <span className="sm:hidden">Nuevo</span>
            </motion.button>
          </div>
        </motion.div>

        <div className="space-y-8">
          {/* My Spaces Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SectionHeader
              icon={Crown}
              title="Mis espacios"
              count={ownedGroups.length}
              color="amber"
            />

            {ownedGroups.length === 0 ? (
              <EmptyState onCreateGroup={handleCreateGroup} />
            ) : (
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="show"
                className="grid gap-4"
              >
                {ownedGroups.map((group) => (
                  <GroupCard
                    key={group.$id}
                    group={group}
                    isActive={activeGroup?.$id === group.$id}
                    onSwitch={switchGroup}
                    onEdit={handleEditGroup}
                    onDelete={setConfirmDelete}
                    onLeave={setConfirmLeave}
                    profile={profile}
                  />
                ))}
              </motion.div>
            )}
          </motion.section>

          {/* Shared Spaces Section */}
          {memberGroups.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <SectionHeader
                icon={UserCheck}
                title="Espacios compartidos"
                count={memberGroups.length}
                color="brand"
              />

              <div className="space-y-4">
                <InfoBanner />

                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="show"
                  className="grid gap-4"
                >
                  {memberGroups.map((group) => (
                    <GroupCard
                      key={group.$id}
                      group={group}
                      isActive={activeGroup?.$id === group.$id}
                      onSwitch={switchGroup}
                      onEdit={handleEditGroup}
                      onDelete={setConfirmDelete}
                      onLeave={setConfirmLeave}
                      profile={profile}
                    />
                  ))}
                </motion.div>
              </div>
            </motion.section>
          )}
        </div>
      </div>

      {/* Group Modal */}
      <GroupModal
        isOpen={showGroupModal}
        onClose={() => {
          setShowGroupModal(false);
          setEditingGroup(null);
        }}
        onSuccess={handleGroupSuccess}
        editGroup={editingGroup}
      />

      {/* Confirm Delete Modal */}
      <ConfirmModal
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDeleteGroup}
        title="Eliminar espacio"
        description={
          <>
            ¿Estás seguro de que quieres eliminar{" "}
            <strong>{confirmDelete?.name}</strong>? Esta acción eliminará todos
            los calendarios y eventos asociados. Esta acción no se puede
            deshacer.
          </>
        }
        confirmText="Eliminar"
        variant="danger"
        loading={deleteGroup.isPending}
      />

      {/* Confirm Leave Modal */}
      <ConfirmModal
        isOpen={!!confirmLeave}
        onClose={() => setConfirmLeave(null)}
        onConfirm={handleLeaveGroup}
        title="Salir del espacio"
        description={
          <>
            ¿Estás seguro de que quieres salir de{" "}
            <strong>{confirmLeave?.name}</strong>? Perderás acceso a todos los
            calendarios y eventos de este espacio. Necesitarás una nueva
            invitación para volver a unirte.
          </>
        }
        confirmText="Salir"
        variant="warning"
        loading={leaveGroup.isPending}
      />
    </div>
  );
}
