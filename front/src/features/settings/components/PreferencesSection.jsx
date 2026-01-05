import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  Globe,
  Calendar,
  Clock,
  Palette,
  Languages,
  Loader2,
  Check,
  Bell,
  Save,
  Download,
  Smartphone,
  CheckCircle2,
} from "lucide-react";
import { useWorkspace } from "../../../app/providers/WorkspaceProvider";
import {
  useUserSettings,
  useUpdateUserSettings,
  SETTINGS_OPTIONS,
} from "../../../lib/hooks";
import { Button } from "../../../components/ui/Button";
import { SettingsCard, SettingsCardHeader } from "./SettingsCard";
import { SettingsSelect } from "./SettingsControls";
import { SettingsAlert, SettingsSkeleton } from "./SettingsWidgets";
import { useIsPWA, usePWAInstall } from "../../../components/PWAInstallPrompt";

export function PreferencesSection() {
  const { activeGroup, profile } = useWorkspace();
  const { data: settings, isLoading } = useUserSettings(
    activeGroup?.$id,
    profile?.$id
  );
  const updateSettings = useUpdateUserSettings();
  const isPWA = useIsPWA();
  const { isInstallable, install } = usePWAInstall();
  const [installing, setInstalling] = useState(false);

  const [localSettings, setLocalSettings] = useState({
    timezone: "America/Mexico_City",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
    weekStartsOn: 1,
    language: "es",
    theme: "SYSTEM",
    defaultReminderMinutes: 15,
  });

  const [hasChanges, setHasChanges] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleInstallPWA = async () => {
    setInstalling(true);
    try {
      await install();
    } finally {
      setInstalling(false);
    }
  };

  // Sincronizar con settings
  useEffect(() => {
    if (settings) {
      setLocalSettings({
        timezone: settings.timezone || "America/Mexico_City",
        dateFormat: settings.dateFormat || "DD/MM/YYYY",
        timeFormat: settings.timeFormat || "24h",
        weekStartsOn: settings.weekStartsOn ?? 1,
        language: settings.language || "es",
        theme: settings.theme || "SYSTEM",
        defaultReminderMinutes: settings.defaultReminderMinutes ?? 15,
      });
      setHasChanges(false);
    }
  }, [settings]);

  const handleChange = (key, value) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }));
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
        <SettingsSkeleton rows={5} />
      </SettingsCard>
    );
  }

  return (
    <div className="space-y-6">
      {/* PWA Installation Card */}
      {!isPWA && (
        <SettingsCard>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-[rgb(var(--brand-primary))]" />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  Instalar aplicación
                </h3>
                <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                  Instala Agenda Pro en tu dispositivo para acceso rápido y una
                  experiencia de app nativa. No ocupa espacio adicional.
                </p>

                <div className="mt-4 flex flex-wrap items-center gap-3">
                  {isInstallable ? (
                    <Button
                      onClick={handleInstallPWA}
                      disabled={installing}
                      loading={installing}
                      leftIcon={<Download className="w-4 h-4" />}
                    >
                      Instalar ahora
                    </Button>
                  ) : (
                    <div className="text-sm text-[rgb(var(--text-muted))]">
                      {/iPad|iPhone|iPod/.test(navigator.userAgent) ? (
                        <>
                          <strong className="text-[rgb(var(--text-primary))]">
                            iOS:
                          </strong>{" "}
                          Toca el botón de compartir{" "}
                          <span className="inline-flex items-center">
                            <svg
                              className="w-4 h-4 inline mx-1"
                              fill="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path d="M16 5l-1.42 1.42-1.59-1.59V16h-1.98V4.83L9.42 6.42 8 5l4-4 4 4zm4 5v11c0 1.1-.9 2-2 2H6c-1.11 0-2-.9-2-2V10c0-1.11.89-2 2-2h3v2H6v11h12V10h-3V8h3c1.1 0 2 .89 2 2z" />
                            </svg>
                          </span>{" "}
                          y selecciona "Agregar a pantalla de inicio"
                        </>
                      ) : (
                        <>
                          En el menú de tu navegador, busca la opción "Instalar
                          aplicación" o "Agregar a pantalla de inicio"
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </SettingsCard>
      )}

      {isPWA && (
        <SettingsCard>
          <div className="p-6">
            <div className="flex items-start gap-4">
              <div className="shrink-0 w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-green-500" />
              </div>

              <div className="flex-1">
                <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  App instalada
                </h3>
                <p className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
                  ¡Genial! Estás usando Agenda Pro como aplicación instalada.
                </p>
              </div>
            </div>
          </div>
        </SettingsCard>
      )}

      {/* Regional Settings */}
      <SettingsCard>
        <SettingsCardHeader
          icon={Globe}
          title="Configuración regional"
          description="Personaliza cómo se muestran las fechas y horas"
        />

        <div className="space-y-3">
          <SettingsSelect
            label="Zona horaria"
            description="Para mostrar eventos en tu hora local"
            icon={Globe}
            value={localSettings.timezone}
            options={SETTINGS_OPTIONS.timezones}
            onChange={(v) => handleChange("timezone", v)}
            disabled={updateSettings.isPending}
          />

          <SettingsSelect
            label="Formato de fecha"
            description="Cómo se muestran las fechas"
            icon={Calendar}
            value={localSettings.dateFormat}
            options={SETTINGS_OPTIONS.dateFormats}
            onChange={(v) => handleChange("dateFormat", v)}
            disabled={updateSettings.isPending}
          />

          <SettingsSelect
            label="Formato de hora"
            description="12 o 24 horas"
            icon={Clock}
            value={localSettings.timeFormat}
            options={SETTINGS_OPTIONS.timeFormats}
            onChange={(v) => handleChange("timeFormat", v)}
            disabled={updateSettings.isPending}
          />

          <SettingsSelect
            label="Semana comienza en"
            description="Primer día de la semana"
            icon={Calendar}
            value={localSettings.weekStartsOn}
            options={SETTINGS_OPTIONS.weekStartsOn}
            onChange={(v) => handleChange("weekStartsOn", parseInt(v))}
            disabled={updateSettings.isPending}
          />
        </div>
      </SettingsCard>

      {/* App Preferences */}
      <SettingsCard>
        <SettingsCardHeader
          icon={Palette}
          title="Preferencias de la aplicación"
          description="Personaliza tu experiencia"
        />

        <div className="space-y-3">
          <SettingsSelect
            label="Idioma"
            description="Idioma de la interfaz"
            icon={Languages}
            value={localSettings.language}
            options={SETTINGS_OPTIONS.languages}
            onChange={(v) => handleChange("language", v)}
            disabled={updateSettings.isPending}
          />

          <SettingsSelect
            label="Tema"
            description="Apariencia de la aplicación"
            icon={Palette}
            value={localSettings.theme}
            options={SETTINGS_OPTIONS.themes}
            onChange={(v) => handleChange("theme", v)}
            disabled={updateSettings.isPending}
          />

          <SettingsSelect
            label="Recordatorio por defecto"
            description="Al crear nuevos eventos"
            icon={Bell}
            value={localSettings.defaultReminderMinutes}
            options={SETTINGS_OPTIONS.reminderOptions}
            onChange={(v) =>
              handleChange("defaultReminderMinutes", parseInt(v))
            }
            disabled={updateSettings.isPending}
          />
        </div>
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
