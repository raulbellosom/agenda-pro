import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Globe,
  Calendar,
  Clock,
  Palette,
  Languages,
  Loader2,
  Check,
} from "lucide-react";
import { useWorkspace } from "../../../app/providers/WorkspaceProvider";
import {
  useUserSettings,
  useUpdateUserSettings,
  SETTINGS_OPTIONS,
} from "../../../lib/hooks";
import { Button } from "../../../components/ui/Button";

function SettingSelect({
  label,
  description,
  icon: Icon,
  value,
  options,
  onChange,
  disabled,
}) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[rgb(var(--bg-subtle))]">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgb(var(--brand-1))]/10 flex items-center justify-center shrink-0">
          <Icon className="w-5 h-5 text-[rgb(var(--brand-1))]" />
        </div>
        <div>
          <div className="font-medium text-[rgb(var(--text-primary))]">
            {label}
          </div>
          <div className="text-sm text-[rgb(var(--muted))]">{description}</div>
        </div>
      </div>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="px-4 py-2 rounded-xl bg-[rgb(var(--card))] border border-[rgb(var(--glass-border))] text-[rgb(var(--text-primary))] text-sm focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-1))] disabled:opacity-50"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

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
      <div className="glass-card rounded-3xl p-12 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--brand-1))]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Regional Settings */}
      <div className="glass-card rounded-3xl p-6">
        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-6">
          Configuración regional
        </h2>

        <div className="space-y-3">
          <SettingSelect
            label="Zona horaria"
            description="Para mostrar eventos en tu hora local"
            icon={Globe}
            value={localSettings.timezone}
            options={SETTINGS_OPTIONS.timezones}
            onChange={(v) => handleChange("timezone", v)}
            disabled={updateSettings.isPending}
          />

          <SettingSelect
            label="Formato de fecha"
            description="Cómo se muestran las fechas"
            icon={Calendar}
            value={localSettings.dateFormat}
            options={SETTINGS_OPTIONS.dateFormats}
            onChange={(v) => handleChange("dateFormat", v)}
            disabled={updateSettings.isPending}
          />

          <SettingSelect
            label="Formato de hora"
            description="12 o 24 horas"
            icon={Clock}
            value={localSettings.timeFormat}
            options={SETTINGS_OPTIONS.timeFormats}
            onChange={(v) => handleChange("timeFormat", v)}
            disabled={updateSettings.isPending}
          />

          <SettingSelect
            label="Semana comienza en"
            description="Primer día de la semana"
            icon={Calendar}
            value={localSettings.weekStartsOn}
            options={SETTINGS_OPTIONS.weekStartsOn}
            onChange={(v) => handleChange("weekStartsOn", parseInt(v))}
            disabled={updateSettings.isPending}
          />
        </div>
      </div>

      {/* App Preferences */}
      <div className="glass-card rounded-3xl p-6">
        <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-6">
          Preferencias de la aplicación
        </h2>

        <div className="space-y-3">
          <SettingSelect
            label="Idioma"
            description="Idioma de la interfaz"
            icon={Languages}
            value={localSettings.language}
            options={SETTINGS_OPTIONS.languages}
            onChange={(v) => handleChange("language", v)}
            disabled={updateSettings.isPending}
          />

          <SettingSelect
            label="Tema"
            description="Apariencia de la aplicación"
            icon={Palette}
            value={localSettings.theme}
            options={SETTINGS_OPTIONS.themes}
            onChange={(v) => handleChange("theme", v)}
            disabled={updateSettings.isPending}
          />

          <SettingSelect
            label="Recordatorio por defecto"
            description="Al crear nuevos eventos"
            icon={Clock}
            value={localSettings.defaultReminderMinutes}
            options={SETTINGS_OPTIONS.reminderOptions}
            onChange={(v) =>
              handleChange("defaultReminderMinutes", parseInt(v))
            }
            disabled={updateSettings.isPending}
          />
        </div>
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
