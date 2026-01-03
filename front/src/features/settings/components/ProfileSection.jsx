import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  User,
  Mail,
  Phone,
  AtSign,
  Camera,
  Trash2,
  Loader2,
  Check,
  X,
  Edit3,
  Eye,
  Calendar,
  Shield,
  Copy,
  CheckCircle,
} from "lucide-react";
import { useWorkspace } from "../../../app/providers/WorkspaceProvider";
import { useAuth } from "../../../app/providers/AuthProvider";
import {
  useUpdateProfile,
  useUploadAvatar,
  useDeleteAvatar,
  getAvatarUrl,
} from "../../../lib/hooks";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { ImageViewerModal } from "../../../shared/ui/ImageViewerModal";
import { BUCKETS } from "../../../lib/constants";
import {
  SettingsCard,
  SettingsCardHeader,
  SettingsCardDivider,
  SettingsRow,
} from "./SettingsCard";
import { SettingsAvatar, SettingsAlert } from "./SettingsWidgets";

export function ProfileSection() {
  const { profile } = useWorkspace();
  const { state: authState } = useAuth();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const deleteAvatar = useDeleteAvatar();

  const [isEditing, setIsEditing] = useState(false);
  const [showAvatarViewer, setShowAvatarViewer] = useState(false);
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    username: "",
  });

  // Sincronizar form con profile
  useEffect(() => {
    if (profile) {
      setForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        username: profile.username || "",
      });
    }
  }, [profile]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const handleSave = async () => {
    if (!profile) return;

    try {
      await updateProfile.mutateAsync({
        profileId: profile.$id,
        data: {
          firstName: form.firstName.trim(),
          lastName: form.lastName.trim(),
          phone: form.phone.trim() || null,
          username: form.username.trim() || null,
        },
      });
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
    }
  };

  const handleCancel = () => {
    if (profile) {
      setForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        username: profile.username || "",
      });
    }
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    if (profile?.avatarFileId) {
      setShowAvatarViewer(true);
    } else {
      fileInputRef.current?.click();
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !profile) return;

    // Validar tipo y tamaño
    if (!file.type.startsWith("image/")) {
      alert("Por favor selecciona una imagen");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      alert("La imagen no puede ser mayor a 5MB");
      return;
    }

    try {
      await uploadAvatar.mutateAsync({
        profileId: profile.$id,
        file,
      });
    } catch (error) {
      console.error("Error uploading avatar:", error);
    }

    // Limpiar input
    e.target.value = "";
  };

  const handleDeleteAvatar = async () => {
    if (!profile?.avatarFileId) return;

    if (!confirm("¿Eliminar tu foto de perfil?")) return;

    try {
      await deleteAvatar.mutateAsync(profile.$id);
    } catch (error) {
      console.error("Error deleting avatar:", error);
    }
  };

  const avatarUrl = profile?.avatarFileId
    ? getAvatarUrl(profile.avatarFileId, 200, 200)
    : null;

  const initials = profile
    ? `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`
    : "?";

  const isLoading =
    updateProfile.isPending || uploadAvatar.isPending || deleteAvatar.isPending;

  const [copiedId, setCopiedId] = useState(false);

  const copyUserId = () => {
    if (profile?.$id) {
      navigator.clipboard.writeText(profile.$id);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Avatar Section - Hero Style */}
      <SettingsCard className="overflow-visible">
        <div className="flex flex-col sm:flex-row items-center gap-6 sm:gap-8">
          {/* Avatar */}
          <div className="relative">
            <SettingsAvatar
              src={avatarUrl}
              initials={initials}
              size="lg"
              loading={uploadAvatar.isPending || deleteAvatar.isPending}
              onView={() => setShowAvatarViewer(true)}
              onUpload={() => fileInputRef.current?.click()}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Info & Actions */}
          <div className="flex-1 text-center sm:text-left space-y-4">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold text-[rgb(var(--text-primary))]">
                {profile?.firstName} {profile?.lastName}
              </h2>
              <p className="text-sm text-[rgb(var(--text-muted))] mt-1 flex items-center justify-center sm:justify-start gap-2">
                <Mail className="w-4 h-4" />
                {profile?.email}
              </p>
            </div>

            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              <Button
                variant="soft"
                size="sm"
                leftIcon={<Camera className="w-4 h-4" />}
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                {avatarUrl ? "Cambiar foto" : "Subir foto"}
              </Button>

              {avatarUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  onClick={handleDeleteAvatar}
                  disabled={isLoading}
                  className="text-[rgb(var(--error))] hover:bg-[rgb(var(--error))]/10"
                >
                  Eliminar
                </Button>
              )}
            </div>

            <p className="text-xs text-[rgb(var(--text-muted))]">
              JPG, PNG o GIF • Máximo 5MB
            </p>
          </div>
        </div>
      </SettingsCard>

      {/* Profile Info Section */}
      <SettingsCard>
        <SettingsCardHeader
          icon={User}
          title="Información personal"
          description="Tu información básica de perfil"
          action={
            !isEditing ? (
              <Button
                variant="soft"
                size="sm"
                leftIcon={<Edit3 className="w-4 h-4" />}
                onClick={() => setIsEditing(true)}
              >
                Editar
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<X className="w-4 h-4" />}
                  onClick={handleCancel}
                  disabled={updateProfile.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  size="sm"
                  leftIcon={
                    updateProfile.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Check className="w-4 h-4" />
                    )
                  }
                  onClick={handleSave}
                  disabled={updateProfile.isPending}
                >
                  Guardar
                </Button>
              </div>
            )
          }
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-[rgb(var(--text-secondary))]">
              Nombre
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--text-muted))]" />
              <input
                type="text"
                placeholder="Tu nombre"
                value={form.firstName}
                onChange={handleChange("firstName")}
                disabled={!isEditing || isLoading}
                className={clsx(
                  "w-full pl-12 pr-4 py-3 rounded-xl text-sm",
                  "bg-[rgb(var(--bg-muted))] border border-[rgb(var(--border-base))]",
                  "text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))]",
                  "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))] focus:border-transparent focus:bg-[rgb(var(--bg-surface))]",
                  "transition-all duration-200",
                  "disabled:opacity-60 disabled:cursor-not-allowed"
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[rgb(var(--text-secondary))]">
              Apellido
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--text-muted))]" />
              <input
                type="text"
                placeholder="Tu apellido"
                value={form.lastName}
                onChange={handleChange("lastName")}
                disabled={!isEditing || isLoading}
                className={clsx(
                  "w-full pl-12 pr-4 py-3 rounded-xl text-sm",
                  "bg-[rgb(var(--bg-muted))] border border-[rgb(var(--border-base))]",
                  "text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))]",
                  "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))] focus:border-transparent focus:bg-[rgb(var(--bg-surface))]",
                  "transition-all duration-200",
                  "disabled:opacity-60 disabled:cursor-not-allowed"
                )}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[rgb(var(--text-secondary))]">
              Correo electrónico
            </label>
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--text-muted))]" />
              <input
                type="email"
                value={profile?.email || ""}
                disabled
                className={clsx(
                  "w-full pl-12 pr-4 py-3 rounded-xl text-sm",
                  "bg-[rgb(var(--bg-muted))] border border-[rgb(var(--border-base))]",
                  "text-[rgb(var(--text-primary))]",
                  "opacity-60 cursor-not-allowed"
                )}
              />
            </div>
            <p className="text-xs text-[rgb(var(--text-muted))] pl-1">
              El email no se puede cambiar desde aquí
            </p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-[rgb(var(--text-secondary))]">
              Teléfono
            </label>
            <div className="relative">
              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--text-muted))]" />
              <input
                type="tel"
                placeholder="+52 123 456 7890"
                value={form.phone}
                onChange={handleChange("phone")}
                disabled={!isEditing || isLoading}
                className={clsx(
                  "w-full pl-12 pr-4 py-3 rounded-xl text-sm",
                  "bg-[rgb(var(--bg-muted))] border border-[rgb(var(--border-base))]",
                  "text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))]",
                  "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))] focus:border-transparent focus:bg-[rgb(var(--bg-surface))]",
                  "transition-all duration-200",
                  "disabled:opacity-60 disabled:cursor-not-allowed"
                )}
              />
            </div>
          </div>

          <div className="sm:col-span-2 space-y-2">
            <label className="text-sm font-medium text-[rgb(var(--text-secondary))]">
              Nombre de usuario
            </label>
            <div className="relative">
              <AtSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--text-muted))]" />
              <input
                type="text"
                placeholder="usuario123"
                value={form.username}
                onChange={handleChange("username")}
                disabled={!isEditing || isLoading}
                className={clsx(
                  "w-full pl-12 pr-4 py-3 rounded-xl text-sm",
                  "bg-[rgb(var(--bg-muted))] border border-[rgb(var(--border-base))]",
                  "text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))]",
                  "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))] focus:border-transparent focus:bg-[rgb(var(--bg-surface))]",
                  "transition-all duration-200",
                  "disabled:opacity-60 disabled:cursor-not-allowed"
                )}
              />
            </div>
            <p className="text-xs text-[rgb(var(--text-muted))] pl-1">
              Opcional • Se puede usar para encontrarte más fácil
            </p>
          </div>
        </div>

        {updateProfile.isError && (
          <SettingsAlert
            type="error"
            title="Error al guardar"
            description={
              updateProfile.error?.message ||
              "No se pudieron guardar los cambios"
            }
            className="mt-6"
          />
        )}
      </SettingsCard>

      {/* Account Info */}
      <SettingsCard>
        <SettingsCardHeader
          icon={Shield}
          title="Información de la cuenta"
          description="Detalles de tu cuenta"
          iconColor="muted"
        />

        <div className="space-y-1 rounded-xl bg-[rgb(var(--bg-muted))]/50 p-4">
          <SettingsRow
            icon={User}
            label="ID de usuario"
            value={
              <button
                onClick={copyUserId}
                className="flex items-center gap-2 font-mono text-xs hover:text-[rgb(var(--brand-primary))] transition-colors"
              >
                {profile?.$id?.slice(0, 8)}...
                {copiedId ? (
                  <CheckCircle className="w-3.5 h-3.5 text-[rgb(var(--success))]" />
                ) : (
                  <Copy className="w-3.5 h-3.5" />
                )}
              </button>
            }
          />
          <SettingsRow
            icon={Calendar}
            label="Cuenta creada"
            value={
              profile?.$createdAt
                ? new Date(profile.$createdAt).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "-"
            }
          />
          <SettingsRow
            icon={Shield}
            label="Estado"
            value={
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgb(var(--success))]/10 text-[rgb(var(--success))] text-xs font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[rgb(var(--success))]" />
                Activo
              </span>
            }
            border={false}
          />
        </div>
      </SettingsCard>

      {/* Image Viewer Modal */}
      {profile?.avatarFileId && BUCKETS.AVATARS && (
        <ImageViewerModal
          isOpen={showAvatarViewer}
          onClose={() => setShowAvatarViewer(false)}
          currentImageId={profile.avatarFileId}
          images={[profile.avatarFileId]}
          bucketId={BUCKETS.AVATARS}
        />
      )}
    </div>
  );
}
