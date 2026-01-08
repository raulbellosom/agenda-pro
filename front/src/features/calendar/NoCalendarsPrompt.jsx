import React from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Plus,
  Sparkles,
  CalendarPlus,
  ArrowRight,
  CalendarDays,
  Palette,
  Users,
} from "lucide-react";

/**
 * NoCalendarsPrompt - Componente que se muestra cuando el usuario no tiene calendarios
 * Ofrece una experiencia visual atractiva para guiar al usuario a crear su primer calendario
 */
export function NoCalendarsPrompt({ onCreateCalendar }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-full flex items-center justify-center p-4 sm:p-6 overflow-y-auto"
    >
      <div className="max-w-md w-full text-center py-8">
        {/* Animated illustration */}
        <div className="relative mb-6 sm:mb-8">
          {/* Background glow */}
          <motion.div
            className="absolute inset-0 blur-3xl"
            animate={{
              background: [
                "radial-gradient(circle, rgba(var(--brand-primary), 0.15) 0%, transparent 70%)",
                "radial-gradient(circle, rgba(var(--brand-primary), 0.25) 0%, transparent 70%)",
                "radial-gradient(circle, rgba(var(--brand-primary), 0.15) 0%, transparent 70%)",
              ],
            }}
            transition={{ duration: 3, repeat: Infinity }}
          />

          {/* Main icon container */}
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{
              type: "spring",
              stiffness: 200,
              damping: 15,
              delay: 0.2,
            }}
            className="relative mx-auto w-24 h-24 sm:w-32 sm:h-32"
          >
            {/* Outer ring */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute inset-0 rounded-full border-2 border-dashed border-[rgb(var(--brand-primary))]/30"
            />

            {/* Inner container */}
            <div className="absolute inset-3 sm:inset-4 rounded-xl sm:rounded-2xl bg-linear-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary))]/60 shadow-xl shadow-[rgb(var(--brand-primary))]/20 flex items-center justify-center">
              <CalendarPlus className="w-8 h-8 sm:w-12 sm:h-12 text-white" />
            </div>

            {/* Floating sparkles */}
            <motion.div
              animate={{ y: [-5, 5, -5], x: [0, 3, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2"
            >
              <Sparkles className="w-4 h-4 sm:w-6 sm:h-6 text-amber-500" />
            </motion.div>

            <motion.div
              animate={{ y: [5, -5, 5], x: [0, -3, 0] }}
              transition={{ duration: 2.5, repeat: Infinity }}
              className="absolute -bottom-1 -left-1"
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-pink-500" />
            </motion.div>
          </motion.div>
        </div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 sm:space-y-4 px-2"
        >
          <h2 className="text-xl sm:text-2xl font-bold text-[rgb(var(--text-primary))]">
            ¡Comienza tu viaje!
          </h2>
          <p className="text-sm sm:text-base text-[rgb(var(--text-muted))] max-w-sm mx-auto">
            Crea tu primer calendario para empezar a organizar tus eventos y
            nunca perderte de nada importante.
          </p>
        </motion.div>

        {/* Features preview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-6 sm:mt-8 grid grid-cols-3 gap-2 sm:gap-3 px-2"
        >
          {[
            { Icon: CalendarDays, label: "Organiza", color: "text-violet-500" },
            { Icon: Palette, label: "Personaliza", color: "text-pink-500" },
            { Icon: Users, label: "Comparte", color: "text-cyan-500" },
          ].map((item, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.6 + idx * 0.1 }}
              className="p-2 sm:p-3 rounded-lg sm:rounded-xl bg-[rgb(var(--bg-muted))] border border-[rgb(var(--border-base))]"
            >
              <div className="flex justify-center mb-1">
                <item.Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${item.color}`} />
              </div>
              <div className="text-[10px] sm:text-xs font-medium text-[rgb(var(--text-secondary))]">
                {item.label}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="mt-6 sm:mt-8 px-2"
        >
          <motion.button
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.97 }}
            onClick={onCreateCalendar}
            className="group relative inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-linear-to-r from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary))]/80 text-white text-sm sm:text-base font-semibold shadow-xl shadow-[rgb(var(--brand-primary))]/25 hover:shadow-2xl hover:shadow-[rgb(var(--brand-primary))]/30 transition-all duration-300 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Crear mi primer calendario
            <motion.div
              animate={{ x: [0, 4, 0] }}
              transition={{ duration: 1.5, repeat: Infinity }}
            >
              <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
            </motion.div>
            {/* Shine effect */}
            <motion.div
              className="absolute inset-0 rounded-2xl overflow-hidden"
              initial={{ x: "-100%" }}
              animate={{ x: "200%" }}
              transition={{ duration: 2, repeat: Infinity, repeatDelay: 3 }}
            >
              <div className="w-1/3 h-full bg-linear-to-r from-transparent via-white/20 to-transparent skew-x-12" />
            </motion.div>
          </motion.button>
        </motion.div>

        {/* Helper text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="mt-4 sm:mt-6 text-xs text-[rgb(var(--text-muted))] flex items-center justify-center gap-1.5 px-2"
        >
          Solo toma unos segundos
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
        </motion.p>
      </div>
    </motion.div>
  );
}

/**
 * NoCalendarsBanner - Banner compacto que aparece cuando se intenta crear un evento sin calendario
 */
export function NoCalendarsBanner({ onCreateCalendar, className = "" }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className={`p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
          <Calendar className="w-5 h-5 text-amber-500" />
        </div>
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-[rgb(var(--text-primary))]">
            Necesitas un calendario
          </h4>
          <p className="text-sm text-[rgb(var(--text-muted))] mt-0.5">
            Para crear eventos, primero debes tener al menos un calendario
            activo.
          </p>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreateCalendar}
            className="mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 text-white text-sm font-medium hover:bg-amber-600 transition-colors"
          >
            <Plus className="w-4 h-4" />
            Crear calendario
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/**
 * EmptyCalendarsList - Versión compacta para la sidebar
 */
export function EmptyCalendarsList({ onCreateCalendar }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="text-center py-6 px-4"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", delay: 0.1 }}
        className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center"
      >
        <Calendar className="w-6 h-6 text-[rgb(var(--brand-primary))]" />
      </motion.div>
      <p className="text-sm text-[rgb(var(--text-muted))] mb-3">
        No hay calendarios
      </p>
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={onCreateCalendar}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))] text-xs font-medium hover:bg-[rgb(var(--brand-primary))]/20 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" />
        Crear calendario
      </motion.button>
    </motion.div>
  );
}
