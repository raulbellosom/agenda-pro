import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, User, Clock, Bell, Info } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

export function NotificationDetailsModal({ notification, onClose }) {
  if (!notification) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md bg-[rgb(var(--bg-surface))] rounded-2xl shadow-xl overflow-hidden border border-[rgb(var(--border-base))]"
        >
          {/* Header */}
          <div className="px-6 py-4 border-b border-[rgb(var(--border-base))] flex items-center justify-between bg-[rgb(var(--bg-muted))]/30">
            <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] flex items-center gap-2">
              <Info className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
              Detalles de la notificación
            </h3>
            <button
              onClick={onClose}
              className="p-2 -mr-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            <h4 className="text-xl font-medium text-[rgb(var(--text-primary))] mb-2">
              {notification.title}
            </h4>
            <p className="text-[rgb(var(--text-secondary))] leading-relaxed mb-6">
              {notification.body}
            </p>

            <div className="space-y-3 pt-4 border-t border-[rgb(var(--border-base))]">
              <div className="flex items-center gap-3 text-sm text-[rgb(var(--text-secondary))]">
                <Clock className="w-4 h-4 text-[rgb(var(--text-muted))]" />
                <span>
                  {format(new Date(notification.createdAt), "PPpp", {
                    locale: es,
                  })}
                </span>
              </div>

              {notification.metadata && (
                <div className="mt-4 p-3 bg-[rgb(var(--bg-muted))] rounded-lg text-sm font-mono text-[rgb(var(--text-muted))] overflow-x-auto">
                  {/* Render metadata if useful, or generic info */}
                  <div className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-[rgb(var(--text-muted))] opacity-70">
                      Info Adicional
                    </span>
                    <pre className="whitespace-pre-wrap font-sans text-[rgb(var(--text-secondary))]">
                      {typeof notification.metadata === "string"
                        ? notification.metadata
                        : JSON.stringify(notification.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-[rgb(var(--bg-muted))]/30 border-t border-[rgb(var(--border-base))] flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg bg-[rgb(var(--bg-hover))] hover:bg-[rgb(var(--bg-base))] text-[rgb(var(--text-primary))] font-medium transition-colors"
            >
              Cerrar
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
