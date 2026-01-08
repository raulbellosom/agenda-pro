import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, X, Plus } from "lucide-react";

/**
 * Banner dismissible que sugiere crear un grupo (no bloquea)
 */
export function NoGroupsBanner({ onCreateGroup, onDismiss }) {
  const [isDismissed, setIsDismissed] = useState(() => {
    return localStorage.getItem("dismissed_no_groups_banner") === "true";
  });

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem("dismissed_no_groups_banner", "true");
    onDismiss?.();
  };

  if (isDismissed) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="mx-4 mt-4 mb-2 p-4 rounded-xl bg-gradient-to-r from-[rgb(var(--brand-primary))]/10 to-[rgb(var(--brand-secondary))]/10 border border-[rgb(var(--brand-primary))]/20 relative"
      >
        <button
          onClick={handleDismiss}
          className="absolute top-2 right-2 p-1 rounded-lg hover:bg-[rgb(var(--bg-hover))] transition-colors"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4 text-[rgb(var(--text-secondary))]" />
        </button>

        <div className="flex items-start gap-3 pr-8">
          <div className="w-10 h-10 rounded-xl bg-[rgb(var(--brand-primary))]/20 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
          </div>

          <div className="flex-1">
            <h3 className="text-sm font-semibold text-[rgb(var(--text-primary))] mb-1">
              ¿Trabajas en equipo?
            </h3>
            <p className="text-xs text-[rgb(var(--text-secondary))] mb-3">
              Crea un espacio de trabajo para compartir calendarios con tu
              equipo o familia.
            </p>
            <button
              onClick={onCreateGroup}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgb(var(--brand-primary))] text-white text-xs font-medium hover:bg-[rgb(var(--brand-primary))]/90 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              Crear espacio
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
