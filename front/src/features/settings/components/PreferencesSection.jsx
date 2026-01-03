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

export function PreferencesSection() {
  const { activeGroup, profile } = useWorkspace();
  const { data: settings, isLoading } = useUserSettings(
    activeGroup?.$id,
    profile?.$id
  );
  const updateSettings = useUpdateUserSettings();

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
