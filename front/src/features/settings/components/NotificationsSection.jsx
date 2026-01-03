import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  Bell,
  Mail,
  Smartphone,
  Volume2,
  VolumeX,
  Loader2,
  Check,
  Info,
  BellOff,
  Save,
} from "lucide-react";
import { useWorkspace } from "../../../app/providers/WorkspaceProvider";
import { useUserSettings, useUpdateUserSettings } from "../../../lib/hooks";
import { Button } from "../../../components/ui/Button";
import { SettingsCard, SettingsCardHeader } from "./SettingsCard";
import { SettingsToggle } from "./SettingsControls";
import { SettingsAlert, SettingsSkeleton } from "./SettingsWidgets";

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
      <SettingsCard>
        <SettingsSkeleton rows={4} />
      </SettingsCard>
    );
  }

  const allDisabled = !localSettings.notificationsEnabled;

  return (
    <div className="space-y-6">
      {/* Master Toggle */}
      <SettingsCard>
        <SettingsCardHeader
          icon={Bell}
          title="Notificaciones generales"
          description="Controla todas tus notificaciones"
        />

        <SettingsToggle
          label="Activar notificaciones"
          description="Recibe alertas sobre tus eventos y recordatorios"
          icon={Bell}
          enabled={localSettings.notificationsEnabled}
          onToggle={() => handleToggle("notificationsEnabled")}
          disabled={updateSettings.isPending}
        />

        <AnimatePresence>
          {!localSettings.notificationsEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4"
            >
              <SettingsAlert
                type="warning"
                icon={BellOff}
                title="Las notificaciones están desactivadas"
                description="No recibirás recordatorios de tus eventos ni alertas importantes."
              />
            </motion.div>
          )}
        </AnimatePresence>
      </SettingsCard>

      {/* Notification Channels */}
      <SettingsCard
        className={clsx(
          "transition-all duration-300",
          allDisabled && "opacity-50 pointer-events-none"
        )}
      >
        <SettingsCardHeader
          icon={Mail}
          title="Canales de notificación"
          description="Elige cómo quieres recibir las notificaciones"
        />

        <div className="space-y-3">
          <SettingsToggle
            label="Notificaciones por email"
            description="Recibe recordatorios en tu correo electrónico"
            icon={Mail}
            enabled={localSettings.emailNotificationsEnabled}
            onToggle={() => handleToggle("emailNotificationsEnabled")}
            disabled={updateSettings.isPending || allDisabled}
          />

          <SettingsToggle
            label="Notificaciones push"
            description="Alertas en tiempo real en tu navegador"
            icon={Smartphone}
            enabled={localSettings.pushNotificationsEnabled}
            onToggle={() => handleToggle("pushNotificationsEnabled")}
            disabled={updateSettings.isPending || allDisabled}
          />
        </div>
      </SettingsCard>

      {/* Sound */}
      <SettingsCard
        className={clsx(
          "transition-all duration-300",
          allDisabled && "opacity-50 pointer-events-none"
        )}
      >
        <SettingsCardHeader
          icon={localSettings.soundEnabled ? Volume2 : VolumeX}
          title="Sonidos"
          description="Controla los sonidos de la aplicación"
        />

        <SettingsToggle
          label="Sonido de notificaciones"
          description="Reproducir sonido al recibir notificaciones"
          icon={localSettings.soundEnabled ? Volume2 : VolumeX}
          enabled={localSettings.soundEnabled}
          onToggle={() => handleToggle("soundEnabled")}
          disabled={updateSettings.isPending || allDisabled}
        />
      </SettingsCard>

      {/* Save Button - Floating style */}
      <AnimatePresence>
        {(hasChanges || saved) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className={clsx(
              "sticky bottom-4 z-10",
              "p-4 rounded-2xl",
              "bg-[rgb(var(--bg-surface))]/95 backdrop-blur-sm",
              "border border-[rgb(var(--border-base))]",
              "shadow-lg shadow-black/10",
              "flex items-center justify-between gap-4"
            )}
          >
            {saved ? (
              <div className="flex items-center gap-2 text-[rgb(var(--success))]">
                <div className="w-8 h-8 rounded-lg bg-[rgb(var(--success))]/10 flex items-center justify-center">
                  <Check className="w-4 h-4" />
                </div>
                <span className="font-medium">Cambios guardados</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-[rgb(var(--text-muted))]">
                <div className="w-2 h-2 rounded-full bg-[rgb(var(--warning))] animate-pulse" />
                <span className="text-sm">Tienes cambios sin guardar</span>
              </div>
            )}

            <Button
              onClick={handleSave}
              disabled={updateSettings.isPending || saved}
              loading={updateSettings.isPending}
              leftIcon={
                !updateSettings.isPending && <Save className="w-4 h-4" />
              }
            >
              Guardar cambios
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {updateSettings.isError && (
        <SettingsAlert
          type="error"
          title="Error"
          description="Error al guardar las preferencias. Intenta de nuevo."
        />
      )}
    </div>
  );
}
