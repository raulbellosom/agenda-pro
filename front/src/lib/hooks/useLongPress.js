import { useRef, useCallback, useEffect } from "react";

/**
 * Hook para detectar long press de forma robusta en móvil y desktop.
 * Optimizado para PWAs en iOS y Android con prevención de conflictos de gestos.
 *
 * @param {Function} onLongPress - Callback cuando se detecta long press
 * @param {Function} onClick - Callback para click normal (opcional)
 * @param {Object} options - Opciones de configuración
 * @param {boolean} options.shouldPreventDefault - Prevenir comportamiento por defecto (default: true)
 * @param {number} options.delay - Tiempo en ms para activar long press (default: 400)
 * @param {number} options.moveTolerance - Tolerancia de movimiento en px (default: 10)
 * @param {boolean} options.cancelOnMove - Cancelar si hay movimiento (default: true)
 */
export function useLongPress(
  onLongPress,
  onClick,
  {
    shouldPreventDefault = true,
    delay = 400,
    moveTolerance = 10,
    cancelOnMove = true,
  } = {}
) {
  const timeout = useRef(null);
  const target = useRef(null);
  const isLongPress = useRef(false);
  const startPosition = useRef({ x: 0, y: 0 });
  const isCancelled = useRef(false);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeout.current) {
        clearTimeout(timeout.current);
      }
    };
  }, []);

  // Obtener posición del evento (touch o mouse)
  const getEventPosition = useCallback((event) => {
    if (event.touches && event.touches.length > 0) {
      return { x: event.touches[0].clientX, y: event.touches[0].clientY };
    }
    if (event.changedTouches && event.changedTouches.length > 0) {
      return {
        x: event.changedTouches[0].clientX,
        y: event.changedTouches[0].clientY,
      };
    }
    return { x: event.clientX, y: event.clientY };
  }, []);

  const handleMove = useCallback(
    (event) => {
      if (!cancelOnMove || isCancelled.current) return;

      const currentPosition = getEventPosition(event);
      const deltaX = Math.abs(currentPosition.x - startPosition.current.x);
      const deltaY = Math.abs(currentPosition.y - startPosition.current.y);

      // Si se movió más de la tolerancia, cancelar el long press
      if (deltaX > moveTolerance || deltaY > moveTolerance) {
        isCancelled.current = true;
        if (timeout.current) {
          clearTimeout(timeout.current);
          timeout.current = null;
        }
      }
    },
    [cancelOnMove, moveTolerance, getEventPosition]
  );

  const start = useCallback(
    (event) => {
      // NO detener propagación al inicio - permitir que el gesto de swipe detecte el evento
      // Solo detendremos propagación cuando se confirme el long press

      // Ignorar si es multitouch (más de un dedo)
      if (event.touches && event.touches.length > 1) {
        return;
      }

      // Guardar posición inicial
      startPosition.current = getEventPosition(event);
      isLongPress.current = false;
      isCancelled.current = false;

      // Configurar target para manejo de eventos
      if (event.target) {
        target.current = event.target;

        // Agregar listener de movimiento para cancelar si se mueve
        if (cancelOnMove) {
          document.addEventListener("touchmove", handleMove, { passive: true });
          document.addEventListener("mousemove", handleMove);
        }
      }

      // Configurar el timeout para long press
      timeout.current = setTimeout(() => {
        if (!isCancelled.current) {
          isLongPress.current = true;

          // Vibrar en dispositivos que lo soporten (feedback háptico)
          if (navigator.vibrate) {
            navigator.vibrate(50);
          }

          // Obtener posición actual para el context menu
          const position = startPosition.current;

          onLongPress(event, position);
        }
      }, delay);
    },
    [onLongPress, delay, cancelOnMove, handleMove, getEventPosition]
  );

  const clear = useCallback(
    (event, shouldTriggerClick = true) => {
      // Solo detener propagación si fue un long press confirmado
      if (isLongPress.current && event && event.stopPropagation) {
        event.stopPropagation();
      }

      // Limpiar timeout
      if (timeout.current) {
        clearTimeout(timeout.current);
        timeout.current = null;
      }

      // Limpiar listeners de movimiento
      document.removeEventListener("touchmove", handleMove);
      document.removeEventListener("mousemove", handleMove);

      // Trigger click si corresponde
      if (
        shouldTriggerClick &&
        !isLongPress.current &&
        !isCancelled.current &&
        onClick
      ) {
        // Pequeño delay para evitar conflictos con otros eventos
        requestAnimationFrame(() => {
          onClick(event);
        });
      }

      // Prevenir default en touchend si fue long press
      if (
        shouldPreventDefault &&
        isLongPress.current &&
        event &&
        event.cancelable
      ) {
        event.preventDefault();
      }

      target.current = null;
    },
    [shouldPreventDefault, onClick, handleMove]
  );

  // Cancelar si hay un segundo toque
  const handleTouchStart = useCallback(
    (event) => {
      // NO detener propagación inmediatamente - permitir que el swipe funcione

      if (event.touches && event.touches.length > 1) {
        // Multitouch detectado, cancelar
        isCancelled.current = true;
        if (timeout.current) {
          clearTimeout(timeout.current);
          timeout.current = null;
        }
        return;
      }
      start(event);
    },
    [start]
  );

  return {
    onMouseDown: (e) => {
      // NO detener propagación - permitir que el swipe funcione
      start(e);
    },
    onTouchStart: handleTouchStart,
    onMouseUp: (e) => {
      // Solo detener propagación si fue long press
      if (isLongPress.current && e && e.stopPropagation) {
        e.stopPropagation();
      }
      clear(e);
    },
    onMouseLeave: (e) => clear(e, false),
    onTouchEnd: (e) => {
      // Solo detener propagación si fue long press
      if (isLongPress.current && e && e.stopPropagation) {
        e.stopPropagation();
      }
      clear(e);
    },
    onTouchCancel: (e) => clear(e, false),
    // Context menu handler para desktop (right click)
    onContextMenu: (e) => {
      if (onLongPress) {
        e.preventDefault();
        const position = { x: e.clientX, y: e.clientY };
        onLongPress(e, position);
      }
    },
  };
}

/**
 * Hook mejorado para long press con posición
 * Útil para context menus
 */
export function useLongPressWithPosition(onLongPress, onClick, options = {}) {
  const handlers = useLongPress(
    (event, position) => {
      if (onLongPress) {
        onLongPress(event, position || { x: 0, y: 0 });
      }
    },
    onClick,
    options
  );

  return handlers;
}

export default useLongPress;
