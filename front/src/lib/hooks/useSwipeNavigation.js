import { useCallback, useRef, useState } from "react";
import { useGesture } from "@use-gesture/react";

/**
 * Hook para manejar gestos de swipe de forma consistente en móvil y desktop.
 * Optimizado para PWAs en iOS y Android.
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
  const isSwipingRef = useRef(false);
  const startTimeRef = useRef(0);

  // Calcular si el gesto debería activar un swipe
  const shouldSwipe = useCallback(
    (direction, distance, velocity) => {
      const absDistance = Math.abs(distance);
      const absVelocity = Math.abs(velocity);

      // Swipe por distancia o por velocidad
      return absDistance > threshold || absVelocity > velocityThreshold;
    },
    [threshold, velocityThreshold]
  );

  const bind = useGesture(
    {
      onDragStart: ({ event }) => {
        if (!enabled) return;

        setIsDragging(true);
        isSwipingRef.current = false;
        startTimeRef.current = Date.now();

        // En móvil, prevenir el comportamiento por defecto si se solicita
        if (preventScroll && event.cancelable) {
          event.preventDefault();
        }
      },

      onDrag: ({
        movement: [mx, my],
        velocity: [vx, vy],
        direction: [dx, dy],
        event,
        cancel,
      }) => {
        if (!enabled) {
          cancel?.();
          return;
        }

        // Determinar si es principalmente horizontal o vertical
        const absX = Math.abs(mx);
        const absY = Math.abs(my);

        // Si ya determinamos que estamos haciendo swipe, continuar con el offset
        if (!isSwipingRef.current) {
          // Determinar la dirección principal del gesto
          if (absX > 10 || absY > 10) {
            const isHorizontalGesture = absX > absY;

            if (isHorizontalGesture && horizontal) {
              isSwipingRef.current = true;
              // Prevenir scroll vertical durante swipe horizontal
              if (event.cancelable) {
                event.preventDefault();
              }
            } else if (!isHorizontalGesture && vertical) {
              isSwipingRef.current = true;
              if (event.cancelable) {
                event.preventDefault();
              }
            }
          }
        }

        if (isSwipingRef.current) {
          // Aplicar un factor de resistencia para el feedback visual
          const resistanceFactor = 0.4;
          setDragOffset({
            x: horizontal ? mx * resistanceFactor : 0,
            y: vertical ? my * resistanceFactor : 0,
          });
        }
      },

      onDragEnd: ({
        movement: [mx, my],
        velocity: [vx, vy],
        direction: [dx, dy],
      }) => {
        if (!enabled) {
          setIsDragging(false);
          setDragOffset({ x: 0, y: 0 });
          return;
        }

        const wasSwipe = isSwipingRef.current;
        const timeDelta = Date.now() - startTimeRef.current;

        setIsDragging(false);
        setDragOffset({ x: 0, y: 0 });
        isSwipingRef.current = false;

        if (!wasSwipe) return;

        // Solo procesar si el gesto fue lo suficientemente rápido (< 500ms)
        // o si la distancia fue significativa
        const isQuickSwipe = timeDelta < 500;
        const absX = Math.abs(mx);
        const absY = Math.abs(my);

        // Determinar dirección principal
        if (horizontal && absX > absY) {
          // Swipe horizontal
          if (shouldSwipe("horizontal", mx, vx)) {
            if (mx < 0 && onSwipeLeft) {
              // Swipe hacia la izquierda = siguiente
              onSwipeLeft();
            } else if (mx > 0 && onSwipeRight) {
              // Swipe hacia la derecha = anterior
              onSwipeRight();
            }
          }
        } else if (vertical && absY > absX) {
          // Swipe vertical
          if (shouldSwipe("vertical", my, vy)) {
            if (my < 0 && onSwipeUp) {
              onSwipeUp();
            } else if (my > 0 && onSwipeDown) {
              onSwipeDown();
            }
          }
        }
      },
    },
    {
      drag: {
        // Configuración importante para móviles
        filterTaps: true,
        threshold: 5,
        // Esto es crucial para iOS - previene el bounce del scroll
        rubberband: false,
        // Axis lock para mejor detección
        axis:
          horizontal && !vertical
            ? "x"
            : vertical && !horizontal
            ? "y"
            : undefined,
        // Opciones de pointer para mejor compatibilidad móvil
        pointer: {
          touch: true,
          mouse: true,
        },
      },
    }
  );

  return {
    bind,
    isDragging,
    dragOffset,
    // Style helper para aplicar transformación durante el drag
    style: isDragging
      ? {
          transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0)`,
          transition: "none",
          touchAction: horizontal ? "pan-y" : vertical ? "pan-x" : "none",
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
    threshold: 60, // Un poco más alto para evitar conflictos con scroll interno
    velocityThreshold: 0.4, // Velocidad más alta para gestos intencionales
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
    // Custom handler para detectar inicio desde el borde
    onDragStart: (state) => {
      const { xy } = state;
      const screenWidth = window.innerWidth;
      startXRef.current = xy[0];
      // Detectar si el gesto comenzó desde el borde izquierdo o derecho
      isFromEdgeRef.current =
        xy[0] < edgeWidth || xy[0] > screenWidth - edgeWidth;
    },
  });
}

export default useSwipeNavigation;
