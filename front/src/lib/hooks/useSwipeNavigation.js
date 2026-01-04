import { useCallback, useRef, useState, useEffect } from "react";

/**
 * Hook para manejar gestos de swipe de forma consistente en móvil y desktop.
 * Implementación nativa para máxima compatibilidad con iOS y Android.
 *
 * Soporta:
 * - Touch swipe en móviles (eventos nativos)
 * - Mouse drag en desktop
 * - Trackpad gestures (2 dedos) en laptop
 */
export function useSwipeNavigation({
  onSwipeLeft,
  onSwipeRight,
  onSwipeUp,
  onSwipeDown,
  threshold = 50,
  velocityThreshold = 0.3,
  horizontal = true,
  vertical = false,
  enabled = true,
} = {}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  const elementRef = useRef(null);
  const stateRef = useRef({
    isActive: false,
    startX: 0,
    startY: 0,
    startTime: 0,
    currentX: 0,
    currentY: 0,
    directionLocked: null, // 'horizontal' | 'vertical' | null
  });

  const wheelStateRef = useRef({
    accumulator: 0,
    timeout: null,
    isWheeling: false,
  });

  // Obtener posición del evento
  const getEventPosition = useCallback((e) => {
    if (e.touches && e.touches.length > 0) {
      return { x: e.touches[0].clientX, y: e.touches[0].clientY };
    }
    if (e.changedTouches && e.changedTouches.length > 0) {
      return { x: e.changedTouches[0].clientX, y: e.changedTouches[0].clientY };
    }
    return { x: e.clientX, y: e.clientY };
  }, []);

  // Manejar inicio del gesto
  const handleStart = useCallback(
    (e) => {
      if (!enabled) return;

      // Ignorar multitouch
      if (e.touches && e.touches.length > 1) return;

      const pos = getEventPosition(e);
      const state = stateRef.current;

      state.isActive = true;
      state.startX = pos.x;
      state.startY = pos.y;
      state.currentX = pos.x;
      state.currentY = pos.y;
      state.startTime = Date.now();
      state.directionLocked = null;

      setIsDragging(true);
    },
    [enabled, getEventPosition]
  );

  // Manejar movimiento
  const handleMove = useCallback(
    (e) => {
      const state = stateRef.current;
      if (!state.isActive || !enabled) return;

      const pos = getEventPosition(e);
      state.currentX = pos.x;
      state.currentY = pos.y;

      const dx = pos.x - state.startX;
      const dy = pos.y - state.startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // Bloquear dirección después de 10px de movimiento
      if (!state.directionLocked && (absX > 10 || absY > 10)) {
        const isHorizontalGesture = absX > absY;

        if (isHorizontalGesture && horizontal) {
          state.directionLocked = "horizontal";
        } else if (!isHorizontalGesture && vertical) {
          state.directionLocked = "vertical";
        } else {
          // No es la dirección que esperamos, cancelar
          state.isActive = false;
          setIsDragging(false);
          setDragOffset({ x: 0, y: 0 });
          return;
        }
      }

      // Si tenemos dirección bloqueada, prevenir scroll y actualizar offset
      if (state.directionLocked) {
        e.preventDefault();

        const resistanceFactor = 0.6;
        setDragOffset({
          x: state.directionLocked === "horizontal" ? dx * resistanceFactor : 0,
          y: state.directionLocked === "vertical" ? dy * resistanceFactor : 0,
        });
      }
    },
    [enabled, horizontal, vertical, getEventPosition]
  );

  // Manejar fin del gesto
  const handleEnd = useCallback(
    (e) => {
      const state = stateRef.current;
      if (!state.isActive) return;

      state.isActive = false;
      setIsDragging(false);
      setDragOffset({ x: 0, y: 0 });

      if (!state.directionLocked) return;

      const pos = getEventPosition(e);
      const dx = pos.x - state.startX;
      const dy = pos.y - state.startY;
      const absX = Math.abs(dx);
      const absY = Math.abs(dy);

      // Calcular velocidad
      const duration = (Date.now() - state.startTime) / 1000;
      const velocityX = absX / duration / 1000;
      const velocityY = absY / duration / 1000;

      // Verificar si cumple threshold
      if (state.directionLocked === "horizontal") {
        const shouldTrigger = absX > threshold || velocityX > velocityThreshold;
        if (shouldTrigger) {
          if (dx < 0 && onSwipeLeft) {
            onSwipeLeft();
          } else if (dx > 0 && onSwipeRight) {
            onSwipeRight();
          }
        }
      } else if (state.directionLocked === "vertical") {
        const shouldTrigger = absY > threshold || velocityY > velocityThreshold;
        if (shouldTrigger) {
          if (dy < 0 && onSwipeUp) {
            onSwipeUp();
          } else if (dy > 0 && onSwipeDown) {
            onSwipeDown();
          }
        }
      }

      state.directionLocked = null;
    },
    [
      threshold,
      velocityThreshold,
      onSwipeLeft,
      onSwipeRight,
      onSwipeUp,
      onSwipeDown,
      getEventPosition,
    ]
  );

  // Cancelar gesto
  const handleCancel = useCallback(() => {
    const state = stateRef.current;
    state.isActive = false;
    state.directionLocked = null;
    setIsDragging(false);
    setDragOffset({ x: 0, y: 0 });
  }, []);

  // Manejar wheel (trackpad)
  const handleWheel = useCallback(
    (e) => {
      if (!enabled || !horizontal) return;

      // Solo procesar si es un gesto de trackpad horizontal
      if (e.ctrlKey || e.deltaMode !== 0) return;

      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 5) {
        e.preventDefault();

        const ws = wheelStateRef.current;
        if (!ws.isWheeling) {
          ws.isWheeling = true;
          ws.accumulator = 0;
        }

        ws.accumulator += e.deltaX;

        if (ws.timeout) clearTimeout(ws.timeout);

        ws.timeout = setTimeout(() => {
          if (Math.abs(ws.accumulator) > threshold) {
            if (ws.accumulator > 0 && onSwipeLeft) {
              onSwipeLeft();
            } else if (ws.accumulator < 0 && onSwipeRight) {
              onSwipeRight();
            }
          }
          ws.accumulator = 0;
          ws.isWheeling = false;
        }, 150);
      }
    },
    [enabled, horizontal, threshold, onSwipeLeft, onSwipeRight]
  );

  // Configurar event listeners
  useEffect(() => {
    const el = elementRef.current;
    if (!el) return;

    // Touch events
    el.addEventListener("touchstart", handleStart, { passive: true });
    el.addEventListener("touchmove", handleMove, { passive: false });
    el.addEventListener("touchend", handleEnd, { passive: true });
    el.addEventListener("touchcancel", handleCancel, { passive: true });

    // Mouse events
    el.addEventListener("mousedown", handleStart);
    el.addEventListener("mousemove", handleMove);
    el.addEventListener("mouseup", handleEnd);
    el.addEventListener("mouseleave", handleCancel);

    // Wheel events (trackpad)
    if (horizontal) {
      el.addEventListener("wheel", handleWheel, { passive: false });
    }

    return () => {
      el.removeEventListener("touchstart", handleStart);
      el.removeEventListener("touchmove", handleMove);
      el.removeEventListener("touchend", handleEnd);
      el.removeEventListener("touchcancel", handleCancel);
      el.removeEventListener("mousedown", handleStart);
      el.removeEventListener("mousemove", handleMove);
      el.removeEventListener("mouseup", handleEnd);
      el.removeEventListener("mouseleave", handleCancel);
      el.removeEventListener("wheel", handleWheel);
    };
  }, [
    handleStart,
    handleMove,
    handleEnd,
    handleCancel,
    handleWheel,
    horizontal,
  ]);

  // Limpiar wheel timeout al desmontar
  useEffect(() => {
    return () => {
      if (wheelStateRef.current.timeout) {
        clearTimeout(wheelStateRef.current.timeout);
      }
    };
  }, []);

  // Función bind que devuelve el ref
  const bind = useCallback(() => {
    return {
      ref: elementRef,
    };
  }, []);

  return {
    bind,
    isDragging,
    dragOffset,
  };
}

/**
 * Hook simplificado para navegación de calendario
 */
export function useCalendarSwipe({ onNext, onPrevious, enabled = true }) {
  return useSwipeNavigation({
    onSwipeLeft: onNext,
    onSwipeRight: onPrevious,
    horizontal: true,
    vertical: false,
    threshold: 60,
    velocityThreshold: 0.4,
    enabled,
  });
}

export default useSwipeNavigation;
