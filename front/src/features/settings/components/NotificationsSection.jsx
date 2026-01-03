import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Bell,
  Mail,
  Smartphone,
  Volume2,
  VolumeX,
  Loader2,
  Check,
  Info,
} from "lucide-react";
import { useWorkspace } from "../../../app/providers/WorkspaceProvider";
import { useUserSettings, useUpdateUserSettings } from "../../../lib/hooks";
import { Button } from "../../../components/ui/Button";

function ToggleSetting({
  label,
  description,
  icon: Icon,
  enabled,
  onToggle,
  disabled,
}) {
  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-[rgb(var(--bg-subtle))]">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
            enabled
              ? "bg-[rgb(var(--brand-1))]/10"
              : "bg-[rgb(var(--muted))]/10"
          }`}
        >
          <Icon
            className={`w-5 h-5 ${
              enabled
                ? "text-[rgb(var(--brand-1))]"
                : "text-[rgb(var(--muted))]"
            }`}
          />
        </div>
        <div>
          <div className="font-medium text-[rgb(var(--text-primary))]">
            {label}
          </div>
          <div className="text-sm text-[rgb(var(--muted))]">{description}</div>
        </div>
      </div>

      <button
        onClick={onToggle}
        disabled={disabled}
        className={`relative w-12 h-7 rounded-full transition-colors duration-200 ${
          enabled ? "bg-[rgb(var(--brand-1))]" : "bg-[rgb(var(--muted))]/30"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
      >
        <motion.div
          animate={{ x: enabled ? 22 : 2 }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
          className="absolute top-1 w-5 h-5 rounded-full bg-white shadow-sm"
        />
      </button>
    </div>
  );
}

export function NotificationsSection() {
  const { activeGroup, profile } = useWorkspace();
  const { data: settings, isLoading } = useUserSettings(
    activeGroup?.$id,
    profile?.$id
  );
  const updateSettings = useUpdateUserSettings();

  const [localSettings, setLocalSettings] = useState({
    notificationsEnabled: true,
    emailNotificationsEnabled: true,
    pushNotificationsEnabled: true,
    soundEnabled: true,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  // Sincronizar con settings
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        notificationsEnabled: settings.notificationsEnabled ?? true,
        emailNotificationsEnabled: settings.emailNotificationsEnabled ?? true,
        pushNotificationsEnabled: settings.pushNotificationsEnabled ?? true,
        soundEnabled: settings.soundEnabled ?? true,
      });
      setHasChanges(false);
    }
  }, [settings]);

  const handleToggle = (key) => {
    setLocalSettings((prev) => ({ ...prev, [key]: !prev[key] }));
    setHasChanges(true);
    setSaved(false);
  };

  const handleSave = async () => {
    if (!activeGroup || !profile) return;

    try {
      await updateSettings.mutateAsync({
        groupId: activeGroup.$id,
        profileId: profile.$id,
        data: localSettings,
      });
      setHasChanges(false);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error saving settings:", error);
    }
  };

  if (isLoading) {
    return (
      <div className="glass-card rounded-3xl p-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--brand-1))]" />
      </div>
    );
  }

  const allDisabled = !localSettings.notificationsEnabled;

  return (
    <div className="space-y-6">
      {/* Master Toggle */}
      <div className="glass-card rounded-3xl p-6">
        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-6">
          Notificaciones generales
        </h2>

        <ToggleSetting
          label="Activar notificaciones"
          description="Recibe alertas sobre tus eventos y recordatorios"
          icon={Bell}
          enabled={localSettings.notificationsEnabled}
          onToggle={() => handleToggle("notificationsEnabled")}
          disabled={updateSettings.isPending}
        />

        {!localSettings.notificationsEnabled && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-4 p-4 rounded-xl bg-[rgb(var(--warn))]/10 border border-[rgb(var(--warn))]/20"
          >
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-[rgb(var(--warn))] shrink-0 mt-0.5" />
              <div className="text-sm text-[rgb(var(--warn))]">
                <p className="font-medium">
                  Las notificaciones están desactivadas
                </p>
                <p className="mt-1 opacity-80">
                  No recibirás recordatorios de tus eventos ni alertas
                  importantes.
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Notification Channels */}
      <div
        className={`glass-card rounded-3xl p-6 transition-opacity ${
          allDisabled ? "opacity-50" : ""
        }`}
      >
        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-6">
          Canales de notificación
        </h2>

        <div className="space-y-3">
          <ToggleSetting
            label="Notificaciones por email"
            description="Recibe recordatorios en tu correo electrónico"
            icon={Mail}
            enabled={localSettings.emailNotificationsEnabled}
            onToggle={() => handleToggle("emailNotificationsEnabled")}
            disabled={updateSettings.isPending || allDisabled}
          />

          <ToggleSetting
            label="Notificaciones push"
            description="Alertas en tiempo real en tu navegador"
            icon={Smartphone}
            enabled={localSettings.pushNotificationsEnabled}
            onToggle={() => handleToggle("pushNotificationsEnabled")}
            disabled={updateSettings.isPending || allDisabled}
          />
        </div>
      </div>

      {/* Sound */}
      <div
        className={`glass-card rounded-3xl p-6 transition-opacity ${
          allDisabled ? "opacity-50" : ""
        }`}
      >
        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-6">
          Sonidos
        </h2>

        <ToggleSetting
          label="Sonido de notificaciones"
          description="Reproducir sonido al recibir notificaciones"
          icon={localSettings.soundEnabled ? Volume2 : VolumeX}
          enabled={localSettings.soundEnabled}
          onToggle={() => handleToggle("soundEnabled")}
          disabled={updateSettings.isPending || allDisabled}
        />
      </div>

      {/* Save Button */}
      {(hasChanges || saved) && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-4 flex items-center justify-between"
        >
          {saved ? (
            <div className="flex items-center gap-2 text-[rgb(var(--ok))]">
              <Check className="w-5 h-5" />
              <span className="font-medium">Cambios guardados</span>
            </div>
          ) : (
            <span className="text-sm text-[rgb(var(--muted))]">
              Tienes cambios sin guardar
            </span>
          )}

          <Button
            onClick={handleSave}
            disabled={updateSettings.isPending || saved}
            isLoading={updateSettings.isPending}
          >
            Guardar cambios
          </Button>
        </motion.div>
      )}

      {updateSettings.isError && (
        <div className="p-4 rounded-xl bg-[rgb(var(--bad))]/10 border border-[rgb(var(--bad))]/20">
          <p className="text-sm text-[rgb(var(--bad))]">
            Error al guardar las preferencias. Intenta de nuevo.
          </p>
        </div>
      )}
    </div>
  );
}
