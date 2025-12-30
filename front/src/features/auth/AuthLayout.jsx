import React from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";

// Animated floating orbs for background effect - Manantial de fantasía
function FloatingOrbs() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Main cyan orb - manantial principal */}
      <motion.div
        className="absolute w-[500px] h-[500px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(34,211,238,0.25) 0%, rgba(34,211,238,0) 70%)",
          filter: "blur(40px)",
        }}
        initial={{ x: "-30%", y: "-20%" }}
        animate={{
          x: ["-30%", "-25%", "-30%"],
          y: ["-20%", "-15%", "-20%"],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Secondary violet orb - profundidad mística */}
      <motion.div
        className="absolute w-[400px] h-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(139,92,246,0.18) 0%, rgba(139,92,246,0) 70%)",
          filter: "blur(50px)",
          right: "-10%",
          top: "20%",
        }}
        animate={{
          x: ["0%", "5%", "0%"],
          y: ["0%", "-5%", "0%"],
        }}
        transition={{
          duration: 10,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Accent teal orb - naturaleza */}
      <motion.div
        className="absolute w-[300px] h-[300px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(45,212,191,0.15) 0%, rgba(45,212,191,0) 70%)",
          filter: "blur(40px)",
          left: "10%",
          bottom: "10%",
        }}
        animate={{
          x: ["0%", "-5%", "0%"],
          y: ["0%", "5%", "0%"],
        }}
        transition={{
          duration: 12,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Small sky accent - aire fresco */}
      <motion.div
        className="absolute w-[200px] h-[200px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(56,189,248,0.12) 0%, rgba(56,189,248,0) 70%)",
          filter: "blur(30px)",
          right: "20%",
          bottom: "30%",
        }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.5, 0.8, 0.5],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
    </div>
  );
}

// Animated grid pattern
function GridPattern() {
  return (
    <div
      className="fixed inset-0 pointer-events-none opacity-[0.03]"
      style={{
        backgroundImage: `
          linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px),
          linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)
        `,
        backgroundSize: "60px 60px",
      }}
    />
  );
}

// Logo component
function Logo() {
  return (
    <motion.div
      className="flex items-center gap-3"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
    >
      <motion.div
        className="relative"
        whileHover={{ scale: 1.05 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center shadow-lg glow-brand">
          <Calendar className="w-6 h-6 text-white" strokeWidth={2.5} />
        </div>
        <motion.div
          className="absolute inset-0 rounded-2xl gradient-brand opacity-50"
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 0, 0.5],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </motion.div>
      <div>
        <span className="text-xl font-bold tracking-tight">
          Agenda <span className="text-gradient-brand">Pro</span>
        </span>
      </div>
    </motion.div>
  );
}

// Container animations
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
      delayChildren: 0.2,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  },
};

export function AuthLayout({ children, title, subtitle }) {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4 py-10 bg-app relative overflow-hidden">
      {/* Background effects */}
      <FloatingOrbs />
      <GridPattern />
      <div className="fixed inset-0 bg-mesh pointer-events-none" />

      {/* Content */}
      <motion.div
        className="w-full max-w-md relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {/* Logo & Header */}
        <motion.div variants={itemVariants} className="mb-8 text-center">
          <div className="flex justify-center mb-6">
            <Logo />
          </div>
          <motion.h1
            className="text-3xl sm:text-4xl font-bold tracking-tight leading-tight"
            variants={itemVariants}
          >
            {title || (
              <>
                Tu tiempo,{" "}
                <span className="text-gradient-brand">organizado</span>
              </>
            )}
          </motion.h1>
          <motion.p
            className="mt-3 text-[rgb(var(--text-secondary))] text-base sm:text-lg"
            variants={itemVariants}
          >
            {subtitle ||
              "La agenda inteligente que se adapta a tu ritmo de vida."}
          </motion.p>
        </motion.div>

        {/* Glass Card */}
        <motion.div
          variants={itemVariants}
          className="glass-elevated rounded-3xl p-6 sm:p-8"
        >
          {children}
        </motion.div>

        {/* Footer */}
        <motion.p
          variants={itemVariants}
          className="mt-6 text-center text-sm text-[rgb(var(--muted))]"
        >
          Hecho con pasión para quienes valoran su tiempo.
        </motion.p>
      </motion.div>
    </div>
  );
}
