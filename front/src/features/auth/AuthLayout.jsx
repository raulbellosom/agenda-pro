import React from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";

export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-[rgb(var(--bg-base))] relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Top gradient */}
        <div
          className="absolute -top-1/4 -left-1/4 w-[600px] h-[600px] rounded-full opacity-20"
          style={{
            background:
              "radial-gradient(circle, rgb(var(--brand-primary)) 0%, transparent 70%)",
          }}
        />
        {/* Bottom gradient */}
        <div
          className="absolute -bottom-1/4 -right-1/4 w-[500px] h-[500px] rounded-full opacity-15"
          style={{
            background:
              "radial-gradient(circle, rgb(var(--brand-secondary)) 0%, transparent 70%)",
          }}
        />
        {/* Grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage: `
              linear-gradient(rgb(var(--text-primary)) 1px, transparent 1px),
              linear-gradient(90deg, rgb(var(--text-primary)) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="relative w-full max-w-md"
      >
        <div className="bg-[rgb(var(--bg-surface))]/80 backdrop-blur-xl rounded-2xl border border-[rgb(var(--border-base))] p-8 shadow-xl">
          {/* Logo */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4">
              <img
                src="/logo.png"
                alt="Agenda Pro"
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold text-[rgb(var(--brand-primary))]">
                Agenda
              </span>
              <span className="text-xl font-bold text-orange-500">Pro</span>
            </div>
          </div>

          {/* Title */}
          {title && (
            <h1 className="text-2xl font-bold text-center text-[rgb(var(--text-primary))] mb-2">
              {title}
            </h1>
          )}
          {subtitle && (
            <p className="text-center text-[rgb(var(--text-muted))] mb-8">
              {subtitle}
            </p>
          )}

          {/* Content */}
          {children}
        </div>

        {/* Footer text */}
        <p className="text-center text-xs text-[rgb(var(--text-muted))] mt-6">
          Al continuar, aceptas nuestros{" "}
          <a
            href="/terms"
            className="text-[rgb(var(--brand-primary))] hover:underline"
          >
            Términos de servicio
          </a>{" "}
          y{" "}
          <a
            href="/privacy"
            className="text-[rgb(var(--brand-primary))] hover:underline"
          >
            Política de privacidad
          </a>
        </p>
      </motion.div>
    </div>
  );
}
