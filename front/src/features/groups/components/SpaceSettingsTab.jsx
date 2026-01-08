import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
  Building2,
  Camera,
  Trash2,
  Loader2,
  Edit3,
  Globe,
  Info,
} from "lucide-react";
import { useWorkspace } from "../../../app/providers/WorkspaceProvider";
import {
  useUpdateGroup,
  useUploadGroupLogo,
  useDeleteGroupLogo,
  getGroupLogoUrl,
} from "../../../lib/hooks";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { GroupLogo } from "../../../components/ui/Avatar";
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

export function SpaceSettingsTab({ group, isOwner }) {
  const updateGroup = useUpdateGroup();
  const uploadLogo = useUploadGroupLogo();
  const deleteLogo = useDeleteGroupLogo();
  const { refetchGroups } = useWorkspace();

  const [isEditing, setIsEditing] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: "",
    description: "",
    timezone: "",
  });

  useEffect(() => {
    if (group) {
      setForm({
        name: group.name || "",
        description: group.description || "",
        timezone: group.timezone || DEFAULTS.TIMEZONE,
      });
    }
  }, [group]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    if (!group) return;

    try {
      await updateGroup.mutateAsync({
        groupId: group.$id,
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
    if (group) {
      setForm({
        name: group.name || "",
        description: group.description || "",
        timezone: group.timezone || DEFAULTS.TIMEZONE,
      });
    }
    setIsEditing(false);
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !group) return;

    // Validar tipo de archivo
    if (!file.type.startsWith("image/")) {
      return;
    }

    // Validar tamaño (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      return;
    }

    try {
      await uploadLogo.mutateAsync({ groupId: group.$id, file });
      refetchGroups?.();
    } catch (error) {
      console.error("Error uploading logo:", error);
    }
  };

  const handleLogoDelete = async () => {
    if (!group) return;
    try {
      await deleteLogo.mutateAsync(group.$id);
      refetchGroups?.();
    } catch (error) {
      console.error("Error deleting logo:", error);
    }
  };

  const logoUrl = group?.logoFileId
    ? getGroupLogoUrl(group.logoFileId, 200, 200)
    : null;

  const isLoading =
    updateGroup.isPending || uploadLogo.isPending || deleteLogo.isPending;

  if (!group) {
    return (
      <div className="text-center py-8">
        <Building2 className="w-12 h-12 mx-auto text-[rgb(var(--text-muted))] mb-3" />
        <p className="text-[rgb(var(--text-muted))]">
          No hay un espacio activo
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Logo Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-[rgb(var(--bg-muted))]/30 border border-[rgb(var(--border-base))]"
      >
        <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-4">
          Logo del espacio
        </h3>

        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          {/* Logo Preview */}
          <div
            className={clsx(
              "w-32 h-32 rounded-2xl flex items-center justify-center overflow-hidden",
              "border-2 border-dashed border-[rgb(var(--border-base))]"
            )}
          >
            <GroupLogo src={logoUrl} name={group.name} size="full" />
          </div>

          {/* Upload/Delete Buttons */}
          <div className="flex gap-2 flex-wrap">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleLogoUpload}
              disabled={!isOwner || isLoading}
              className="hidden"
            />
            <Button
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={!isOwner || isLoading}
              loading={uploadLogo.isPending}
              leftIcon={!uploadLogo.isPending && <Camera className="w-4 h-4" />}
            >
              {uploadLogo.isPending ? "Subiendo..." : "Cambiar logo"}
            </Button>
            {logoUrl && (
              <Button
                variant="ghost"
                onClick={handleLogoDelete}
                disabled={!isOwner || isLoading}
                className="text-[rgb(var(--error))]"
                leftIcon={<Trash2 className="w-4 h-4" />}
              >
                Eliminar
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Info Section */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 rounded-xl bg-[rgb(var(--bg-muted))]/30 border border-[rgb(var(--border-base))]"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-[rgb(var(--text-primary))]">
            Información del espacio
          </h3>
          {!isEditing && isOwner && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(true)}
              disabled={isLoading}
              leftIcon={<Edit3 className="w-4 h-4" />}
            >
              Editar
            </Button>
          )}
        </div>

        {isEditing ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                Nombre del espacio
              </label>
              <Input
                value={form.name}
                onChange={handleChange("name")}
                placeholder="Mi espacio"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                Descripción
              </label>
              <textarea
                value={form.description}
                onChange={handleChange("description")}
                placeholder="Describe el propósito de tu espacio..."
                className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] text-sm resize-none h-20"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                Zona horaria
              </label>
              <select
                value={form.timezone}
                onChange={handleChange("timezone")}
                className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] text-sm"
              >
                {TIMEZONES.map((tz) => (
                  <option key={tz.value} value={tz.value}>
                    {tz.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-3 pt-4">
              <Button
                variant="ghost"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={isLoading}
                loading={isLoading}
              >
                {isLoading ? "Guardando..." : "Guardar cambios"}
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-[rgb(var(--text-muted))]">
                Nombre
              </label>
              <p className="mt-1 text-[rgb(var(--text-primary))]">
                {form.name}
              </p>
            </div>

            {form.description && (
              <div>
                <label className="text-xs font-medium text-[rgb(var(--text-muted))]">
                  Descripción
                </label>
                <p className="mt-1 text-[rgb(var(--text-primary))]">
                  {form.description}
                </p>
              </div>
            )}

            <div>
              <label className="text-xs font-medium text-[rgb(var(--text-muted))]">
                Zona horaria
              </label>
              <div className="mt-1 flex items-center gap-2 text-[rgb(var(--text-primary))]">
                <Globe className="w-4 h-4 text-[rgb(var(--text-muted))]" />
                {TIMEZONES.find((tz) => tz.value === form.timezone)?.label ||
                  form.timezone}
              </div>
            </div>
          </div>
        )}
      </motion.div>

      {/* Info Alert */}
      {!isOwner && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-[rgb(var(--info))]/5 border border-[rgb(var(--info))]/20"
        >
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-[rgb(var(--info))] mt-0.5 shrink-0" />
            <p className="text-sm text-[rgb(var(--text-muted))]">
              Solo el propietario del espacio puede editar esta información
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
