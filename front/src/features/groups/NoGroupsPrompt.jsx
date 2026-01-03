import React from "react";
import { motion } from "framer-motion";
import {
  Users,
  Plus,
  Sparkles,
  ArrowRight,
  Calendar,
  Shield,
} from "lucide-react";

/**
 * NoGroupsPrompt - Componente que se muestra cuando el usuario no tiene grupos
 * Debe crearse antes de poder acceder a calendarios y eventos
 */
export function NoGroupsPrompt({ onCreateGroup }) {
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
            className="relative w-24 h-24 sm:w-32 sm:h-32 mx-auto rounded-2xl sm:rounded-3xl bg-linear-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary))]/60 flex items-center justify-center shadow-2xl shadow-[rgb(var(--brand-primary))]/30"
          >
            <Users
              className="w-12 h-12 sm:w-16 sm:h-16 text-white"
              strokeWidth={1.5}
            />

            {/* Floating icons */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, 0],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: 0.5,
              }}
              className="absolute -top-1 -right-1 sm:-top-2 sm:-right-2 w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-linear-to-br from-[rgb(var(--brand-secondary))] to-[rgb(var(--brand-secondary))]/60 flex items-center justify-center shadow-xl"
            >
              <Calendar
                className="w-5 h-5 sm:w-6 sm:h-6 text-white"
                strokeWidth={2}
              />
            </motion.div>

            <motion.div
              animate={{
                y: [0, 10, 0],
                rotate: [0, -5, 0],
              }}
              transition={{
                duration: 2.5,
                repeat: Infinity,
                delay: 1,
              }}
              className="absolute -bottom-1 -left-1 sm:-bottom-2 sm:-left-2 w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-linear-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-xl"
            >
              <Sparkles
                className="w-4 h-4 sm:w-5 sm:h-5 text-white"
                strokeWidth={2}
              />
            </motion.div>
          </motion.div>
        </div>

        {/* Text content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 sm:space-y-4 px-2"
        >
          <h2 className="text-2xl sm:text-3xl font-bold text-[rgb(var(--text-primary))]">
            ¡Bienvenido a Agenda Pro!
          </h2>
          <p className="text-sm sm:text-base text-[rgb(var(--text-secondary))] max-w-sm mx-auto leading-relaxed">
            Para comenzar, necesitas crear tu primer{" "}
            <span className="font-semibold text-[rgb(var(--brand-primary))]">
              espacio de trabajo
            </span>
            . Este será tu lugar para organizar calendarios y eventos.
          </p>
        </motion.div>

        {/* Features list */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="mt-6 sm:mt-8 space-y-2 sm:space-y-3 px-2"
        >
          {[
            {
              icon: Users,
              text: "Organiza tus calendarios en espacios",
            },
            {
              icon: Shield,
              text: "Controla quien puede ver tus eventos",
            },
            {
              icon: Calendar,
              text: "Comparte con familiares y equipos",
            },
          ].map((feature, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.7 + index * 0.1 }}
              className="flex items-center gap-2 sm:gap-3 text-left bg-[rgb(var(--bg-surface))] rounded-xl sm:rounded-2xl p-3 sm:p-4 border border-[rgb(var(--border-base))]"
            >
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center shrink-0">
                <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-[rgb(var(--brand-primary))]" />
              </div>
              <span className="text-xs sm:text-sm text-[rgb(var(--text-secondary))] font-medium">
                {feature.text}
              </span>
            </motion.div>
          ))}
        </motion.div>

        {/* CTA Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mt-6 sm:mt-8 px-2"
        >
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onCreateGroup}
            className="group relative inline-flex items-center gap-2 sm:gap-3 px-6 sm:px-8 py-3 sm:py-4 rounded-xl sm:rounded-2xl bg-linear-to-r from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary))]/80 text-white text-sm sm:text-base font-semibold shadow-xl shadow-[rgb(var(--brand-primary))]/25 hover:shadow-2xl hover:shadow-[rgb(var(--brand-primary))]/30 transition-all duration-300 w-full sm:w-auto"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
            Crear mi primer espacio
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
          transition={{ delay: 1.1 }}
          className="mt-4 sm:mt-6 text-xs text-[rgb(var(--text-muted))] flex items-center justify-center gap-1.5 px-2"
        >
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
          Se creará automáticamente un calendario personal
        </motion.p>
      </div>
    </motion.div>
  );
}
