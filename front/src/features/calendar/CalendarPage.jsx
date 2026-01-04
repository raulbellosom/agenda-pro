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
  Globe,
} from "lucide-react";
import { NoCalendarsPrompt, EmptyCalendarsList } from "./NoCalendarsPrompt";
import { CreateCalendarModal } from "./CreateCalendarModal";
import { NoGroupsPrompt } from "../groups/NoGroupsPrompt";
import { GroupModal } from "../groups/GroupModal";
import { EventModal } from "./EventModal";
import { EventDetailsModal } from "./EventDetailsModal";
import { DeleteEventModal } from "./DeleteEventModal";
import { VerticalMonthScroller } from "./VerticalMonthScroller";
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
import { formatInTimeZone } from "date-fns-tz";
import { useMonthEvents } from "../../lib/hooks/useEvents";
import { useDeleteCalendar } from "../../lib/hooks/useCalendars";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import {
  useUserSettings,
  SETTINGS_OPTIONS,
  useDuplicateEvent,
  useLongPress,
  useCalendarSwipe,
  useSwipeNavigation,
} from "../../lib/hooks";
import { ContextMenu, MENU_ITEMS } from "./ContextMenu";
import { MoveEventModal } from "./MoveEventModal";
import {
  formatDate,
  formatTime,
  formatTimeRange,
  getWeekDayNames,
} from "../../lib/utils/dateTimeFormat";

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
    x: direction > 0 ? "100%" : direction < 0 ? "-100%" : 0,
    opacity: direction === 0 ? 1 : 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction) => ({
    x: direction < 0 ? "100%" : direction > 0 ? "-100%" : 0,
    opacity: direction === 0 ? 1 : 0,
  }),
};

// ================================================
// DATE PICKER COMPONENT (for Day View)
// ================================================

function DatePicker({
  selectedDate,
  onDateChange,
  isOpen,
  onClose,
  weekStartsOn = 1,
}) {
  const [currentMonth, setCurrentMonth] = useState(
    startOfMonth(selectedDate || new Date())
  );

  useEffect(() => {
    if (isOpen && selectedDate) {
      setCurrentMonth(startOfMonth(selectedDate));
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });

  const days = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = getWeekDayNames(weekStartsOn, "short");

  const handleDateClick = (date) => {
    onDateChange(date);
    onClose();
  };

  const goToPreviousMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const goToNextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-[rgb(var(--bg-elevated))] rounded-2xl shadow-xl border border-[rgb(var(--border-base))] p-6 w-full max-w-sm"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={goToPreviousMonth}
              className="p-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))] transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] capitalize">
              {format(currentMonth, "MMMM yyyy", { locale: es })}
            </h3>
            <button
              onClick={goToNextMonth}
              className="p-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))] transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>

          {/* Calendar Grid */}
          <div className="select-none">
            {/* Week days */}
            <div className="grid grid-cols-7 gap-1 mb-2">
              {weekDays.map((day, i) => (
                <div
                  key={i}
                  className="text-center text-xs font-medium text-[rgb(var(--text-muted))] py-1"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Days */}
            <div className="grid grid-cols-7 gap-1">
              {days.map((day, i) => {
                const isCurrentMonth = isSameMonth(day, currentMonth);
                const isSelectedDay =
                  selectedDate && isSameDay(day, selectedDate);
                const isTodayDate = isToday(day);

                return (
                  <button
                    key={i}
                    onClick={() => handleDateClick(day)}
                    className={`
                      aspect-square rounded-lg text-sm font-medium transition-colors
                      ${
                        !isCurrentMonth
                          ? "text-[rgb(var(--text-muted))]/50"
                          : ""
                      }
                      ${
                        isSelectedDay
                          ? "bg-[rgb(var(--brand-primary))] text-white"
                          : isTodayDate
                          ? "bg-[rgb(var(--brand-primary))]/20 text-[rgb(var(--brand-primary))]"
                          : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))]"
                      }
                    `}
                  >
                    {format(day, "d")}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Today button */}
          <button
            onClick={() => handleDateClick(new Date())}
            className="w-full mt-4 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[rgb(var(--brand-primary))] hover:opacity-90 transition-opacity"
          >
            Hoy
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ================================================
// MONTH YEAR PICKER COMPONENT
// ================================================

function MonthYearPicker({ selectedDate, onDateChange, isOpen, onClose }) {
  const [currentYear, setCurrentYear] = useState(
    selectedDate ? selectedDate.getFullYear() : new Date().getFullYear()
  );

  useEffect(() => {
    if (isOpen && selectedDate) {
      setCurrentYear(selectedDate.getFullYear());
    }
  }, [isOpen, selectedDate]);

  if (!isOpen) return null;

  // Generate array of 11 years (5 before, current, 5 after)
  const years = Array.from({ length: 11 }, (_, i) => currentYear - 5 + i);

  const months = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
  ];

  const handleYearClick = (year) => {
    setCurrentYear(year);
  };

  const handleMonthClick = (monthIndex) => {
    const newDate = new Date(currentYear, monthIndex, 1);
    onDateChange(newDate);
    onClose();
  };

  const selectedYear = selectedDate ? selectedDate.getFullYear() : null;
  const selectedMonth = selectedDate ? selectedDate.getMonth() : null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-[rgb(var(--bg-elevated))] rounded-2xl shadow-xl border border-[rgb(var(--border-base))] p-6 w-full max-w-sm"
        >
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] text-center">
              Seleccionar Mes y Año
            </h3>
          </div>

          {/* Year Grid */}
          <div className="mb-6">
            <div className="text-sm font-medium text-[rgb(var(--text-muted))] mb-2">
              Año
            </div>
            <div className="grid grid-cols-4 gap-2">
              {years.map((year) => (
                <button
                  key={year}
                  onClick={() => handleYearClick(year)}
                  className={`
                    px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${
                      year === currentYear
                        ? "bg-[rgb(var(--brand-primary))] text-white"
                        : year === selectedYear
                        ? "bg-[rgb(var(--brand-primary))]/20 text-[rgb(var(--brand-primary))]"
                        : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))]"
                    }
                  `}
                >
                  {year}
                </button>
              ))}
            </div>
          </div>

          {/* Month Grid */}
          <div>
            <div className="text-sm font-medium text-[rgb(var(--text-muted))] mb-2">
              Mes
            </div>
            <div className="grid grid-cols-3 gap-2">
              {months.map((month, index) => {
                const isSelected =
                  currentYear === selectedYear && index === selectedMonth;
                const isCurrent =
                  currentYear === new Date().getFullYear() &&
                  index === new Date().getMonth();

                return (
                  <button
                    key={month}
                    onClick={() => handleMonthClick(index)}
                    className={`
                      px-3 py-2 rounded-lg text-sm font-medium transition-colors
                      ${
                        isSelected
                          ? "bg-[rgb(var(--brand-primary))] text-white"
                          : isCurrent
                          ? "bg-[rgb(var(--brand-primary))]/20 text-[rgb(var(--brand-primary))]"
                          : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))]"
                      }
                    `}
                  >
                    {month.substring(0, 3)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Today button */}
          <button
            onClick={() => {
              const today = new Date();
              setCurrentYear(today.getFullYear());
              handleMonthClick(today.getMonth());
            }}
            className="w-full mt-4 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[rgb(var(--brand-primary))] hover:opacity-90 transition-opacity"
          >
            Hoy
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

// ================================================
// MINI CALENDAR COMPONENT
// ================================================

function MiniCalendar({
  currentDate,
  selectedDate,
  onSelectDate,
  weekStartsOn = 1,
}) {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });

  const days = [];
  let day = calendarStart;
  while (day <= calendarEnd) {
    days.push(day);
    day = addDays(day, 1);
  }

  const weekDays = getWeekDayNames(weekStartsOn, "short");

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
        className={`flex items-center gap-2 px-2 py-1.5 sm:py-2 rounded-lg transition-all ${
          isVisible ? "" : "opacity-50"
        } sm:hover:bg-[rgb(var(--bg-hover))] active:bg-[rgb(var(--bg-hover))]`}
      >
        {/* Checkbox para visibilidad - área táctil ampliada */}
        <button
          onClick={onToggle}
          className="shrink-0 p-1.5 -m-1.5 touch-manipulation"
          aria-label={
            isVisible ? `Ocultar ${calendar.name}` : `Mostrar ${calendar.name}`
          }
        >
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

        {/* Menú de opciones - visible siempre en móvil, en hover en desktop */}
        <div ref={menuRef} className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowMenu(!showMenu);
            }}
            className={`p-1.5 -m-0.5 rounded-md transition-all touch-manipulation ${
              showMenu
                ? "bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-secondary))]"
                : "sm:opacity-0 sm:group-hover:opacity-100 text-[rgb(var(--text-muted))] active:bg-[rgb(var(--bg-hover))] sm:hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-secondary))]"
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
  needsFirstGroup = false,
}) {
  if (!calendars || calendars.length === 0) {
    return (
      <EmptyCalendarsList
        onCreateCalendar={onCreateCalendar}
        needsFirstGroup={needsFirstGroup}
      />
    );
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

function EventCard({
  event,
  compact = false,
  onClick,
  onLongPress,
  timeFormat = "24h",
}) {
  const colors = getCalendarColor(event.calendar?.color || "violet");
  const startTime = event.startAt
    ? formatTime(parseISO(event.startAt), timeFormat)
    : "";
  const endTime = event.endAt
    ? formatTime(parseISO(event.endAt), timeFormat)
    : "";

  // Solo usamos useLongPress para detectar long press en móvil
  const longPressHandlers = useLongPress(
    (e) => {
      e?.stopPropagation?.();
      // Extraer coordenadas del evento
      const x = e?.touches?.[0]?.clientX || e?.clientX || window.innerWidth / 2;
      const y =
        e?.touches?.[0]?.clientY || e?.clientY || window.innerHeight / 2;
      onLongPress?.(event, { x, y });
    },
    null, // No manejamos onClick aquí
    { delay: 500 }
  );

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Extraer coordenadas del evento de contexto
    const x = e.clientX || window.innerWidth / 2;
    const y = e.clientY || window.innerHeight / 2;
    onLongPress?.(event, { x, y });
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(event);
  };

  if (compact) {
    return (
      <div
        onMouseDown={longPressHandlers.onMouseDown}
        onMouseUp={longPressHandlers.onMouseUp}
        onMouseLeave={longPressHandlers.onMouseLeave}
        onTouchStart={longPressHandlers.onTouchStart}
        onTouchEnd={longPressHandlers.onTouchEnd}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        className={`px-2 py-1 rounded-md text-xs truncate ${colors.bg} ${colors.text} font-medium cursor-pointer hover:ring-2 hover:ring-offset-1 hover:ring-[rgb(var(--brand-primary))]/30 transition-all`}
      >
        {startTime && <span className="opacity-75 mr-1">{startTime}</span>}
        {event.title}
      </div>
    );
  }

  return (
    <motion.div
      onMouseDown={longPressHandlers.onMouseDown}
      onMouseUp={longPressHandlers.onMouseUp}
      onMouseLeave={longPressHandlers.onMouseLeave}
      onTouchStart={longPressHandlers.onTouchStart}
      onTouchEnd={longPressHandlers.onTouchEnd}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
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
            // Extraer coordenadas del clic para posicionar el menú contextual
            const x = e.clientX || window.innerWidth / 2;
            const y = e.clientY || window.innerHeight / 2;
            onLongPress?.(event, { x, y });
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

// Mini event component for day cells
function DayCellEvent({ event, onEventClick, onEventLongPress }) {
  const colors = getCalendarColor(event.calendar?.color || "violet");

  // Solo usamos useLongPress para detectar long press en móvil
  const longPressHandlers = useLongPress(
    (e) => {
      e?.stopPropagation?.();
      // Extraer coordenadas del evento
      const x = e?.touches?.[0]?.clientX || e?.clientX || window.innerWidth / 2;
      const y =
        e?.touches?.[0]?.clientY || e?.clientY || window.innerHeight / 2;
      onEventLongPress?.(event, { x, y });
    },
    null, // No manejamos onClick aquí
    { delay: 500 }
  );

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Extraer coordenadas del evento de contexto
    const x = e.clientX || window.innerWidth / 2;
    const y = e.clientY || window.innerHeight / 2;
    onEventLongPress?.(event, { x, y });
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onEventClick?.(event);
  };

  return (
    <div
      onMouseDown={longPressHandlers.onMouseDown}
      onMouseUp={longPressHandlers.onMouseUp}
      onMouseLeave={longPressHandlers.onMouseLeave}
      onTouchStart={longPressHandlers.onTouchStart}
      onTouchEnd={longPressHandlers.onTouchEnd}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className={`text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded truncate ${colors.bg} ${colors.text} font-medium cursor-pointer hover:ring-2 hover:ring-inset hover:ring-[rgb(var(--brand-primary))]/50 transition-all`}
    >
      {event.title}
    </div>
  );
}

function DayCell({
  date,
  events,
  isCurrentMonth,
  isSelected,
  isTodayDate,
  onClick,
  onLongPress,
  onContextMenu,
  onEventClick,
  onEventLongPress,
}) {
  const maxVisible = 3;
  const visibleEvents = events.slice(0, maxVisible);
  const remaining = events.length - maxVisible;

  const longPressHandlers = useLongPress(
    () => onLongPress?.(date),
    () => onClick(),
    { delay: 500 }
  );

  const handleDoubleClick = (e) => {
    e.stopPropagation();
    onLongPress?.(date);
  };

  return (
    <motion.button
      {...longPressHandlers}
      onDoubleClick={handleDoubleClick}
      onContextMenu={(e) => {
        e.preventDefault();
        onContextMenu?.(e, date);
      }}
      whileTap={{ scale: 0.98 }}
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
      <div className="flex-1 space-y-0.5 sm:space-y-1 overflow-y-auto overflow-x-visible">
        {visibleEvents.map((event, i) => (
          <DayCellEvent
            key={event.$id || i}
            event={event}
            onEventClick={onEventClick}
            onEventLongPress={onEventLongPress}
          />
        ))}
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

function TimeGridEvent({ event, dayStart, onClick, onLongPress }) {
  const colors = getCalendarColor(event.calendar?.color || "violet");
  const eventStart = parseISO(event.startAt);
  const eventEnd = event.endAt ? parseISO(event.endAt) : addDays(eventStart, 0);

  const startMinutes = differenceInMinutes(eventStart, dayStart);
  const duration = differenceInMinutes(eventEnd, eventStart) || 60;

  const top = (startMinutes / 60) * 60; // 60px per hour
  const height = Math.max((duration / 60) * 60, 24); // min height 24px

  // Solo usamos useLongPress para detectar long press en móvil
  const longPressHandlers = useLongPress(
    (e) => {
      e?.stopPropagation?.();
      // Extraer coordenadas del evento
      const x = e?.touches?.[0]?.clientX || e?.clientX || window.innerWidth / 2;
      const y =
        e?.touches?.[0]?.clientY || e?.clientY || window.innerHeight / 2;
      onLongPress?.(event, { x, y });
    },
    null, // No manejamos onClick aquí
    { delay: 500 }
  );

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    // Extraer coordenadas del evento de contexto
    const x = e.clientX || window.innerWidth / 2;
    const y = e.clientY || window.innerHeight / 2;
    onLongPress?.(event, { x, y });
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(event);
  };

  return (
    <motion.div
      onMouseDown={longPressHandlers.onMouseDown}
      onMouseUp={longPressHandlers.onMouseUp}
      onMouseLeave={longPressHandlers.onMouseLeave}
      onTouchStart={longPressHandlers.onTouchStart}
      onTouchEnd={longPressHandlers.onTouchEnd}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
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

function DayView({
  selectedDate,
  events,
  onEventClick,
  onEventLongPress,
  onDateClick,
  onCreateEventAtTime,
}) {
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
      <button
        onClick={onDateClick}
        className="flex items-center justify-center py-4 border-b border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] hover:bg-[rgb(var(--bg-hover))] transition-colors active:scale-95"
      >
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
      </button>

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
          {HOURS.map((hour) => {
            const hourLongPress = useLongPress(
              () => {
                // Long press para crear evento en esta hora (móvil)
                onCreateEventAtTime?.(selectedDate, hour);
              },
              null,
              { delay: 500 }
            );

            return (
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
                <div
                  className="flex-1 relative hover:bg-[rgb(var(--bg-hover))]/50 transition-colors cursor-pointer"
                  onDoubleClick={() => onDateClick()}
                  {...hourLongPress}
                />
              </div>
            );
          })}

          {/* Events */}
          <div className="absolute top-0 left-16 sm:left-20 right-0 bottom-0">
            {dayEvents.map((event) => (
              <TimeGridEvent
                key={event.$id}
                event={event}
                dayStart={dayStart}
                onClick={onEventClick}
                onLongPress={onEventLongPress}
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

function WeekView({
  selectedDate,
  events,
  onSelectDate,
  onEventClick,
  onEventLongPress,
  onCreateEventAtTime,
  weekStartsOn = 1,
}) {
  const scrollRef = useRef(null);
  const weekStart = startOfWeek(selectedDate, { weekStartsOn });
  const weekDays = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  // Scroll to current time on mount
  useEffect(() => {
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

  // Formateo de días para móvil y desktop
  const formatDayName = (day) => {
    return format(day, "EEEEE", { locale: es }); // Una sola letra: L, M, M, J, V, S, D
  };

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Week Header - Sticky - Siempre 7 columnas */}
      <div className="flex border-b border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] shrink-0">
        {/* Time column header placeholder */}
        <div className="w-8 sm:w-12 md:w-14 shrink-0 bg-[rgb(var(--bg-surface))] border-r border-[rgb(var(--border-base))]" />

        {/* Week days header - Grid de 7 columnas siempre */}
        <div className="flex-1 grid grid-cols-7 relative">
          {weekDays.map((day, index) => (
            <button
              key={day.toISOString()}
              onClick={() => onSelectDate(day)}
              className={`py-1.5 sm:py-2 md:py-3 text-center transition-colors relative ${
                isSameDay(day, selectedDate)
                  ? "bg-[rgb(var(--brand-primary))]/10"
                  : "hover:bg-[rgb(var(--bg-hover))]"
              } ${
                index > 0
                  ? 'before:content-[""] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-[rgb(var(--border-base))]'
                  : ""
              }`}
            >
              <div className="text-[9px] sm:text-[10px] md:text-xs text-[rgb(var(--text-muted))] uppercase tracking-wide">
                <span className="md:hidden">{formatDayName(day)}</span>
                <span className="hidden md:inline">
                  {format(day, "EEE", { locale: es })}
                </span>
              </div>
              <div
                className={`text-xs sm:text-sm md:text-lg font-semibold mt-0.5 ${
                  isToday(day)
                    ? "w-5 h-5 sm:w-6 sm:h-6 md:w-8 md:h-8 rounded-full bg-[rgb(var(--brand-primary))] text-white flex items-center justify-center mx-auto text-[10px] sm:text-xs md:text-base"
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
      </div>

      {/* Time Grid - Solo scroll vertical */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto overflow-x-hidden">
        <div className="flex h-[1440px]">
          {" "}
          {/* 24 horas * 60px */}
          {/* Time column - Fixed/Sticky */}
          <div className="w-8 sm:w-12 md:w-14 shrink-0 sticky left-0 z-10 bg-[rgb(var(--bg-surface))] border-r border-[rgb(var(--border-base))]">
            <div className="relative h-full">
              {HOURS.map((hour) => (
                <div
                  key={hour}
                  className="absolute left-0 right-0 border-t border-[rgb(var(--border-base))] flex items-start justify-end pr-0.5 sm:pr-1"
                  style={{ top: `${hour * 60}px`, height: "60px" }}
                >
                  <span className="text-[8px] sm:text-[10px] md:text-xs text-[rgb(var(--text-muted))] -translate-y-1 sm:-translate-y-1.5">
                    {format(setHours(new Date(), hour), "HH:mm")}
                  </span>
                </div>
              ))}
            </div>
          </div>
          {/* Day columns - Grid de 7 columnas siempre */}
          <div className="flex-1 grid grid-cols-7 h-full relative">
            {/* Current time indicator */}
            {weekDays.some((d) => isToday(d)) && (
              <div
                className="absolute z-20 pointer-events-none left-0 right-0"
                style={{
                  top: `${
                    new Date().getHours() * 60 + new Date().getMinutes()
                  }px`,
                }}
              >
                <div className="flex items-center">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-[rgb(var(--error))] -ml-0.5" />
                  <div className="flex-1 h-0.5 bg-[rgb(var(--error))]" />
                </div>
              </div>
            )}

            {/* Hour grid lines background */}
            {HOURS.map((hour) => (
              <div
                key={`hour-line-${hour}`}
                className="absolute left-0 right-0 border-t border-[rgb(var(--border-base))]"
                style={{ top: `${hour * 60}px` }}
              />
            ))}

            {/* Day columns with events */}
            {weekDays.map((day, index) => {
              const dayEvents = getEventsForDay(day);
              const dayStart = startOfDay(day);
              const isSelected = isSameDay(day, selectedDate);
              const isTodayDate = isToday(day);

              return (
                <div
                  key={day.toISOString()}
                  className={`relative ${
                    isSelected ? "bg-[rgb(var(--brand-primary))]/5" : ""
                  } ${
                    isTodayDate && !isSelected
                      ? "bg-[rgb(var(--brand-primary))]/[0.02]"
                      : ""
                  } ${
                    index > 0
                      ? 'before:content-[""] before:absolute before:left-0 before:top-0 before:bottom-0 before:w-px before:bg-[rgb(var(--border-base))] before:z-10'
                      : ""
                  }`}
                  onClick={() => onSelectDate(day)}
                >
                  {/* Hour cells for interaction */}
                  {HOURS.map((hour) => {
                    const cellLongPress = useLongPress(
                      () => {
                        // Long press para crear evento en este día y hora (móvil)
                        onCreateEventAtTime?.(day, hour);
                      },
                      null,
                      { delay: 500 }
                    );

                    return (
                      <div
                        key={`${day.toISOString()}-${hour}`}
                        className="absolute left-0 right-0 hover:bg-[rgb(var(--bg-hover))]/50 transition-colors cursor-pointer"
                        style={{ top: `${hour * 60}px`, height: "60px" }}
                        onDoubleClick={() => onCreateEventAtTime?.(day, hour)}
                        {...cellLongPress}
                      />
                    );
                  })}

                  {/* Events */}
                  {dayEvents.map((event) => (
                    <TimeGridEventCompact
                      key={event.$id}
                      event={event}
                      dayStart={dayStart}
                      onClick={onEventClick}
                      onLongPress={onEventLongPress}
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
// COMPACT TIME GRID EVENT (for week view)
// ================================================

function TimeGridEventCompact({ event, dayStart, onClick, onLongPress }) {
  const colors = getCalendarColor(event.calendar?.color);

  const startTime = parseISO(event.startAt);
  const endTime = event.endAt ? parseISO(event.endAt) : addDays(startTime, 0);

  const minutesFromStart = differenceInMinutes(startTime, dayStart);
  const duration = event.endAt
    ? Math.max(differenceInMinutes(endTime, startTime), 30)
    : 60;

  const top = Math.max(0, minutesFromStart);
  const height = Math.min(duration, 1440 - top);

  const longPressHandlers = useLongPress(
    (e, position) => {
      if (onLongPress) {
        onLongPress(
          event,
          position || { x: e.clientX || 0, y: e.clientY || 0 }
        );
      }
    },
    () => onClick?.(event),
    { delay: 400, moveTolerance: 8 }
  );

  // Formatear hora de inicio
  const timeStr = format(startTime, "HH:mm");

  return (
    <div
      {...longPressHandlers}
      className={`absolute left-0.5 right-0.5 sm:left-1 sm:right-1 rounded ${colors.bg} ${colors.border} border-l-2 overflow-hidden cursor-pointer hover:ring-1 hover:ring-[rgb(var(--brand-primary))]/50 transition-all z-10`}
      style={{
        top: `${top}px`,
        height: `${height}px`,
        minHeight: "20px",
      }}
    >
      <div className="p-0.5 sm:p-1 h-full flex flex-col">
        <div
          className={`text-[8px] sm:text-[10px] ${colors.text} font-medium truncate leading-tight`}
        >
          {timeStr}
        </div>
        <div
          className={`text-[9px] sm:text-xs font-medium ${colors.text} truncate leading-tight`}
        >
          {event.title}
        </div>
      </div>
    </div>
  );
}

// ================================================
// MONTH VIEW COMPONENT
// ================================================

// Month Event Card Component (for month view)
function MonthEventCard({ event, onClick, onLongPress }) {
  const colors = getCalendarColor(event.calendar?.color || "violet");

  const longPressHandlers = useLongPress(
    (e) => {
      e?.stopPropagation?.();
      const x = e?.touches?.[0]?.clientX || e?.clientX || window.innerWidth / 2;
      const y =
        e?.touches?.[0]?.clientY || e?.clientY || window.innerHeight / 2;
      onLongPress?.(event, { x, y });
    },
    null,
    { delay: 500 }
  );

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const x = e.clientX || window.innerWidth / 2;
    const y = e.clientY || window.innerHeight / 2;
    onLongPress?.(event, { x, y });
  };

  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(e);
  };

  return (
    <div
      onMouseDown={longPressHandlers.onMouseDown}
      onMouseUp={longPressHandlers.onMouseUp}
      onMouseLeave={longPressHandlers.onMouseLeave}
      onTouchStart={longPressHandlers.onTouchStart}
      onTouchEnd={longPressHandlers.onTouchEnd}
      onClick={handleClick}
      onContextMenu={handleContextMenu}
      className={`text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded truncate ${colors.bg} ${colors.text} font-medium cursor-pointer hover:ring-2 hover:ring-inset hover:ring-[rgb(var(--brand-primary))]/50 transition-all`}
    >
      {event.title}
    </div>
  );
}

// ================================================
// SINGLE MONTH VIEW WITH SWIPE (Mobile)
// ================================================

function SingleMonthSwipeView({
  currentDate,
  selectedDate,
  onSelectDate,
  eventsByDay,
  onEventClick,
  onEventLongPress,
  onDayLongPress,
  onDayContextMenu,
  onMonthChange,
  weekStartsOn = 1,
}) {
  const containerRef = useRef(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const [animateDirection, setAnimateDirection] = useState(0); // -1: prev, 0: none, 1: next

  // Configurar gestos de swipe vertical
  const {
    bind: swipeBindings,
    isDragging,
    dragOffset,
  } = useSwipeNavigation({
    onSwipeUp: () => {
      // Primero animar, luego cambiar el mes
      setAnimateDirection(1);
      setIsAnimating(true);
    },
    onSwipeDown: () => {
      setAnimateDirection(-1);
      setIsAnimating(true);
    },
    horizontal: false,
    vertical: true,
    threshold: 50,
    velocityThreshold: 0.3,
  });

  // Obtener los handlers del swipe (incluye el ref)
  const swipeHandlers = swipeBindings();

  // Combinar refs - el swipeHandlers.ref es un useRef object
  const setRefs = useCallback(
    (el) => {
      containerRef.current = el;
      // Asignar al ref del swipe hook
      if (swipeHandlers.ref) {
        swipeHandlers.ref.current = el;
      }
    },
    [swipeHandlers.ref]
  );

  // Cuando la animación termina, cambiar el mes
  useEffect(() => {
    if (isAnimating && animateDirection !== 0) {
      const timer = setTimeout(() => {
        if (animateDirection === 1) {
          onMonthChange(addMonths(currentDate, 1));
        } else {
          onMonthChange(subMonths(currentDate, 1));
        }
        setIsAnimating(false);
        setAnimateDirection(0);
      }, 280); // Un poco menos que la duración de la transición
      return () => clearTimeout(timer);
    }
  }, [isAnimating, animateDirection, currentDate, onMonthChange]);

  // Calcular días para un mes específico
  const getMonthDays = useCallback(
    (date) => {
      const monthStart = startOfMonth(date);
      const monthEnd = endOfMonth(date);
      const calendarStart = startOfWeek(monthStart, { weekStartsOn });
      const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });

      const days = [];
      let day = calendarStart;
      while (day <= calendarEnd) {
        days.push(day);
        day = addDays(day, 1);
      }
      return days;
    },
    [weekStartsOn]
  );

  // Memoizar los días de los 3 meses
  const prevMonth = subMonths(currentDate, 1);
  const nextMonth = addMonths(currentDate, 1);

  const prevMonthDays = useMemo(
    () => getMonthDays(prevMonth),
    [prevMonth, getMonthDays]
  );
  const currentMonthDays = useMemo(
    () => getMonthDays(currentDate),
    [currentDate, getMonthDays]
  );
  const nextMonthDays = useMemo(
    () => getMonthDays(nextMonth),
    [nextMonth, getMonthDays]
  );

  const weekDaysMobile = getWeekDayNames(weekStartsOn, "short");

  // Calcular filas de cada mes
  const prevMonthRows = Math.ceil(prevMonthDays.length / 7);
  const currentMonthRows = Math.ceil(currentMonthDays.length / 7);
  const nextMonthRows = Math.ceil(nextMonthDays.length / 7);

  // Calcular mes destino para el indicador
  const showMonthIndicator = isDragging && Math.abs(dragOffset.y) > 20;
  const targetMonth = dragOffset.y > 0 ? prevMonth : nextMonth;

  // Calcular la posición del carrusel
  const getTranslateY = () => {
    if (isDragging) {
      return dragOffset.y;
    }
    if (isAnimating) {
      // Animar hacia el mes destino (100% del contenedor)
      const containerHeight = containerRef.current?.offsetHeight || 0;
      return animateDirection === 1 ? -containerHeight : containerHeight;
    }
    return 0;
  };

  // Componente para renderizar un grid de mes
  const MonthGrid = ({ monthDate, days, rows }) => (
    <div
      className="absolute inset-0 grid grid-cols-7 border-l border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-base))]"
      style={{
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      }}
    >
      {days.map((day) => (
        <MobileDayCell
          key={day.toISOString()}
          day={day}
          currentDate={monthDate}
          selectedDate={selectedDate}
          eventsByDay={eventsByDay}
          onSelectDate={onSelectDate}
          onEventClick={onEventClick}
          onEventLongPress={onEventLongPress}
          onDayLongPress={onDayLongPress}
        />
      ))}
    </div>
  );

  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Week days header - siempre fijo */}
      <div className="grid grid-cols-7 shrink-0 border-b border-[rgb(var(--border-base))] z-20 bg-[rgb(var(--bg-surface))]">
        {weekDaysMobile.map((day, idx) => (
          <div
            key={`${day}-${idx}`}
            className="text-center text-[10px] font-medium text-[rgb(var(--text-muted))] py-1.5 bg-[rgb(var(--bg-muted))]/50"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Contenedor del carrusel de 3 meses */}
      <div ref={setRefs} className="flex-1 relative overflow-hidden touch-none">
        {/* Indicador del mes destino - aparece solo durante swipe */}
        <AnimatePresence>
          {showMonthIndicator && (
            <motion.div
              initial={{ opacity: 0, y: dragOffset.y > 0 ? -20 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`absolute left-0 right-0 z-30 flex justify-center pointer-events-none ${
                dragOffset.y > 0 ? "top-2" : "bottom-2"
              }`}
            >
              <div className="bg-[rgb(var(--bg-elevated))] shadow-lg rounded-full px-4 py-1.5 border border-[rgb(var(--border-base))]">
                <span className="text-sm font-semibold text-[rgb(var(--text-primary))] capitalize">
                  {format(targetMonth, "MMMM yyyy", { locale: es })}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Carrusel de 3 meses apilados verticalmente */}
        <div
          className="absolute inset-0"
          style={{
            transform: `translateY(${getTranslateY()}px)`,
            transition: isDragging
              ? "none"
              : "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
            willChange: "transform",
          }}
        >
          {/* Mes anterior (arriba del visible) */}
          <div
            className="absolute left-0 right-0"
            style={{ height: "100%", top: "-100%" }}
          >
            <MonthGrid
              monthDate={prevMonth}
              days={prevMonthDays}
              rows={prevMonthRows}
            />
          </div>

          {/* Mes actual (visible) */}
          <div
            className="absolute left-0 right-0"
            style={{ height: "100%", top: "0" }}
          >
            <MonthGrid
              monthDate={currentDate}
              days={currentMonthDays}
              rows={currentMonthRows}
            />
          </div>

          {/* Mes siguiente (debajo del visible) */}
          <div
            className="absolute left-0 right-0"
            style={{ height: "100%", top: "100%" }}
          >
            <MonthGrid
              monthDate={nextMonth}
              days={nextMonthDays}
              rows={nextMonthRows}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Mobile Day Cell Component (extracted to avoid hooks in loop)
function MobileDayCell({
  day,
  currentDate,
  selectedDate,
  eventsByDay,
  onSelectDate,
  onEventClick,
  onEventLongPress,
  onDayLongPress,
}) {
  const dateKey = format(day, "yyyy-MM-dd");
  const dayEvents = eventsByDay[dateKey] || [];
  const isCurrentMonth = isSameMonth(day, currentDate);
  const isSelected = isSameDay(day, selectedDate);
  const isTodayDate = isToday(day);

  const handleDayClick = () => {
    onSelectDate(day);
  };

  const dayLongPress = useLongPress(
    (e, position) => {
      onDayLongPress?.(day, position || { x: 0, y: 0 });
    },
    null,
    { delay: 500 }
  );

  return (
    <button
      onClick={handleDayClick}
      {...dayLongPress}
      className={`
        flex flex-col p-1 sm:p-1.5 h-full overflow-hidden border-r border-b border-[rgb(var(--border-base))] transition-all text-left
        ${
          isSelected
            ? "bg-[rgb(var(--brand-primary))]/10 ring-2 ring-inset ring-[rgb(var(--brand-primary))]"
            : isTodayDate
            ? "bg-[rgb(var(--brand-primary))]/5"
            : "hover:bg-[rgb(var(--bg-hover))]"
        }
        ${!isCurrentMonth ? "opacity-40" : ""}
      `}
      style={{ touchAction: "manipulation" }}
    >
      <div className="flex items-center justify-center mb-1 shrink-0">
        <span
          className={`text-xs sm:text-sm font-medium ${
            isTodayDate
              ? "w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-[rgb(var(--brand-primary))] text-white flex items-center justify-center text-[10px] sm:text-xs"
              : isSelected
              ? "text-[rgb(var(--brand-primary))]"
              : "text-[rgb(var(--text-primary))]"
          }`}
        >
          {format(day, "d")}
        </span>
      </div>

      {/* Events */}
      <div className="flex-1 min-h-0 space-y-0.5 overflow-hidden">
        {dayEvents.slice(0, 3).map((event) => (
          <MonthEventCard
            key={event.$id}
            event={event}
            onClick={(e) => {
              e.stopPropagation();
              onEventClick(event);
            }}
            onLongPress={(e, pos) => {
              e?.stopPropagation?.();
              onEventLongPress(event, pos);
            }}
          />
        ))}
        {dayEvents.length > 3 && (
          <div className="text-[9px] text-[rgb(var(--text-muted))] pl-1">
            +{dayEvents.length - 3} más
          </div>
        )}
      </div>
    </button>
  );
}

// ================================================
// MONTH VIEW (Desktop & regular)
// ================================================

function MonthView({
  currentDate,
  selectedDate,
  onSelectDate,
  eventsByDay,
  onEventClick,
  onEventLongPress,
  onDayLongPress,
  onDayContextMenu,
  weekStartsOn = 1,
}) {
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentDate);
    const monthEnd = endOfMonth(currentDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });

    const days = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      days.push(day);
      day = addDays(day, 1);
    }
    return days;
  }, [currentDate, weekStartsOn]);

  const weekDays = getWeekDayNames(weekStartsOn, "medium");
  const weekDaysMobile = getWeekDayNames(weekStartsOn, "short");

  return (
    <div className="h-full flex flex-col border-l border-t border-[rgb(var(--border-base))] overflow-hidden">
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
              onLongPress={onDayLongPress}
              onContextMenu={onDayContextMenu}
              onEventClick={onEventClick}
              onEventLongPress={onEventLongPress}
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

function AgendaView({
  events,
  selectedDate,
  onEventClick,
  onEventLongPress,
  onCreateEvent,
}) {
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
                        onLongPress={onEventLongPress}
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
  onEventLongPress,
  onCreateEvent,
}) {
  const { activeGroup, profile } = useWorkspace();
  const { data: userSettings } = useUserSettings(
    activeGroup?.$id,
    profile?.$id
  );

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

  const currentTimezone = userSettings?.timezone || "America/Mexico_City";

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
        <div className="flex items-center gap-2 mt-1.5">
          {isToday(selectedDate) && (
            <span className="inline-block text-xs text-[rgb(var(--brand-primary))] font-medium">
              Hoy
            </span>
          )}
          <div
            className="inline-flex items-center gap-1.5 text-xs text-[rgb(var(--text-muted))] group relative"
            title="Zona horaria configurada para tus eventos"
          >
            <Globe className="w-3 h-3" />
            <span>
              {SETTINGS_OPTIONS.timezones.find(
                (tz) => tz.value === currentTimezone
              )?.label || currentTimezone}
            </span>
            {/* Tooltip */}
            <div className="invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity absolute left-0 top-full mt-1 px-2 py-1 bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border-base))] rounded-lg shadow-lg text-xs text-[rgb(var(--text-primary))] whitespace-nowrap z-10">
              Zona horaria de configuración
            </div>
          </div>
        </div>
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
              <EventCard
                key={event.$id}
                event={event}
                onClick={onEventClick}
                onLongPress={onEventLongPress}
              />
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
  const [movingEvent, setMovingEvent] = useState(null);
  const [defaultEventDate, setDefaultEventDate] = useState(null);

  // Context menu states
  const [contextMenu, setContextMenu] = useState({
    isOpen: false,
    position: { x: 0, y: 0 },
    items: [],
  });

  // Date picker states
  const [showMonthYearPicker, setShowMonthYearPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Group modal state
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);

  // Detect if mobile
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768); // md breakpoint
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const {
    activeGroup,
    calendars = [],
    profile,
    needsFirstGroup,
  } = useWorkspace();
  const deleteCalendar = useDeleteCalendar();
  const duplicateEvent = useDuplicateEvent();
  const hasCalendars = calendars.length > 0;
  const groupId = activeGroup?.$id;
  const profileId = profile?.$id;

  // Cargar preferencias del usuario
  const { data: userSettings } = useUserSettings(groupId, profileId);

  // Configuración con valores por defecto si no hay settings
  const weekStartsOn = userSettings?.weekStartsOn ?? 1; // Default: Lunes
  const dateFormat = userSettings?.dateFormat ?? "DD/MM/YYYY";
  const timeFormat = userSettings?.timeFormat ?? "24h";
  const currentTimezone = userSettings?.timezone ?? "America/Mexico_City";

  const { data: rawEvents = [] } = useMonthEvents(
    groupId,
    currentDate,
    visibleCalendars.length > 0 ? visibleCalendars : undefined
  );

  // Enrich events with calendar information
  const events = useMemo(() => {
    return rawEvents.map((event) => ({
      ...event,
      calendar: calendars.find((c) => c.$id === event.calendarId),
    }));
  }, [rawEvents, calendars]);

  // Initialize visible calendars - solo inicializar una vez cuando se cargan los calendarios
  const hasInitializedCalendars = React.useRef(false);
  React.useEffect(() => {
    if (calendars.length > 0 && !hasInitializedCalendars.current) {
      setVisibleCalendars(calendars.map((c) => c.$id));
      hasInitializedCalendars.current = true;
    }
  }, [calendars]);

  // Handle view mode change animation direction
  const prevViewModeRef = React.useRef(viewMode);
  React.useEffect(() => {
    const viewOrder = [
      VIEW_MODES.DAY,
      VIEW_MODES.WEEK,
      VIEW_MODES.MONTH,
      VIEW_MODES.AGENDA,
    ];
    const prevIndex = viewOrder.indexOf(prevViewModeRef.current);
    const currentIndex = viewOrder.indexOf(viewMode);

    if (prevIndex !== -1 && currentIndex !== -1 && prevIndex !== currentIndex) {
      // Cambio de vista: determinar dirección
      setNavigationDirection(currentIndex > prevIndex ? 1 : -1);
    }

    prevViewModeRef.current = viewMode;
  }, [viewMode]);

  // Generar key para animación basada en el período de vista
  // Para vista semanal, usa el inicio de semana para evitar re-renders innecesarios
  const getViewKey = useCallback(() => {
    switch (viewMode) {
      case VIEW_MODES.DAY:
        return `day-${format(currentDate, "yyyy-MM-dd")}`;
      case VIEW_MODES.WEEK:
        // Usar inicio de semana para que no cambie al seleccionar días dentro de la misma semana
        const weekStart = startOfWeek(currentDate, { weekStartsOn });
        return `week-${format(weekStart, "yyyy-MM-dd")}`;
      case VIEW_MODES.MONTH:
        return `month-${format(currentDate, "yyyy-MM")}`;
      case VIEW_MODES.AGENDA:
        return `agenda-${format(currentDate, "yyyy-MM")}`;
      default:
        return currentDate.toISOString();
    }
  }, [viewMode, currentDate, weekStartsOn]);

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

  // Hook de swipe para navegación táctil en móviles
  // Solo activo cuando no estamos en scroll infinito del mes móvil
  const shouldEnableSwipe =
    !needsFirstGroup &&
    hasCalendars &&
    !(isMobile && viewMode === VIEW_MODES.MONTH);
  const {
    bind: swipeBindings,
    style: swipeStyle,
    isDragging,
  } = useCalendarSwipe({
    onNext: navigateNext,
    onPrevious: navigatePrevious,
    enabled: shouldEnableSwipe,
  });

  const toggleCalendarVisibility = (calId) => {
    setVisibleCalendars((prev) =>
      prev.includes(calId)
        ? prev.filter((id) => id !== calId)
        : [...prev, calId]
    );
  };

  // Event handlers
  const handleCreateEvent = useCallback((date = null) => {
    setDefaultEventDate(date);
    setEditingEvent(null);
    setShowEventModal(true);
  }, []);

  // Handler para crear evento en una hora específica (desde day/week view)
  const handleCreateEventAtTime = useCallback((date, hour) => {
    // Crear una fecha con la hora específica
    const eventDate = setHours(startOfDay(date), hour);
    setDefaultEventDate(eventDate);
    setEditingEvent(null);
    setShowEventModal(true);
  }, []);

  const handleEventClick = useCallback((event) => {
    setViewingEvent(event);
  }, []);

  const handleEditEvent = useCallback((event) => {
    setViewingEvent(null);
    setEditingEvent(event);
    setShowEventModal(true);
  }, []);

  const handleDeleteEvent = useCallback((event) => {
    setViewingEvent(null);
    setDeletingEvent(event);
  }, []);

  const handleMoveEvent = useCallback((event) => {
    setViewingEvent(null);
    setMovingEvent(event);
  }, []);

  const handleDuplicateEvent = useCallback(
    async (event) => {
      try {
        await duplicateEvent.mutateAsync({
          eventId: event.$id,
        });
        setViewingEvent(null);
      } catch (error) {
        console.error("Error duplicating event:", error);
      }
    },
    [duplicateEvent]
  );

  // Date picker handlers
  const handleMonthYearChange = useCallback((date) => {
    setNavigationDirection(0);
    setCurrentDate(date);
    setSelectedDate(date);
    setShowMonthYearPicker(false);
  }, []);

  const handleDateChange = useCallback((date) => {
    setNavigationDirection(0);
    setCurrentDate(date);
    setSelectedDate(date);
    setShowDatePicker(false);
  }, []);

  // Context menu handlers
  const showContextMenu = useCallback((position, items) => {
    setContextMenu({
      isOpen: true,
      position,
      items,
    });
  }, []);

  const closeContextMenu = useCallback(() => {
    setContextMenu({ isOpen: false, position: { x: 0, y: 0 }, items: [] });
  }, []);

  // Handler for long press on a day (create event)
  const handleDayLongPress = useCallback(
    (date) => {
      setDefaultEventDate(date);
      handleCreateEvent(date);
    },
    [handleCreateEvent]
  );

  // Handler for context menu on a day (right-click or two-finger tap)
  const handleDayContextMenu = useCallback(
    (e, date) => {
      e.preventDefault();
      e.stopPropagation();

      const x = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
      const y = e.clientY || (e.touches && e.touches[0]?.clientY) || 0;

      showContextMenu({ x, y }, [
        MENU_ITEMS.createEvent(() => {
          closeContextMenu();
          setDefaultEventDate(date);
          handleCreateEvent(date);
        }),
      ]);
    },
    [showContextMenu, closeContextMenu, handleCreateEvent]
  );

  // Handler for long press on event (show context menu)
  const handleEventLongPress = useCallback(
    (event, position) => {
      // position ya viene con { x, y } desde los componentes
      const x = position?.x || window.innerWidth / 2;
      const y = position?.y || window.innerHeight / 2;

      showContextMenu({ x, y }, [
        MENU_ITEMS.viewEvent(() => {
          closeContextMenu();
          handleEventClick(event);
        }),
        MENU_ITEMS.editEvent(() => {
          closeContextMenu();
          handleEditEvent(event);
        }),
        MENU_ITEMS.duplicateEvent(() => {
          closeContextMenu();
          handleDuplicateEvent(event);
        }),
        MENU_ITEMS.moveEvent(() => {
          closeContextMenu();
          handleMoveEvent(event);
        }),
        MENU_ITEMS.deleteEvent(() => {
          closeContextMenu();
          handleDeleteEvent(event);
        }),
      ]);
    },
    [
      showContextMenu,
      closeContextMenu,
      handleEventClick,
      handleEditEvent,
      handleDuplicateEvent,
      handleMoveEvent,
      handleDeleteEvent,
    ]
  );

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
        const weekStart = startOfWeek(selectedDate, { weekStartsOn });
        const weekEnd = endOfWeek(selectedDate, { weekStartsOn });
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

          {/* Navigation - Flechas verticales para vista mes, horizontales para otras vistas */}
          <div className="flex items-center gap-1">
            <button
              onClick={navigatePrevious}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))] transition-colors"
              title={
                viewMode === VIEW_MODES.MONTH ? "Mes anterior" : "Anterior"
              }
            >
              {viewMode === VIEW_MODES.MONTH ? (
                <ChevronUp className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
            <button
              onClick={navigateNext}
              className="p-1.5 sm:p-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))] transition-colors"
              title={
                viewMode === VIEW_MODES.MONTH ? "Mes siguiente" : "Siguiente"
              }
            >
              {viewMode === VIEW_MODES.MONTH ? (
                <ChevronDown className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>
          </div>

          <button
            onClick={() => setShowMonthYearPicker(true)}
            className="text-sm sm:text-lg font-semibold text-[rgb(var(--text-primary))] capitalize truncate hover:bg-[rgb(var(--bg-hover))] px-3 py-1 rounded-lg transition-colors flex items-center gap-1.5"
          >
            {getNavigationTitle()}
            <ChevronDown className="w-4 h-4" />
          </button>
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
              if (needsFirstGroup) {
                return; // No hacer nada si no hay grupo
              }
              if (!hasCalendars) {
                setShowCreateCalendarModal(true);
              } else {
                handleCreateEvent();
              }
            }}
            disabled={needsFirstGroup}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg bg-[rgb(var(--brand-primary))] text-white text-sm font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">
              {needsFirstGroup
                ? "Crear Grupo"
                : hasCalendars
                ? "Nuevo"
                : "Crear Calendario"}
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
                            weekStartsOn={weekStartsOn}
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
                    {!needsFirstGroup && (
                      <button
                        onClick={() => setShowCreateCalendarModal(true)}
                        className="text-xs text-[rgb(var(--brand-primary))] hover:underline"
                      >
                        + Nuevo
                      </button>
                    )}
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
                      needsFirstGroup={needsFirstGroup}
                    />
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Calendar Area */}
        <div className="flex-1 flex flex-col min-w-0 bg-[rgb(var(--bg-base))] overflow-hidden">
          {needsFirstGroup ? (
            <NoGroupsPrompt
              onCreateGroup={() => setShowCreateGroupModal(true)}
            />
          ) : !hasCalendars ? (
            <NoCalendarsPrompt
              onCreateCalendar={() => setShowCreateCalendarModal(true)}
            />
          ) : viewMode === VIEW_MODES.MONTH ? (
            // Vista de mes con scroll vertical infinito (móvil y desktop)
            <VerticalMonthScroller
              currentDate={currentDate}
              selectedDate={selectedDate}
              eventsByDay={eventsByDay}
              onSelectDate={setSelectedDate}
              onEventClick={handleEventClick}
              onEventLongPress={handleEventLongPress}
              onDayLongPress={handleDayLongPress}
              onMonthChange={(newDate) => {
                setCurrentDate(newDate);
                setNavigationDirection(newDate > currentDate ? 1 : -1);
              }}
              weekStartsOn={weekStartsOn}
            />
          ) : (
            // Contenedor con gestos de swipe para navegación
            <div
              className="flex-1 overflow-hidden"
              {...swipeBindings()}
              style={{
                touchAction: "pan-y",
                ...swipeStyle,
              }}
            >
              <AnimatePresence mode="wait" custom={navigationDirection}>
                <motion.div
                  key={getViewKey()}
                  custom={navigationDirection}
                  variants={viewTransitionVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    duration: isDragging ? 0 : 0.25,
                    ease: "easeInOut",
                  }}
                  className="h-full"
                >
                  {viewMode === VIEW_MODES.DAY && (
                    <DayView
                      selectedDate={selectedDate}
                      events={filteredEvents}
                      onEventClick={handleEventClick}
                      onEventLongPress={handleEventLongPress}
                      onDateClick={() => setShowDatePicker(true)}
                      onCreateEventAtTime={handleCreateEventAtTime}
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
                      onEventLongPress={handleEventLongPress}
                      onCreateEventAtTime={handleCreateEventAtTime}
                      weekStartsOn={weekStartsOn}
                    />
                  )}

                  {viewMode === VIEW_MODES.AGENDA && (
                    <AgendaView
                      events={filteredEvents}
                      selectedDate={selectedDate}
                      onEventClick={handleEventClick}
                      onEventLongPress={handleEventLongPress}
                      onCreateEvent={handleCreateEvent}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
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
                      onEventLongPress={handleEventLongPress}
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
          setDefaultEventDate(null);
        }}
        event={editingEvent}
        isEditing={!!editingEvent}
        defaultDate={defaultEventDate || selectedDate}
        onSuccess={() => {
          setShowEventModal(false);
          setEditingEvent(null);
          setDefaultEventDate(null);
        }}
      />

      <EventDetailsModal
        isOpen={!!viewingEvent}
        onClose={() => setViewingEvent(null)}
        event={viewingEvent}
        calendar={getCalendarForEvent(viewingEvent)}
        onEdit={handleEditEvent}
        onDelete={handleDeleteEvent}
        onDuplicate={handleDuplicateEvent}
        onMove={handleMoveEvent}
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

      <MoveEventModal
        isOpen={!!movingEvent}
        onClose={() => setMovingEvent(null)}
        event={movingEvent}
        currentCalendar={calendars.find(
          (cal) => cal.$id === movingEvent?.calendarId
        )}
        onSuccess={() => {
          setMovingEvent(null);
          setViewingEvent(null);
        }}
      />

      {/* Date Pickers */}
      <MonthYearPicker
        selectedDate={currentDate}
        onDateChange={handleMonthYearChange}
        isOpen={showMonthYearPicker}
        onClose={() => setShowMonthYearPicker(false)}
      />

      <DatePicker
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        isOpen={showDatePicker}
        onClose={() => setShowDatePicker(false)}
        weekStartsOn={weekStartsOn}
      />

      {/* Context Menu */}
      <ContextMenu
        isOpen={contextMenu.isOpen}
        position={contextMenu.position}
        items={contextMenu.items}
        onClose={closeContextMenu}
      />

      {/* Group Modal */}
      <GroupModal
        isOpen={showCreateGroupModal}
        onClose={() => setShowCreateGroupModal(false)}
        onSuccess={() => setShowCreateGroupModal(false)}
      />
    </div>
  );
}
