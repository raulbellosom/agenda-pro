import React, { useState, useCallback, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  AlignLeft,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  ChevronUp,
  Check,
  Loader2,
  CalendarPlus,
  Type,
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
  Sun,
  Repeat,
  Bell,
  Globe,
  Lock,
  AlertCircle,
  Search,
} from "lucide-react";
import { format, addHours, setHours, setMinutes, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { formatInTimeZone, toZonedTime, fromZonedTime } from "date-fns-tz";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import { useCreateEvent, useUpdateEvent } from "../../lib/hooks/useEvents";
import { useUserSettings } from "../../lib/hooks/useUserSettings";
import { ENUMS, DEFAULTS } from "../../lib/constants";

// ================================================
// CONSTANTS
// ================================================

const CALENDAR_ICONS = {
  calendar: Calendar,
  "calendar-days": CalendarDays,
  "calendar-check": CalendarCheck,
  "calendar-clock": CalendarClock,
  "calendar-heart": CalendarHeart,
  "calendar-range": CalendarRange,
  star: Star,
  briefcase: Briefcase,
  "graduation-cap": GraduationCap,
  heart: Heart,
  home: Home,
  plane: Plane,
  trophy: Trophy,
  music: Music,
  dumbbell: Dumbbell,
  coffee: Coffee,
  utensils: Utensils,
  car: Car,
  "book-open": BookOpen,
  "gamepad-2": Gamepad2,
};

const CALENDAR_COLORS = {
  violet: {
    bg: "bg-violet-500",
    light: "bg-violet-500/10",
    text: "text-violet-500",
    border: "border-violet-500",
    ring: "ring-violet-500",
  },
  blue: {
    bg: "bg-blue-500",
    light: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500",
    ring: "ring-blue-500",
  },
  cyan: {
    bg: "bg-cyan-500",
    light: "bg-cyan-500/10",
    text: "text-cyan-500",
    border: "border-cyan-500",
    ring: "ring-cyan-500",
  },
  emerald: {
    bg: "bg-emerald-500",
    light: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "border-emerald-500",
    ring: "ring-emerald-500",
  },
  amber: {
    bg: "bg-amber-500",
    light: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500",
    ring: "ring-amber-500",
  },
  orange: {
    bg: "bg-orange-500",
    light: "bg-orange-500/10",
    text: "text-orange-500",
    border: "border-orange-500",
    ring: "ring-orange-500",
  },
  rose: {
    bg: "bg-rose-500",
    light: "bg-rose-500/10",
    text: "text-rose-500",
    border: "border-rose-500",
    ring: "ring-rose-500",
  },
  pink: {
    bg: "bg-pink-500",
    light: "bg-pink-500/10",
    text: "text-pink-500",
    border: "border-pink-500",
    ring: "ring-pink-500",
  },
  red: {
    bg: "bg-red-500",
    light: "bg-red-500/10",
    text: "text-red-500",
    border: "border-red-500",
    ring: "ring-red-500",
  },
  teal: {
    bg: "bg-teal-500",
    light: "bg-teal-500/10",
    text: "text-teal-500",
    border: "border-teal-500",
    ring: "ring-teal-500",
  },
  slate: {
    bg: "bg-slate-500",
    light: "bg-slate-500/10",
    text: "text-slate-500",
    border: "border-slate-500",
    ring: "ring-slate-500",
  },
};

const getCalendarIcon = (iconId) => CALENDAR_ICONS[iconId] || Calendar;
const getCalendarColor = (color) =>
  CALENDAR_COLORS[color] || CALENDAR_COLORS.violet;

// Generate hours and minutes arrays for time picker
const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);

// Duration options
const DURATION_OPTIONS = [
  { value: 15, label: "15 minutos" },
  { value: 30, label: "30 minutos" },
  { value: 45, label: "45 minutos" },
  { value: 60, label: "1 hora" },
  { value: 90, label: "1 hora 30 min" },
  { value: 120, label: "2 horas" },
  { value: 180, label: "3 horas" },
  { value: 240, label: "4 horas" },
  { value: 480, label: "8 horas" },
];

// ================================================
// HELPER COMPONENTS
// ================================================

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
          initial={{ width: 20 }}
          animate={{
            width: idx + 1 === currentStep ? 28 : 20,
          }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
        />
      ))}
    </div>
  );
}

const CalendarSelector = React.memo(function CalendarSelector({
  calendars,
  selectedId,
  onChange,
}) {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [showAll, setShowAll] = useState(false);

  // Debounce search query para evitar filtrados excesivos en móviles
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 200);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter calendars based on search
  const filteredCalendars = useMemo(() => {
    if (!debouncedQuery.trim()) return calendars;
    const query = debouncedQuery.toLowerCase();
    return calendars.filter((cal) => cal.name.toLowerCase().includes(query));
  }, [calendars, debouncedQuery]);

  // Get visible calendars (show selected first, then limit to 3 unless showAll)
  const visibleCalendars = useMemo(() => {
    if (showAll || searchQuery.trim()) return filteredCalendars;

    // Sort to show selected calendar first
    const sorted = [...filteredCalendars].sort((a, b) => {
      if (a.$id === selectedId) return -1;
      if (b.$id === selectedId) return 1;
      return 0;
    });

    return sorted.slice(0, 3);
  }, [filteredCalendars, selectedId, showAll, searchQuery]);

  const hiddenCount = filteredCalendars.length - visibleCalendars.length;
  const showSearch = calendars.length > 2;

  return (
    <div className="space-y-3">
      {/* Search input - only show if more than 2 calendars */}
      {showSearch && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-muted))]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setShowAll(false);
            }}
            placeholder="Buscar calendario..."
            className={`w-full h-10 pl-10 rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-elevated))] text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))]/20 transition-all ${
              searchQuery ? "pr-10" : "pr-4"
            }`}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full bg-[rgb(var(--bg-muted))] flex items-center justify-center hover:bg-[rgb(var(--bg-hover))] transition-colors"
            >
              <X className="w-3 h-3 text-[rgb(var(--text-muted))]" />
            </button>
          )}
        </div>
      )}

      {/* Calendar list */}
      <div className="space-y-2">
        <AnimatePresence mode="popLayout">
          {visibleCalendars.map((calendar) => {
            const colors = getCalendarColor(calendar.color);
            const Icon = getCalendarIcon(calendar.icon);
            const isSelected = selectedId === calendar.$id;

            return (
              <motion.button
                key={calendar.$id}
                type="button"
                layout
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={() => onChange(calendar.$id)}
                className={`w-full p-3 rounded-xl border transition-all duration-200 text-left flex items-center gap-3 ${
                  isSelected
                    ? `border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary))]/10 ring-2 ring-[rgb(var(--brand-primary))]/20`
                    : "border-[rgb(var(--border-base))] hover:border-[rgb(var(--border-hover))] bg-[rgb(var(--bg-elevated))]"
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-xl ${colors.bg} flex items-center justify-center shrink-0`}
                >
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <span
                    className={`font-medium block truncate ${
                      isSelected
                        ? "text-[rgb(var(--brand-primary))]"
                        : "text-[rgb(var(--text-primary))]"
                    }`}
                  >
                    {calendar.name}
                  </span>
                  <span className="text-xs text-[rgb(var(--text-muted))]">
                    {calendar.visibility === "PRIVATE" ? "Privado" : "Grupo"}
                  </span>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="w-6 h-6 rounded-full bg-[rgb(var(--brand-primary))] flex items-center justify-center shrink-0"
                  >
                    <Check className="w-4 h-4 text-white" />
                  </motion.div>
                )}
              </motion.button>
            );
          })}
        </AnimatePresence>

        {/* No results message */}
        {searchQuery && filteredCalendars.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-4 text-center"
          >
            <Search className="w-8 h-8 mx-auto text-[rgb(var(--text-muted))] mb-2" />
            <p className="text-sm text-[rgb(var(--text-muted))]">
              No se encontraron calendarios
            </p>
          </motion.div>
        )}

        {/* Show more button */}
        {hiddenCount > 0 && !searchQuery && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowAll(true)}
            className="w-full py-2.5 rounded-xl border border-dashed border-[rgb(var(--border-base))] text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--border-hover))] transition-colors flex items-center justify-center gap-2"
          >
            <ChevronDown className="w-4 h-4" />
            Ver {hiddenCount} calendario{hiddenCount > 1 ? "s" : ""} más
          </motion.button>
        )}

        {/* Show less button */}
        {showAll && calendars.length > 3 && !searchQuery && (
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            onClick={() => setShowAll(false)}
            className="w-full py-2.5 rounded-xl border border-dashed border-[rgb(var(--border-base))] text-sm text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))] hover:border-[rgb(var(--border-hover))] transition-colors flex items-center justify-center gap-2"
          >
            <ChevronUp className="w-4 h-4" />
            Ver menos
          </motion.button>
        )}
      </div>
    </div>
  );
});

const TimeInput = React.memo(function TimeInput({
  label,
  value,
  onChange,
  error,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = React.useRef(null);
  const hoursRef = React.useRef(null);
  const minutesRef = React.useRef(null);

  // Parse current value
  const [hours, minutes] = value.split(":").map(Number);

  // Close on click outside
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };

    // Usar capture para evitar que otros elementos intercepten el evento
    document.addEventListener("mousedown", handleClickOutside, true);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside, true);
  }, [isOpen]);

  // Scroll to selected values when picker opens
  useEffect(() => {
    if (!isOpen) return;

    // Usar requestAnimationFrame para mejor rendimiento en móviles
    const scrollToTime = () => {
      hoursRef.current
        ?.querySelector(`[data-value="${hours}"]`)
        ?.scrollIntoView({ block: "center", behavior: "auto" });
      minutesRef.current
        ?.querySelector(`[data-value="${minutes}"]`)
        ?.scrollIntoView({ block: "center", behavior: "auto" });
    };

    const rafId = requestAnimationFrame(scrollToTime);
    return () => cancelAnimationFrame(rafId);
  }, [isOpen, hours, minutes]);

  const handleHourChange = useCallback(
    (h) => {
      onChange(
        `${h.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}`
      );
    },
    [onChange, minutes]
  );

  const handleMinuteChange = useCallback(
    (m) => {
      onChange(
        `${hours.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
      );
    },
    [onChange, hours]
  );

  return (
    <div className="space-y-1.5 relative z-10" ref={containerRef}>
      <label className="text-sm font-medium text-[rgb(var(--text-secondary))]">
        {label}
      </label>

      {/* Display button */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`w-full h-12 px-4 rounded-xl border bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))]/20 transition-all flex items-center justify-between ${
          error
            ? "border-[rgb(var(--error))] focus:ring-[rgb(var(--error))]/20"
            : "border-[rgb(var(--border-base))] hover:border-[rgb(var(--border-hover))]"
        }`}
      >
        <span className="text-base font-medium tabular-nums">
          {hours.toString().padStart(2, "0")}:
          {minutes.toString().padStart(2, "0")}
        </span>
        <Clock
          className={`w-4 h-4 transition-colors ${
            isOpen
              ? "text-[rgb(var(--brand-primary))]"
              : "text-[rgb(var(--text-muted))]"
          }`}
        />
      </button>

      {/* Time picker dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-2 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border-base))] shadow-2xl overflow-hidden z-50"
            style={{ top: "calc(100% + 0.5rem)" }}
          >
            <div className="flex divide-x divide-[rgb(var(--border-base))]">
              {/* Hours column */}
              <div className="flex-1 flex flex-col">
                <div className="px-3 py-2 text-xs font-medium text-[rgb(var(--text-muted))] text-center bg-[rgb(var(--bg-muted))] border-b border-[rgb(var(--border-base))]">
                  Hora
                </div>
                <div
                  ref={hoursRef}
                  className="h-40 overflow-y-auto overscroll-contain scrollbar-thin"
                >
                  {HOURS.map((h) => (
                    <button
                      key={h}
                      type="button"
                      data-value={h}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleHourChange(h);
                      }}
                      className={`w-full py-2 px-3 text-center text-sm transition-colors ${
                        h === hours
                          ? "bg-[rgb(var(--brand-primary))] text-white font-medium"
                          : "hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-primary))]"
                      }`}
                    >
                      {h.toString().padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>

              {/* Minutes column */}
              <div className="flex-1 flex flex-col">
                <div className="px-3 py-2 text-xs font-medium text-[rgb(var(--text-muted))] text-center bg-[rgb(var(--bg-muted))] border-b border-[rgb(var(--border-base))]">
                  Min
                </div>
                <div
                  ref={minutesRef}
                  className="h-40 overflow-y-auto overscroll-contain scrollbar-thin"
                >
                  {MINUTES.map((m) => (
                    <button
                      key={m}
                      type="button"
                      data-value={m}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleMinuteChange(m);
                      }}
                      className={`w-full py-2 px-3 text-center text-sm transition-colors ${
                        m === minutes
                          ? "bg-[rgb(var(--brand-primary))] text-white font-medium"
                          : "hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-primary))]"
                      }`}
                    >
                      {m.toString().padStart(2, "0")}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Quick select minutes */}
            <div className="px-2 py-2 border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))]">
              <div className="flex gap-1 justify-center">
                {[0, 15, 30, 45].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleMinuteChange(m);
                    }}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
                      m === minutes
                        ? "bg-[rgb(var(--brand-primary))] text-white"
                        : "bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))]"
                    }`}
                  >
                    :{m.toString().padStart(2, "0")}
                  </button>
                ))}
              </div>
            </div>

            {/* Done button */}
            <div className="px-3 py-2 border-t border-[rgb(var(--border-base))]">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setIsOpen(false);
                }}
                className="w-full py-2 rounded-lg bg-[rgb(var(--brand-primary))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
              >
                Listo
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// ================================================
// STEP COMPONENTS
// ================================================

// Step 1: Title & Date/Time
function StepBasicInfo({
  title,
  date,
  startTime,
  endTime,
  allDay,
  onTitleChange,
  onDateChange,
  onStartTimeChange,
  onEndTimeChange,
  onAllDayChange,
  errors,
  timezone,
  isMobile = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isMobile ? 0 : -20 }}
      transition={{ duration: isMobile ? 0.15 : 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary))]/60 flex items-center justify-center shadow-lg shadow-[rgb(var(--brand-primary))]/20"
        >
          <CalendarPlus className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
          Nuevo evento
        </h3>
        <p className="text-sm text-[rgb(var(--text-muted))]">
          ¿Qué tienes planeado y cuándo?
        </p>
      </div>

      {/* Title Input */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[rgb(var(--text-secondary))] flex items-center gap-2">
          <Type className="w-4 h-4" />
          Título del evento
        </label>
        <div className="relative">
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="Ej: Reunión de equipo, Cita médica..."
            maxLength={200}
            autoFocus
            className={`w-full h-14 pl-4 pr-16 rounded-xl border bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] text-lg placeholder:text-[rgb(var(--text-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))]/20 transition-all ${
              errors?.title
                ? "border-[rgb(var(--error))] focus:ring-[rgb(var(--error))]/20"
                : "border-[rgb(var(--border-base))]"
            }`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-surface))] px-1 rounded">
            {title.length}/200
          </div>
        </div>
        {errors?.title && (
          <p className="text-sm text-[rgb(var(--error))] flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            {errors.title}
          </p>
        )}
      </div>

      {/* Timezone Info */}
      {timezone && (
        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[rgb(var(--bg-muted))] text-xs text-[rgb(var(--text-muted))]">
          <Globe className="w-3 h-3" />
          <span>{formatTimezoneLabel(timezone)}</span>
        </div>
      )}

      {/* All Day Toggle */}
      <motion.button
        type="button"
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        onClick={() => onAllDayChange(!allDay)}
        className={`w-full p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 ${
          allDay
            ? "border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary))]/5 ring-2 ring-[rgb(var(--brand-primary))]/20"
            : "border-[rgb(var(--border-base))] hover:border-[rgb(var(--border-hover))] bg-[rgb(var(--bg-surface))]"
        }`}
      >
        <div
          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
            allDay
              ? "bg-[rgb(var(--brand-primary))] text-white"
              : "bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-muted))]"
          }`}
        >
          <Sun className="w-5 h-5" />
        </div>
        <div className="flex-1 text-left">
          <span
            className={`font-medium ${
              allDay
                ? "text-[rgb(var(--brand-primary))]"
                : "text-[rgb(var(--text-primary))]"
            }`}
          >
            Todo el día
          </span>
          <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">
            El evento durará las 24 horas
          </p>
        </div>
        <div
          className={`w-12 h-7 rounded-full transition-colors flex items-center px-1 ${
            allDay
              ? "bg-[rgb(var(--brand-primary))]"
              : "bg-[rgb(var(--bg-muted))]"
          }`}
        >
          <motion.div
            className="w-5 h-5 rounded-full bg-white shadow-sm"
            animate={{ x: allDay ? 20 : 0 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          />
        </div>
      </motion.button>

      {/* Date Input */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[rgb(var(--text-secondary))] flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Fecha
        </label>
        <div className="relative">
          <input
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className={`w-full h-12 px-4 rounded-xl border bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))]/20 transition-all appearance-none [&::-webkit-calendar-picker-indicator]:opacity-0 [&::-webkit-calendar-picker-indicator]:absolute [&::-webkit-calendar-picker-indicator]:inset-0 [&::-webkit-calendar-picker-indicator]:w-full [&::-webkit-calendar-picker-indicator]:h-full [&::-webkit-calendar-picker-indicator]:cursor-pointer ${
              errors?.date
                ? "border-[rgb(var(--error))] focus:ring-[rgb(var(--error))]/20"
                : "border-[rgb(var(--border-base))]"
            }`}
          />
        </div>
        {errors?.date && (
          <p className="text-sm text-[rgb(var(--error))] flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            {errors.date}
          </p>
        )}
      </div>

      {/* Time inputs (only if not all day) */}
      {!allDay && (
        <div className="grid grid-cols-2 gap-3">
          <TimeInput
            label="Hora de inicio"
            value={startTime}
            onChange={onStartTimeChange}
            error={errors?.startTime}
          />
          <TimeInput
            label="Hora de fin"
            value={endTime}
            onChange={onEndTimeChange}
            error={errors?.endTime}
          />
        </div>
      )}
    </motion.div>
  );
}

// Helper para formatear nombre de zona horaria
function formatTimezoneLabel(timezone) {
  // Extraer ciudad del formato "America/Mexico_City" -> "Mexico City"
  const city = timezone.split("/").pop().replace(/_/g, " ");

  // Obtener offset actual
  try {
    const now = new Date();
    const formatted = formatInTimeZone(now, timezone, "xxx"); // +HH:mm format
    return `${city} (GMT${formatted})`;
  } catch {
    return city;
  }
}

// Step 2: Optional Details (Location, Description)
function StepOptionalDetails({
  location,
  description,
  onLocationChange,
  onDescriptionChange,
  isMobile = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isMobile ? 0 : -20 }}
      transition={{ duration: isMobile ? 0.15 : 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20"
        >
          <AlignLeft className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
          Detalles adicionales
        </h3>
        <p className="text-sm text-[rgb(var(--text-muted))]">
          Información opcional para tu evento
        </p>
      </div>

      {/* Location Input */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[rgb(var(--text-secondary))] flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          Ubicación
        </label>
        <input
          type="text"
          value={location}
          onChange={(e) => onLocationChange(e.target.value)}
          placeholder="Ej: Oficina principal, Sala de reuniones..."
          maxLength={300}
          className="w-full h-12 px-4 rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))]/20 transition-all"
        />
      </div>

      {/* Description Input */}
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[rgb(var(--text-secondary))] flex items-center gap-2">
          <AlignLeft className="w-4 h-4" />
          Descripción
        </label>
        <textarea
          value={description}
          onChange={(e) => onDescriptionChange(e.target.value)}
          placeholder="Agrega notas o detalles sobre el evento..."
          maxLength={3000}
          rows={4}
          className="w-full px-4 py-3 rounded-xl border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))]/20 transition-all resize-none"
        />
        <div className="text-right text-xs text-[rgb(var(--text-muted))]">
          {description.length}/3000
        </div>
      </div>

      {/* Info card */}
      <div className="p-4 rounded-xl bg-[rgb(var(--bg-muted))] border border-[rgb(var(--border-base))]">
        <p className="text-sm text-[rgb(var(--text-muted))]">
          <span className="font-medium text-[rgb(var(--text-secondary))]">
            Tip:
          </span>{" "}
          Puedes dejar estos campos vacíos y agregar la información después.
        </p>
      </div>
    </motion.div>
  );
}

// Step 3: Calendar Selection
function StepCalendar({
  calendarId,
  calendars,
  onCalendarChange,
  errors,
  isMobile = false,
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: isMobile ? 0 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: isMobile ? 0 : -20 }}
      transition={{ duration: isMobile ? 0.15 : 0.3 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="text-center space-y-2">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", delay: 0.1 }}
          className="w-16 h-16 mx-auto rounded-2xl bg-linear-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/20"
        >
          <Calendar className="w-8 h-8 text-white" />
        </motion.div>
        <h3 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
          ¿Dónde guardarlo?
        </h3>
        <p className="text-sm text-[rgb(var(--text-muted))]">
          Selecciona el calendario para este evento
        </p>
      </div>

      {/* Calendar Selection */}
      <div className="space-y-3">
        {calendars.length > 0 ? (
          <CalendarSelector
            calendars={calendars}
            selectedId={calendarId}
            onChange={onCalendarChange}
          />
        ) : (
          <div className="p-4 rounded-xl bg-[rgb(var(--bg-muted))] text-center">
            <p className="text-sm text-[rgb(var(--text-muted))]">
              No hay calendarios disponibles
            </p>
          </div>
        )}
        {errors?.calendarId && (
          <p className="text-sm text-[rgb(var(--error))] flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4" />
            {errors.calendarId}
          </p>
        )}
      </div>
    </motion.div>
  );
}

// ================================================
// MAIN MODAL COMPONENT
// ================================================

export function EventModal({
  isOpen,
  onClose,
  onSuccess,
  event = null,
  isEditing = false,
  defaultDate = null,
  defaultCalendarId = null,
}) {
  const { activeGroup, calendars = [], profile } = useWorkspace();
  const createEvent = useCreateEvent();
  const updateEvent = useUpdateEvent();

  // Obtener la zona horaria del usuario desde sus configuraciones (ahora globales)
  const { data: userSettings } = useUserSettings(profile?.$id);
  const userTimezone = userSettings?.timezone || DEFAULTS.TIMEZONE;

  const [step, setStep] = useState(1);
  const [errors, setErrors] = useState({});

  // Get default values
  const getDefaultDate = () => {
    if (defaultDate) {
      return format(defaultDate, "yyyy-MM-dd");
    }
    return format(new Date(), "yyyy-MM-dd");
  };

  const getDefaultStartTime = () => {
    if (defaultDate) {
      return format(defaultDate, "HH:mm");
    }
    const now = new Date();
    const nextHour = addHours(setMinutes(now, 0), 1);
    return format(nextHour, "HH:mm");
  };

  const getDefaultEndTime = () => {
    if (defaultDate) {
      return format(addHours(defaultDate, 1), "HH:mm");
    }
    const now = new Date();
    const nextHour = addHours(setMinutes(now, 0), 2);
    return format(nextHour, "HH:mm");
  };

  const [formData, setFormData] = useState({
    title: "",
    calendarId: defaultCalendarId || calendars[0]?.$id || "",
    date: getDefaultDate(),
    startTime: getDefaultStartTime(),
    endTime: getDefaultEndTime(),
    allDay: false,
    location: "",
    description: "",
  });

  // Initialize form with event data when editing
  useEffect(() => {
    // Solo ejecutar cuando el modal se abre
    if (!isOpen) return;

    if (isEditing && event) {
      // Parsear las fechas ISO (que están en UTC)
      const startDateUTC = parseISO(event.startAt);
      const endDateUTC = parseISO(event.endAt);

      // Convertir a la zona horaria del usuario para mostrar en el formulario
      const startZoned = toZonedTime(startDateUTC, userTimezone);
      const endZoned = toZonedTime(endDateUTC, userTimezone);

      setFormData({
        title: event.title || "",
        calendarId: event.calendarId || calendars[0]?.$id || "",
        date: format(startZoned, "yyyy-MM-dd"),
        startTime: format(startZoned, "HH:mm"),
        endTime: format(endZoned, "HH:mm"),
        allDay: event.allDay || false,
        location: event.locationText || "",
        description: event.description || "",
      });
    } else if (!isEditing) {
      // Reset form when opening for creation
      setFormData({
        title: "",
        calendarId: defaultCalendarId || calendars[0]?.$id || "",
        date: getDefaultDate(),
        startTime: getDefaultStartTime(),
        endTime: getDefaultEndTime(),
        allDay: false,
        location: "",
        description: "",
      });
      setStep(1);
      setErrors({});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, event?.$id, isEditing]);

  // Detectar si estamos en un dispositivo móvil para reducir animaciones
  const isMobile = useMemo(() => {
    return (
      /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent
      ) || window.innerWidth < 768
    );
  }, []);

  const updateField = useCallback((field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: null }));
  }, []);

  const validateStep = useCallback(
    (stepNumber) => {
      const newErrors = {};

      if (stepNumber === 1) {
        // Validar título y fecha/hora
        if (!formData.title.trim() || formData.title.trim().length < 2) {
          newErrors.title = "El título debe tener al menos 2 caracteres";
        }
        if (!formData.date) {
          newErrors.date = "Selecciona una fecha";
        }
        if (!formData.allDay) {
          if (!formData.startTime) {
            newErrors.startTime = "Selecciona hora de inicio";
          }
          if (!formData.endTime) {
            newErrors.endTime = "Selecciona hora de fin";
          }
          if (formData.startTime && formData.endTime) {
            const [startH, startM] = formData.startTime.split(":").map(Number);
            const [endH, endM] = formData.endTime.split(":").map(Number);
            const startMinutes = startH * 60 + startM;
            const endMinutes = endH * 60 + endM;
            if (endMinutes <= startMinutes) {
              newErrors.endTime = "La hora de fin debe ser posterior al inicio";
            }
          }
        }
      }

      if (stepNumber === 2) {
        // Paso 2 es opcional (ubicación y descripción), siempre válido
      }

      if (stepNumber === 3) {
        // Validar selección de calendario
        if (!formData.calendarId) {
          newErrors.calendarId = "Selecciona un calendario";
        }
      }

      setErrors(newErrors);
      return Object.keys(newErrors).length === 0;
    },
    [formData]
  );

  const handleNext = useCallback(() => {
    if (validateStep(step)) {
      if (step < 3) {
        setStep((s) => s + 1);
      }
    }
  }, [step, validateStep]);

  const handleBack = useCallback(() => {
    if (step > 1) {
      setStep((s) => s - 1);
    }
  }, [step]);

  const handleSubmit = async () => {
    if (!validateStep(1) || !validateStep(2) || !validateStep(3)) {
      return;
    }

    // Solo requerimos profile, no activeGroup (puede ser calendario personal)
    if (!profile?.$id) return;

    try {
      // Construir fechas usando la zona horaria del usuario
      // fromZonedTime convierte una fecha "como si estuviera en esa zona" a UTC
      let startDateTime, endDateTime;

      if (formData.allDay) {
        // Para eventos de todo el día, crear fecha en la zona horaria del usuario
        const [year, month, day] = formData.date.split("-").map(Number);

        // Crear fecha local a medianoche en la zona horaria del usuario
        const startLocal = new Date(year, month - 1, day, 0, 0, 0, 0);
        const endLocal = new Date(year, month - 1, day, 23, 59, 59, 999);

        // Convertir de la zona horaria del usuario a UTC
        startDateTime = fromZonedTime(startLocal, userTimezone).toISOString();
        endDateTime = fromZonedTime(endLocal, userTimezone).toISOString();
      } else {
        // Para eventos con hora específica
        const [year, month, day] = formData.date.split("-").map(Number);
        const [startHour, startMin] = formData.startTime.split(":").map(Number);
        const [endHour, endMin] = formData.endTime.split(":").map(Number);

        // Crear fechas en la zona horaria del usuario
        const startLocal = new Date(
          year,
          month - 1,
          day,
          startHour,
          startMin,
          0,
          0
        );
        const endLocal = new Date(year, month - 1, day, endHour, endMin, 0, 0);

        // Convertir de la zona horaria del usuario a UTC
        startDateTime = fromZonedTime(startLocal, userTimezone).toISOString();
        endDateTime = fromZonedTime(endLocal, userTimezone).toISOString();
      }

      const eventData = {
        calendarId: formData.calendarId,
        ownerProfileId: profile.$id,
        title: formData.title.trim(),
        description: formData.description.trim(),
        locationText: formData.location.trim(),
        startAt: startDateTime,
        endAt: endDateTime,
        allDay: formData.allDay,
        status: ENUMS.EVENT_STATUS.CONFIRMED,
        // visibility: ENUMS.EVENT_VISIBILITY.INHERIT, // TODO: habilitar cuando exista en Appwrite
      };

      // Solo agregar groupId si el calendario es de tipo GROUP
      const selectedCalendar = calendars.find(
        (cal) => cal.$id === formData.calendarId
      );
      if (
        selectedCalendar?.scope === ENUMS.CALENDAR_SCOPE.GROUP &&
        activeGroup?.$id
      ) {
        eventData.groupId = activeGroup.$id;
      }

      if (isEditing && event) {
        await updateEvent.mutateAsync({
          eventId: event.$id,
          data: eventData,
        });
      } else {
        await createEvent.mutateAsync(eventData);
      }

      onSuccess?.();
      handleClose();
    } catch (error) {
      console.error("Error saving event:", error);
      setErrors({ submit: error.message || "Error al guardar el evento" });
    }
  };

  const handleClose = () => {
    if (!createEvent.isPending && !updateEvent.isPending) {
      onClose();
      setStep(1);
      setErrors({});
    }
  };

  // Prevenir scroll del body cuando el modal está abierto (mejora en móviles)
  useEffect(() => {
    if (isOpen) {
      const originalStyle = window.getComputedStyle(document.body).overflow;
      document.body.style.overflow = "hidden";

      // En móviles, prevenir zoom accidental en inputs
      if (isMobile) {
        const viewport = document.querySelector("meta[name=viewport]");
        const originalContent = viewport?.getAttribute("content");
        if (viewport) {
          viewport.setAttribute(
            "content",
            "width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
          );
        }

        return () => {
          document.body.style.overflow = originalStyle;
          if (viewport && originalContent) {
            viewport.setAttribute("content", originalContent);
          }
        };
      }

      return () => {
        document.body.style.overflow = originalStyle;
      };
    }
  }, [isOpen, isMobile]);

  const isPending = createEvent.isPending || updateEvent.isPending;
  const isStepValid = useMemo(() => {
    if (step === 1) {
      // Validar título y fecha/hora
      if (formData.title.trim().length < 2) return false;
      if (!formData.date) return false;
      if (!formData.allDay) {
        if (!formData.startTime || !formData.endTime) return false;
        const [startH, startM] = formData.startTime.split(":").map(Number);
        const [endH, endM] = formData.endTime.split(":").map(Number);
        const startMinutes = startH * 60 + startM;
        const endMinutes = endH * 60 + endM;
        if (endMinutes <= startMinutes) return false;
      }
      return true;
    }
    if (step === 2) {
      // Paso 2 es opcional (ubicación y descripción)
      return true;
    }
    if (step === 3) {
      // Validar calendario seleccionado
      return !!formData.calendarId;
    }
    return true;
  }, [step, formData]);

  // Get selected calendar for preview
  const selectedCalendar = calendars.find((c) => c.$id === formData.calendarId);

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
            initial={{
              opacity: 0,
              scale: isMobile ? 1 : 0.95,
              y: isMobile ? 20 : 20,
            }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{
              opacity: 0,
              scale: isMobile ? 1 : 0.95,
              y: isMobile ? 20 : 20,
            }}
            transition={{
              type: isMobile ? "tween" : "spring",
              damping: 25,
              stiffness: 300,
              duration: isMobile ? 0.2 : undefined,
            }}
            className="fixed inset-4 z-50 flex items-center justify-center sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg sm:p-4"
            style={{ maxHeight: "calc(100dvh - 2rem)" }}
          >
            <div
              className="bg-[rgb(var(--bg-surface))] rounded-3xl shadow-2xl border border-[rgb(var(--border-base))] flex flex-col w-full overflow-hidden"
              style={{ maxHeight: "calc(100dvh - 2rem)" }}
            >
              {/* Header - Always visible */}
              <div className="px-6 py-4 border-b border-[rgb(var(--border-base))] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  {selectedCalendar && (
                    <div
                      className={`w-10 h-10 rounded-xl ${
                        getCalendarColor(selectedCalendar.color).bg
                      } flex items-center justify-center`}
                    >
                      {React.createElement(
                        getCalendarIcon(selectedCalendar.icon),
                        {
                          className: "w-5 h-5 text-white",
                        }
                      )}
                    </div>
                  )}
                  <div>
                    <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                      {isEditing ? "Editar evento" : "Nuevo evento"}
                    </h2>
                    <div className="mt-1">
                      <StepIndicator currentStep={step} totalSteps={3} />
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={isPending}
                  className="w-8 h-8 rounded-lg hover:bg-[rgb(var(--bg-muted))] flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-[rgb(var(--text-muted))]" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 overscroll-contain relative">
                <AnimatePresence mode="wait">
                  {step === 1 && (
                    <StepBasicInfo
                      key="step1"
                      title={formData.title}
                      date={formData.date}
                      startTime={formData.startTime}
                      endTime={formData.endTime}
                      allDay={formData.allDay}
                      onTitleChange={(v) => updateField("title", v)}
                      onDateChange={(v) => updateField("date", v)}
                      onStartTimeChange={(v) => updateField("startTime", v)}
                      onEndTimeChange={(v) => updateField("endTime", v)}
                      onAllDayChange={(v) => updateField("allDay", v)}
                      errors={errors}
                      timezone={userTimezone}
                      isMobile={isMobile}
                    />
                  )}

                  {step === 2 && (
                    <StepOptionalDetails
                      key="step2"
                      location={formData.location}
                      description={formData.description}
                      onLocationChange={(v) => updateField("location", v)}
                      onDescriptionChange={(v) => updateField("description", v)}
                      isMobile={isMobile}
                    />
                  )}

                  {step === 3 && (
                    <StepCalendar
                      key="step3"
                      calendarId={formData.calendarId}
                      calendars={calendars}
                      onCalendarChange={(v) => updateField("calendarId", v)}
                      errors={errors}
                      isMobile={isMobile}
                    />
                  )}
                </AnimatePresence>

                {/* Error message */}
                {errors.submit && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mt-4 p-3 rounded-xl bg-[rgb(var(--error))]/10 border border-[rgb(var(--error))]/20"
                  >
                    <p className="text-sm text-[rgb(var(--error))] flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" />
                      {errors.submit}
                    </p>
                  </motion.div>
                )}
              </div>

              {/* Footer - Fixed */}
              <div className="px-6 py-4 border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] shrink-0 rounded-b-3xl">
                <div className="flex gap-3">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={handleBack}
                      disabled={isPending}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-[rgb(var(--text-secondary))] bg-[rgb(var(--bg-muted))] hover:bg-[rgb(var(--bg-hover))] transition-colors disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      Atrás
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleClose}
                      disabled={isPending}
                      className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-[rgb(var(--text-secondary))] bg-[rgb(var(--bg-muted))] hover:bg-[rgb(var(--bg-hover))] transition-colors disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  )}

                  {step < 3 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      disabled={!isStepValid || isPending}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[rgb(var(--brand-primary))] hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      Continuar
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleSubmit}
                      disabled={isPending}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[rgb(var(--brand-primary))] hover:opacity-90 transition-opacity disabled:opacity-50"
                    >
                      {isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          {isEditing ? "Guardando..." : "Creando..."}
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4" />
                          {isEditing ? "Guardar cambios" : "Crear evento"}
                        </>
                      )}
                    </button>
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
