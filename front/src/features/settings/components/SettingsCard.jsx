import React from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

/**
 * Card container para secciones de settings
 * Componente atómico reutilizable
 */
export function SettingsCard({
  children,
  className,
  padding = "md",
  hover = false,
  glow = false,
}) {
  const paddings = {
    none: "",
    sm: "p-4",
    md: "p-5 sm:p-6",
    lg: "p-6 sm:p-8",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      whileHover={hover ? { y: -2, scale: 1.005 } : undefined}
      className={clsx(
        "relative rounded-2xl border border-[rgb(var(--border-base))]",
        "bg-[rgb(var(--bg-surface))]",
        "overflow-hidden transition-all duration-300",
        hover &&
          "cursor-pointer hover:border-[rgb(var(--border-hover))] hover:shadow-lg",
        glow && "hover:shadow-[0_0_30px_-5px_rgba(var(--brand-primary),0.15)]",
        paddings[padding],
        className
      )}
    >
      {children}
    </motion.div>
  );
}

/**
 * Header para SettingsCard
 */
export function SettingsCardHeader({
  icon: Icon,
  title,
  description,
  action,
  iconColor = "brand",
}) {
  const iconColors = {
    brand: "bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))]",
    success: "bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]",
    warning: "bg-[rgb(var(--warning))]/10 text-[rgb(var(--warning))]",
    error: "bg-[rgb(var(--error))]/10 text-[rgb(var(--error))]",
    muted: "bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-muted))]",
  };

  return (
    <div className="flex items-start justify-between gap-4 mb-6">
      <div className="flex items-center gap-3 sm:gap-4">
        {Icon && (
          <div
            className={clsx(
              "w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center shrink-0",
              "transition-transform duration-300 group-hover:scale-110",
              iconColors[iconColor]
            )}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
        )}
        <div className="min-w-0">
          <h3 className="text-base sm:text-lg font-semibold text-[rgb(var(--text-primary))] truncate">
            {title}
          </h3>
          {description && (
            <p className="text-sm text-[rgb(var(--text-muted))] mt-0.5 line-clamp-2">
              {description}
            </p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/**
 * Divider para SettingsCard
 */
export function SettingsCardDivider({ className }) {
  return (
    <div
      className={clsx(
        "h-px bg-linear-to-r from-transparent via-[rgb(var(--border-base))] to-transparent my-6",
        className
      )}
    />
  );
}

/**
 * Row item para mostrar datos key-value
 */
export function SettingsRow({
  label,
  value,
  icon: Icon,
  action,
  border = true,
  className,
}) {
  return (
    <div
      className={clsx(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4 py-3",
        border && "border-b border-[rgb(var(--border-base))] last:border-0",
        className
      )}
    >
      <div className="flex items-center gap-3 text-sm text-[rgb(var(--text-muted))]">
        {Icon && <Icon className="w-4 h-4 shrink-0" />}
        <span>{label}</span>
      </div>
      <div className="flex items-center gap-3 sm:ml-auto">
        <span className="text-sm font-medium text-[rgb(var(--text-secondary))]">
          {value}
        </span>
        {action}
      </div>
    </div>
  );
}
