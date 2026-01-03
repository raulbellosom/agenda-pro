import React, {
  useState,
  useMemo,
  useCallback,
  useRef,
  useEffect,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Calendar as CalendarIcon,
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
  LayoutGrid,
  List,
  MapPin,
  Clock,
  MoreHorizontal,
  PanelLeftClose,
  PanelLeft,
  PanelRightClose,
  PanelRight,
  ChevronDown,
  ChevronUp,
  Sun,
  Check,
  Users,
  Pencil,
  Share2,
  Trash2,
  Loader2,
} from "lucide-react";
import { NoCalendarsPrompt, EmptyCalendarsList } from "./NoCalendarsPrompt";
import { CreateCalendarModal } from "./CreateCalendarModal";
import { EventModal } from "./EventModal";
import { EventDetailsModal } from "./EventDetailsModal";
import { DeleteEventModal } from "./DeleteEventModal";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  startOfDay,
  addDays,
  addWeeks,
  subWeeks,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
  parseISO,
  differenceInMinutes,
  setHours,
} from "date-fns";
import { es } from "date-fns/locale";
import { useMonthEvents } from "../../lib/hooks/useEvents";
import { useDeleteCalendar } from "../../lib/hooks/useCalendars";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";

// ================================================
// CONSTANTS & UTILITIES
// ================================================

const CALENDAR_COLORS = {
  violet: {
    bg: "bg-violet-500/20",
    border: "border-violet-500",
    text: "text-violet-500 dark:text-violet-400",
    dot: "bg-violet-500",
    light: "bg-violet-500/10",
  },
  blue: {
    bg: "bg-blue-500/20",
    border: "border-blue-500",
    text: "text-blue-500 dark:text-blue-400",
    dot: "bg-blue-500",
    light: "bg-blue-500/10",
  },
  cyan: {
    bg: "bg-cyan-500/20",
    border: "border-cyan-500",
    text: "text-cyan-500 dark:text-cyan-400",
    dot: "bg-cyan-500",
    light: "bg-cyan-500/10",
  },
  emerald: {
    bg: "bg-emerald-500/20",
    border: "border-emerald-500",
    text: "text-emerald-500 dark:text-emerald-400",
    dot: "bg-emerald-500",
    light: "bg-emerald-500/10",
  },
  teal: {
    bg: "bg-teal-500/20",
    border: "border-teal-500",
    text: "text-teal-500 dark:text-teal-400",
    dot: "bg-teal-500",
    light: "bg-teal-500/10",
  },
  amber: {
    bg: "bg-amber-500/20",
    border: "border-amber-500",
    text: "text-amber-500 dark:text-amber-400",
    dot: "bg-amber-500",
    light: "bg-amber-500/10",
  },
  orange: {
    bg: "bg-orange-500/20",
    border: "border-orange-500",
    text: "text-orange-500 dark:text-orange-400",
    dot: "bg-orange-500",
    light: "bg-orange-500/10",
  },
  red: {
    bg: "bg-red-500/20",
    border: "border-red-500",
    text: "text-red-500 dark:text-red-400",
    dot: "bg-red-500",
    light: "bg-red-500/10",
  },
  rose: {
    bg: "bg-rose-500/20",
    border: "border-rose-500",
    text: "text-rose-500 dark:text-rose-400",
    dot: "bg-rose-500",
    light: "bg-rose-500/10",
  },
  pink: {
    bg: "bg-pink-500/20",
    border: "border-pink-500",
    text: "text-pink-500 dark:text-pink-400",
    dot: "bg-pink-500",
    light: "bg-pink-500/10",
  },
  slate: {
    bg: "bg-slate-500/20",
    border: "border-slate-500",
    text: "text-slate-500 dark:text-slate-400",
    dot: "bg-slate-500",
    light: "bg-slate-500/10",
  },
};

// Calendar icons map
const CALENDAR_ICONS = {
  calendar: CalendarIcon,
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

const getCalendarIcon = (iconId) => CALENDAR_ICONS[iconId] || CalendarIcon;

const getCalendarColor = (color) =>
  CALENDAR_COLORS[color] || CALENDAR_COLORS.violet;

// View modes
const VIEW_MODES = {
  DAY: "day",
  WEEK: "week",
  MONTH: "month",
  AGENDA: "agenda",
};

// Hours for day/week view
const HOURS = Array.from({ length: 24 }, (_, i) => i);

// Animation variants for view transitions
const viewTransitionVariants = {
  enter: (direction) => ({
    x: direction > 0 ? 100 : -100,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction < 0 ? 100 : -100,
    opacity: 0,
  }),
};

// ================================================
// MINI CALENDAR COMPONENT
// ================================================

function MiniCalendar({ currentDate, selectedDate, onSelectDate }) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

  const days = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <div className="select-none">
      <div className="grid grid-cols-7 gap-1 mb-1">
        {weekDays.map((d, i) => (
          <div
            key={i}
            className="text-center text-xs text-[rgb(var(--text-muted))] py-1"
          >
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {days.map((d, i) => {
          const isCurrentMonth = isSameMonth(d, currentDate);
          const isSelected = isSameDay(d, selectedDate);
          const isTodayDate = isToday(d);

          return (
            <button
              key={i}
              onClick={() => onSelectDate(d)}
              className={`
                aspect-square flex items-center justify-center text-xs rounded-md transition-all
                ${
                  !isCurrentMonth
                    ? "text-[rgb(var(--text-muted))]/40"
                    : "text-[rgb(var(--text-secondary))]"
                }
                ${isSelected ? "bg-[rgb(var(--brand-primary))] text-white" : ""}
                ${
                  isTodayDate && !isSelected
                    ? "border border-[rgb(var(--brand-primary))] text-[rgb(var(--brand-primary))]"
                    : ""
                }
                ${
                  !isSelected && isCurrentMonth
                    ? "hover:bg-[rgb(var(--bg-hover))]"
                    : ""
                }
              `}
            >
              {format(d, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ================================================
// CALENDARS LIST COMPONENT
// ================================================

function CalendarCheckbox({ checked, color }) {
  const colors = getCalendarColor(color);

  return (
    <div
      className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
        checked
          ? `${colors.dot}`
          : "border-2 border-[rgb(var(--border-base))] bg-transparent"
      }`}
    >
      {checked && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
    </div>
  );
}

function CalendarItem({
  calendar,
  isVisible,
  onToggle,
  onEdit,
  onShare,
  onDelete,
  isOwner,
}) {
  const colors = getCalendarColor(calendar.color);
  const CalendarItemIcon = getCalendarIcon(calendar.icon);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef(null);

  // Close menu when clicking outside
  React.useEffect(() => {
    if (!showMenu) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showMenu]);

  return (
    <div className="relative group">
      <div
        className={`flex items-center gap-2 px-2 py-2 rounded-lg transition-all ${
          isVisible ? "" : "opacity-50"
        } hover:bg-[rgb(var(--bg-hover))]`}
      >
        {/* Checkbox para visibilidad */}
        <button onClick={onToggle} className="shrink-0">
          <CalendarCheckbox checked={isVisible} color={calendar.color} />
        </button>

        {/* Icono de calendario */}
        <div
          className={`w-5 h-5 rounded ${colors.light} flex items-center justify-center shrink-0`}
        >
          <CalendarItemIcon className={`w-3 h-3 ${colors.text}`} />
        </div>

        {/* Nombre del calendario */}
        <span className="flex-1 text-sm text-[rgb(var(--text-secondary))] text-left truncate">
          {calendar.name}
        </span>

        {/* Menú de opciones - solo visible en hover o si está abierto */}
        <div ref={menuRef} className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={`p-1 rounded-md transition-all ${
              showMenu
                ? "bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-secondary))]"
                : "opacity-0 group-hover:opacity-100 text-[rgb(var(--text-muted))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-secondary))]"
            }`}
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {/* Dropdown Menu */}
          <AnimatePresence>
            {showMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -5 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -5 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-1 w-40 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border-base))] shadow-lg overflow-hidden z-50"
              >
                <div className="py-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onEdit?.(calendar);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
                  >
                    <Pencil className="w-4 h-4" />
                    Editar
                  </button>
                  {isOwner && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowMenu(false);
                        onShare?.(calendar);
                      }}
                      className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      Compartir
                    </button>
                  )}
                  <div className="my-1 border-t border-[rgb(var(--border-base))]" />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowMenu(false);
                      onDelete?.(calendar);
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-[rgb(var(--error))] hover:bg-[rgb(var(--error))]/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Eliminar
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function CalendarsList({
  calendars,
  visibleCalendars,
  onToggleVisibility,
  onCreateCalendar,
  onEditCalendar,
  onShareCalendar,
  onDeleteCalendar,
  currentProfileId,
}) {
  if (!calendars || calendars.length === 0) {
    return <EmptyCalendarsList onCreateCalendar={onCreateCalendar} />;
  }

  // Separar calendarios propios y compartidos
  const myCalendars = calendars.filter(
    (cal) => cal.ownerProfileId === currentProfileId
  );
  const sharedCalendars = calendars.filter(
    (cal) => cal.ownerProfileId !== currentProfileId
  );

  return (
    <div className="space-y-4">
      {/* Mis Calendarios */}
      {myCalendars.length > 0 && (
        <div>
          <div className="px-2 mb-1">
            <span className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wider">
              Mis calendarios
            </span>
          </div>
          <div className="space-y-0.5">
            {myCalendars.map((cal) => (
              <CalendarItem
                key={cal.$id}
                calendar={cal}
                isVisible={visibleCalendars.includes(cal.$id)}
                onToggle={() => onToggleVisibility(cal.$id)}
                onEdit={onEditCalendar}
                onShare={onShareCalendar}
                onDelete={onDeleteCalendar}
                isOwner={true}
              />
            ))}
          </div>
        </div>
      )}

      {/* Calendarios Compartidos */}
      {sharedCalendars.length > 0 && (
        <div>
          <div className="px-2 mb-1 flex items-center gap-1.5">
            <Users className="w-3 h-3 text-[rgb(var(--text-muted))]" />
            <span className="text-xs font-medium text-[rgb(var(--text-muted))] uppercase tracking-wider">
              Compartidos
            </span>
          </div>
          <div className="space-y-0.5">
            {sharedCalendars.map((cal) => (
              <CalendarItem
                key={cal.$id}
                calendar={cal}
                isVisible={visibleCalendars.includes(cal.$id)}
                onToggle={() => onToggleVisibility(cal.$id)}
                onEdit={onEditCalendar}
                onShare={onShareCalendar}
                onDelete={onDeleteCalendar}
                isOwner={false}
              />
            ))}
          </div>
        </div>
      )}

      {/* Mensaje si no hay calendarios propios */}
      {myCalendars.length === 0 && sharedCalendars.length > 0 && (
        <div className="px-2 py-3 text-center">
          <p className="text-xs text-[rgb(var(--text-muted))]">
            No tienes calendarios propios
          </p>
          <button
            onClick={onCreateCalendar}
            className="mt-2 text-xs text-[rgb(var(--brand-primary))] hover:underline"
          >
            Crear mi primer calendario
          </button>
        </div>
      )}
    </div>
  );
}

// ================================================
// EVENT CARD COMPONENT
// ================================================

function EventCard({ event, compact = false, onClick }) {
  const colors = getCalendarColor(event.calendar?.color || "violet");
  const startTime = event.startAt
    ? format(parseISO(event.startAt), "HH:mm")
    : "";
  const endTime = event.endAt ? format(parseISO(event.endAt), "HH:mm") : "";

  if (compact) {
    return (
      <div
        onClick={(e) => {
          e.stopPropagation();
          onClick?.(event);
        }}
        className={`px-2 py-1 rounded-md text-xs truncate ${colors.bg} ${colors.text} font-medium cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-[rgb(var(--brand-primary))]/30 transition-all`}
      >
        {startTime && <span className="opacity-75 mr-1">{startTime}</span>}
        {event.title}
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      onClick={() => onClick?.(event)}
      className={`group p-3 rounded-xl border-l-4 ${colors.border} bg-[rgb(var(--bg-surface))] shadow-sm hover:shadow-md transition-shadow cursor-pointer`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-[rgb(var(--text-primary))] truncate">
            {event.title}
          </h4>
          {(startTime || endTime) && (
            <div className="flex items-center gap-1.5 mt-1.5 text-xs text-[rgb(var(--text-muted))]">
              <Clock className="w-3.5 h-3.5" />
              <span>
                {startTime}
                {endTime && ` - ${endTime}`}
              </span>
            </div>
          )}
          {event.locationText && (
            <div className="flex items-center gap-1.5 mt-1 text-xs text-[rgb(var(--text-muted))]">
              <MapPin className="w-3.5 h-3.5" />
              <span className="truncate">{event.locationText}</span>
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onClick?.(event);
          }}
          className="p-1.5 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))] opacity-0 group-hover:opacity-100 transition-opacity"
        >
          <MoreHorizontal className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ================================================
// DAY CELL COMPONENT (for Month View)
// ================================================

function DayCell({
  date,
  events,
  isCurrentMonth,
  isSelected,
  isTodayDate,
  onClick,
}) {
  const maxVisible = 3;
  const visibleEvents = events.slice(0, maxVisible);
  const remaining = events.length - maxVisible;

  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`
        flex flex-col p-1 sm:p-1.5 min-h-[70px] sm:min-h-[90px] lg:min-h-[100px] h-full border-r border-b border-[rgb(var(--border-base))] transition-all text-left
        ${!isCurrentMonth ? "opacity-40 bg-[rgb(var(--bg-muted))]/30" : ""}
        ${
          isSelected
            ? "bg-[rgb(var(--brand-primary))]/10 ring-2 ring-inset ring-[rgb(var(--brand-primary))]"
            : "hover:bg-[rgb(var(--bg-hover))]"
        }
        ${isTodayDate && !isSelected ? "bg-[rgb(var(--brand-primary))]/5" : ""}
      `}
    >
      <span
        className={`text-xs sm:text-sm font-medium mb-1 sm:mb-2 ${
          isTodayDate
            ? "w-5 h-5 sm:w-7 sm:h-7 rounded-full bg-[rgb(var(--brand-primary))] text-white flex items-center justify-center text-xs"
            : "text-[rgb(var(--text-secondary))]"
        }`}
      >
        {format(date, "d")}
      </span>
      <div className="flex-1 space-y-0.5 sm:space-y-1 overflow-hidden">
        {visibleEvents.map((event, i) => {
          const colors = getCalendarColor(event.calendar?.color || "violet");
          return (
            <div
              key={event.$id || i}
              className={`text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded truncate ${colors.bg} ${colors.text} font-medium`}
            >
              <span className="hidden sm:inline">{event.title}</span>
              <span className="sm:hidden">•</span>
            </div>
          );
        })}
        {remaining > 0 && (
          <div className="text-[10px] sm:text-xs text-[rgb(var(--text-muted))] px-1 font-medium">
            +{remaining}
          </div>
        )}
      </div>
    </motion.button>
  );
}

// ================================================
// TIME GRID EVENT (for Day/Week views)
// ================================================

function TimeGridEvent({ event, dayStart, onClick }) {
  const colors = getCalendarColor(event.calendar?.color || "violet");
  const eventStart = parseISO(event.startAt);
  const eventEnd = event.endAt ? parseISO(event.endAt) : addDays(eventStart, 0);

  const startMinutes = differenceInMinutes(eventStart, dayStart);
  const duration = differenceInMinutes(eventEnd, eventStart) || 60;

  const top = (startMinutes / 60) * 60; // 60px per hour
  const height = Math.max((duration / 60) * 60, 24); // min height 24px

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={() => onClick?.(event)}
      className={`absolute left-1 right-1 ${colors.bg} ${colors.border} border-l-2 rounded-md px-2 py-1 overflow-hidden cursor-pointer hover:ring-2 hover:ring-[rgb(var(--brand-primary))]/30 transition-all z-10`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        minHeight: "24px",
      }}
    >
      <p className={`text-xs font-medium ${colors.text} truncate`}>
        {event.title}
      </p>
      {height > 40 && (
        <p className="text-[10px] text-[rgb(var(--text-muted))] mt-0.5">
          {format(eventStart, "HH:mm")} - {format(eventEnd, "HH:mm")}
        </p>
      )}
    </motion.div>
  );
}

// ================================================
// EMPTY DAY MESSAGE COMPONENT (Dismissible)
// ================================================

function EmptyDayMessage({ onDismiss }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.2 }}
      className="relative text-center bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border-base))] shadow-lg rounded-2xl p-6 max-w-xs"
    >
      <button
        onClick={onDismiss}
        className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))] transition-colors"
        title="Cerrar"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M6 18L18 6M6 6l12 12"
          />
        </svg>
      </button>
      <Sun className="w-12 h-12 mx-auto mb-3 text-[rgb(var(--text-muted))]" />
      <p className="text-[rgb(var(--text-secondary))] font-medium">Día libre</p>
      <p className="text-sm text-[rgb(var(--text-muted))] mt-1">
        No hay eventos programados
      </p>
    </motion.div>
  );
}

// ================================================
// DAY VIEW COMPONENT
// ================================================

function DayView({ selectedDate, events, onEventClick }) {
  const scrollRef = useRef(null);
  const dayStart = startOfDay(selectedDate);
  const [showEmptyMessage, setShowEmptyMessage] = useState(true);

  const dayEvents = events.filter((e) => {
    if (!e.startAt) return false;
    return isSameDay(parseISO(e.startAt), selectedDate);
  });

  // Reset empty message visibility when date changes
  React.useEffect(() => {
    setShowEmptyMessage(true);
  }, [selectedDate]);

  // Scroll to current time on mount
  React.useEffect(() => {
    if (scrollRef.current && isToday(selectedDate)) {
      const currentHour = new Date().getHours();
      scrollRef.current.scrollTop = Math.max(0, (currentHour - 1) * 60);
    }
  }, [selectedDate]);

  return (
    <div className="h-full flex flex-col relative">
      {/* Day Header */}
      <div className="flex items-center justify-center py-4 border-b border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))]">
        <div className="text-center">
          <div className="text-sm text-[rgb(var(--text-muted))] uppercase tracking-wide">
            {format(selectedDate, "EEEE", { locale: es })}
          </div>
          <div
            className={`text-3xl font-bold mt-1 ${
              isToday(selectedDate)
                ? "w-12 h-12 rounded-full bg-[rgb(var(--brand-primary))] text-white flex items-center justify-center mx-auto"
                : "text-[rgb(var(--text-primary))]"
            }`}
          >
            {format(selectedDate, "d")}
          </div>
        </div>
      </div>

      {/* Time Grid */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div className="relative" style={{ height: `${24 * 60}px` }}>
          {/* Current time indicator */}
          {isToday(selectedDate) && (
            <div
              className="absolute left-0 right-0 z-20 flex items-center"
              style={{
                top: `${
                  new Date().getHours() * 60 + new Date().getMinutes()
                }px`,
              }}
            >
              <div className="w-2 h-2 rounded-full bg-[rgb(var(--error))]" />
              <div className="flex-1 h-0.5 bg-[rgb(var(--error))]" />
            </div>
          )}

          {/* Hour rows */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 flex border-t border-[rgb(var(--border-base))]"
              style={{ top: `${hour * 60}px`, height: "60px" }}
            >
              <div className="w-16 sm:w-20 shrink-0 pr-2 text-right">
                <span className="text-xs text-[rgb(var(--text-muted))] -translate-y-2 inline-block">
                  {format(setHours(new Date(), hour), "HH:mm")}
                </span>
              </div>
              <div className="flex-1 relative hover:bg-[rgb(var(--bg-hover))]/50 transition-colors" />
            </div>
          ))}

          {/* Events */}
          <div className="absolute top-0 left-16 sm:left-20 right-0 bottom-0">
            {dayEvents.map((event) => (
              <TimeGridEvent
                key={event.$id}
                event={event}
                dayStart={dayStart}
                onClick={onEventClick}
              />
            ))}
          </div>
        </div>
      </div>

      {/* No events message - overlay positioned from the container, not scroll area */}
      <AnimatePresence>
        {dayEvents.length === 0 && showEmptyMessage && (
          <div className="absolute inset-0 top-[88px] flex items-center justify-center z-10 pointer-events-none">
            <div className="pointer-events-auto">
              <EmptyDayMessage onDismiss={() => setShowEmptyMessage(false)} />
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ================================================
// WEEK VIEW COMPONENT
// ================================================

function WeekView({ selectedDate, events, onSelectDate, onEventClick }) {
  const scrollRef = useRef(null);
  const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Scroll to current time on mount
  React.useEffect(() => {
    if (scrollRef.current) {
      const currentHour = new Date().getHours();
      scrollRef.current.scrollTop = Math.max(0, (currentHour - 1) * 60);
    }
  }, [selectedDate]);

  const getEventsForDay = (day) =>
    events.filter((e) => {
      if (!e.startAt) return false;
      return isSameDay(parseISO(e.startAt), day);
    });

  return (
    <div className="h-full flex flex-col">
      {/* Week Header */}
      <div className="flex border-b border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] shrink-0">
        <div className="w-16 sm:w-20 shrink-0" />
        {weekDays.map((day) => (
          <button
            key={day.toISOString()}
            onClick={() => onSelectDate(day)}
            className={`flex-1 py-3 text-center transition-colors ${
              isSameDay(day, selectedDate)
                ? "bg-[rgb(var(--brand-primary))]/5"
                : "hover:bg-[rgb(var(--bg-hover))]"
            }`}
          >
            <div className="text-xs text-[rgb(var(--text-muted))] uppercase tracking-wide">
              {format(day, "EEE", { locale: es })}
            </div>
            <div
              className={`text-lg font-semibold mt-1 ${
                isToday(day)
                  ? "w-8 h-8 rounded-full bg-[rgb(var(--brand-primary))] text-white flex items-center justify-center mx-auto"
                  : isSameDay(day, selectedDate)
                  ? "text-[rgb(var(--brand-primary))]"
                  : "text-[rgb(var(--text-primary))]"
              }`}
            >
              {format(day, "d")}
            </div>
          </button>
        ))}
      </div>

      {/* Time Grid */}
      <div ref={scrollRef} className="flex-1 overflow-auto">
        <div
          className="relative min-w-[600px]"
          style={{ height: `${24 * 60}px` }}
        >
          {/* Current time indicator */}
          {weekDays.some((d) => isToday(d)) && (
            <div
              className="absolute z-20 pointer-events-none"
              style={{
                top: `${
                  new Date().getHours() * 60 + new Date().getMinutes()
                }px`,
                left: "80px",
                right: 0,
              }}
            >
              <div className="flex items-center">
                <div className="w-2 h-2 rounded-full bg-[rgb(var(--error))] -ml-1" />
                <div className="flex-1 h-0.5 bg-[rgb(var(--error))]" />
              </div>
            </div>
          )}

          {/* Hour rows */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="absolute left-0 right-0 flex border-t border-[rgb(var(--border-base))]"
              style={{ top: `${hour * 60}px`, height: "60px" }}
            >
              <div className="w-16 sm:w-20 shrink-0 pr-2 text-right">
                <span className="text-xs text-[rgb(var(--text-muted))] -translate-y-2 inline-block">
                  {format(setHours(new Date(), hour), "HH:mm")}
                </span>
              </div>
              <div className="flex-1 flex">
                {weekDays.map((day) => (
                  <div
                    key={day.toISOString()}
                    className={`flex-1 border-l border-[rgb(var(--border-base))] hover:bg-[rgb(var(--bg-hover))]/50 transition-colors ${
                      isSameDay(day, selectedDate)
                        ? "bg-[rgb(var(--brand-primary))]/5"
                        : ""
                    }`}
                  />
                ))}
              </div>
            </div>
          ))}

          {/* Events per day */}
          <div className="absolute top-0 left-16 sm:left-20 right-0 bottom-0 flex">
            {weekDays.map((day) => {
              const dayEvents = getEventsForDay(day);
              const dayStart = startOfDay(day);
              return (
                <div
                  key={day.toISOString()}
                  className="flex-1 relative border-l border-[rgb(var(--border-base))]"
                >
                  {dayEvents.map((event) => (
                    <TimeGridEvent
                      key={event.$id}
                      event={event}
                      dayStart={dayStart}
                      onClick={onEventClick}
                    />
                  ))}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ================================================
// MONTH VIEW COMPONENT
// ================================================

function MonthView({ currentDate, selectedDate, onSelectDate, eventsByDay }) {
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });

    const days = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate]);

  const weekDays = ["LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB", "DOM"];
  const weekDaysMobile = ["L", "M", "M", "J", "V", "S", "D"];

  return (
    <div className="h-full flex flex-col border-l border-t border-[rgb(var(--border-base))]">
      {/* Week days header */}
      <div className="grid grid-cols-7">
        {weekDays.map((day, i) => (
          <div
            key={day}
            className="text-center text-[10px] sm:text-xs font-medium text-[rgb(var(--text-muted))] py-1.5 border-r border-b border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))]/50"
          >
            <span className="hidden sm:inline">{day}</span>
            <span className="sm:hidden">{weekDaysMobile[i]}</span>
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 flex-1 auto-rows-fr">
        {calendarDays.map((day) => {
          const dateKey = format(day, "yyyy-MM-dd");
          const dayEvents = eventsByDay[dateKey] || [];

          return (
            <DayCell
              key={dateKey}
              date={day}
              events={dayEvents}
              isCurrentMonth={isSameMonth(day, currentDate)}
              isSelected={isSameDay(day, selectedDate)}
              isTodayDate={isToday(day)}
              onClick={() => onSelectDate(day)}
            />
          );
        })}
      </div>
    </div>
  );
}

// ================================================
// AGENDA VIEW COMPONENT
// ================================================

function AgendaView({ events, selectedDate, onEventClick, onCreateEvent }) {
  // Group events by date
  const groupedEvents = useMemo(() => {
    const groups = {};
    events.forEach((event) => {
      if (event.startAt) {
        const dateKey = format(parseISO(event.startAt), "yyyy-MM-dd");
        if (!groups[dateKey]) groups[dateKey] = [];
        groups[dateKey].push(event);
      }
    });
    // Sort by date
    return Object.entries(groups)
      .sort(([a], [b]) => a.localeCompare(b))
      .filter(([dateKey]) => dateKey >= format(selectedDate, "yyyy-MM-dd"));
  }, [events, selectedDate]);

  const upcomingEvents = groupedEvents.slice(0, 30); // Show next 30 days with events

  return (
    <div className="h-full overflow-auto">
      <div className="p-4 sm:p-6 max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-bold text-[rgb(var(--text-primary))]">
            Próximos eventos
          </h2>
          <p className="text-sm text-[rgb(var(--text-muted))] mt-1">
            Tu agenda a partir de hoy
          </p>
        </div>

        {/* Events list */}
        {upcomingEvents.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-16"
          >
            <div className="w-20 h-20 rounded-2xl bg-[rgb(var(--bg-muted))] flex items-center justify-center mx-auto mb-4">
              <CalendarIcon className="w-10 h-10 text-[rgb(var(--text-muted))]" />
            </div>
            <p className="text-lg text-[rgb(var(--text-secondary))] font-medium">
              Sin eventos próximos
            </p>
            <p className="text-sm text-[rgb(var(--text-muted))] mt-2 max-w-xs mx-auto">
              No tienes eventos programados. ¡Es un buen momento para planificar
              algo!
            </p>
            <button
              onClick={onCreateEvent}
              className="mt-6 inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[rgb(var(--brand-primary))] text-white font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-4 h-4" />
              Crear evento
            </button>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {upcomingEvents.map(([dateKey, dayEvents], groupIndex) => {
              const eventDate = parseISO(dateKey);
              const isTodayDate = isToday(eventDate);

              return (
                <motion.div
                  key={dateKey}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: groupIndex * 0.05 }}
                >
                  {/* Date header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-12 h-12 rounded-xl flex flex-col items-center justify-center ${
                        isTodayDate
                          ? "bg-[rgb(var(--brand-primary))] text-white"
                          : "bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-secondary))]"
                      }`}
                    >
                      <span className="text-[10px] uppercase font-medium opacity-80">
                        {format(eventDate, "MMM", { locale: es })}
                      </span>
                      <span className="text-lg font-bold leading-tight">
                        {format(eventDate, "d")}
                      </span>
                    </div>
                    <div>
                      <p
                        className={`font-medium capitalize ${
                          isTodayDate
                            ? "text-[rgb(var(--brand-primary))]"
                            : "text-[rgb(var(--text-primary))]"
                        }`}
                      >
                        {isTodayDate
                          ? "Hoy"
                          : format(eventDate, "EEEE", { locale: es })}
                      </p>
                      <p className="text-sm text-[rgb(var(--text-muted))]">
                        {dayEvents.length} evento
                        {dayEvents.length !== 1 ? "s" : ""}
                      </p>
                    </div>
                  </div>

                  {/* Events for this day */}
                  <div className="space-y-3 pl-0 sm:pl-15">
                    {dayEvents.map((event) => (
                      <EventCard
                        key={event.$id}
                        event={event}
                        onClick={onEventClick}
                      />
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ================================================
// SELECTED DAY PANEL COMPONENT
// ================================================

function SelectedDayPanel({
  selectedDate,
  events,
  onEventClick,
  onCreateEvent,
}) {
  // Estado para el reloj en tiempo real
  const [currentTime, setCurrentTime] = useState(new Date());

  // Actualizar el reloj cada segundo
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const dayEvents = events.filter((e) => {
    if (!e.startAt) return false;
    return isSameDay(parseISO(e.startAt), selectedDate);
  });

  return (
    <div className="h-full flex flex-col">
      {/* Header con fecha y reloj */}
      <div className="p-4 border-b border-[rgb(var(--border-base))]">
        <div className="flex items-baseline justify-between">
          <div className="text-3xl font-bold text-[rgb(var(--text-primary))]">
            {format(selectedDate, "d")}
          </div>
          {/* Reloj en tiempo real */}
          <div className="text-right">
            <div className="text-2xl font-semibold text-[rgb(var(--text-primary))] tabular-nums">
              {format(currentTime, "HH:mm")}
            </div>
            <div className="text-xs text-[rgb(var(--text-muted))] tabular-nums">
              {format(currentTime, "ss")} seg
            </div>
          </div>
        </div>
        <div className="text-sm text-[rgb(var(--text-secondary))] capitalize mt-1">
          {format(selectedDate, "EEEE, MMMM yyyy", { locale: es })}
        </div>
        {isToday(selectedDate) && (
          <span className="inline-block mt-1 text-xs text-[rgb(var(--brand-primary))] font-medium">
            Hoy
          </span>
        )}
      </div>

      {/* Events */}
      <div className="flex-1 overflow-auto p-4">
        {dayEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--bg-muted))] flex items-center justify-center mb-4">
              <CalendarIcon className="w-8 h-8 text-[rgb(var(--text-muted))]" />
            </div>
            <p className="text-[rgb(var(--text-secondary))] font-medium">
              Sin eventos
            </p>
            <p className="text-sm text-[rgb(var(--text-muted))] mt-1">
              No hay eventos programados
            </p>
            <button
              onClick={onCreateEvent}
              className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))] text-sm font-medium hover:bg-[rgb(var(--brand-primary))]/20 transition-colors"
            >
              <Plus className="w-4 h-4" />
              Crear evento
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {dayEvents.map((event) => (
              <EventCard key={event.$id} event={event} onClick={onEventClick} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ================================================
// VIEW MODE SELECTOR COMPONENT
// ================================================

function ViewModeSelector({ viewMode, setViewMode, isMobile = false }) {
  const modes = [
    { id: VIEW_MODES.DAY, icon: Sun, label: "Día" },
    { id: VIEW_MODES.WEEK, icon: CalendarRange, label: "Semana" },
    { id: VIEW_MODES.MONTH, icon: LayoutGrid, label: "Mes" },
    { id: VIEW_MODES.AGENDA, icon: List, label: "Agenda" },
  ];

  if (isMobile) {
    return (
      <div className="flex items-center bg-[rgb(var(--bg-muted))] rounded-lg p-1 w-full">
        {modes.map(({ id, icon: Icon, label }) => (
          <button
            key={id}
            onClick={() => setViewMode(id)}
            className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 rounded-md text-xs font-medium transition-colors ${
              viewMode === id
                ? "bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] shadow-sm"
                : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            <span className="hidden xs:inline">{label}</span>
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="hidden sm:flex items-center bg-[rgb(var(--bg-muted))] rounded-lg p-1">
      {modes.map(({ id, icon: Icon, label }) => (
        <button
          key={id}
          onClick={() => setViewMode(id)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            viewMode === id
              ? "bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] shadow-sm"
              : "text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-secondary))]"
          }`}
        >
          <Icon className="w-4 h-4" />
          {label}
        </button>
      ))}
    </div>
  );
}

// ================================================
// MAIN CALENDAR PAGE COMPONENT
// ================================================

export function CalendarPage() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [viewMode, setViewMode] = useState(VIEW_MODES.MONTH);
  const [visibleCalendars, setVisibleCalendars] = useState([]);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [miniCalendarCollapsed, setMiniCalendarCollapsed] = useState(false);
  const [rightSidebarCollapsed, setRightSidebarCollapsed] = useState(false);
  const [navigationDirection, setNavigationDirection] = useState(0);
  const [showCreateCalendarModal, setShowCreateCalendarModal] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState(null);
  const [deletingCalendar, setDeletingCalendar] = useState(null);
  const [sharingCalendar, setSharingCalendar] = useState(null);

  // Event modal states
  const [showEventModal, setShowEventModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [viewingEvent, setViewingEvent] = useState(null);
  const [deletingEvent, setDeletingEvent] = useState(null);

  const { activeGroup, calendars = [], profile } = useWorkspace();
  const deleteCalendar = useDeleteCalendar();
  const hasCalendars = calendars.length > 0;
  const groupId = activeGroup?.$id;

  const { data: events = [] } = useMonthEvents(
    groupId,
    currentDate,
    visibleCalendars.length > 0 ? visibleCalendars : undefined
  );

  // Initialize visible calendars
  React.useEffect(() => {
    if (calendars.length > 0 && visibleCalendars.length === 0) {
      setVisibleCalendars(calendars.map((c) => c.$id));
    }
  }, [calendars, visibleCalendars.length]);

  // Filter events by visible calendars
  const filteredEvents = useMemo(() => {
    return events.filter((e) => visibleCalendars.includes(e.calendarId));
  }, [events, visibleCalendars]);

  // Events by day map
  const eventsByDay = useMemo(() => {
    const map = {};
    filteredEvents.forEach((event) => {
      if (event.startAt) {
        const dateKey = format(parseISO(event.startAt), "yyyy-MM-dd");
        if (!map[dateKey]) map[dateKey] = [];
        map[dateKey].push(event);
      }
    });
    return map;
  }, [filteredEvents]);

  // Navigation handlers
  const navigatePrevious = useCallback(() => {
    setNavigationDirection(-1);
    switch (viewMode) {
      case VIEW_MODES.DAY:
        setCurrentDate((d) => addDays(d, -1));
        setSelectedDate((d) => addDays(d, -1));
        break;
      case VIEW_MODES.WEEK:
        setCurrentDate((d) => subWeeks(d, 1));
        setSelectedDate((d) => subWeeks(d, 1));
        break;
      case VIEW_MODES.MONTH:
      case VIEW_MODES.AGENDA:
        setCurrentDate((d) => subMonths(d, 1));
        break;
      default:
        break;
    }
  }, [viewMode]);

  const navigateNext = useCallback(() => {
    setNavigationDirection(1);
    switch (viewMode) {
      case VIEW_MODES.DAY:
        setCurrentDate((d) => addDays(d, 1));
        setSelectedDate((d) => addDays(d, 1));
        break;
      case VIEW_MODES.WEEK:
        setCurrentDate((d) => addWeeks(d, 1));
        setSelectedDate((d) => addWeeks(d, 1));
        break;
      case VIEW_MODES.MONTH:
      case VIEW_MODES.AGENDA:
        setCurrentDate((d) => addMonths(d, 1));
        break;
      default:
        break;
    }
  }, [viewMode]);

  const goToToday = useCallback(() => {
    setNavigationDirection(0);
    setCurrentDate(new Date());
    setSelectedDate(new Date());
  }, []);

  const toggleCalendarVisibility = (calId) => {
    setVisibleCalendars((prev) =>
      prev.includes(calId)
        ? prev.filter((id) => id !== calId)
        : [...prev, calId]
    );
  };

  // Event handlers
  const handleCreateEvent = useCallback(() => {
    setEditingEvent(null);
    setShowEventModal(true);
  }, []);

  const handleEventClick = useCallback((event) => {
    setViewingEvent(event);
  }, []);

  const handleEditEvent = useCallback((event) => {
    setEditingEvent(event);
    setShowEventModal(true);
  }, []);

  const handleDeleteEvent = useCallback((event) => {
    setDeletingEvent(event);
  }, []);

  // Get calendar for an event
  const getCalendarForEvent = useCallback(
    (event) => {
      return calendars.find((c) => c.$id === event?.calendarId);
    },
    [calendars]
  );

  // Get title based on view mode
  const getNavigationTitle = () => {
    switch (viewMode) {
      case VIEW_MODES.DAY:
        return format(selectedDate, "d 'de' MMMM yyyy", { locale: es });
      case VIEW_MODES.WEEK: {
        const weekStart = startOfWeek(selectedDate, { weekStartsOn: 1 });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn: 1 });
        if (isSameMonth(weekStart, weekEnd)) {
          return format(weekStart, "MMMM yyyy", { locale: es });
        }
        return `${format(weekStart, "MMM", { locale: es })} - ${format(
          weekEnd,
          "MMM yyyy",
          { locale: es }
        )}`;
      }
      case VIEW_MODES.MONTH:
      case VIEW_MODES.AGENDA:
        return format(currentDate, "MMMM yyyy", { locale: es });
      default:
        return format(currentDate, "MMMM yyyy", { locale: es });
    }
  };

  return (
    <div className="h-full flex flex-col">
      {/* Top Navbar */}
      <header className="flex items-center justify-between px-3 sm:px-4 h-14 border-b border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] shrink-0 gap-2">
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          {/* Left Sidebar Toggle - Desktop */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex p-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))] transition-colors"
            title={
              sidebarCollapsed ? "Mostrar calendarios" : "Ocultar calendarios"
            }
          >
            {sidebarCollapsed ? (
              <PanelLeft className="w-5 h-5" />
            ) : (
              <PanelLeftClose className="w-5 h-5" />
            )}
          </button>

          {/* Navigation */}
          <div className="flex items-center gap-1">
            <button
              onClick={navigatePrevious}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))] transition-colors"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
            <button
              onClick={navigateNext}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))] transition-colors"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>

          <h1 className="text-sm sm:text-lg font-semibold text-[rgb(var(--text-primary))] capitalize truncate">
            {getNavigationTitle()}
          </h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Today Button - Navigates to current date */}
          <button
            onClick={goToToday}
            className="px-2.5 sm:px-3 py-1.5 text-xs sm:text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] rounded-lg transition-colors border border-[rgb(var(--border-base))] font-medium"
            title="Ir a la fecha actual"
          >
            Hoy
          </button>

          {/* View Toggle - Desktop */}
          <ViewModeSelector viewMode={viewMode} setViewMode={setViewMode} />

          {/* New Event/Calendar Button */}
          <button
            onClick={() => {
              if (!hasCalendars) {
                setShowCreateCalendarModal(true);
              } else {
                handleCreateEvent();
              }
            }}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-[rgb(var(--brand-primary))] text-white text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">
              {hasCalendars ? "Nuevo" : "Crear Calendario"}
            </span>
          </button>
        </div>
      </header>

      {/* Mobile View Selector */}
      <div className="sm:hidden px-3 py-2 border-b border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))]">
        <ViewModeSelector
          viewMode={viewMode}
          setViewMode={setViewMode}
          isMobile
        />
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex min-h-0 overflow-hidden">
        {/* Left Sidebar - Desktop Only */}
        <AnimatePresence initial={false}>
          {!sidebarCollapsed && (
            <motion.aside
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: 260, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="hidden lg:flex flex-col border-r border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] overflow-hidden"
            >
              <div className="flex flex-col h-full w-[260px]">
                {/* Mini Calendar Section */}
                <div className="border-b border-[rgb(var(--border-base))]">
                  <button
                    onClick={() =>
                      setMiniCalendarCollapsed(!miniCalendarCollapsed)
                    }
                    className="w-full flex items-center justify-between px-4 py-3 hover:bg-[rgb(var(--bg-hover))] transition-colors"
                  >
                    <span className="text-sm font-medium text-[rgb(var(--text-primary))] capitalize">
                      {format(currentDate, "MMMM yyyy", { locale: es })}
                    </span>
                    {miniCalendarCollapsed ? (
                      <ChevronDown className="w-4 h-4 text-[rgb(var(--text-muted))]" />
                    ) : (
                      <ChevronUp className="w-4 h-4 text-[rgb(var(--text-muted))]" />
                    )}
                  </button>

                  <AnimatePresence initial={false}>
                    {!miniCalendarCollapsed && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4">
                          <MiniCalendar
                            currentDate={currentDate}
                            selectedDate={selectedDate}
                            onSelectDate={(d) => {
                              setSelectedDate(d);
                              setCurrentDate(d);
                            }}
                          />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Calendars List */}
                <div className="flex-1 overflow-auto">
                  <div className="flex items-center justify-between px-4 py-3">
                    <span className="text-sm font-medium text-[rgb(var(--text-primary))]">
                      Calendarios
                    </span>
                    <button
                      onClick={() => setShowCreateCalendarModal(true)}
                      className="text-xs text-[rgb(var(--brand-primary))] hover:underline"
                    >
                      + Nuevo
                    </button>
                  </div>
                  <div className="px-2 pb-4">
                    <CalendarsList
                      calendars={calendars}
                      visibleCalendars={visibleCalendars}
                      onToggleVisibility={toggleCalendarVisibility}
                      onCreateCalendar={() => setShowCreateCalendarModal(true)}
                      onEditCalendar={(cal) => setEditingCalendar(cal)}
                      onShareCalendar={(cal) => setSharingCalendar(cal)}
                      onDeleteCalendar={(cal) => setDeletingCalendar(cal)}
                      currentProfileId={profile?.$id}
                    />
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[rgb(var(--bg-base))] overflow-hidden">
          {!hasCalendars ? (
            <NoCalendarsPrompt
              onCreateCalendar={() => setShowCreateCalendarModal(true)}
            />
          ) : (
            <AnimatePresence mode="wait" custom={navigationDirection}>
              <motion.div
                key={viewMode + currentDate.toISOString()}
                custom={navigationDirection}
                variants={viewTransitionVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="flex-1 overflow-hidden"
              >
                {viewMode === VIEW_MODES.DAY && (
                  <DayView
                    selectedDate={selectedDate}
                    events={filteredEvents}
                    onEventClick={handleEventClick}
                  />
                )}

                {viewMode === VIEW_MODES.WEEK && (
                  <WeekView
                    selectedDate={selectedDate}
                    events={filteredEvents}
                    onSelectDate={(d) => {
                      setSelectedDate(d);
                      setCurrentDate(d);
                    }}
                    onEventClick={handleEventClick}
                  />
                )}

                {viewMode === VIEW_MODES.MONTH && (
                  <MonthView
                    currentDate={currentDate}
                    selectedDate={selectedDate}
                    eventsByDay={eventsByDay}
                    onSelectDate={setSelectedDate}
                  />
                )}

                {viewMode === VIEW_MODES.AGENDA && (
                  <AgendaView
                    events={filteredEvents}
                    selectedDate={selectedDate}
                    onEventClick={handleEventClick}
                    onCreateEvent={handleCreateEvent}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          )}
        </div>

        {/* Right Sidebar - Selected Day (Desktop, only in month view) */}
        {viewMode === VIEW_MODES.MONTH && hasCalendars && (
          <div className="hidden xl:flex shrink-0">
            <AnimatePresence initial={false} mode="wait">
              {rightSidebarCollapsed ? (
                <motion.button
                  key="collapsed"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 40, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  onClick={() => setRightSidebarCollapsed(false)}
                  className="h-full border-l border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] flex flex-col items-center pt-4 hover:bg-[rgb(var(--bg-hover))] transition-colors overflow-hidden"
                  title="Expandir panel"
                >
                  <PanelRight className="w-5 h-5 text-[rgb(var(--text-muted))] shrink-0" />
                  <span
                    className="mt-3 text-xs text-[rgb(var(--text-muted))] shrink-0"
                    style={{ writingMode: "vertical-rl" }}
                  >
                    {format(selectedDate, "d MMM", { locale: es })}
                  </span>
                </motion.button>
              ) : (
                <motion.aside
                  key="expanded"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 280, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  className="border-l border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] flex flex-col overflow-hidden"
                >
                  <div className="w-[280px] flex flex-col h-full">
                    <div className="flex justify-end p-2 border-b border-[rgb(var(--border-base))]">
                      <button
                        onClick={() => setRightSidebarCollapsed(true)}
                        className="p-1.5 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))] transition-colors"
                        title="Colapsar panel"
                      >
                        <PanelRightClose className="w-4 h-4" />
                      </button>
                    </div>
                    <SelectedDayPanel
                      selectedDate={selectedDate}
                      events={filteredEvents}
                      onEventClick={handleEventClick}
                      onCreateEvent={handleCreateEvent}
                    />
                  </div>
                </motion.aside>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Create Calendar Modal */}
      <CreateCalendarModal
        isOpen={showCreateCalendarModal}
        onClose={() => setShowCreateCalendarModal(false)}
        isFirstCalendar={!hasCalendars}
        onSuccess={(newCalendar) => {
          // Auto-select the new calendar
          if (newCalendar?.$id) {
            setVisibleCalendars((prev) => [...prev, newCalendar.$id]);
          }
        }}
      />

      {/* Edit Calendar Modal */}
      <CreateCalendarModal
        isOpen={!!editingCalendar}
        onClose={() => setEditingCalendar(null)}
        calendar={editingCalendar}
        isEditing={true}
      />

      {/* Delete Calendar Confirmation */}
      <AnimatePresence>
        {deletingCalendar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() =>
                !deleteCalendar.isPending && setDeletingCalendar(null)
              }
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[rgb(var(--bg-elevated))] rounded-2xl shadow-xl border border-[rgb(var(--border-base))] p-6 max-w-sm w-full"
            >
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[rgb(var(--error))]/10 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-[rgb(var(--error))]" />
                </div>
                <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">
                  Eliminar calendario
                </h3>
                <p className="text-sm text-[rgb(var(--text-muted))] mb-6">
                  ¿Estás seguro de que deseas eliminar{" "}
                  <span className="font-medium text-[rgb(var(--text-secondary))]">
                    "{deletingCalendar.name}"
                  </span>
                  ? Esta acción eliminará también todos los eventos asociados.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeletingCalendar(null)}
                    disabled={deleteCalendar.isPending}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-[rgb(var(--text-secondary))] bg-[rgb(var(--bg-muted))] hover:bg-[rgb(var(--bg-hover))] transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      deleteCalendar.mutate(deletingCalendar.$id, {
                        onSuccess: () => {
                          // Remover de calendarios visibles
                          setVisibleCalendars((prev) =>
                            prev.filter((id) => id !== deletingCalendar.$id)
                          );
                          setDeletingCalendar(null);
                        },
                      });
                    }}
                    disabled={deleteCalendar.isPending}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[rgb(var(--error))] hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {deleteCalendar.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      "Eliminar"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Share Calendar Modal - TODO */}
      <AnimatePresence>
        {sharingCalendar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() => setSharingCalendar(null)}
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[rgb(var(--bg-elevated))] rounded-2xl shadow-xl border border-[rgb(var(--border-base))] p-6 max-w-md w-full"
            >
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center">
                  <Share2 className="w-6 h-6 text-[rgb(var(--brand-primary))]" />
                </div>
                <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">
                  Compartir calendario
                </h3>
                <p className="text-sm text-[rgb(var(--text-muted))] mb-6">
                  Compartir{" "}
                  <span className="font-medium text-[rgb(var(--text-secondary))]">
                    "{sharingCalendar.name}"
                  </span>{" "}
                  con otros miembros del grupo.
                </p>
                <p className="text-xs text-[rgb(var(--text-muted))] bg-[rgb(var(--bg-muted))] rounded-lg p-3">
                  🚧 Esta funcionalidad estará disponible próximamente
                </p>
                <button
                  onClick={() => setSharingCalendar(null)}
                  className="mt-6 w-full px-4 py-2.5 rounded-xl text-sm font-medium text-[rgb(var(--text-secondary))] bg-[rgb(var(--bg-muted))] hover:bg-[rgb(var(--bg-hover))] transition-colors"
                >
                  Cerrar
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Event Modals */}
      <EventModal
        isOpen={showEventModal}
        onClose={() => {
          setShowEventModal(false);
          setEditingEvent(null);
        }}
        event={editingEvent}
        isEditing={!!editingEvent}
        defaultDate={selectedDate}
        onSuccess={() => {
          setShowEventModal(false);
          setEditingEvent(null);
        }}
      />

      <EventDetailsModal
        isOpen={!!viewingEvent}
        onClose={() => setViewingEvent(null)}
        event={viewingEvent}
        calendar={getCalendarForEvent(viewingEvent)}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
      />

      <DeleteEventModal
        isOpen={!!deletingEvent}
        onClose={() => setDeletingEvent(null)}
        event={deletingEvent}
        onSuccess={() => {
          setDeletingEvent(null);
          setViewingEvent(null);
        }}
      />
    </div>
  );
}
