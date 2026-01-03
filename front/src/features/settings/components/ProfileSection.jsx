import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
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

  return (
    <div className="space-y-6">
      {/* Avatar Section */}
      <div className="glass-card rounded-3xl p-6">
        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-6">
          Foto de perfil
        </h2>

        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Avatar */}
          <div className="relative group">
            <button
              onClick={handleAvatarClick}
              disabled={isLoading}
              className="relative w-28 h-28 rounded-3xl overflow-hidden focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-1))] focus:ring-offset-2 focus:ring-offset-[rgb(var(--bg-app))]"
            >
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full gradient-brand flex items-center justify-center">
                  <span className="text-3xl font-bold text-white">
                    {initials.toUpperCase()}
                  </span>
                </div>
              )}

              {/* Overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {avatarUrl ? (
                  <Eye className="w-6 h-6 text-white" />
                ) : (
                  <Camera className="w-6 h-6 text-white" />
                )}
              </div>

              {/* Loading overlay */}
              {(uploadAvatar.isPending || deleteAvatar.isPending) && (
                <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                  <Loader2 className="w-8 h-8 text-white animate-spin" />
                </div>
              )}
            </button>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>

          {/* Avatar Actions */}
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-medium text-[rgb(var(--text-primary))]">
              {profile?.firstName} {profile?.lastName}
            </h3>
            <p className="text-sm text-[rgb(var(--muted))] mt-1">
              {profile?.email}
            </p>

            <div className="flex flex-wrap gap-2 mt-4 justify-center sm:justify-start">
              <Button
                variant="soft"
                size="sm"
                leftIcon={<Camera className="w-4 h-4" />}
                onClick={() => fileInputRef.current?.click()}
                disabled={isLoading}
              >
                {avatarUrl ? "Cambiar" : "Subir"} foto
              </Button>

              {avatarUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                  onClick={handleDeleteAvatar}
                  disabled={isLoading}
                  className="text-[rgb(var(--bad))] hover:bg-[rgb(var(--bad))]/10"
                >
                  Eliminar
                </Button>
              )}
            </div>

            <p className="text-xs text-[rgb(var(--muted))] mt-3">
              JPG, PNG o GIF. Máximo 5MB.
            </p>
          </div>
        </div>
      </div>

      {/* Profile Info Section */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
            Información personal
          </h2>

          {!isEditing ? (
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
          )}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Input
            label="Nombre"
            placeholder="Tu nombre"
            value={form.firstName}
            onChange={handleChange("firstName")}
            disabled={!isEditing || isLoading}
            icon={User}
          />

          <Input
            label="Apellido"
            placeholder="Tu apellido"
            value={form.lastName}
            onChange={handleChange("lastName")}
            disabled={!isEditing || isLoading}
            icon={User}
          />

          <Input
            label="Correo electrónico"
            type="email"
            value={profile?.email || ""}
            disabled
            icon={Mail}
            hint="El email no se puede cambiar desde aquí"
          />

          <Input
            label="Teléfono"
            placeholder="+52 123 456 7890"
            value={form.phone}
            onChange={handleChange("phone")}
            disabled={!isEditing || isLoading}
            icon={Phone}
          />

          <div className="sm:col-span-2">
            <Input
              label="Nombre de usuario"
              placeholder="usuario123"
              value={form.username}
              onChange={handleChange("username")}
              disabled={!isEditing || isLoading}
              icon={AtSign}
              hint="Opcional. Se puede usar para encontrarte más fácil."
            />
          </div>
        </div>

        {updateProfile.isError && (
          <div className="mt-4 p-3 rounded-xl bg-[rgb(var(--bad))]/10 border border-[rgb(var(--bad))]/20">
            <p className="text-sm text-[rgb(var(--bad))]">
              {updateProfile.error?.message || "Error al guardar los cambios"}
            </p>
          </div>
        )}
      </div>

      {/* Account Info */}
      <div className="glass-card rounded-3xl p-6">
        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-4">
          Información de la cuenta
        </h2>

        <div className="space-y-3 text-sm">
          <div className="flex justify-between py-2 border-b border-[rgb(var(--glass-border))]">
            <span className="text-[rgb(var(--muted))]">ID de usuario</span>
            <span className="font-mono text-[rgb(var(--text-secondary))]">
              {profile?.$id?.slice(0, 8)}...
            </span>
          </div>
          <div className="flex justify-between py-2 border-b border-[rgb(var(--glass-border))]">
            <span className="text-[rgb(var(--muted))]">Cuenta creada</span>
            <span className="text-[rgb(var(--text-secondary))]">
              {profile?.$createdAt
                ? new Date(profile.$createdAt).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })
                : "-"}
            </span>
          </div>
          <div className="flex justify-between py-2">
            <span className="text-[rgb(var(--muted))]">Estado</span>
            <span className="px-2 py-0.5 rounded-full bg-[rgb(var(--ok))]/10 text-[rgb(var(--ok))] text-xs font-medium">
              Activo
            </span>
          </div>
        </div>
      </div>

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
