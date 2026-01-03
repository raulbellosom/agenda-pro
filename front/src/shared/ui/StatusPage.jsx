import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  ArrowLeft,
  Calendar,
  Settings,
  RefreshCw,
  FileQuestion,
  ShieldX,
  Trash2,
  ServerCrash,
  WifiOff,
  Search,
  HelpCircle,
} from "lucide-react";
import { Button } from "./Button";

/**
 * StatusPage - Componente reutilizable para páginas de estado
 *
 * @param {Object} props
 * @param {'404' | 'forbidden' | 'deleted' | 'error' | 'offline' | 'empty' | 'custom'} props.variant - Tipo de estado
 * @param {string} props.title - Título personalizado (opcional)
 * @param {string} props.description - Descripción personalizada (opcional)
 * @param {React.ReactNode} props.illustration - Ilustración personalizada (opcional)
 * @param {Array} props.actions - Acciones personalizadas [{label, to, icon, variant, onClick}]
 * @param {Array} props.quickLinks - Links rápidos [{label, to}]
 * @param {boolean} props.showBackButton - Mostrar botón de regresar
 * @param {boolean} props.showHomeButton - Mostrar botón de inicio
 * @param {boolean} props.showRetryButton - Mostrar botón de reintentar
 * @param {Function} props.onRetry - Callback para reintentar
 * @param {string} props.homeRoute - Ruta del botón de inicio (default: "/")
 * @param {string} props.homeLabel - Texto del botón de inicio
 */

// Configuraciones predefinidas por variante
const variantConfigs = {
  404: {
    title: "Página no encontrada",
    description:
      "Ups, parece que esta página no existe o fue movida a otra ubicación.",
    code: "404",
    icon: FileQuestion,
    color: "violet",
  },
  forbidden: {
    title: "Acceso denegado",
    description:
      "No tienes permisos para acceder a este recurso. Contacta al administrador si crees que es un error.",
    code: "403",
    icon: ShieldX,
    color: "amber",
  },
  deleted: {
    title: "Recurso eliminado",
    description:
      "Este elemento ya no existe. Es posible que haya sido eliminado o movido.",
    code: "410",
    icon: Trash2,
    color: "rose",
  },
  error: {
    title: "Algo salió mal",
    description:
      "Ocurrió un error inesperado. Por favor, intenta de nuevo más tarde.",
    code: "500",
    icon: ServerCrash,
    color: "red",
  },
  offline: {
    title: "Sin conexión",
    description:
      "Parece que no tienes conexión a internet. Verifica tu conexión e intenta de nuevo.",
    code: "---",
    icon: WifiOff,
    color: "gray",
  },
  empty: {
    title: "Nada por aquí",
    description: "No hay contenido disponible en esta sección.",
    code: "∅",
    icon: Search,
    color: "blue",
  },
  custom: {
    title: "Estado",
    description: "Información adicional del estado.",
    code: "?",
    icon: HelpCircle,
    color: "violet",
  },
};

// Colores por variante
const colorMap = {
  violet: {
    bg: "bg-violet-500/10",
    text: "text-violet-500",
    border: "border-violet-500/20",
    gradient: "from-violet-500/20 via-violet-500/5 to-transparent",
    glow: "shadow-violet-500/20",
  },
  amber: {
    bg: "bg-amber-500/10",
    text: "text-amber-500",
    border: "border-amber-500/20",
    gradient: "from-amber-500/20 via-amber-500/5 to-transparent",
    glow: "shadow-amber-500/20",
  },
  rose: {
    bg: "bg-rose-500/10",
    text: "text-rose-500",
    border: "border-rose-500/20",
    gradient: "from-rose-500/20 via-rose-500/5 to-transparent",
    glow: "shadow-rose-500/20",
  },
  red: {
    bg: "bg-red-500/10",
    text: "text-red-500",
    border: "border-red-500/20",
    gradient: "from-red-500/20 via-red-500/5 to-transparent",
    glow: "shadow-red-500/20",
  },
  gray: {
    bg: "bg-zinc-500/10",
    text: "text-zinc-500",
    border: "border-zinc-500/20",
    gradient: "from-zinc-500/20 via-zinc-500/5 to-transparent",
    glow: "shadow-zinc-500/20",
  },
  blue: {
    bg: "bg-blue-500/10",
    text: "text-blue-500",
    border: "border-blue-500/20",
    gradient: "from-blue-500/20 via-blue-500/5 to-transparent",
    glow: "shadow-blue-500/20",
  },
};

// Partícula flotante animada
function FloatingParticle({ delay, duration, x, y, size, color }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{
        opacity: [0, 1, 1, 0],
        scale: [0, 1, 1, 0],
        y: [0, -30, -60, -90],
        x: [0, x * 0.5, x, x * 1.2],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        repeatDelay: 1,
        ease: "easeOut",
      }}
      style={{ width: size, height: size }}
      className={`absolute rounded-full ${color}`}
    />
  );
}

// Ilustración animada
function StatusIllustration({ code, Icon, color }) {
  const colors = colorMap[color] || colorMap.violet;

  // Configuración de partículas flotantes
  const particles = [
    { delay: 0, duration: 3, x: -20, y: 0, size: 6 },
    { delay: 0.5, duration: 3.5, x: 25, y: 0, size: 4 },
    { delay: 1, duration: 2.8, x: -15, y: 0, size: 5 },
    { delay: 1.5, duration: 3.2, x: 30, y: 0, size: 3 },
    { delay: 2, duration: 3, x: -25, y: 0, size: 4 },
  ];

  return (
    <div className="relative">
      {/* Animated glow effect with pulse */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: [0.5, 0.8, 0.5],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className={`absolute inset-0 blur-3xl ${colors.bg} rounded-full`}
      />

      {/* Secondary pulsing ring */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{
          opacity: [0.2, 0.4, 0.2],
          scale: [0.9, 1.15, 0.9],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: "easeInOut",
          delay: 0.5,
        }}
        className={`absolute inset-[-20px] blur-2xl ${colors.bg} rounded-full`}
      />

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-visible pointer-events-none">
        {particles.map((p, i) => (
          <FloatingParticle key={i} {...p} color={colors.bg} />
        ))}
      </div>

      {/* Main circle with code */}
      <motion.div
        initial={{ scale: 0, rotate: -180 }}
        animate={{ scale: 1, rotate: 0 }}
        transition={{ type: "spring", stiffness: 100, damping: 15 }}
        className={`relative w-44 h-44 sm:w-56 sm:h-56 rounded-full ${colors.bg} border-2 ${colors.border} flex items-center justify-center shadow-2xl ${colors.glow}`}
      >
        {/* Rotating outer ring */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "linear",
          }}
          className={`absolute inset-2 rounded-full border border-dashed ${colors.border} opacity-50`}
        />

        {/* Counter-rotating inner ring */}
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1, rotate: -360 }}
          transition={{
            scale: { delay: 0.3, type: "spring" },
            rotate: { duration: 25, repeat: Infinity, ease: "linear" },
          }}
          className={`absolute inset-6 rounded-full border border-dotted ${colors.border} opacity-30`}
        />

        {/* Code text with breathing effect */}
        <motion.span
          initial={{ opacity: 0, y: 20 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: [1, 1.02, 1],
          }}
          transition={{
            opacity: { delay: 0.4, duration: 0.4 },
            y: { delay: 0.4, duration: 0.4 },
            scale: {
              delay: 1,
              duration: 3,
              repeat: Infinity,
              ease: "easeInOut",
            },
          }}
          className={`text-5xl sm:text-7xl font-bold ${colors.text} select-none z-10`}
        >
          {code}
        </motion.span>
      </motion.div>

      {/* Floating icon with bounce */}
      <motion.div
        initial={{ scale: 0, x: 20, y: 20 }}
        animate={{
          scale: 1,
          x: 0,
          y: [0, -8, 0],
        }}
        transition={{
          scale: { delay: 0.5, type: "spring", stiffness: 200 },
          x: { delay: 0.5, type: "spring", stiffness: 200 },
          y: {
            delay: 1,
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut",
          },
        }}
        className={`absolute -bottom-2 -right-2 sm:bottom-0 sm:right-0 w-14 h-14 sm:w-16 sm:h-16 rounded-2xl ${colors.bg} border ${colors.border} flex items-center justify-center shadow-lg backdrop-blur-sm`}
      >
        <motion.div
          animate={{ rotate: [0, 10, -10, 0] }}
          transition={{
            duration: 2,
            repeat: Infinity,
            repeatDelay: 3,
            ease: "easeInOut",
          }}
        >
          <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${colors.text}`} />
        </motion.div>
      </motion.div>

      {/* Decorative floating dots with orbital motion */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: 1,
          scale: [1, 1.2, 1],
          x: [0, -5, 0, 5, 0],
          y: [0, 5, 0, -5, 0],
        }}
        transition={{
          opacity: { delay: 0.6, duration: 0.3 },
          scale: { delay: 1, duration: 4, repeat: Infinity, ease: "easeInOut" },
          x: { delay: 1, duration: 6, repeat: Infinity, ease: "easeInOut" },
          y: { delay: 1, duration: 6, repeat: Infinity, ease: "easeInOut" },
        }}
        className={`absolute -top-3 -left-3 w-6 h-6 rounded-full ${colors.bg} border ${colors.border}`}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: 1,
          scale: [1, 0.8, 1],
          x: [0, 8, 0, -8, 0],
          y: [0, -6, 0, 6, 0],
        }}
        transition={{
          opacity: { delay: 0.7, duration: 0.3 },
          scale: {
            delay: 1.2,
            duration: 3.5,
            repeat: Infinity,
            ease: "easeInOut",
          },
          x: { delay: 1.2, duration: 5, repeat: Infinity, ease: "easeInOut" },
          y: { delay: 1.2, duration: 5, repeat: Infinity, ease: "easeInOut" },
        }}
        className={`absolute top-8 -right-6 w-4 h-4 rounded-full ${colors.bg} border ${colors.border}`}
      />
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={{
          opacity: 1,
          scale: [1, 1.3, 1],
          x: [0, 6, 0, -6, 0],
          y: [0, 4, 0, -4, 0],
        }}
        transition={{
          opacity: { delay: 0.8, duration: 0.3 },
          scale: {
            delay: 1.4,
            duration: 4.5,
            repeat: Infinity,
            ease: "easeInOut",
          },
          x: { delay: 1.4, duration: 7, repeat: Infinity, ease: "easeInOut" },
          y: { delay: 1.4, duration: 7, repeat: Infinity, ease: "easeInOut" },
        }}
        className={`absolute -bottom-4 left-8 w-3 h-3 rounded-full ${colors.bg} border ${colors.border}`}
      />

      {/* Extra floating elements for more depth */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{
          opacity: [0, 0.6, 0],
          scale: [0.5, 1, 0.5],
          y: [20, -40, -100],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          repeatDelay: 2,
          ease: "easeOut",
        }}
        className={`absolute top-1/2 left-1/2 w-2 h-2 rounded-full ${colors.bg}`}
      />
    </div>
  );
}

// Links rápidos por defecto para la aplicación
const defaultQuickLinks = [
  { label: "Calendario", to: "/" },
  { label: "Configuración", to: "/settings" },
];

export function StatusPage({
  variant = "404",
  title,
  description,
  illustration,
  actions,
  quickLinks = defaultQuickLinks,
  showBackButton = true,
  showHomeButton = true,
  showRetryButton = false,
  onRetry,
  homeRoute = "/",
  homeLabel = "Ir al Calendario",
  className = "",
}) {
  const navigate = useNavigate();
  const config = variantConfigs[variant] || variantConfigs.custom;
  const colors = colorMap[config.color] || colorMap.violet;

  const displayTitle = title || config.title;
  const displayDescription = description || config.description;

  const handleGoBack = () => {
    if (window.history.length > 2) {
      navigate(-1);
    } else {
      navigate(homeRoute);
    }
  };

  // Container animation variants
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
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div
      className={`min-h-dvh flex items-center justify-center px-4 py-8 sm:py-12 bg-gradient-to-b ${colors.gradient} ${className}`}
    >
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="w-full max-w-lg text-center"
      >
        {/* Illustration */}
        <motion.div
          variants={itemVariants}
          className="flex justify-center mb-8 sm:mb-10"
        >
          {illustration || (
            <StatusIllustration
              code={config.code}
              Icon={config.icon}
              color={config.color}
            />
          )}
        </motion.div>

        {/* Title */}
        <motion.h1
          variants={itemVariants}
          className="text-2xl sm:text-3xl lg:text-4xl font-bold text-(--text-primary) mb-3"
        >
          {displayTitle}
        </motion.h1>

        {/* Description */}
        <motion.p
          variants={itemVariants}
          className="text-sm sm:text-base text-(--text-secondary) mb-8 max-w-md mx-auto leading-relaxed"
        >
          {displayDescription}
        </motion.p>

        {/* Actions */}
        <motion.div
          variants={itemVariants}
          className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-10"
        >
          {actions ? (
            // Custom actions
            actions.map((action, index) => (
              <Button
                key={index}
                variant={
                  action.variant || (index === 0 ? "primary" : "outline")
                }
                size="lg"
                onClick={action.onClick}
                asChild={!!action.to}
                className="w-full sm:w-auto"
              >
                {action.to ? (
                  <Link to={action.to}>
                    {action.icon && <action.icon size={18} className="mr-2" />}
                    {action.label}
                  </Link>
                ) : (
                  <>
                    {action.icon && <action.icon size={18} className="mr-2" />}
                    {action.label}
                  </>
                )}
              </Button>
            ))
          ) : (
            // Default actions
            <>
              {showHomeButton && (
                <Button asChild size="lg" className="w-full sm:w-auto">
                  <Link to={homeRoute}>
                    <Calendar size={18} className="mr-2" />
                    {homeLabel}
                  </Link>
                </Button>
              )}
              {showRetryButton && onRetry && (
                <Button
                  variant="outline"
                  size="lg"
                  onClick={onRetry}
                  className="w-full sm:w-auto"
                >
                  <RefreshCw size={18} className="mr-2" />
                  Reintentar
                </Button>
              )}
              {showBackButton && (
                <Button
                  variant="ghost"
                  size="lg"
                  onClick={handleGoBack}
                  className="w-full sm:w-auto"
                >
                  <ArrowLeft size={18} className="mr-2" />
                  Regresar
                </Button>
              )}
            </>
          )}
        </motion.div>

        {/* Quick Links */}
        {quickLinks && quickLinks.length > 0 && (
          <motion.div variants={itemVariants}>
            <p className="text-xs sm:text-sm font-medium text-(--text-muted) mb-3">
              O navega directamente a:
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
              {quickLinks.map((link, index) => (
                <Link
                  key={index}
                  to={link.to}
                  className="text-sm text-(--brand-primary) hover:text-(--brand-secondary) transition-colors duration-200 underline-offset-4 hover:underline"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          </motion.div>
        )}

        {/* Help footer */}
        <motion.div
          variants={itemVariants}
          className="mt-12 pt-6 border-t border-(--border-base)"
        >
          <p className="text-xs text-(--text-muted)">
            ¿Necesitas ayuda?{" "}
            <a
              href="mailto:soporte@agenda.pro"
              className="text-(--brand-primary) hover:underline"
            >
              Contacta al soporte
            </a>
          </p>
        </motion.div>
      </motion.div>
    </div>
  );
}

// Componentes pre-configurados para uso rápido
export function NotFoundPage(props) {
  return <StatusPage variant="404" {...props} />;
}

export function ForbiddenPage(props) {
  return <StatusPage variant="forbidden" {...props} />;
}

export function DeletedResourcePage(props) {
  return <StatusPage variant="deleted" {...props} />;
}

export function ErrorPage(props) {
  return <StatusPage variant="error" showRetryButton={true} {...props} />;
}

export function OfflinePage(props) {
  return (
    <StatusPage
      variant="offline"
      showRetryButton={true}
      onRetry={() => window.location.reload()}
      {...props}
    />
  );
}
