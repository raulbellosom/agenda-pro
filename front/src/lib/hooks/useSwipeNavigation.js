import { useCallback, useRef, useState, useEffect } from "react";
import { useDrag } from "@use-gesture/react";

/**
 * Hook para manejar gestos de swipe de forma consistente en móvil y desktop.
 * Optimizado para PWAs en iOS y Android.
 *
 * Soporta:
 * - Touch swipe en móviles
 * - Mouse drag en desktop
 * - Trackpad gestures (2 dedos) en laptop
 *
 * @param {Object} options - Opciones de configuración
 * @param {Function} options.onSwipeLeft - Callback cuando se hace swipe a la izquierda (siguiente)
 * @param {Function} options.onSwipeRight - Callback cuando se hace swipe a la derecha (anterior)
 * @param {Function} options.onSwipeUp - Callback cuando se hace swipe hacia arriba
 * @param {Function} options.onSwipeDown - Callback cuando se hace swipe hacia abajo
 * @param {number} options.threshold - Distancia mínima en px para activar el swipe (default: 50)
 * @param {number} options.velocityThreshold - Velocidad mínima para activar swipe rápido (default: 0.3)
 * @param {boolean} options.horizontal - Habilitar swipes horizontales (default: true)
 * @param {boolean} options.vertical - Habilitar swipes verticales (default: false)
 * @param {boolean} options.preventScroll - Prevenir scroll durante el gesto (default: false)
 * @param {boolean} options.enabled - Si los gestos están habilitados (default: true)
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
  preventScroll = false,
  enabled = true,
} = {}) {
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const directionLockedRef = useRef(null);
  const swipeTriggeredRef = useRef(false);
  const elementRef = useRef(null);
  const wheelStateRef = useRef({
    accumulator: 0,
    timeout: null,
    isWheeling: false,
  });

  // Función para manejar wheel (trackpad)
  const handleWheel = useCallback(
    (e) => {
      if (!enabled || !horizontal) return;

      // Solo procesar si es un gesto de trackpad horizontal (no zoom)
      if (e.ctrlKey || e.deltaMode !== 0) return;

      // Detectar si es principalmente horizontal
      if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 5) {
        e.preventDefault();

        const ws = wheelStateRef.current;
        if (!ws.isWheeling) {
          ws.isWheeling = true;
          ws.accumulator = 0;
        }

        ws.accumulator += e.deltaX;

        // Limpiar timeout anterior
        if (ws.timeout) clearTimeout(ws.timeout);

        // Cuando el usuario deja de hacer scroll, evaluar
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

  // Efecto para limpiar el timeout de wheel al desmontar
  useEffect(() => {
    return () => {
      if (wheelStateRef.current.timeout) {
        clearTimeout(wheelStateRef.current.timeout);
      }
    };
  }, []);

  const bind = useDrag(
    (state) => {
      const {
        active,
        movement: [mx, my],
        velocity: [vx, vy],
        first,
        last,
        cancel,
        memo,
      } = state;

      if (!enabled) {
        if (cancel) cancel();
        return memo;
      }

      const absX = Math.abs(mx);
      const absY = Math.abs(my);

      // En el primer movimiento, inicializar
      if (first) {
        directionLockedRef.current = null;
        swipeTriggeredRef.current = false;
        setIsDragging(true);
        return { startTime: Date.now() };
      }

      // Bloquear dirección después de cierto movimiento (8px threshold)
      if (!directionLockedRef.current && (absX > 8 || absY > 8)) {
        const isHorizontalGesture = absX > absY;

        if (isHorizontalGesture && horizontal) {
          directionLockedRef.current = "horizontal";
        } else if (!isHorizontalGesture && vertical) {
          directionLockedRef.current = "vertical";
        } else {
          // No es la dirección que esperamos, no interferir
          setIsDragging(false);
          setDragOffset({ x: 0, y: 0 });
          return memo;
        }
      }

      // Si tenemos una dirección bloqueada, aplicar el offset visual
      if (directionLockedRef.current && active) {
        const resistanceFactor = 0.5;
        setDragOffset({
          x:
            directionLockedRef.current === "horizontal"
              ? mx * resistanceFactor
              : 0,
          y:
            directionLockedRef.current === "vertical"
              ? my * resistanceFactor
              : 0,
        });
      }

      // Al soltar, determinar si activamos el swipe
      if (last) {
        setIsDragging(false);
        setDragOffset({ x: 0, y: 0 });

        if (!directionLockedRef.current || swipeTriggeredRef.current) {
          directionLockedRef.current = null;
          return memo;
        }

        const absVx = Math.abs(vx);
        const absVy = Math.abs(vy);

        // Verificar si cumple con el threshold
        if (directionLockedRef.current === "horizontal") {
          const shouldTrigger = absX > threshold || absVx > velocityThreshold;
          if (shouldTrigger) {
            swipeTriggeredRef.current = true;
            if (mx < 0 && onSwipeLeft) {
              onSwipeLeft();
            } else if (mx > 0 && onSwipeRight) {
              onSwipeRight();
            }
          }
        } else if (directionLockedRef.current === "vertical") {
          const shouldTrigger = absY > threshold || absVy > velocityThreshold;
          if (shouldTrigger) {
            swipeTriggeredRef.current = true;
            if (my < 0 && onSwipeUp) {
              onSwipeUp();
            } else if (my > 0 && onSwipeDown) {
              onSwipeDown();
            }
          }
        }

        directionLockedRef.current = null;
      }

      return memo;
    },
    {
      filterTaps: true,
      threshold: 5,
      rubberband: false,
      pointer: {
        touch: true,
        mouse: true,
      },
      eventOptions: { passive: false },
    }
  );

  // Wrapper para bind que agrega ref y wheel handler
  const bindWithRef = useCallback(() => {
    const handlers = bind();
    return {
      ...handlers,
      ref: (el) => {
        // Limpiar listener anterior si existe
        if (elementRef.current && elementRef.current !== el) {
          elementRef.current.removeEventListener("wheel", handleWheel);
        }

        elementRef.current = el;

        // Agregar listener de wheel para trackpad
        if (el && horizontal) {
          el.addEventListener("wheel", handleWheel, { passive: false });
        }

        // Si el handler original tiene ref, llamarlo también
        if (handlers.ref) {
          if (typeof handlers.ref === "function") {
            handlers.ref(el);
          } else {
            handlers.ref.current = el;
          }
        }
      },
    };
  }, [bind, handleWheel, horizontal]);

  // Limpiar listener de wheel al desmontar
  useEffect(() => {
    return () => {
      if (elementRef.current) {
        elementRef.current.removeEventListener("wheel", handleWheel);
      }
    };
  }, [handleWheel]);

  return {
    bind: bindWithRef,
    isDragging,
    dragOffset,
    style: isDragging
      ? {
          transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
          transition: "none",
          willChange: "transform",
          userSelect: "none",
        }
      : {
          transform: "translate3d(0, 0, 0)",
          transition: "transform 0.2s ease-out",
        },
  };
}

/**
 * Hook simplificado para navegación de calendario
 * Específico para cambiar entre períodos (día, semana, mes)
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

/**
 * Hook para detectar swipe desde los bordes de la pantalla
 * Útil para navegación cuando hay scroll horizontal interno
 */
export function useEdgeSwipe({
  onSwipeLeft,
  onSwipeRight,
  edgeWidth = 40,
  enabled = true,
}) {
  const startXRef = useRef(0);
  const isFromEdgeRef = useRef(false);

  return useSwipeNavigation({
    onSwipeLeft: () => {
      if (isFromEdgeRef.current) {
        onSwipeLeft?.();
      }
    },
    onSwipeRight: () => {
      if (isFromEdgeRef.current) {
        onSwipeRight?.();
      }
    },
    horizontal: true,
    vertical: false,
    threshold: 50,
    velocityThreshold: 0.3,
    enabled,
  });
}

export default useSwipeNavigation;
