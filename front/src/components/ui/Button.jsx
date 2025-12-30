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
    "relative inline-flex items-center justify-center gap-2.5 select-none font-semibold",
    "transition-all duration-200 overflow-hidden",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand-1))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg))]"
  );

  const sizes = {
    sm: "min-h-10 px-4 text-sm rounded-xl",
    md: "min-h-12 px-5 text-base rounded-2xl",
    lg: "min-h-14 px-6 text-lg rounded-2xl",
  }[size];

  const variants = {
    primary: clsx(
      "gradient-brand text-white shadow-lg",
      "hover:shadow-xl hover:scale-[1.02]",
      "active:scale-[0.98]",
      isDisabled &&
        "opacity-50 cursor-not-allowed hover:scale-100 hover:shadow-lg"
    ),
    secondary: clsx(
      "bg-[rgb(var(--bg-subtle))] text-[rgb(var(--text))]",
      "border-2 border-[rgb(var(--card-hover))]",
      "hover:border-[rgb(var(--brand-1))] hover:bg-[rgb(var(--card))]",
      "active:scale-[0.98]",
      isDisabled && "opacity-50 cursor-not-allowed"
    ),
    soft: clsx(
      "bg-[rgb(var(--brand-1))]/10 text-[rgb(var(--brand-1))]",
      "hover:bg-[rgb(var(--brand-1))]/20",
      "active:scale-[0.98]",
      isDisabled && "opacity-50 cursor-not-allowed"
    ),
    ghost: clsx(
      "bg-transparent text-[rgb(var(--text))]",
      "hover:bg-[rgb(var(--bg-subtle))]",
      "active:scale-[0.98]",
      isDisabled && "opacity-50 cursor-not-allowed"
    ),
    danger: clsx(
      "bg-[rgb(var(--bad))] text-white",
      "hover:opacity-90 hover:scale-[1.02]",
      "active:scale-[0.98]",
      isDisabled && "opacity-50 cursor-not-allowed hover:scale-100"
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
      {/* Shimmer effect on primary */}
      {variant === "primary" && !isDisabled && (
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
          initial={{ x: "-100%" }}
          animate={{ x: "100%" }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut",
          }}
        />
      )}

      {loading ? (
        <>
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="shrink-0"
          >
            <Loader2 className="w-5 h-5" />
          </motion.span>
          <span className="relative">Cargando...</span>
        </>
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          <span className="relative">{children}</span>
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </motion.button>
  );
}
