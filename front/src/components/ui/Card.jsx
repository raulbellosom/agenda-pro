import React from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

export function Card({
  className,
  children,
  variant = "default",
  animate = false,
}) {
  const variants = {
    default:
      "bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border-hover))]",
    elevated:
      "bg-[rgb(var(--bg-elevated))] border border-[rgb(var(--border-hover))] shadow-lg",
    glass: "card",
    glassElevated: "glass-elevated",
  };

  const Comp = animate ? motion.div : "div";
  const animateProps = animate
    ? {
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] },
      }
    : {};

  return (
    <Comp
      className={clsx("rounded-2xl", variants[variant], className)}
      {...animateProps}
    >
      {children}
    </Comp>
  );
}

export function CardHeader({ title, subtitle, right, className }) {
  return (
    <div
      className={clsx("p-5 flex items-start justify-between gap-4", className)}
    >
      <div>
        <div className="text-xl font-semibold tracking-tight text-[rgb(var(--text-primary))]">
          {title}
        </div>
        {subtitle && (
          <div className="mt-1 text-sm text-[rgb(var(--text-secondary))]">
            {subtitle}
          </div>
        )}
      </div>
      {right && <div className="shrink-0">{right}</div>}
    </div>
  );
}

export function CardBody({ className, children }) {
  return <div className={clsx("px-5 pb-5", className)}>{children}</div>;
}

export function CardFooter({ className, children }) {
  return (
    <div
      className={clsx(
        "px-5 py-4 border-t border-[rgb(var(--border-hover))] flex items-center justify-end gap-3",
        className
      )}
    >
      {children}
    </div>
  );
}
