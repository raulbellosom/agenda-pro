import React from "react";
import clsx from "clsx";

/**
 * Genera las iniciales de un nombre
 */
function getInitials(name) {
  if (!name) return "?";

  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }

  return (parts[0][0] + (parts[parts.length - 1][0] || "")).toUpperCase();
}

/**
 * Genera un color basado en el nombre
 */
function getColorFromName(name) {
  if (!name) return "from-gray-400 to-gray-500";

  const colors = [
    "from-violet-400 to-purple-500",
    "from-blue-400 to-indigo-500",
    "from-cyan-400 to-blue-500",
    "from-teal-400 to-cyan-500",
    "from-emerald-400 to-green-500",
    "from-amber-400 to-orange-500",
    "from-rose-400 to-pink-500",
    "from-fuchsia-400 to-purple-500",
  ];

  const hash = name
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  return colors[hash % colors.length];
}

/**
 * Componente Avatar que muestra imagen o iniciales
 */
export function Avatar({
  src,
  name = "",
  size = 40,
  className,
  rounded = "full",
  onClick,
}) {
  const initials = getInitials(name);
  const gradientColors = getColorFromName(name);

  const sizeClasses = {
    full: "w-full h-full",
  };

  const roundedClasses = {
    full: "rounded-full",
    lg: "rounded-lg",
    xl: "rounded-xl",
    "2xl": "rounded-2xl",
  };

  const containerClass = clsx(
    "flex items-center justify-center overflow-hidden flex-shrink-0",
    sizeClasses[size] || `w-[${size}px] h-[${size}px]`,
    roundedClasses[rounded],
    onClick && "cursor-pointer hover:opacity-80 transition-opacity",
    className
  );

  if (src) {
    return (
      <div className={containerClass} onClick={onClick}>
        <img
          src={src}
          alt={name}
          className="w-full h-full object-cover aspect-square"
          onError={(e) => {
            // Si falla la carga, ocultar la imagen
            e.target.style.display = "none";
          }}
        />
      </div>
    );
  }

  return (
    <div
      className={clsx(
        containerClass,
        `bg-linear-to-br ${gradientColors}`,
        "text-white font-semibold select-none"
      )}
      style={
        size === "full"
          ? { fontSize: "1.5rem" }
          : {
              width: typeof size === "number" ? `${size}px` : size,
              height: typeof size === "number" ? `${size}px` : size,
              fontSize: typeof size === "number" ? `${size * 0.4}px` : "1rem",
            }
      }
      onClick={onClick}
    >
      {initials}
    </div>
  );
}

/**
 * Componente para logo de grupo/espacio
 */
export function GroupLogo({ src, name = "", size = 48, className, onClick }) {
  return (
    <Avatar
      src={src}
      name={name}
      size={size}
      rounded="xl"
      className={className}
      onClick={onClick}
    />
  );
}
