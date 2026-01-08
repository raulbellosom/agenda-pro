import { CalendarDays } from "lucide-react";
import { cn } from "../utils/cn";

/**
 * LoadingScreen - Componente de carga reutilizable
 *
 * Variantes:
 * - "fullscreen": Pantalla completa con ícono animado (ideal para carga inicial de la app)
 * - "page": Ocupa todo el contenedor padre (ideal para páginas/secciones)
 * - "inline": Compacto, para usar dentro de cards o secciones pequeñas
 * - "minimal": Solo spinner, sin texto (para espacios reducidos)
 *
 * @param {Object} props
 * @param {string} [props.label] - Texto a mostrar debajo del spinner
 * @param {"fullscreen"|"page"|"inline"|"minimal"} [props.variant] - Variante de visualización
 * @param {boolean} [props.showLogo] - Mostrar ícono de la app (solo en fullscreen/page)
 * @param {string} [props.className] - Clases adicionales
 */
export function LoadingScreen({
  label = "Cargando...",
  variant = "page",
  showLogo = false,
  className,
}) {
  const variants = {
    fullscreen: "fixed inset-0 z-50 h-dvh",
    page: "h-full min-h-[300px]",
    inline: "py-8",
    minimal: "py-4",
  };

  const isCompact = variant === "inline" || variant === "minimal";
  const shouldShowLogo = showLogo && !isCompact;
  const shouldShowLabel = variant !== "minimal" && label;

  return (
    <div
      className={cn(
        "flex w-full flex-col items-center justify-center",
        "bg-[rgb(var(--bg-base))] text-[rgb(var(--text-primary))]",
        variants[variant],
        className
      )}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Ícono principal con animaciones */}
        <div className="relative">
          {/* Círculos de fondo animados */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                "rounded-full bg-[rgb(var(--brand-primary))]/5",
                "animate-ping",
                variant === "fullscreen" ? "h-24 w-24" : "h-16 w-16"
              )}
            />
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={cn(
                "rounded-full bg-[rgb(var(--brand-primary))]/10",
                variant === "fullscreen" ? "h-20 w-20" : "h-14 w-14"
              )}
            />
          </div>

          {/* Contenedor del ícono con gradiente */}
          <div
            className={cn(
              "relative flex items-center justify-center rounded-2xl",
              "bg-linear-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-dark))]",
              "shadow-lg shadow-[rgb(var(--brand-primary))]/25",
              variant === "fullscreen" ? "h-16 w-16" : "h-12 w-12"
            )}
          >
            <CalendarDays
              className={cn(
                "text-white",
                variant === "fullscreen" ? "h-8 w-8" : "h-6 w-6"
              )}
            />
          </div>
        </div>

        {/* Spinner de puntos */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={cn(
                "rounded-full bg-[rgb(var(--brand-primary))]",
                variant === "fullscreen" ? "h-2.5 w-2.5" : "h-2 w-2"
              )}
              style={{
                animation: "bounce 1.4s ease-in-out infinite",
                animationDelay: `${i * 0.16}s`,
              }}
            />
          ))}
        </div>

        {/* Label */}
        {shouldShowLabel && (
          <p
            className={cn(
              "text-center font-medium",
              "text-[rgb(var(--text-secondary))]",
              variant === "fullscreen" ? "text-base" : "text-sm"
            )}
          >
            {label}
          </p>
        )}
      </div>

      {/* Keyframes para la animación de bounce */}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

/**
 * LoadingSpinner - Spinner simple para botones o indicadores pequeños
 */
export function LoadingSpinner({ size = "sm", className }) {
  const sizes = {
    xs: "h-1 w-1",
    sm: "h-1.5 w-1.5",
    md: "h-2 w-2",
    lg: "h-2.5 w-2.5",
  };

  return (
    <div className={cn("flex items-center gap-1", className)}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className={cn("rounded-full bg-current", sizes[size])}
          style={{
            animation: "bounce 1.4s ease-in-out infinite",
            animationDelay: `${i * 0.16}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0.6);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
