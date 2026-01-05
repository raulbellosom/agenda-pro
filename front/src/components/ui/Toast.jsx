import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";

export function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="fixed top-4 left-0 right-0 z-9999 flex items-start justify-center px-4 pointer-events-none">
      <div className="w-full max-w-md space-y-3">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -30, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.9 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="pointer-events-auto bg-[rgb(var(--bg-elevated))] rounded-2xl p-5 shadow-2xl border-2 border-[rgb(var(--border-base))]"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`shrink-0 w-12 h-12 rounded-xl flex items-center justify-center ${
                    t.type === "success"
                      ? "bg-[rgb(var(--success))]/20 text-[rgb(var(--success))]"
                      : t.type === "info"
                      ? "bg-[rgb(var(--info))]/20 text-[rgb(var(--info))]"
                      : "bg-[rgb(var(--error))]/20 text-[rgb(var(--error))]"
                  }`}
                >
                  {t.type === "success" ? (
                    <CheckCircle className="w-6 h-6" />
                  ) : t.type === "info" ? (
                    <Info className="w-6 h-6" />
                  ) : (
                    <AlertCircle className="w-6 h-6" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-base text-[rgb(var(--text-primary))]">
                    {t.title}
                  </div>
                  {t.message && (
                    <div className="mt-1.5 text-sm text-[rgb(var(--text-secondary))] line-clamp-2">
                      {t.message}
                    </div>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.15 }}
                  whileTap={{ scale: 0.9 }}
                  className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center hover:bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition-colors"
                  onClick={() => onDismiss(t.id)}
                >
                  <X className="w-5 h-5" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
