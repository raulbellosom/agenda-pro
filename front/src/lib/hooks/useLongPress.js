import { useRef, useCallback } from "react";

export function useLongPress(
  onLongPress,
  onClick,
  { shouldPreventDefault = true, delay = 500 } = {}
) {
  const timeout = useRef();
  const target = useRef();
  const isLongPress = useRef(false);

  const start = useCallback(
    (event) => {
      if (shouldPreventDefault && event.target) {
        event.target.addEventListener("touchend", preventDefault, {
          passive: false,
        });
        target.current = event.target;
      }

      isLongPress.current = false;

      timeout.current = setTimeout(() => {
        isLongPress.current = true;
        onLongPress(event);
      }, delay);
    },
    [onLongPress, delay, shouldPreventDefault]
  );

  const clear = useCallback(
    (event, shouldTriggerClick = true) => {
      timeout.current && clearTimeout(timeout.current);

      if (shouldTriggerClick && !isLongPress.current && onClick) {
        onClick(event);
      }

      if (shouldPreventDefault && target.current) {
        target.current.removeEventListener("touchend", preventDefault);
      }
    },
    [shouldPreventDefault, onClick]
  );

  return {
    onMouseDown: (e) => start(e),
    onTouchStart: (e) => start(e),
    onMouseUp: (e) => clear(e),
    onMouseLeave: (e) => clear(e, false),
    onTouchEnd: (e) => clear(e),
  };
}

const preventDefault = (event) => {
  if (!isTouchEvent(event)) return;

  if (event.touches.length < 2 && event.preventDefault) {
    event.preventDefault();
  }
};

const isTouchEvent = (event) => {
  return "touches" in event;
};
