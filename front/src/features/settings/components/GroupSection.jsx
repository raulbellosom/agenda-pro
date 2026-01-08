import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  Building2,
  Camera,
  Trash2,
  Loader2,
  Check,
  X,
  Edit3,
  Globe,
  MapPin,
  Info,
  Shield,
  Crown,
} from "lucide-react";
import { useWorkspace } from "../../../app/providers/WorkspaceProvider";
import {
  useUpdateGroup,
  useUploadGroupLogo,
  useDeleteGroupLogo,
  getGroupLogoUrl,
} from "../../../lib/hooks";
import {
  useUserPermissions,
  SYSTEM_PERMISSIONS,
} from "../../../lib/hooks/useRbac";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import {
  SettingsCard,
  SettingsCardHeader,
  SettingsCardDivider,
  SettingsRow,
} from "./SettingsCard";
import { SettingsAlert } from "./SettingsWidgets";
import { DEFAULTS } from "../../../lib/constants";

// Lista de zonas horarias comunes
const TIMEZONES = [
  { value: "America/Mexico_City", label: "Ciudad de México (GMT-6)" },
  { value: "America/New_York", label: "Nueva York (GMT-5)" },
  { value: "America/Los_Angeles", label: "Los Ángeles (GMT-8)" },
  { value: "America/Chicago", label: "Chicago (GMT-6)" },
  { value: "America/Denver", label: "Denver (GMT-7)" },
  { value: "America/Bogota", label: "Bogotá (GMT-5)" },
  { value: "America/Lima", label: "Lima (GMT-5)" },
  { value: "America/Sao_Paulo", label: "São Paulo (GMT-3)" },
  { value: "America/Buenos_Aires", label: "Buenos Aires (GMT-3)" },
  { value: "America/Santiago", label: "Santiago (GMT-4)" },
  { value: "Europe/Madrid", label: "Madrid (GMT+1)" },
  { value: "Europe/London", label: "Londres (GMT+0)" },
  { value: "Europe/Paris", label: "París (GMT+1)" },
  { value: "UTC", label: "UTC" },
];

export function GroupSection() {
  const { activeGroup, profile, isOwner, refetchGroups } = useWorkspace();
  const updateGroup = useUpdateGroup();
  const uploadLogo = useUploadGroupLogo();
  const deleteLogo = useDeleteGroupLogo();

  const { data: permissions } = useUserPermissions(
    activeGroup?.$id,
    profile?.$id
  );
  const canEditGroup =
    isOwner || permissions?.some((p) => p.key === "groups.edit");

  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    timezone: "",
  });

  useEffect(() => {
    if (activeGroup) {
      setForm({
        name: activeGroup.name || "",
        description: activeGroup.description || "",
        timezone: activeGroup.timezone || DEFAULTS.TIMEZONE,
      });
    }
  }, [activeGroup]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    if (!activeGroup) return;

    try {
      await updateGroup.mutateAsync({
        groupId: activeGroup.$id,
        data: {
          name: form.name.trim(),
          description: form.description.trim() || null,
          timezone: form.timezone,
        },
      });
      setIsEditing(false);
      refetchGroups?.();
    } catch (error) {
      console.error("Error updating group:", error);
    }
  };

  const handleCancel = () => {
    if (activeGroup) {
      setForm({
        name: activeGroup.name || "",
        description: activeGroup.description || "",
        timezone: activeGroup.timezone || DEFAULTS.TIMEZONE,
      });
    }
    setIsEditing(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeGroup) return;

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return;
    }

    try {
      await uploadLogo.mutateAsync({ groupId: activeGroup.$id, file });
      refetchGroups?.();
    } catch (error) {
      console.error("Error uploading logo:", error);
    }
  };

  const handleLogoDelete = async () => {
    if (!activeGroup) return;
    try {
      await deleteLogo.mutateAsync(activeGroup.$id);
      refetchGroups?.();
    } catch (error) {
      console.error("Error deleting logo:", error);
    }
  };

  const logoUrl = activeGroup?.logoFileId
    ? getGroupLogoUrl(activeGroup.logoFileId, 200, 200)
    : null;

  const isLoading =
    updateGroup.isPending || uploadLogo.isPending || deleteLogo.isPending;

  if (!activeGroup) {
    return (
      <SettingsCard>
        <div className="text-center py-8">
          <Building2 className="w-12 h-12 mx-auto text-[rgb(var(--text-muted))] mb-3" />
          <p className="text-[rgb(var(--text-muted))]">
            No hay un espacio activo
          </p>
        </div>
      </SettingsCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* Group Info Card */}
      <SettingsCard>
        <SettingsCardHeader
          icon={Building2}
          title="Información del espacio"
          description="Nombre, descripción y configuración del grupo"
          action={
            canEditGroup && !isEditing ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(true)}
                disabled={isLoading}
                className="gap-2"
              >
                <Edit3 className="w-4 h-4" />
                Editar
              </Button>
            ) : null
          }
        />

        {/* Logo Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-6">
          <div className="relative">
            <div
              className={clsx(
                "w-20 h-20 rounded-2xl flex items-center justify-center overflow-hidden",
                "border-2 border-[rgb(var(--border-base))]",
                "bg-linear-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-dark))]"
              )}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt={activeGroup.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <span className="text-2xl font-bold text-white">
                  {activeGroup.name?.charAt(0)?.toUpperCase() || "?"}
                </span>
              )}
            </div>

            {canEditGroup && (
              <>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  className={clsx(
                    "absolute -bottom-1 -right-1",
                    "w-8 h-8 rounded-full",
                    "bg-[rgb(var(--brand-primary))] text-white",
                    "flex items-center justify-center",
                    "shadow-lg hover:bg-[rgb(var(--brand-dark))]",
                    "transition-all duration-200",
                    "disabled:opacity-50"
                  )}
                >
                  {uploadLogo.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Camera className="w-4 h-4" />
                  )}
                </button>
              </>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] truncate">
                {activeGroup.name}
              </h3>
              {isOwner && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 text-xs font-medium">
                  <Crown className="w-3 h-3" />
                  Propietario
                </span>
              )}
            </div>
            {activeGroup.description && (
              <p className="text-sm text-[rgb(var(--text-muted))] mt-1 line-clamp-2">
                {activeGroup.description}
              </p>
            )}
            {logoUrl && canEditGroup && (
              <button
                onClick={handleLogoDelete}
                disabled={isLoading}
                className="text-xs text-[rgb(var(--error))] hover:underline mt-2"
              >
                {deleteLogo.isPending ? "Eliminando..." : "Eliminar logo"}
              </button>
            )}
          </div>
        </div>

        <SettingsCardDivider />

        {/* Edit Form or View */}
        <AnimatePresence mode="wait">
          {isEditing ? (
            <motion.div
              key="edit"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                  Nombre del espacio
                </label>
                <Input
                  value={form.name}
                  onChange={handleChange("name")}
                  placeholder="Mi espacio de trabajo"
                  disabled={isLoading}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                  Descripción
                </label>
                <textarea
                  value={form.description}
                  onChange={handleChange("description")}
                  placeholder="Descripción opcional del espacio..."
                  rows={3}
                  disabled={isLoading}
                  className={clsx(
                    "w-full px-4 py-3 rounded-xl",
                    "bg-[rgb(var(--bg-muted))] border border-[rgb(var(--border-base))]",
                    "text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-muted))]",
                    "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))]/50",
                    "resize-none transition-all"
                  )}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                  Zona horaria
                </label>
                <select
                  value={form.timezone}
                  onChange={handleChange("timezone")}
                  disabled={isLoading}
                  className={clsx(
                    "w-full px-4 py-3 rounded-xl",
                    "bg-[rgb(var(--bg-muted))] border border-[rgb(var(--border-base))]",
                    "text-[rgb(var(--text-primary))]",
                    "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))]/50",
                    "transition-all appearance-none cursor-pointer"
                  )}
                >
                  {TIMEZONES.map((tz) => (
                    <option key={tz.value} value={tz.value}>
                      {tz.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={handleCancel}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={isLoading || !form.name.trim()}
                  leftIcon={
                    updateGroup.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )
                  }
                >
                  {updateGroup.isPending ? "Guardando..." : "Guardar"}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="view"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-4"
            >
              <SettingsRow
                icon={Building2}
                label="Nombre"
                value={activeGroup.name}
              />
              <SettingsRow
                icon={Info}
                label="Descripción"
                value={activeGroup.description || "Sin descripción"}
                muted={!activeGroup.description}
              />
              <SettingsRow
                icon={Globe}
                label="Zona horaria"
                value={
                  TIMEZONES.find((tz) => tz.value === activeGroup.timezone)
                    ?.label || activeGroup.timezone
                }
              />
            </motion.div>
          )}
        </AnimatePresence>
      </SettingsCard>

      {/* Permissions Info */}
      {!isOwner && (
        <SettingsAlert
          type="info"
          icon={Shield}
          title="Permisos"
          description={
            canEditGroup
              ? "Tienes permisos para editar este espacio."
              : "Solo el propietario o usuarios con permisos pueden editar este espacio."
          }
        />
      )}
    </div>
  );
}
