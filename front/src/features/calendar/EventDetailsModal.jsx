import React, { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  AlignLeft,
  Pencil,
  Trash2,
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
  User,
  Eye,
  CheckCircle,
  XCircle,
  Clock3,
} from "lucide-react";
import {
  format,
  parseISO,
  differenceInMinutes,
  differenceInHours,
} from "date-fns";
import { es } from "date-fns/locale";

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
  },
  blue: {
    bg: "bg-blue-500",
    light: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500",
  },
  cyan: {
    bg: "bg-cyan-500",
    light: "bg-cyan-500/10",
    text: "text-cyan-500",
    border: "border-cyan-500",
  },
  emerald: {
    bg: "bg-emerald-500",
    light: "bg-emerald-500/10",
    text: "text-emerald-500",
    border: "border-emerald-500",
  },
  amber: {
    bg: "bg-amber-500",
    light: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500",
  },
  orange: {
    bg: "bg-orange-500",
    light: "bg-orange-500/10",
    text: "text-orange-500",
    border: "border-orange-500",
  },
  rose: {
    bg: "bg-rose-500",
    light: "bg-rose-500/10",
    text: "text-rose-500",
    border: "border-rose-500",
  },
  pink: {
    bg: "bg-pink-500",
    light: "bg-pink-500/10",
    text: "text-pink-500",
    border: "border-pink-500",
  },
  red: {
    bg: "bg-red-500",
    light: "bg-red-500/10",
    text: "text-red-500",
    border: "border-red-500",
  },
  teal: {
    bg: "bg-teal-500",
    light: "bg-teal-500/10",
    text: "text-teal-500",
    border: "border-teal-500",
  },
  slate: {
    bg: "bg-slate-500",
    light: "bg-slate-500/10",
    text: "text-slate-500",
    border: "border-slate-500",
  },
};

const STATUS_CONFIG = {
  DRAFT: {
    label: "Borrador",
    icon: Clock3,
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
  CONFIRMED: {
    label: "Confirmado",
    icon: CheckCircle,
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  CANCELLED: {
    label: "Cancelado",
    icon: XCircle,
    color: "text-red-500",
    bg: "bg-red-500/10",
  },
};

const getCalendarIcon = (iconId) => CALENDAR_ICONS[iconId] || Calendar;
const getCalendarColor = (color) =>
  CALENDAR_COLORS[color] || CALENDAR_COLORS.violet;

// ================================================
// HELPER FUNCTIONS
// ================================================

function formatDuration(startAt, endAt) {
  if (!startAt || !endAt) return null;

  try {
    const start = parseISO(startAt);
    const end = parseISO(endAt);
    const minutes = differenceInMinutes(end, start);

    if (minutes < 60) {
      return `${minutes} minutos`;
    }

    const hours = differenceInHours(end, start);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
      return `${hours} hora${hours !== 1 ? "s" : ""}`;
    }

    return `${hours}h ${remainingMinutes}m`;
  } catch {
    return null;
  }
}

// ================================================
// DETAIL ROW COMPONENT
// ================================================

function DetailRow({ icon: Icon, label, value, className = "" }) {
  if (!value) return null;

  return (
    <div className={`flex items-start gap-3 ${className}`}>
      <div className="w-9 h-9 rounded-xl bg-[rgb(var(--bg-muted))] flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-[rgb(var(--text-muted))]" />
      </div>
      <div className="flex-1 min-w-0 py-1.5">
        <p className="text-xs text-[rgb(var(--text-muted))] mb-0.5">{label}</p>
        <p className="text-sm text-[rgb(var(--text-primary))]">{value}</p>
      </div>
    </div>
  );
}

// ================================================
// MAIN COMPONENT
// ================================================

export function EventDetailsModal({
  isOpen,
  onClose,
  event,
  calendar,
  onEdit,
  onDelete,
  canEdit = true,
}) {
  // Memoize computed values
  const eventData = useMemo(() => {
    if (!event) return null;

    try {
      const startDate = event.startAt ? parseISO(event.startAt) : null;
      const endDate = event.endAt ? parseISO(event.endAt) : null;

      return {
        date: startDate
          ? format(startDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })
          : null,
        startTime: startDate ? format(startDate, "HH:mm") : null,
        endTime: endDate ? format(endDate, "HH:mm") : null,
        duration: formatDuration(event.startAt, event.endAt),
        status: STATUS_CONFIG[event.status] || STATUS_CONFIG.CONFIRMED,
      };
    } catch {
      return null;
    }
  }, [event]);

  const calendarColors = calendar
    ? getCalendarColor(calendar.color)
    : getCalendarColor("violet");
  const CalendarIcon = calendar ? getCalendarIcon(calendar.icon) : Calendar;

  if (!event) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 z-50 flex items-center justify-center sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg sm:p-4"
            style={{ maxHeight: "calc(100dvh - 2rem)" }}
          >
            <div
              className="bg-[rgb(var(--bg-surface))] rounded-3xl shadow-2xl border border-[rgb(var(--border-base))] overflow-hidden flex flex-col w-full"
              style={{ maxHeight: "calc(100dvh - 2rem)" }}
            >
              {/* Header with color accent */}
              <div className={`h-2 ${calendarColors.bg}`} />

              <div className="px-6 py-4 border-b border-[rgb(var(--border-base))] flex items-start justify-between gap-4 shrink-0">
                <div className="flex items-start gap-3 min-w-0 flex-1">
                  <div
                    className={`w-12 h-12 rounded-xl ${calendarColors.bg} flex items-center justify-center shrink-0`}
                  >
                    <CalendarIcon className="w-6 h-6 text-white" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] line-clamp-2">
                      {event.title}
                    </h2>
                    {calendar && (
                      <p className="text-sm text-[rgb(var(--text-muted))] mt-0.5">
                        {calendar.name}
                      </p>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-lg hover:bg-[rgb(var(--bg-muted))] flex items-center justify-center transition-colors shrink-0"
                >
                  <X className="w-5 h-5 text-[rgb(var(--text-muted))]" />
                </button>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 overscroll-contain">
                {/* Status Badge */}
                {eventData?.status && (
                  <div className="flex items-center gap-2">
                    <div
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${eventData.status.bg} ${eventData.status.color}`}
                    >
                      <eventData.status.icon className="w-3.5 h-3.5" />
                      {eventData.status.label}
                    </div>
                    {event.allDay && (
                      <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-secondary))]">
                        Todo el día
                      </div>
                    )}
                  </div>
                )}

                {/* Date & Time */}
                <div className="space-y-3">
                  <DetailRow
                    icon={Calendar}
                    label="Fecha"
                    value={eventData?.date}
                  />

                  {!event.allDay && eventData?.startTime && (
                    <DetailRow
                      icon={Clock}
                      label="Horario"
                      value={
                        eventData.endTime
                          ? `${eventData.startTime} - ${eventData.endTime}`
                          : eventData.startTime
                      }
                    />
                  )}

                  {eventData?.duration && !event.allDay && (
                    <DetailRow
                      icon={Clock3}
                      label="Duración"
                      value={eventData.duration}
                    />
                  )}
                </div>

                {/* Location */}
                {event.locationText && (
                  <DetailRow
                    icon={MapPin}
                    label="Ubicación"
                    value={event.locationText}
                  />
                )}

                {/* Description */}
                {event.description && (
                  <div className="pt-2">
                    <div className="flex items-center gap-2 mb-2">
                      <AlignLeft className="w-4 h-4 text-[rgb(var(--text-muted))]" />
                      <span className="text-xs text-[rgb(var(--text-muted))]">
                        Descripción
                      </span>
                    </div>
                    <div className="p-4 rounded-xl bg-[rgb(var(--bg-muted))] border border-[rgb(var(--border-base))]">
                      <p className="text-sm text-[rgb(var(--text-secondary))] whitespace-pre-wrap">
                        {event.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* Visibility Info */}
                {event.visibility && event.visibility !== "INHERIT" && (
                  <DetailRow
                    icon={Eye}
                    label="Visibilidad"
                    value={
                      event.visibility === "PRIVATE"
                        ? "Solo visible para ti"
                        : "Visible para el grupo"
                    }
                  />
                )}

                {/* Created/Updated info */}
                {(event.createdAt || event.updatedAt) && (
                  <div className="pt-4 border-t border-[rgb(var(--border-base))]">
                    <div className="flex flex-wrap gap-4 text-xs text-[rgb(var(--text-muted))]">
                      {event.createdAt && (
                        <span>
                          Creado:{" "}
                          {format(
                            parseISO(event.createdAt),
                            "d MMM yyyy, HH:mm",
                            {
                              locale: es,
                            }
                          )}
                        </span>
                      )}
                      {event.updatedAt &&
                        event.updatedAt !== event.createdAt && (
                          <span>
                            Actualizado:{" "}
                            {format(
                              parseISO(event.updatedAt),
                              "d MMM yyyy, HH:mm",
                              {
                                locale: es,
                              }
                            )}
                          </span>
                        )}
                    </div>
                  </div>
                )}
              </div>

              {/* Footer with Actions - Fixed */}
              {canEdit && (
                <div className="px-6 py-4 border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] shrink-0 rounded-b-3xl">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onDelete?.(event);
                      }}
                      className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-[rgb(var(--error))] bg-[rgb(var(--error))]/10 hover:bg-[rgb(var(--error))]/20 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                      Eliminar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onEdit?.(event);
                      }}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[rgb(var(--brand-primary))] hover:opacity-90 transition-opacity"
                    >
                      <Pencil className="w-4 h-4" />
                      Editar evento
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
