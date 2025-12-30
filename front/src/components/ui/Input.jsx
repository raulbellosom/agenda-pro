import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import { Eye, EyeOff, AlertCircle } from "lucide-react";

export function Input({
  label,
  hint,
  error,
  className,
  type = "text",
  icon: Icon,
  ...rest
}) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const inputType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <motion.label
      className="block"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {label && (
        <div className="mb-2 text-sm font-medium text-[rgb(var(--text-secondary))]">
          {label}
        </div>
      )}
      <div className="relative group">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[rgb(var(--muted))] group-focus-within:text-[rgb(var(--brand-1))] transition-colors duration-200">
            <Icon className="w-5 h-5" />
          </div>
        )}
        <input
          type={inputType}
          className={clsx(
            "w-full min-h-[var(--tap)] rounded-2xl",
            "bg-[rgb(var(--bg-subtle))]",
            "px-4 text-base",
            "placeholder:text-[rgb(var(--muted))]",
            "border-2 border-transparent",
            "focus:border-[rgb(var(--brand-1))] focus:bg-[rgb(var(--bg))]",
            "hover:bg-[rgb(var(--bg))]",
            "outline-none transition-all duration-200",
            Icon && "pl-12",
            isPassword && "pr-12",
            error && "border-[rgb(var(--bad))] focus:border-[rgb(var(--bad))]",
            className
          )}
          {...rest}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className={clsx(
              "absolute right-4 top-1/2 -translate-y-1/2",
              "text-[rgb(var(--muted))] hover:text-[rgb(var(--text))]",
              "transition-colors duration-200",
              "p-1 rounded-lg hover:bg-white/5"
            )}
            tabIndex={-1}
          >
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={showPassword ? "visible" : "hidden"}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.15 }}
              >
                {showPassword ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </motion.div>
            </AnimatePresence>
          </button>
        )}
      </div>
      <AnimatePresence mode="wait">
        {error ? (
          <motion.div
            key="error"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-2 text-sm text-[rgb(var(--bad))] flex items-center gap-1.5"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </motion.div>
        ) : hint ? (
          <motion.div
            key="hint"
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className="mt-2 text-sm text-[rgb(var(--muted))]"
          >
            {hint}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </motion.label>
  );
}
