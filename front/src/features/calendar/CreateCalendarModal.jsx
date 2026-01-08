import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Palette,
  Eye,
  Check,
  Sparkles,
  ChevronRight,
  ChevronLeft,
  Globe,
  Lock,
  Loader2,
  // Icons for calendar selection
  CalendarDays,
  CalendarCheck,
  CalendarClock,
  CalendarHeart,
  CalendarRange,
  Star,
  Briefcase,
  GraduationCap,
  Heart,
  Home,
  Plane,
  Trophy,
  Music,
  Dumbbell,
  Coffee,
  Utensils,
  Car,
  BookOpen,
  Gamepad2,
  Gift,
} from "lucide-react";
import {
  useCreateCalendar,
  useUpdateCalendar,
  CALENDAR_COLORS,
} from "../../lib/hooks/useCalendars";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import { ENUMS } from "../../lib/constants";

// Colores disponibles para calendarios con estilos TailwindCSS
const COLORS_CONFIG = [
  { id: "cyan", label: "Cyan", class: "bg-cyan-500", ring: "ring-cyan-500" },
  { id: "blue", label: "Azul", class: "bg-blue-500", ring: "ring-blue-500" },
  {
    id: "violet",
    label: "Violeta",
    class: "bg-violet-500",
    ring: "ring-violet-500",
  },
  { id: "pink", label: "Rosa", class: "bg-pink-500", ring: "ring-pink-500" },
  { id: "red", label: "Rojo", class: "bg-red-500", ring: "ring-red-500" },
  {
    id: "orange",
    label: "Naranja",
    class: "bg-orange-500",
    ring: "ring-orange-500",
  },
  {
    id: "amber",
    label: "Ámbar",
    class: "bg-amber-500",
    ring: "ring-amber-500",
  },
  {
    id: "emerald",
    label: "Esmeralda",
    class: "bg-emerald-500",
    ring: "ring-emerald-500",
  },
  { id: "teal", label: "Teal", class: "bg-teal-500", ring: "ring-teal-500" },
  { id: "slate", label: "Gris", class: "bg-slate-500", ring: "ring-slate-500" },
];

// Iconos disponibles para calendarios
const ICONS_CONFIG = [
  { id: "calendar", icon: Calendar, label: "Calendario" },
  { id: "calendar-days", icon: CalendarDays, label: "Días" },
  { id: "calendar-check", icon: CalendarCheck, label: "Check" },
  { id: "calendar-clock", icon: CalendarClock, label: "Reloj" },
  { id: "calendar-heart", icon: CalendarHeart, label: "Corazón" },
  { id: "calendar-range", icon: CalendarRange, label: "Rango" },
  { id: "star", icon: Star, label: "Estrella" },
  { id: "briefcase", icon: Briefcase, label: "Trabajo" },
  { id: "graduation-cap", icon: GraduationCap, label: "Estudio" },
  { id: "heart", icon: Heart, label: "Personal" },
  { id: "home", icon: Home, label: "Casa" },
  { id: "plane", icon: Plane, label: "Viajes" },
  { id: "trophy", icon: Trophy, label: "Metas" },
  { id: "music", icon: Music, label: "Música" },
  { id: "dumbbell", icon: Dumbbell, label: "Ejercicio" },
  { id: "coffee", icon: Coffee, label: "Social" },
  { id: "utensils", icon: Utensils, label: "Comida" },
  { id: "car", icon: Car, label: "Auto" },
  { id: "book-open", icon: BookOpen, label: "Lectura" },
  { id: "gamepad-2", icon: Gamepad2, label: "Juegos" },
];

const VISIBILITY_OPTIONS = [
  {
    id: ENUMS.CALENDAR_VISIBILITY.GROUP,
    label: "Grupo",
    description: "Todos los miembros del grupo pueden ver este calendario",
    icon: Globe,
  },
  {
    id: ENUMS.CALENDAR_VISIBILITY.PRIVATE,
    label: "Privado",
    description: "Solo tú puedes ver este calendario",
    icon: Lock,
  },
];

// Steps config
const STEPS = [
  { id: 1, title: "Nombre", icon: Calendar },
  { id: 2, title: "Estilo", icon: Palette },
  { id: 3, title: "Visibilidad", icon: Eye },
];

// Progress indicator component
function StepIndicator({ currentStep, totalSteps }) {
  return (
    <div className="flex items-center justify-center gap-2">
      {Array.from({ length: totalSteps }).map((_, idx) => (
        <motion.div
          key={idx}
          className={`h-1.5 rounded-full transition-all duration-300 ${
            idx + 1 <= currentStep
              ? "bg-[rgb(var(--brand-primary))]"
              : "bg-[rgb(var(--border-base))]"
          }`}
          initial={{ width: 24 }}
          animate={{
            width: idx + 1 === currentStep ? 32 : 24,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />
      ))}
    </div>
  );
}

// Step 1: Name
function StepName({ value, onChange, onNext }) {
  const isValid = value.trim().length >= 2;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary))]/60 flex items-center justify-center shadow-lg shadow-[rgb(var(--brand-primary))]/20"
        >
          <Calendar className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
          ¿Cómo se llamará tu calendario?
        </h3>
        <p className="text-sm text-[rgb(var(--text-muted))]">
          Elige un nombre descriptivo para identificarlo fácilmente
        </p>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Ej: Trabajo, Personal, Reuniones..."
            maxLength={50}
            autoFocus
            className="w-full h-14 px-4 rounded-xl border-2 border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] text-lg placeholder:text-[rgb(var(--text-muted))] focus:outline-none focus:border-[rgb(var(--brand-primary))] transition-colors"
            onKeyDown={(e) => {
              if (e.key === "Enter" && isValid) {
                onNext();
              }
            }}
          />
          <div className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-[rgb(var(--text-muted))]">
            {value.length}/50
          </div>
        </div>

        {/* Sugerencias rápidas */}
        <div className="flex flex-wrap gap-2">
          {["Personal", "Trabajo", "Familia", "Proyectos", "Salud"].map(
            (suggestion) => (
              <motion.button
                key={suggestion}
                type="button"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onChange(suggestion)}
                className="px-3 py-1.5 rounded-lg bg-[rgb(var(--bg-muted))] text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
              >
                {suggestion}
              </motion.button>
            )
          )}
        </div>
      </div>
    </motion.div>
  );
}

// Step 2: Color & Icon
function StepColorAndIcon({ color, icon, onColorChange, onIconChange }) {
  const selectedColor = COLORS_CONFIG.find((c) => c.id === color);
  const SelectedIcon =
    ICONS_CONFIG.find((i) => i.id === icon)?.icon || Calendar;

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <motion.div
          key={`${color}-${icon}`}
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className={`w-16 h-16 mx-auto rounded-2xl ${
            selectedColor?.class || "bg-cyan-500"
          } flex items-center justify-center shadow-lg`}
        >
          <SelectedIcon className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
          Personaliza tu calendario
        </h3>
        <p className="text-sm text-[rgb(var(--text-muted))]">
          Elige un color e icono para identificarlo fácilmente
        </p>
      </div>

      {/* Color selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[rgb(var(--text-secondary))]">
          Color
        </label>
        <div className="grid grid-cols-5 gap-3">
          {COLORS_CONFIG.map((colorItem, idx) => (
            <motion.button
              key={colorItem.id}
              type="button"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.03, type: "spring", stiffness: 300 }}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              onClick={() => onColorChange(colorItem.id)}
              className={`relative aspect-square rounded-xl ${
                colorItem.class
              } transition-all duration-200 ${
                color === colorItem.id
                  ? `ring-2 ring-offset-2 ring-offset-[rgb(var(--bg-surface))] ${colorItem.ring}`
                  : ""
              }`}
            >
              <AnimatePresence>
                {color === colorItem.id && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <Check className="w-5 h-5 text-white drop-shadow-md" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Icon selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-[rgb(var(--text-secondary))]">
          Icono
        </label>
        <div className="grid grid-cols-5 gap-2">
          {ICONS_CONFIG.map((iconItem, idx) => {
            const IconComponent = iconItem.icon;
            const isSelected = icon === iconItem.id;
            return (
              <motion.button
                key={iconItem.id}
                type="button"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: idx * 0.02,
                  type: "spring",
                  stiffness: 300,
                }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => onIconChange(iconItem.id)}
                title={iconItem.label}
                className={`relative aspect-square rounded-xl flex items-center justify-center transition-all duration-200 ${
                  isSelected
                    ? `${
                        selectedColor?.class || "bg-cyan-500"
                      } text-white ring-2 ring-offset-2 ring-offset-[rgb(var(--bg-surface))] ${
                        selectedColor?.ring || "ring-cyan-500"
                      }`
                    : "bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))]"
                }`}
              >
                <IconComponent className="w-5 h-5" />
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Preview */}
      <motion.div
        key={`${color}-${icon}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-[rgb(var(--bg-muted))] border border-[rgb(var(--border-base))]"
      >
        <div className="flex items-center gap-3">
          <div
            className={`w-8 h-8 rounded-lg ${
              selectedColor?.class || "bg-cyan-500"
            } flex items-center justify-center`}
          >
            <SelectedIcon className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">
            Así se verá tu calendario
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// Step 3: Visibility
function StepVisibility({ value, onChange }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"
        >
          <Eye className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
          ¿Quién puede verlo?
        </h3>
        <p className="text-sm text-[rgb(var(--text-muted))]">
          Controla la visibilidad de tu calendario
        </p>
      </div>

      <div className="space-y-3">
        {VISIBILITY_OPTIONS.map((option, idx) => {
          const Icon = option.icon;
          const isSelected = value === option.id;

          return (
            <motion.button
              key={option.id}
              type="button"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => onChange(option.id)}
              className={`w-full p-4 rounded-xl border-2 transition-all duration-200 text-left flex items-start gap-4 ${
                isSelected
                  ? "border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary))]/5"
                  : "border-[rgb(var(--border-base))] hover:border-[rgb(var(--border-hover))] bg-[rgb(var(--bg-surface))]"
              }`}
            >
              <div
                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                  isSelected
                    ? "bg-[rgb(var(--brand-primary))] text-white"
                    : "bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-muted))]"
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span
                    className={`font-medium ${
                      isSelected
                        ? "text-[rgb(var(--brand-primary))]"
                        : "text-[rgb(var(--text-primary))]"
                    }`}
                  >
                    {option.label}
                  </span>
                  {isSelected && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="w-5 h-5 rounded-full bg-[rgb(var(--brand-primary))] flex items-center justify-center"
                    >
                      <Check className="w-3 h-3 text-white" />
                    </motion.div>
                  )}
                </div>
                <p className="text-sm text-[rgb(var(--text-muted))] mt-0.5">
                  {option.description}
                </p>
              </div>
            </motion.button>
          );
        })}
      </div>
    </motion.div>
  );
}

// Main Modal Component
export function CreateCalendarModal({
  isOpen,
  onClose,
  onSuccess,
  isFirstCalendar = false,
  calendar = null,
  isEditing = false,
}) {
  const { activeGroup, profile } = useWorkspace();
  const createCalendar = useCreateCalendar();
  const updateCalendar = useUpdateCalendar();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    name: "",
    color: "cyan",
    icon: "calendar",
    visibility: ENUMS.CALENDAR_VISIBILITY.GROUP,
  });

  // Initialize form with calendar data when editing
  React.useEffect(() => {
    if (isEditing && calendar) {
      setFormData({
        name: calendar.name || "",
        color: calendar.color || "cyan",
        icon: calendar.icon || "calendar",
        visibility: calendar.visibility || ENUMS.CALENDAR_VISIBILITY.GROUP,
      });
    }
  }, [isEditing, calendar]);

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleNext = useCallback(() => {
    if (step < 3) {
      setStep((s) => s + 1);
    }
  }, [step]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep((s) => s - 1);
    }
  }, [step]);

  const handleSubmit = async () => {
    if (!activeGroup?.$id || !profile?.$id) return;

    try {
      if (isEditing && calendar) {
        // Update existing calendar
        const result = await updateCalendar.mutateAsync({
          calendarId: calendar.$id,
          data: {
            name: formData.name.trim(),
            color: formData.color,
            icon: formData.icon,
            visibility: formData.visibility,
          },
        });
        onSuccess?.(result);
      } else {
        // Create new calendar
        const result = await createCalendar.mutateAsync({
          groupId: activeGroup.$id,
          ownerProfileId: profile.$id,
          name: formData.name.trim(),
          color: formData.color,
          icon: formData.icon,
          visibility: formData.visibility,
          isDefault: isFirstCalendar,
        });
        onSuccess?.(result);
      }
      handleClose();
    } catch (error) {
      console.error("Error saving calendar:", error);
    }
  };

  const isPending = createCalendar.isPending || updateCalendar.isPending;

  const handleClose = () => {
    if (!isPending) {
      onClose();
      // Reset state after animation
      setTimeout(() => {
        setStep(1);
        setFormData({
          name: "",
          color: "cyan",
          icon: "calendar",
          visibility: ENUMS.CALENDAR_VISIBILITY.GROUP,
        });
      }, 300);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.name.trim().length >= 2;
      case 2:
        return !!formData.color;
      case 3:
        return !!formData.visibility;
      default:
        return false;
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 z-50 flex items-center justify-center sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:p-4"
            style={{ maxHeight: "calc(100dvh - 2rem)" }}
          >
            <div
              className="bg-[rgb(var(--bg-surface))] rounded-3xl shadow-2xl border border-[rgb(var(--border-base))] w-full flex flex-col"
              style={{ maxHeight: "calc(100dvh - 2rem)" }}
            >
              {/* Header - Always visible */}
              <div className="px-6 py-5 border-b border-[rgb(var(--border-base))] shrink-0">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {isFirstCalendar && !isEditing && (
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                      >
                        <Sparkles className="w-5 h-5 text-amber-500" />
                      </motion.div>
                    )}
                    <span className="text-sm font-medium text-[rgb(var(--text-muted))]">
                      {isEditing
                        ? "Editar calendario"
                        : isFirstCalendar
                        ? "¡Tu primer calendario!"
                        : "Nuevo calendario"}
                    </span>
                  </div>
                  <button
                    onClick={handleClose}
                    disabled={isPending}
                    className="w-8 h-8 rounded-lg hover:bg-[rgb(var(--bg-muted))] flex items-center justify-center transition-colors disabled:opacity-50"
                  >
                    <X className="w-5 h-5 text-[rgb(var(--text-muted))]" />
                  </button>
                </div>

                {/* Step indicator */}
                <StepIndicator currentStep={step} totalSteps={3} />

                {/* Step labels */}
                <div className="flex items-center justify-between mt-4 px-2">
                  {STEPS.map((s, idx) => {
                    const Icon = s.icon;
                    const isActive = s.id === step;
                    const isCompleted = s.id < step;

                    return (
                      <div
                        key={s.id}
                        className={`flex items-center gap-1.5 text-xs font-medium transition-colors ${
                          isActive
                            ? "text-[rgb(var(--brand-primary))]"
                            : isCompleted
                            ? "text-[rgb(var(--text-secondary))]"
                            : "text-[rgb(var(--text-muted))]"
                        }`}
                      >
                        {isCompleted ? (
                          <div className="w-4 h-4 rounded-full bg-[rgb(var(--brand-primary))] flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        ) : (
                          <Icon className="w-4 h-4" />
                        )}
                        <span className="hidden sm:inline">{s.title}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto overscroll-contain min-h-0">
                <div className="p-6">
                  <AnimatePresence mode="wait">
                    {step === 1 && (
                      <StepName
                        key="step1"
                        value={formData.name}
                        onChange={(v) => updateField("name", v)}
                        onNext={handleNext}
                      />
                    )}
                    {step === 2 && (
                      <StepColorAndIcon
                        key="step2"
                        color={formData.color}
                        icon={formData.icon}
                        onColorChange={(v) => updateField("color", v)}
                        onIconChange={(v) => updateField("icon", v)}
                      />
                    )}
                    {step === 3 && (
                      <StepVisibility
                        key="step3"
                        value={formData.visibility}
                        onChange={(v) => updateField("visibility", v)}
                      />
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Footer - Always visible */}
              <div className="px-6 py-4 border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] shrink-0 rounded-b-3xl">
                <div className="flex items-center justify-between">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handleBack}
                    disabled={step === 1 || isPending}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] transition-colors disabled:opacity-0 disabled:pointer-events-none"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Atrás
                  </motion.button>

                  {step < 3 ? (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleNext}
                      disabled={!isStepValid()}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-[rgb(var(--brand-primary))] text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Siguiente
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  ) : (
                    <motion.button
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={handleSubmit}
                      disabled={!isStepValid() || isPending}
                      className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium bg-[rgb(var(--brand-primary))] text-white hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {isEditing ? "Guardando..." : "Creando..."}
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-4 h-4" />
                          {isEditing ? "Guardar cambios" : "Crear calendario"}
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
