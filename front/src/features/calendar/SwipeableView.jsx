import React from "react";
import { useCalendarSwipe } from "../../lib/hooks";

/**
 * Wrapper component que agrega capacidades de swipe a cualquier vista del calendario.
 * Útil para vistas que necesitan navegación por swipe horizontal.
 */
export function SwipeableView({
  children,
  onNext,
  onPrevious,
  enabled = true,
  className = "",
  style = {},
}) {
  const {
    bind,
    style: swipeStyle,
    isDragging,
  } = useCalendarSwipe({
    onNext,
    onPrevious,
    enabled,
  });

  return (
    <div
      {...bind()}
      className={`${className} ${isDragging ? "select-none" : ""}`}
      style={{
        touchAction: "pan-y",
        ...style,
        ...swipeStyle,
      }}
    >
      {children}
    </div>
  );
}

export default SwipeableView;
