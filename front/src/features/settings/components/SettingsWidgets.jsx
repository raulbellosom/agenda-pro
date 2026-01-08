import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  Camera,
  Edit3,
  Eye,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";

/**
 * Avatar con controles de edición
 */
export function SettingsAvatar({
  src,
  initials = "?",
  size = "lg",
  loading = false,
  editable = true,
  onView,
  onUpload,
  className,
}) {
  const sizes = {
    sm: "w-16 h-16 text-xl",
    md: "w-20 h-20 text-2xl",
    lg: "w-28 h-28 sm:w-32 sm:h-32 text-3xl sm:text-4xl",
    xl: "w-36 h-36 sm:w-40 sm:h-40 text-4xl sm:text-5xl",
  };

  const handleClick = () => {
    if (src && onView) {
      onView();
    } else if (editable && onUpload) {
      onUpload();
    }
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={loading}
      whileHover={{ scale: editable ? 1.02 : 1 }}
      whileTap={{ scale: editable ? 0.98 : 1 }}
      className={clsx(
        "relative rounded-2xl overflow-hidden group",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-[rgb(var(--brand-primary))] focus-visible:ring-offset-2 focus-visible:ring-offset-[rgb(var(--bg-surface))]",
        sizes[size],
        editable && "cursor-pointer",
        className
      )}
    >
      {/* Avatar Image or Initials */}
      {src ? (
        <img src={src} alt="Avatar" className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-linear-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-dark))] flex items-center justify-center">
          <span className="font-bold text-white">{initials.toUpperCase()}</span>
        </div>
      )}

      {/* Hover Overlay */}
      <AnimatePresence>
        {editable && !loading && (
          <motion.div
            initial={{ opacity: 0 }}
            whileHover={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
          >
            {src ? (
              <Eye className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            ) : (
              <Camera className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 flex items-center justify-center"
          >
            <Loader2 className="w-8 h-8 text-white animate-spin" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Edit badge */}
      {editable && !loading && (
        <div className="absolute -bottom-1 -right-1 w-8 h-8 rounded-full bg-[rgb(var(--brand-primary))] text-white flex items-center justify-center shadow-lg">
          <Edit3 className="w-4 h-4" />
        </div>
      )}
    </motion.button>
  );
}

/**
 * Alert/Banner para settings
 */
export function SettingsAlert({
  type = "info",
  title,
  description,
  icon: CustomIcon,
  action,
  onDismiss,
  className,
}) {
  const types = {
    info: {
      bg: "bg-[rgb(var(--brand-primary))]/5 border-[rgb(var(--brand-primary))]/20",
      icon: "text-[rgb(var(--brand-primary))]",
      title: "text-[rgb(var(--brand-primary))]",
    },
    success: {
      bg: "bg-[rgb(var(--success))]/5 border-[rgb(var(--success))]/20",
      icon: "text-[rgb(var(--success))]",
      title: "text-[rgb(var(--success))]",
    },
    warning: {
      bg: "bg-[rgb(var(--warning))]/5 border-[rgb(var(--warning))]/20",
      icon: "text-[rgb(var(--warning))]",
      title: "text-[rgb(var(--warning))]",
    },
    error: {
      bg: "bg-[rgb(var(--error))]/5 border-[rgb(var(--error))]/20",
      icon: "text-[rgb(var(--error))]",
      title: "text-[rgb(var(--error))]",
    },
  };

  const defaultIcons = {
    info: AlertCircle,
    success: CheckCircle,
    warning: AlertCircle,
    error: AlertCircle,
  };

  const style = types[type];
  const Icon = CustomIcon || defaultIcons[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={clsx(
        "p-4 rounded-xl border flex items-start gap-3",
        style.bg,
        className
      )}
    >
      <Icon className={clsx("w-5 h-5 shrink-0 mt-0.5", style.icon)} />
      <div className="flex-1 min-w-0">
        {title && (
          <p className={clsx("font-medium text-sm", style.title)}>{title}</p>
        )}
        {description && (
          <p className="text-sm text-[rgb(var(--text-secondary))] mt-0.5">
            {description}
          </p>
        )}
        {action && <div className="mt-3">{action}</div>}
      </div>
    </motion.div>
  );
}

/**
 * Progress/Strength indicator
 */
export function SettingsStrength({
  score = 0,
  maxScore = 5,
  label,
  colors = {
    1: "rgb(var(--error))",
    2: "rgb(var(--warning))",
    3: "rgb(var(--warning))",
    4: "rgb(var(--success))",
    5: "rgb(var(--success))",
  },
}) {
  const color = colors[Math.min(score, maxScore)] || "rgb(var(--text-muted))";

  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {Array.from({ length: maxScore }).map((_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors duration-300"
            style={{
              backgroundColor: i < score ? color : "rgb(var(--bg-muted))",
            }}
          />
        ))}
      </div>
      {label && (
        <p className="text-xs font-medium" style={{ color }}>
          {label}
        </p>
      )}
    </div>
  );
}

/**
 * Skeleton loader para settings
 */
export function SettingsSkeleton({ rows = 3, className }) {
  return (
    <div className={clsx("animate-pulse space-y-4", className)}>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[rgb(var(--bg-muted))]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 rounded bg-[rgb(var(--bg-muted))]" />
            <div className="h-3 w-1/2 rounded bg-[rgb(var(--bg-muted))]" />
          </div>
        </div>
      ))}
    </div>
  );
}
