import React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { X, AlertCircle, CheckCircle, Info } from "lucide-react";

export function ToastViewport({ toasts, onDismiss }) {
  return (
    <div className="fixed top-4 left-0 right-0 z-50 flex items-start justify-center px-4 pointer-events-none">
      <div className="w-full max-w-md space-y-3">
        <AnimatePresence>
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="pointer-events-auto glass-elevated rounded-2xl p-4 shadow-lg"
            >
              <div className="flex items-start gap-3">
                <div
                  className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center ${
                    t.type === "success"
                      ? "bg-[rgb(var(--success))]/15 text-[rgb(var(--success))]"
                      : t.type === "info"
                      ? "bg-[rgb(var(--info))]/15 text-[rgb(var(--info))]"
                      : "bg-[rgb(var(--error))]/15 text-[rgb(var(--error))]"
                  }`}
                >
                  {t.type === "success" ? (
                    <CheckCircle className="w-5 h-5" />
                  ) : t.type === "info" ? (
                    <Info className="w-5 h-5" />
                  ) : (
                    <AlertCircle className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-[rgb(var(--text-primary))]">
                    {t.title}
                  </div>
                  {t.message && (
                    <div className="mt-1 text-sm text-[rgb(var(--text-secondary))] line-clamp-2">
                      {t.message}
                    </div>
                  )}
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="shrink-0 w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] transition-colors"
                  onClick={() => onDismiss(t.id)}
                >
                  <X className="w-4 h-4" />
                </motion.button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
