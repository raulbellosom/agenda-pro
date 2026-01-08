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
  AlertCircle,
} from "lucide-react";
import { useWorkspace } from "../../../app/providers/WorkspaceProvider";
import { useUserSettings, useUpdateUserSettings } from "../../../lib/hooks";
import { useRequestNotificationPermission } from "../../../lib/hooks/useNotifications";
import {
  isIOS,
  isIOSStandalone,
  isIOSNotificationSupported,
} from "../../../lib/firebase_config";
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
  const {
    permission,
    hasPermission,
    isDenied,
    isRequesting,
    requestPermission,
    fcmToken,
  } = useRequestNotificationPermission();

  const [localSettings, setLocalSettings] = useState({
    notificationsEnabled: true,
    emailNotificationsEnabled: true,
    pushNotificationsEnabled: true,
    soundEnabled: true,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  // Detect iOS and its capabilities
  const isIOSDevice = isIOS();
  const isIOSPWA = isIOSStandalone();
  const iosSupportsNotifications = isIOSNotificationSupported();

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

          {/* Push Notification Permission Status */}
          {localSettings.pushNotificationsEnabled && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-3 pl-11"
            >
              {/* iOS specific warnings */}
              {isIOSDevice && !iosSupportsNotifications && (
                <SettingsAlert
                  type="warning"
                  icon={AlertCircle}
                  title="iOS 16.4+ requerido"
                  description="Las notificaciones push en iOS requieren la versión 16.4 o superior. Por favor, actualiza tu dispositivo."
                />
              )}

              {isIOSDevice && iosSupportsNotifications && !isIOSPWA && (
                <SettingsAlert
                  type="warning"
                  icon={Info}
                  title="Instalar como aplicación"
                  description="En iOS, las notificaciones push solo funcionan cuando instalas la app en tu pantalla de inicio. Toca el botón de compartir y selecciona 'Agregar a pantalla de inicio'."
                />
              )}

              {/* Standard notification states */}
              {(!isIOSDevice ||
                (isIOSDevice && iosSupportsNotifications && isIOSPWA)) && (
                <>
                  {hasPermission && fcmToken ? (
                    <SettingsAlert
                      type="success"
                      icon={Check}
                      title="Push habilitado"
                      description="Tu navegador está configurado para recibir notificaciones."
                    />
                  ) : isDenied ? (
                    <SettingsAlert
                      type="error"
                      icon={AlertCircle}
                      title="Permisos bloqueados"
                      description={
                        isIOSDevice
                          ? "Ve a Ajustes → Safari → Sitios web → Notificaciones y habilita las notificaciones para esta app."
                          : "Para habilitar notificaciones push, debes cambiar la configuración en tu navegador. Haz clic en el ícono 🔒 en la barra de direcciones y permite las notificaciones."
                      }
                    />
                  ) : (
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                            Se requiere permiso del navegador
                          </p>
                          <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                            {isIOSDevice
                              ? "Toca el botón para habilitar notificaciones. iOS te pedirá confirmación."
                              : "Para recibir notificaciones push, necesitas autorizar el acceso en tu navegador."}
                          </p>
                          <Button
                            onClick={requestPermission}
                            disabled={isRequesting}
                            size="sm"
                            className="mt-2"
                          >
                            {isRequesting ? (
                              <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Solicitando...
                              </>
                            ) : (
                              <>
                                <Bell className="w-4 h-4 mr-2" />
                                Habilitar notificaciones
                              </>
                            )}
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </motion.div>
          )}
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
