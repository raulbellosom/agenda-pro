import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  addDays,
  parseISO,
} from "date-fns";
import { es } from "date-fns/locale";
import {
  Plus,
  ChevronLeft,
  ChevronRight,
  Calendar as CalIcon,
  List,
  Grid3X3,
  Clock,
  MapPin,
  CalendarDays,
  Loader2,
} from "lucide-react";
import { useGesture } from "@use-gesture/react";
import { Button } from "../../components/ui/Button";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import { useMonthEvents } from "../../lib/hooks";
import { CreateGroupModal } from "../groups/CreateGroupModal";

// Helper to build the month grid
function buildMonthGrid(cursor) {
  const start = startOfWeek(startOfMonth(cursor), { weekStartsOn: 1 });
  const end = endOfWeek(endOfMonth(cursor), { weekStartsOn: 1 });
  const days = [];
  for (let d = start; d <= end; d = addDays(d, 1)) days.push(d);
  return days;
}

// Calendar colors map
const CALENDAR_COLORS = {
  cyan: "rgb(var(--brand-1))",
  violet: "rgb(var(--accent-1))",
  teal: "rgb(var(--accent-2))",
  sky: "rgb(var(--accent-3))",
  emerald: "rgb(var(--ok))",
  amber: "rgb(var(--warn))",
  rose: "rgb(var(--bad))",
};

// Day cell component
function DayCell({ day, cursor, selected, events, onSelect }) {
  const inMonth = isSameMonth(day, cursor);
  const isSel = isSameDay(day, selected);
  const today = isToday(day);
  const dayEvents = events.filter((e) =>
    isSameDay(parseISO(e.startDateTime), day)
  );

  return (
    <motion.button
      onClick={() => onSelect(day)}
      whileTap={{ scale: 0.95 }}
      className={`
        relative min-h-[70px] rounded-2xl p-2 text-left transition-all
        ${
          inMonth
            ? "bg-[rgb(var(--bg-subtle))]"
            : "bg-[rgb(var(--bg-subtle))]/30 opacity-50"
        }
        ${
          isSel
            ? "ring-2 ring-[rgb(var(--brand-1))] bg-[rgb(var(--brand-1))]/10"
            : "hover:bg-[rgb(var(--card-hover))]"
        }
        ${today && !isSel ? "ring-1 ring-[rgb(var(--brand-1))]/50" : ""}
      `}
      aria-label={`Día ${format(day, "d", { locale: es })}`}
    >
      <div className="flex items-start justify-between">
        <span
          className={`
            text-sm font-semibold 
            ${
              today
                ? "text-[rgb(var(--brand-1))]"
                : inMonth
                ? "text-[rgb(var(--text-primary))]"
                : "text-[rgb(var(--muted))]"
            }
          `}
        >
          {format(day, "d")}
        </span>
        {today && (
          <span className="text-[10px] font-medium text-[rgb(var(--brand-1))] uppercase">
            Hoy
          </span>
        )}
      </div>

      {/* Event indicators */}
      {dayEvents.length > 0 && (
        <div className="mt-1 flex flex-wrap gap-1">
          {dayEvents.slice(0, 3).map((ev) => (
            <div
              key={ev.$id}
              className="h-1.5 w-1.5 rounded-full"
              style={{
                backgroundColor:
                  CALENDAR_COLORS[ev.calendarColor] || CALENDAR_COLORS.cyan,
              }}
            />
          ))}
          {dayEvents.length > 3 && (
            <span className="text-[10px] text-[rgb(var(--muted))]">
              +{dayEvents.length - 3}
            </span>
          )}
        </div>
      )}
    </motion.button>
  );
}

// Event card component
function EventCard({ event, onClick }) {
  const color = CALENDAR_COLORS[event.calendarColor] || CALENDAR_COLORS.cyan;
  const startTime = format(parseISO(event.startDateTime), "HH:mm", {
    locale: es,
  });
  const endTime = format(parseISO(event.endDateTime), "HH:mm", { locale: es });

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className="w-full glass-card rounded-2xl p-4 text-left transition-all hover:shadow-lg"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-1 h-full min-h-[40px] rounded-full"
          style={{ backgroundColor: color }}
        />
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-[rgb(var(--text-primary))] truncate">
            {event.title}
          </h4>
          <div className="mt-1 flex items-center gap-3 text-sm text-[rgb(var(--muted))]">
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              {event.allDay ? "Todo el día" : `${startTime} - ${endTime}`}
            </span>
            {event.location && (
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{event.location}</span>
              </span>
            )}
          </div>
          {event.description && (
            <p className="mt-2 text-sm text-[rgb(var(--text-secondary))] line-clamp-2">
              {event.description}
            </p>
          )}
        </div>
      </div>
    </motion.button>
  );
}

// Empty state component
function EmptyDayState({ date }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--brand-1))]/10 flex items-center justify-center mb-4">
        <CalendarDays className="w-8 h-8 text-[rgb(var(--brand-1))]" />
      </div>
      <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
        Sin eventos
      </h3>
      <p className="mt-1 text-sm text-[rgb(var(--muted))] max-w-xs">
        No hay eventos programados para{" "}
        {isToday(date)
          ? "hoy"
          : format(date, "EEEE d 'de' MMMM", { locale: es })}
        .
      </p>
    </div>
  );
}

// Agenda list view
function AgendaList({ events, onPickDate, onEventClick }) {
  const sorted = useMemo(
    () =>
      [...events].sort(
        (a, b) => new Date(a.startDateTime) - new Date(b.startDateTime)
      ),
    [events]
  );

  // Group by date
  const grouped = useMemo(() => {
    return sorted.reduce((acc, event) => {
      const dateKey = format(parseISO(event.startDateTime), "yyyy-MM-dd");
      if (!acc[dateKey]) acc[dateKey] = [];
      acc[dateKey].push(event);
      return acc;
    }, {});
  }, [sorted]);

  if (!sorted.length) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--brand-1))]/10 flex items-center justify-center mb-4">
          <List className="w-8 h-8 text-[rgb(var(--brand-1))]" />
        </div>
        <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
          Sin eventos este mes
        </h3>
        <p className="mt-1 text-sm text-[rgb(var(--muted))]">
          Crea tu primer evento para empezar.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([dateKey, dayEvents]) => {
        const date = parseISO(dateKey);
        return (
          <div key={dateKey}>
            <button
              onClick={() => onPickDate(date)}
              className="flex items-center gap-2 mb-3 text-sm font-semibold text-[rgb(var(--text-secondary))] hover:text-[rgb(var(--brand-1))] transition-colors"
            >
              <span className="capitalize">
                {isToday(date)
                  ? "Hoy"
                  : format(date, "EEEE d 'de' MMMM", { locale: es })}
              </span>
              {isToday(date) && (
                <span className="px-2 py-0.5 rounded-full bg-[rgb(var(--brand-1))]/10 text-[rgb(var(--brand-1))] text-xs">
                  Hoy
                </span>
              )}
            </button>
            <div className="space-y-2">
              {dayEvents.map((event) => (
                <EventCard
                  key={event.$id}
                  event={event}
                  onClick={() => onEventClick(event)}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Main Calendar Page
export function CalendarPage() {
  const { activeGroup, calendars, needsFirstGroup, profile, refetchGroups, switchGroup } =
    useWorkspace();
  const [view, setView] = useState("mes");
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState(new Date());
  const [showCreateGroup, setShowCreateGroup] = useState(false);

  // Build month grid
  const days = useMemo(() => buildMonthGrid(cursor), [cursor]);

  // Fetch events for the current month
  const { data: events = [], isLoading: eventsLoading } = useMonthEvents(
    activeGroup?.$id,
    cursor
  );

  // Filter events for selected day
  const dayEvents = useMemo(
    () => events.filter((e) => isSameDay(parseISO(e.startDateTime), selected)),
    [events, selected]
  );

  // Gesture handler for swiping
  const bind = useGesture(
    {
      onDragEnd: ({ swipe: [swipeX] }) => {
        if (swipeX === -1) setCursor((d) => addMonths(d, 1));
        if (swipeX === 1) setCursor((d) => addMonths(d, -1));
      },
    },
    { drag: { axis: "x", threshold: 25 } }
  );

  const monthTitle = format(cursor, "MMMM yyyy", { locale: es });

  // Show create group prompt if needed
  if (needsFirstGroup) {
    return (
      <>
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
          <div className="w-20 h-20 rounded-3xl gradient-brand flex items-center justify-center mb-6 shadow-glow">
            <CalIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
            Bienvenido a Agenda Pro
          </h1>
          <p className="mt-2 text-[rgb(var(--text-secondary))] max-w-md">
            Para empezar, necesitas crear tu primer espacio de trabajo. Un
            espacio te permite organizar tus calendarios y colaborar con otros.
          </p>
          <Button
            className="mt-6"
            leftIcon={<Plus className="w-4 h-4" />}
            onClick={() => setShowCreateGroup(true)}
          >
            Crear mi espacio
          </Button>
        </div>
        <CreateGroupModal
          isOpen={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
          onSuccess={(newGroup) => {
            // Recargar grupos y seleccionar el nuevo como activo
            refetchGroups?.();
            if (newGroup?.$id) {
              switchGroup(newGroup.$id);
            }
          }}
          profileId={profile?.$id}
        />
      </>
    );
  }

  return (
    <div className="space-y-6">
      {/* Calendar Card */}
      <div className="glass-card rounded-3xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-5 border-b border-[rgb(var(--glass-border))]">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-[rgb(var(--text-primary))]">
                Agenda
              </h1>
              <p className="text-sm text-[rgb(var(--muted))]">
                {calendars.length} calendario{calendars.length !== 1 ? "s" : ""}{" "}
                activo{calendars.length !== 1 ? "s" : ""}
              </p>
            </div>
            <Button
              leftIcon={<Plus className="w-4 h-4" />}
              onClick={() => {
                // TODO: Open create event modal
                alert("Crear evento - próximamente");
              }}
            >
              Nuevo evento
            </Button>
          </div>
        </div>

        {/* Controls */}
        <div className="px-6 py-4 border-b border-[rgb(var(--glass-border))]/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {/* Navigation */}
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCursor((d) => addMonths(d, -1))}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <span className="text-lg font-semibold capitalize min-w-[160px] text-center">
                {monthTitle}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCursor((d) => addMonths(d, 1))}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                variant="soft"
                size="sm"
                leftIcon={<CalIcon className="w-4 h-4" />}
                onClick={() => {
                  const now = new Date();
                  setCursor(now);
                  setSelected(now);
                }}
              >
                Hoy
              </Button>
              <div className="flex p-1 bg-[rgb(var(--bg-subtle))] rounded-xl">
                <button
                  onClick={() => setView("mes")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    view === "mes"
                      ? "bg-[rgb(var(--brand-1))] text-white shadow"
                      : "text-[rgb(var(--muted))] hover:text-[rgb(var(--text-primary))]"
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setView("agenda")}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    view === "agenda"
                      ? "bg-[rgb(var(--brand-1))] text-white shadow"
                      : "text-[rgb(var(--muted))] hover:text-[rgb(var(--text-primary))]"
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {eventsLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-[rgb(var(--brand-1))]" />
            </div>
          ) : view === "mes" ? (
            <div {...bind()} className="select-none touch-pan-y">
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-2 mb-2">
                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                  <div
                    key={d}
                    className="text-center text-xs font-medium text-[rgb(var(--muted))] py-2"
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Day grid */}
              <div className="grid grid-cols-7 gap-2">
                {days.map((day) => (
                  <DayCell
                    key={day.toISOString()}
                    day={day}
                    cursor={cursor}
                    selected={selected}
                    events={events}
                    onSelect={setSelected}
                  />
                ))}
              </div>
            </div>
          ) : (
            <AgendaList
              events={events}
              onPickDate={(d) => {
                setSelected(d);
                setView("mes");
              }}
              onEventClick={(ev) => {
                // TODO: Open event detail modal
                console.log("Event clicked:", ev);
              }}
            />
          )}
        </div>
      </div>

      {/* Selected Day Events */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selected.toISOString()}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.2 }}
          className="glass-card rounded-3xl overflow-hidden"
        >
          <div className="px-6 py-5 border-b border-[rgb(var(--glass-border))]">
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))] capitalize">
              {isToday(selected)
                ? "Hoy"
                : format(selected, "EEEE d 'de' MMMM", { locale: es })}
            </h2>
            <p className="text-sm text-[rgb(var(--muted))]">
              {dayEvents.length} evento{dayEvents.length !== 1 ? "s" : ""}
            </p>
          </div>
          <div className="p-6">
            {dayEvents.length > 0 ? (
              <div className="space-y-3">
                {dayEvents.map((event) => (
                  <EventCard
                    key={event.$id}
                    event={event}
                    onClick={() => {
                      // TODO: Open event detail modal
                      console.log("Event clicked:", event);
                    }}
                  />
                ))}
              </div>
            ) : (
              <EmptyDayState date={selected} />
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
