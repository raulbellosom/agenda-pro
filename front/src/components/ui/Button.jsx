import React from "react";
import { motion } from "framer-motion";
import clsx from "clsx";
import { Loader2 } from "lucide-react";

export function Button({
  variant = "primary",
  size = "md",
  leftIcon,
  rightIcon,
  loading = false,
  className,
  children,
  disabled,
  ...rest
}) {
  const isDisabled = disabled || loading;

  const base = clsx(
    "relative inline-flex items-center justify-center gap-2 select-none font-medium",
    "transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand-primary))] focus-visible:ring-offset-2"
  );

  const sizes = {
    xs: "h-8 px-3 text-xs rounded-lg",
    sm: "h-9 px-3.5 text-sm rounded-lg",
    md: "h-10 px-4 text-sm rounded-xl",
    lg: "h-11 px-5 text-base rounded-xl",
    xl: "h-12 px-6 text-base rounded-xl",
  }[size];

  const variants = {
    primary: clsx(
      "bg-[rgb(var(--brand-primary))] text-white",
      "hover:bg-[rgb(var(--brand-dark))]",
      "active:scale-[0.98]",
      "shadow-sm hover:shadow-md",
      isDisabled &&
        "opacity-50 cursor-not-allowed hover:bg-[rgb(var(--brand-primary))]"
    ),
    secondary: clsx(
      "bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-primary))]",
      "border border-[rgb(var(--border-base))]",
      "hover:bg-[rgb(var(--bg-hover))] hover:border-[rgb(var(--border-strong))]",
      "active:scale-[0.98]",
      isDisabled && "opacity-50 cursor-not-allowed"
    ),
    soft: clsx(
      "bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))]",
      "hover:bg-[rgb(var(--brand-primary))]/20",
      "active:scale-[0.98]",
      isDisabled && "opacity-50 cursor-not-allowed"
    ),
    ghost: clsx(
      "bg-transparent text-[rgb(var(--text-secondary))]",
      "hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))]",
      "active:scale-[0.98]",
      isDisabled && "opacity-50 cursor-not-allowed"
    ),
    outline: clsx(
      "bg-transparent text-[rgb(var(--text-primary))]",
      "border border-[rgb(var(--border-base))]",
      "hover:bg-[rgb(var(--bg-hover))]",
      "active:scale-[0.98]",
      isDisabled && "opacity-50 cursor-not-allowed"
    ),
    danger: clsx(
      "bg-[rgb(var(--error))] text-white",
      "hover:opacity-90",
      "active:scale-[0.98]",
      isDisabled && "opacity-50 cursor-not-allowed"
    ),
  }[variant];

  return (
    <motion.button
      whileTap={isDisabled ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 500, damping: 30 }}
      className={clsx(base, sizes, variants, className)}
      disabled={isDisabled}
      {...rest}
    >
      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Cargando...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
}
