import React, { useCallback, useRef, useState, useEffect } from "react";
import { Outlet, NavLink, Navigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  Shield,
  Users,
  Key,
  Building2,
  LayoutDashboard,
  ChevronLeft,
  Settings,
  Activity,
  Sun,
  Moon,
  Monitor,
  Check,
  Menu,
  X,
} from "lucide-react";
import { useModeAnimation } from "react-theme-switch-animation";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import { useTheme } from "../../shared/theme/useTheme";
import { useLongPress } from "../../lib/hooks/useLongPress";

// Navegación del módulo de administración
const ADMIN_NAV = [
  {
    id: "dashboard",
    label: "Dashboard",
    icon: LayoutDashboard,
    path: "/admin",
  },
  {
    id: "users",
    label: "Usuarios",
    icon: Users,
    path: "/admin/users",
  },
  {
    id: "permissions",
    label: "Permisos",
    icon: Key,
    path: "/admin/permissions",
  },
  {
    id: "groups",
    label: "Espacios",
    icon: Building2,
    path: "/admin/groups",
  },
  {
    id: "audit",
    label: "Auditoría",
    icon: Activity,
    path: "/admin/audit",
  },
];

// Opciones del tema
const THEME_OPTIONS = [
  {
    value: "system",
    label: "Sistema",
    icon: Monitor,
    description: "Según tu dispositivo",
  },
  { value: "light", label: "Claro", icon: Sun, description: "Tema claro" },
  { value: "dark", label: "Oscuro", icon: Moon, description: "Tema oscuro" },
];

export function AdminLayout() {
  const { profile } = useWorkspace();
  const location = useLocation();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isLongPressRef = useRef(false);

  // Cerrar menú móvil cuando cambia la ruta
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Theme switcher with animation
  const { ref: themeButtonRef, toggleSwitchTheme } = useModeAnimation({
    isDarkMode: resolvedTheme === "dark",
    duration: 750,
    easing: "ease-out",
    animationType: "circle",
  });

  // Toggle rápido de tema (clic simple)
  const handleQuickThemeToggle = useCallback(
    async (event) => {
      const newTheme = resolvedTheme === "dark" ? "light" : "dark";
      if (event) {
        await toggleSwitchTheme();
      }
      setTheme(newTheme);
    },
    [resolvedTheme, setTheme, toggleSwitchTheme]
  );

  // Cambio de tema desde menú
  const handleThemeChange = useCallback(
    async (newTheme, event) => {
      const willBeDark =
        newTheme === "dark" ||
        (newTheme === "system" &&
          window.matchMedia("(prefers-color-scheme: dark)").matches);
      const currentlyDark = resolvedTheme === "dark";

      if (willBeDark !== currentlyDark && event) {
        await toggleSwitchTheme();
      }
      setTheme(newTheme);
      setShowThemeMenu(false);
    },
    [resolvedTheme, setTheme, toggleSwitchTheme]
  );

  // Long press para mostrar menú de temas
  const { handlers: longPressHandlers } = useLongPress(
    () => {
      isLongPressRef.current = true;
      setShowThemeMenu(true);
    },
    { threshold: 500 }
  );

  // Click en el botón de tema
  const handleThemeClick = useCallback(
    (event) => {
      if (isLongPressRef.current) {
        isLongPressRef.current = false;
        return;
      }
      handleQuickThemeToggle(event);
    },
    [handleQuickThemeToggle]
  );

  // Verificar si es platform admin
  const isPlatformAdmin =
    profile?.isPlatformAdmin === true || profile?.adminplatform === true;

  // Icono del tema actual
  const ThemeIcon = resolvedTheme === "dark" ? Moon : Sun;

  // Redirigir si no es admin
  if (!isPlatformAdmin) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="h-screen flex overflow-hidden">
      {/* Mobile Header */}
      <div className="lg:hidden fixed top-0 left-0 right-0 h-14 bg-[rgb(var(--bg-surface))] border-b border-[rgb(var(--border-base))] flex items-center justify-between px-4 z-30">
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 -ml-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-primary))]"
        >
          {mobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <h2 className="font-bold text-[rgb(var(--text-primary))]">Admin</h2>
        </div>
        <div className="w-9" /> {/* Spacer for centering */}
      </div>

      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
              onClick={() => setMobileMenuOpen(false)}
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween", duration: 0.3 }}
              className="lg:hidden fixed top-0 left-0 bottom-0 w-64 bg-[rgb(var(--bg-surface))] border-r border-[rgb(var(--border-base))] flex flex-col z-50"
            >
              {/* Header */}
              <div className="p-4 border-b border-[rgb(var(--border-base))]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="font-bold text-[rgb(var(--text-primary))]">
                      Administración
                    </h2>
                    <p className="text-xs text-[rgb(var(--text-muted))]">
                      Panel de control
                    </p>
                  </div>
                </div>
              </div>

              {/* Navigation */}
              <nav className="flex-1 p-3 space-y-1">
                {ADMIN_NAV.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  if (item.disabled) {
                    return (
                      <div
                        key={item.id}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[rgb(var(--text-muted))] opacity-50 cursor-not-allowed"
                      >
                        <Icon className="w-5 h-5" />
                        <span className="text-sm">{item.label}</span>
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))]">
                          Pronto
                        </span>
                      </div>
                    );
                  }

                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      className={clsx(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                        isActive
                          ? "bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))]"
                          : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))]"
                      )}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>

              {/* Footer: Theme toggle + Back to app */}
              <div className="p-3 border-t border-[rgb(var(--border-base))] space-y-1">
                {/* Theme toggle */}
                <div className="relative">
                  <button
                    ref={themeButtonRef}
                    onClick={handleThemeClick}
                    {...longPressHandlers}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
                    title="Cambiar tema (mantén presionado para más opciones)"
                  >
                    <motion.div
                      key={resolvedTheme}
                      initial={{ rotate: -30, opacity: 0 }}
                      animate={{ rotate: 0, opacity: 1 }}
                      transition={{ duration: 0.2 }}
                    >
                      <ThemeIcon className="w-5 h-5" />
                    </motion.div>
                    <span className="text-sm font-medium">
                      {resolvedTheme === "dark" ? "Tema oscuro" : "Tema claro"}
                    </span>
                  </button>

                  {/* Theme menu dropdown */}
                  <AnimatePresence>
                    {showThemeMenu && (
                      <>
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="fixed inset-0 z-40"
                          onClick={() => setShowThemeMenu(false)}
                        />
                        <motion.div
                          initial={{ opacity: 0, y: 10, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 10, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute bottom-full left-0 right-0 mb-2 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border-base))] rounded-xl shadow-lg z-50 overflow-hidden"
                        >
                          <div className="p-1">
                            <div className="px-3 py-2 text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wide">
                              Apariencia
                            </div>
                            {THEME_OPTIONS.map((option) => {
                              const Icon = option.icon;
                              const isActive = theme === option.value;

                              return (
                                <motion.button
                                  key={option.value}
                                  onClick={(e) =>
                                    handleThemeChange(option.value, e)
                                  }
                                  whileHover={{ x: 2 }}
                                  className={clsx(
                                    "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                                    isActive
                                      ? "bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))]"
                                      : "hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-primary))]"
                                  )}
                                >
                                  <div
                                    className={clsx(
                                      "w-8 h-8 rounded-lg flex items-center justify-center",
                                      isActive
                                        ? "bg-[rgb(var(--brand-primary))]/10"
                                        : "bg-[rgb(var(--bg-muted))]"
                                    )}
                                  >
                                    <Icon className="w-4 h-4" />
                                  </div>
                                  <div className="flex-1 text-left">
                                    <div className="text-sm font-medium">
                                      {option.label}
                                    </div>
                                    <div className="text-xs text-[rgb(var(--text-muted))]">
                                      {option.description}
                                    </div>
                                  </div>
                                  {isActive && (
                                    <Check className="w-4 h-4 text-[rgb(var(--brand-primary))]" />
                                  )}
                                </motion.button>
                              );
                            })}
                          </div>
                        </motion.div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                {/* Back to app */}
                <NavLink
                  to="/"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
                >
                  <ChevronLeft className="w-5 h-5" />
                  <span className="text-sm font-medium">Volver a la app</span>
                </NavLink>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 shrink-0 bg-[rgb(var(--bg-surface))] border-r border-[rgb(var(--border-base))] flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-[rgb(var(--border-base))]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-[rgb(var(--text-primary))]">
                Administración
              </h2>
              <p className="text-xs text-[rgb(var(--text-muted))]">
                Panel de control
              </p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 space-y-1">
          {ADMIN_NAV.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            if (item.disabled) {
              return (
                <div
                  key={item.id}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[rgb(var(--text-muted))] opacity-50 cursor-not-allowed"
                >
                  <Icon className="w-5 h-5" />
                  <span className="text-sm">{item.label}</span>
                  <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded bg-[rgb(var(--bg-muted))]">
                    Pronto
                  </span>
                </div>
              );
            }

            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all",
                  isActive
                    ? "bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))]"
                    : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))]"
                )}
              >
                <Icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {/* Footer: Theme toggle + Back to app */}
        <div className="p-3 border-t border-[rgb(var(--border-base))] space-y-1">
          {/* Theme toggle */}
          <div className="relative">
            <button
              ref={themeButtonRef}
              onClick={handleThemeClick}
              {...longPressHandlers}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
              title="Cambiar tema (mantén presionado para más opciones)"
            >
              <motion.div
                key={resolvedTheme}
                initial={{ rotate: -30, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.2 }}
              >
                <ThemeIcon className="w-5 h-5" />
              </motion.div>
              <span className="text-sm font-medium">
                {resolvedTheme === "dark" ? "Tema oscuro" : "Tema claro"}
              </span>
            </button>

            {/* Theme menu dropdown */}
            <AnimatePresence>
              {showThemeMenu && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setShowThemeMenu(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute bottom-full left-0 right-0 mb-2 bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border-base))] rounded-xl shadow-lg z-50 overflow-hidden"
                  >
                    <div className="p-1">
                      <div className="px-3 py-2 text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wide">
                        Apariencia
                      </div>
                      {THEME_OPTIONS.map((option) => {
                        const Icon = option.icon;
                        const isActive = theme === option.value;

                        return (
                          <motion.button
                            key={option.value}
                            onClick={(e) => handleThemeChange(option.value, e)}
                            whileHover={{ x: 2 }}
                            className={clsx(
                              "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                              isActive
                                ? "bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))]"
                                : "hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-primary))]"
                            )}
                          >
                            <div
                              className={clsx(
                                "w-8 h-8 rounded-lg flex items-center justify-center",
                                isActive
                                  ? "bg-[rgb(var(--brand-primary))]/10"
                                  : "bg-[rgb(var(--bg-muted))]"
                              )}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1 text-left">
                              <div className="text-sm font-medium">
                                {option.label}
                              </div>
                              <div className="text-xs text-[rgb(var(--text-muted))]">
                                {option.description}
                              </div>
                            </div>
                            {isActive && (
                              <Check className="w-4 h-4 text-[rgb(var(--brand-primary))]" />
                            )}
                          </motion.button>
                        );
                      })}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          {/* Back to app */}
          <NavLink
            to="/"
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm font-medium">Volver a la app</span>
          </NavLink>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto bg-[rgb(var(--bg-base))] h-full pt-14 lg:pt-0">
        <Outlet />
      </main>
    </div>
  );
}
