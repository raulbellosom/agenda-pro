import React from "react";
import { motion } from "framer-motion";
import clsx from "clsx";

/**
 * Toggle Switch elegante y accesible
 */
export function SettingsToggle({
  enabled,
  onToggle,
  disabled = false,
  size = "md",
  label,
  description,
  icon: Icon,
  className,
}) {
  const sizes = {
    sm: { track: "w-9 h-5", thumb: "w-4 h-4", translate: 16 },
    md: { track: "w-11 h-6", thumb: "w-5 h-5", translate: 20 },
    lg: { track: "w-14 h-7", thumb: "w-6 h-6", translate: 28 },
  };

  const currentSize = sizes[size];

  const handleClick = () => {
    if (!disabled) {
      onToggle?.(!enabled);
    }
  };

  const toggle = (
    <button
      type="button"
      role="switch"
      aria-checked={enabled}
      onClick={handleClick}
      disabled={disabled}
      className={clsx(
        "relative rounded-full transition-colors duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand-primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg-surface))]",
        currentSize.track,
        enabled
          ? "bg-[rgb(var(--brand-primary))]"
          : "bg-[rgb(var(--text-muted))]/30",
        disabled && "opacity-50 cursor-not-allowed"
      )}
    >
      <motion.span
        initial={false}
        animate={{ x: enabled ? currentSize.translate : 2 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className={clsx(
          "absolute top-1 rounded-full bg-white shadow-sm",
          currentSize.thumb
        )}
      />
    </button>
  );

  if (!label) return toggle;

  return (
    <div
      className={clsx(
        "flex items-center justify-between gap-4 p-4 rounded-xl",
        "bg-[rgb(var(--bg-muted))]/50 hover:bg-[rgb(var(--bg-muted))]",
        "transition-colors duration-200",
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div
            className={clsx(
              "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
              "transition-colors duration-200",
              enabled
                ? "bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))]"
                : "bg-[rgb(var(--text-muted))]/10 text-[rgb(var(--text-muted))]"
            )}
          >
            <Icon className="w-5 h-5" />
          </div>
        )}
        <div className="min-w-0">
          <div className="font-medium text-[rgb(var(--text-primary))] truncate">
            {label}
          </div>
          {description && (
            <div className="text-sm text-[rgb(var(--text-muted))] mt-0.5 line-clamp-2">
              {description}
            </div>
          )}
        </div>
      </div>
      {toggle}
    </div>
  );
}

/**
 * Select elegante para settings
 */
export function SettingsSelect({
  value,
  onChange,
  options = [],
  disabled = false,
  label,
  description,
  icon: Icon,
  className,
}) {
  return (
    <div
      className={clsx(
        "flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl",
        "bg-[rgb(var(--bg-muted))]/50 hover:bg-[rgb(var(--bg-muted))]",
        "transition-colors duration-200",
        className
      )}
    >
      <div className="flex items-center gap-3 min-w-0">
        {Icon && (
          <div className="w-10 h-10 rounded-xl bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center shrink-0">
            <Icon className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
          </div>
        )}
        <div className="min-w-0">
          <div className="font-medium text-[rgb(var(--text-primary))] truncate">
            {label}
          </div>
          {description && (
            <div className="text-sm text-[rgb(var(--text-muted))] mt-0.5 line-clamp-2">
              {description}
            </div>
          )}
        </div>
      </div>
      <select
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled}
        className={clsx(
          "px-4 py-2.5 rounded-xl text-sm font-medium",
          "bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border-base))]",
          "text-[rgb(var(--text-primary))]",
          "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))] focus:border-transparent",
          "hover:border-[rgb(var(--border-hover))]",
          "transition-all duration-200",
          "cursor-pointer min-w-[140px] sm:min-w-[180px]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}

/**
 * Input elegante para settings
 */
export function SettingsInput({
  value,
  onChange,
  placeholder,
  disabled = false,
  label,
  description,
  hint,
  error,
  icon: Icon,
  type = "text",
  className,
}) {
  return (
    <div className={clsx("space-y-2", className)}>
      {(label || description) && (
        <div className="flex items-center gap-3">
          {Icon && (
            <div className="w-8 h-8 rounded-lg bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center shrink-0">
              <Icon className="w-4 h-4 text-[rgb(var(--brand-primary))]" />
            </div>
          )}
          <div>
            {label && (
              <div className="text-sm font-medium text-[rgb(var(--text-secondary))]">
                {label}
              </div>
            )}
            {description && (
              <div className="text-xs text-[rgb(var(--text-muted))]">
                {description}
              </div>
            )}
          </div>
        </div>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className={clsx(
          "w-full px-4 py-3 rounded-xl text-sm",
          "bg-[rgb(var(--bg-muted))] border border-[rgb(var(--border-base))]",
          "text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))]",
          "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))] focus:border-transparent focus:bg-[rgb(var(--bg-surface))]",
          "hover:border-[rgb(var(--border-hover))]",
          "transition-all duration-200",
          error && "border-[rgb(var(--error))] focus:ring-[rgb(var(--error))]",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      />
      {hint && !error && (
        <p className="text-xs text-[rgb(var(--text-muted))] pl-1">{hint}</p>
      )}
      {error && (
        <p className="text-xs text-[rgb(var(--error))] pl-1">{error}</p>
      )}
    </div>
  );
}
