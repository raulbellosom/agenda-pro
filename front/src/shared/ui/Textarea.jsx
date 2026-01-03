import clsx from "clsx";
import { forwardRef } from "react";
import { motion } from "framer-motion";

export const Textarea = forwardRef(
  ({ className, label, error, rows = 3, ...props }, ref) => {
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
          <textarea
            ref={ref}
            rows={rows}
            className={clsx(
              "w-full rounded-2xl",
              "bg-[rgb(var(--bg-subtle))]",
              "px-4 py-3 text-base",
              "placeholder:text-[rgb(var(--muted))]",
              "border-2 border-transparent",
              "focus:border-[rgb(var(--brand-1))] focus:bg-[rgb(var(--bg))]",
              "hover:bg-[rgb(var(--bg))]",
              "outline-none transition-all duration-200",
              "resize-none",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              error &&
                "border-[rgb(var(--bad))] focus:border-[rgb(var(--bad))]",
              className
            )}
            {...props}
          />
        </div>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            className="mt-2 text-sm text-[rgb(var(--bad))] flex items-center gap-2"
          >
            {error}
          </motion.div>
        )}
      </motion.label>
    );
  }
);

Textarea.displayName = "Textarea";
