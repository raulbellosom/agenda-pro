import React, {
  useRef,
  useCallback,
  useState,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  addDays,
  addMonths,
  subMonths,
  isSameMonth,
  isSameDay,
  isToday,
} from "date-fns";
import { es } from "date-fns/locale";
import { useLongPress } from "../../lib/hooks";
import { getWeekDayNames } from "../../lib/utils/dateTimeFormat";

// ================================================
// CONSTANTS
// ================================================

const CALENDAR_COLORS = {
  violet: {
    bg: "bg-violet-500/20",
    text: "text-violet-500 dark:text-violet-400",
  },
  blue: { bg: "bg-blue-500/20", text: "text-blue-500 dark:text-blue-400" },
  cyan: { bg: "bg-cyan-500/20", text: "text-cyan-500 dark:text-cyan-400" },
  emerald: {
    bg: "bg-emerald-500/20",
    text: "text-emerald-500 dark:text-emerald-400",
  },
  teal: { bg: "bg-teal-500/20", text: "text-teal-500 dark:text-teal-400" },
  amber: { bg: "bg-amber-500/20", text: "text-amber-500 dark:text-amber-400" },
  orange: {
    bg: "bg-orange-500/20",
    text: "text-orange-500 dark:text-orange-400",
  },
  red: { bg: "bg-red-500/20", text: "text-red-500 dark:text-red-400" },
  rose: { bg: "bg-rose-500/20", text: "text-rose-500 dark:text-rose-400" },
  pink: { bg: "bg-pink-500/20", text: "text-pink-500 dark:text-pink-400" },
  slate: { bg: "bg-slate-500/20", text: "text-slate-500 dark:text-slate-400" },
};

const getCalendarColor = (color) =>
  CALENDAR_COLORS[color] || CALENDAR_COLORS.violet;

// ================================================
// EVENT CARD COMPONENT
// ================================================

function ScrollerEventCard({ event, onClick, onLongPress }) {
  const colors = getCalendarColor(event.calendar?.color || "violet");
  const isLongPressTriggeredRef = useRef(false);

  // Usar useLongPress con onClick como segundo parámetro
  // Esto evita que onClick se dispare si hubo un long press
  const longPressHandlers = useLongPress(
    (e, position) => {
      e?.stopPropagation?.();
      e?.preventDefault?.();
      isLongPressTriggeredRef.current = true;
      const x =
        position?.x ||
        e?.touches?.[0]?.clientX ||
        e?.clientX ||
        window.innerWidth / 2;
      const y =
        position?.y ||
        e?.touches?.[0]?.clientY ||
        e?.clientY ||
        window.innerHeight / 2;
      onLongPress?.(event, { x, y });
    },
    // onClick callback - solo se ejecuta si NO hubo long press
    (e) => {
      // Doble verificación: el hook ya previene esto, pero por seguridad
      if (!isLongPressTriggeredRef.current) {
        e?.stopPropagation?.();
        onClick?.(e);
      }
      isLongPressTriggeredRef.current = false;
    },
    { delay: 500, moveTolerance: 8 }
  );

  const handleContextMenu = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const x = e.clientX || window.innerWidth / 2;
    const y = e.clientY || window.innerHeight / 2;
    onLongPress?.(event, { x, y });
  };

  return (
    <div
      {...longPressHandlers}
      onContextMenu={handleContextMenu}
      className={`text-[10px] sm:text-xs px-1 sm:px-2 py-0.5 sm:py-1 rounded truncate ${colors.bg} ${colors.text} font-medium cursor-pointer hover:ring-2 hover:ring-inset hover:ring-[rgb(var(--brand-primary))]/50 transition-all active:scale-95 select-none touch-manipulation`}
    >
      {event.title}
    </div>
  );
}

// ================================================
// DAY CELL COMPONENT
// ================================================

function ScrollerDayCell({
  day,
  monthDate,
  selectedDate,
  events,
  onSelectDate,
  onEventClick,
  onEventLongPress,
  onDayLongPress,
}) {
  const isCurrentMonth = isSameMonth(day, monthDate);
  const isSelected = isSameDay(day, selectedDate);
  const isTodayDate = isToday(day);

  const dayLongPress = useLongPress(
    (e) => {
      const x = e?.touches?.[0]?.clientX || e?.clientX || window.innerWidth / 2;
      const y =
        e?.touches?.[0]?.clientY || e?.clientY || window.innerHeight / 2;
      onDayLongPress?.(day, { x, y });
    },
    () => onSelectDate(day),
    { delay: 500, moveTolerance: 5 }
  );

  return (
    <div
      {...dayLongPress}
      className={`
        flex flex-col p-1 sm:p-1.5 h-full overflow-hidden border-r border-b border-[rgb(var(--border-base))] transition-all text-left
        ${
          isSelected
            ? "bg-[rgb(var(--brand-primary))]/10 ring-2 ring-inset ring-[rgb(var(--brand-primary))]"
            : isTodayDate
            ? "bg-[rgb(var(--brand-primary))]/5"
            : "active:bg-[rgb(var(--bg-hover))]"
        }
        ${!isCurrentMonth ? "opacity-40 bg-[rgb(var(--bg-muted))]/30" : ""}
      `}
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
        {events.slice(0, 3).map((event) => (
          <ScrollerEventCard
            key={event.$id}
            event={event}
            onClick={(e) => {
              e.stopPropagation();
              onEventClick(event);
            }}
            onLongPress={(ev, pos) => {
              onEventLongPress(ev, pos);
            }}
          />
        ))}
        {events.length > 3 && (
          <div className="text-[9px] text-[rgb(var(--text-muted))] pl-1">
            +{events.length - 3} más
          </div>
        )}
      </div>
    </div>
  );
}

// ================================================
// SINGLE MONTH GRID
// ================================================

function MonthGrid({
  monthDate,
  selectedDate,
  eventsByDay,
  onSelectDate,
  onEventClick,
  onEventLongPress,
  onDayLongPress,
  weekStartsOn,
}) {
  const days = useMemo(() => {
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const calendarStart = startOfWeek(monthStart, { weekStartsOn });
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn });

    const result = [];
    let day = calendarStart;
    while (day <= calendarEnd) {
      result.push(day);
      day = addDays(day, 1);
    }
    return result;
  }, [monthDate, weekStartsOn]);

  const rows = Math.ceil(days.length / 7);

  return (
    <div
      className="grid grid-cols-7 h-full border-l border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-base))]"
      style={{
        gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))`,
      }}
    >
      {days.map((day) => {
        const dateKey = format(day, "yyyy-MM-dd");
        const dayEvents = eventsByDay[dateKey] || [];

        return (
          <ScrollerDayCell
            key={dateKey}
            day={day}
            monthDate={monthDate}
            selectedDate={selectedDate}
            events={dayEvents}
            onSelectDate={onSelectDate}
            onEventClick={onEventClick}
            onEventLongPress={onEventLongPress}
            onDayLongPress={onDayLongPress}
          />
        );
      })}
    </div>
  );
}

// ================================================
// VERTICAL MONTH SCROLLER - MAIN COMPONENT
// Con gestos táctiles nativos y scroll snap
// ================================================

export const VerticalMonthScroller = forwardRef(function VerticalMonthScroller(
  {
    currentDate,
    selectedDate,
    eventsByDay,
    onSelectDate,
    onEventClick,
    onEventLongPress,
    onDayLongPress,
    onMonthChange,
    weekStartsOn = 1,
  },
  ref
) {
  const containerRef = useRef(null);
  const scrollRef = useRef(null);
  const [showMonthIndicator, setShowMonthIndicator] = useState(false);
  const [indicatorMonth, setIndicatorMonth] = useState(currentDate);

  // Track touch state for gesture handling
  const touchStateRef = useRef({
    startY: 0,
    startTime: 0,
    lastY: 0,
    isDragging: false,
    velocity: 0,
  });

  // Track scroll state
  const scrollStateRef = useRef({
    isSnapping: false,
    lastScrollTop: 0,
    indicatorTimeout: null,
    initialized: false,
  });

  // Los 3 meses: anterior, actual, siguiente
  const months = useMemo(() => {
    const prevMonth = subMonths(currentDate, 1);
    const nextMonth = addMonths(currentDate, 1);
    return [prevMonth, currentDate, nextMonth];
  }, [currentDate]);

  const weekDays = getWeekDayNames(weekStartsOn, "short");

  // Altura de una sección de mes
  const getSectionHeight = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return 0;
    return container.scrollHeight / 3;
  }, []);

  // Centrar en el mes actual al montar y cuando cambie currentDate
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    // Usar requestAnimationFrame para asegurar que el DOM esté listo
    requestAnimationFrame(() => {
      const sectionHeight = container.scrollHeight / 3;
      // Saltar sin animación para centrar instantáneamente
      container.style.scrollBehavior = "auto";
      container.scrollTop = sectionHeight;
      scrollStateRef.current.lastScrollTop = sectionHeight;
      scrollStateRef.current.initialized = true;

      // Restaurar comportamiento después
      requestAnimationFrame(() => {
        container.style.scrollBehavior = "";
      });
    });
  }, [currentDate]);

  // Detectar en qué mes estamos basándonos en el scroll
  const getCurrentMonthIndex = useCallback(() => {
    const container = scrollRef.current;
    if (!container) return 1;

    const sectionHeight = getSectionHeight();
    if (sectionHeight === 0) return 1;

    const scrollTop = container.scrollTop;
    const index = Math.round(scrollTop / sectionHeight);
    return Math.max(0, Math.min(2, index));
  }, [getSectionHeight]);

  // Snap al mes más cercano con animación suave
  const snapToMonth = useCallback(
    (targetIndex) => {
      const container = scrollRef.current;
      if (!container || scrollStateRef.current.isSnapping) return;

      scrollStateRef.current.isSnapping = true;

      const sectionHeight = getSectionHeight();
      const targetScrollTop = targetIndex * sectionHeight;

      container.scrollTo({
        top: targetScrollTop,
        behavior: "smooth",
      });

      // Detectar cuando termine el scroll
      let frameCount = 0;
      const maxFrames = 60; // ~1 segundo máximo

      const checkScrollEnd = () => {
        frameCount++;
        const currentScroll = container.scrollTop;

        if (
          Math.abs(currentScroll - targetScrollTop) < 2 ||
          frameCount > maxFrames
        ) {
          scrollStateRef.current.isSnapping = false;
          scrollStateRef.current.lastScrollTop = container.scrollTop;

          // Cambiar de mes si es necesario
          if (targetIndex === 0) {
            onMonthChange(subMonths(currentDate, 1));
          } else if (targetIndex === 2) {
            onMonthChange(addMonths(currentDate, 1));
          }
        } else {
          requestAnimationFrame(checkScrollEnd);
        }
      };

      requestAnimationFrame(checkScrollEnd);
    },
    [currentDate, getSectionHeight, onMonthChange]
  );

  // Exponer métodos públicos para navegación programática desde el padre
  useImperativeHandle(
    ref,
    () => ({
      goToPreviousMonth: () => {
        if (!scrollStateRef.current.initialized) return;
        snapToMonth(0); // Scroll al mes anterior
      },
      goToNextMonth: () => {
        if (!scrollStateRef.current.initialized) return;
        snapToMonth(2); // Scroll al mes siguiente
      },
    }),
    [snapToMonth]
  );

  // Handle scroll events - solo para mostrar indicador
  const handleScroll = useCallback(() => {
    const container = scrollRef.current;
    if (!container || !scrollStateRef.current.initialized) return;
    if (scrollStateRef.current.isSnapping) return;

    // Mostrar indicador del mes
    const monthIndex = getCurrentMonthIndex();
    if (months[monthIndex]) {
      setIndicatorMonth(months[monthIndex]);
      setShowMonthIndicator(true);
    }

    // Ocultar indicador después de un tiempo
    if (scrollStateRef.current.indicatorTimeout) {
      clearTimeout(scrollStateRef.current.indicatorTimeout);
    }

    scrollStateRef.current.indicatorTimeout = setTimeout(() => {
      setShowMonthIndicator(false);
    }, 800);
  }, [getCurrentMonthIndex, months]);

  // Touch start
  const handleTouchStart = useCallback((e) => {
    if (scrollStateRef.current.isSnapping) return;

    const touch = e.touches[0];
    touchStateRef.current = {
      startY: touch.clientY,
      startTime: Date.now(),
      lastY: touch.clientY,
      isDragging: true,
      velocity: 0,
    };
  }, []);

  // Touch move - calcular velocidad
  const handleTouchMove = useCallback((e) => {
    if (!touchStateRef.current.isDragging) return;

    const touch = e.touches[0];
    const currentY = touch.clientY;
    const deltaTime = Date.now() - touchStateRef.current.startTime;

    // Calcular velocidad (pixels por segundo) basada en el desplazamiento total
    if (deltaTime > 0) {
      const totalDeltaY = touchStateRef.current.startY - currentY;
      touchStateRef.current.velocity = (totalDeltaY / deltaTime) * 1000;
    }

    touchStateRef.current.lastY = currentY;
  }, []);

  // Touch end - hacer snap
  const handleTouchEnd = useCallback(() => {
    if (!touchStateRef.current.isDragging) return;
    touchStateRef.current.isDragging = false;

    const container = scrollRef.current;
    if (!container || scrollStateRef.current.isSnapping) return;

    const sectionHeight = getSectionHeight();
    if (sectionHeight === 0) return;

    const currentScroll = container.scrollTop;
    const velocity = touchStateRef.current.velocity;

    // Determinar el mes target basándose en posición
    let targetIndex = Math.round(currentScroll / sectionHeight);

    // Si hay suficiente velocidad (> 400 px/s), forzar cambio de mes
    if (Math.abs(velocity) > 400) {
      if (velocity > 0) {
        // Deslizando hacia arriba = ir al mes siguiente
        targetIndex = Math.min(
          2,
          Math.floor(currentScroll / sectionHeight) + 1
        );
      } else {
        // Deslizando hacia abajo = ir al mes anterior
        targetIndex = Math.max(0, Math.ceil(currentScroll / sectionHeight) - 1);
      }
    }

    targetIndex = Math.max(0, Math.min(2, targetIndex));

    // Solo hacer snap si es necesario
    const currentIndex = Math.round(currentScroll / sectionHeight);
    const distanceFromSnap = Math.abs(
      currentScroll - currentIndex * sectionHeight
    );

    if (distanceFromSnap > 5 || targetIndex !== currentIndex) {
      snapToMonth(targetIndex);
    }
  }, [getSectionHeight, snapToMonth]);

  // Scroll end detection para desktop/wheel/trackpad
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;

    let scrollEndTimeout = null;
    let lastScrollTop = container.scrollTop;

    const handleScrollEnd = () => {
      // No hacer nada si estamos en medio de un snap o touch
      if (scrollStateRef.current.isSnapping || touchStateRef.current.isDragging)
        return;
      if (!scrollStateRef.current.initialized) return;

      clearTimeout(scrollEndTimeout);

      // Guardar posición actual
      lastScrollTop = container.scrollTop;

      scrollEndTimeout = setTimeout(() => {
        // Verificar si el scroll ha parado
        if (Math.abs(container.scrollTop - lastScrollTop) < 2) {
          const targetIndex = getCurrentMonthIndex();
          const sectionHeight = getSectionHeight();
          const currentScroll = container.scrollTop;

          // Solo hacer snap si no estamos exactamente en posición
          if (Math.abs(currentScroll - targetIndex * sectionHeight) > 5) {
            snapToMonth(targetIndex);
          }
        }
      }, 150);
    };

    container.addEventListener("scroll", handleScrollEnd, { passive: true });

    return () => {
      container.removeEventListener("scroll", handleScrollEnd);
      clearTimeout(scrollEndTimeout);
    };
  }, [getCurrentMonthIndex, getSectionHeight, snapToMonth]);

  // Manejar wheel del ratón para scroll más suave
  const handleWheel = useCallback(
    (e) => {
      // Solo prevenir el comportamiento por defecto si estamos dentro del contenedor
      const container = scrollRef.current;
      if (!container || scrollStateRef.current.isSnapping) return;
      if (!scrollStateRef.current.initialized) return;

      // Acumular delta del wheel
      if (!scrollStateRef.current.wheelAccumulator) {
        scrollStateRef.current.wheelAccumulator = 0;
      }

      scrollStateRef.current.wheelAccumulator += e.deltaY;

      // Limpiar timeout previo del wheel
      if (scrollStateRef.current.wheelTimeout) {
        clearTimeout(scrollStateRef.current.wheelTimeout);
      }

      // Después de que pare el wheel, hacer snap
      scrollStateRef.current.wheelTimeout = setTimeout(() => {
        const sectionHeight = getSectionHeight();
        const accumulated = scrollStateRef.current.wheelAccumulator;
        scrollStateRef.current.wheelAccumulator = 0;

        // Si hay suficiente acumulación, cambiar de mes
        if (Math.abs(accumulated) > 50) {
          const currentIndex = getCurrentMonthIndex();
          let targetIndex = currentIndex;

          if (accumulated > 0) {
            // Scroll hacia abajo = mes siguiente
            targetIndex = Math.min(2, currentIndex + 1);
          } else {
            // Scroll hacia arriba = mes anterior
            targetIndex = Math.max(0, currentIndex - 1);
          }

          if (targetIndex !== currentIndex) {
            snapToMonth(targetIndex);
          }
        }
      }, 100);
    },
    [getCurrentMonthIndex, getSectionHeight, snapToMonth]
  );

  // Limpiar timeouts al desmontar
  useEffect(() => {
    return () => {
      if (scrollStateRef.current.indicatorTimeout) {
        clearTimeout(scrollStateRef.current.indicatorTimeout);
      }
      if (scrollStateRef.current.wheelTimeout) {
        clearTimeout(scrollStateRef.current.wheelTimeout);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="h-full flex flex-col overflow-hidden relative"
    >
      {/* Indicador del mes durante scroll */}
      <AnimatePresence>
        {showMonthIndicator && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.15 }}
            className="absolute top-2 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
          >
            <div className="bg-[rgb(var(--bg-elevated))] shadow-lg rounded-full px-4 py-1.5 border border-[rgb(var(--border-base))]">
              <span className="text-sm font-semibold text-[rgb(var(--text-primary))] capitalize">
                {format(indicatorMonth, "MMMM yyyy", { locale: es })}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header con días de la semana - siempre fijo */}
      <div className="grid grid-cols-7 shrink-0 border-b border-[rgb(var(--border-base))] z-20 bg-[rgb(var(--bg-surface))]">
        {weekDays.map((day, idx) => (
          <div
            key={`${day}-${idx}`}
            className="text-center text-[10px] font-medium text-[rgb(var(--text-muted))] py-1.5 bg-[rgb(var(--bg-muted))]/50"
          >
            {day}
          </div>
        ))}
      </div>

      {/* Contenedor de scroll */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
        onWheel={handleWheel}
        className="flex-1 overflow-y-auto overflow-x-hidden overscroll-y-contain scroll-smooth"
        style={{
          WebkitOverflowScrolling: "touch",
          scrollbarWidth: "none",
          msOverflowStyle: "none",
        }}
      >
        {/* Los 3 meses apilados verticalmente - cada uno ocupa 100% de altura visible */}
        <div className="h-[300%]">
          {months.map((monthDate) => (
            <div key={format(monthDate, "yyyy-MM")} className="h-1/3">
              <MonthGrid
                monthDate={monthDate}
                selectedDate={selectedDate}
                eventsByDay={eventsByDay}
                onSelectDate={onSelectDate}
                onEventClick={onEventClick}
                onEventLongPress={onEventLongPress}
                onDayLongPress={onDayLongPress}
                weekStartsOn={weekStartsOn}
              />
            </div>
          ))}
        </div>
      </div>

      {/* CSS para ocultar scrollbar */}
      <style>{`
        div::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
});

export default VerticalMonthScroller;
