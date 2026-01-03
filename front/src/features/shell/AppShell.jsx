import React, { useState, useEffect, useRef, useCallback } from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useModeAnimation } from "react-theme-switch-animation";
import {
  Calendar,
  Bell,
  Settings,
  ChevronLeft,
  ChevronDown,
  Menu,
  X,
  CheckSquare,
  FileText,
  FolderKanban,
  Users,
  LogOut,
  Moon,
  Sun,
  Monitor,
  Plus,
  Check,
  Eye,
  EyeOff,
  Pencil,
  Share2,
  Trash2,
  MoreHorizontal,
  Clock,
  MessageSquare,
  UserPlus,
  CalendarCheck,
  Search,
  PanelLeft,
  Building2,
  Crown,
} from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import { useTheme } from "../../shared/theme/useTheme";
import { getAvatarUrl } from "../../lib/services/profileService";
import { getGroupLogoUrl } from "../../lib/hooks/useGroups";
import { CreateCalendarModal } from "../calendar/CreateCalendarModal";
import { GroupModal } from "../groups/GroupModal";
import { ImageViewerModal } from "../../shared/ui/ImageViewerModal";
import { env } from "../../shared/appwrite/env";

// Módulos de navegación principal
const MODULES = [
  { id: "calendar", label: "Calendario", icon: Calendar, path: "/" },
  {
    id: "tasks",
    label: "Tareas",
    icon: CheckSquare,
    path: "/tasks",
    disabled: true,
  },
  {
    id: "notes",
    label: "Notas",
    icon: FileText,
    path: "/notes",
    disabled: true,
  },
  {
    id: "projects",
    label: "Proyectos",
    icon: FolderKanban,
    path: "/projects",
    disabled: true,
  },
];

// Colores para calendarios
const CALENDAR_COLORS = {
  violet: { dot: "bg-violet-500" },
  blue: { dot: "bg-blue-500" },
  green: { dot: "bg-green-500" },
  yellow: { dot: "bg-yellow-500" },
  orange: { dot: "bg-orange-500" },
  red: { dot: "bg-red-500" },
  pink: { dot: "bg-pink-500" },
};

const getCalendarColor = (color) =>
  CALENDAR_COLORS[color] || CALENDAR_COLORS.violet;

// Hook para detectar long press
function useLongPress(callback, { threshold = 500 } = {}) {
  const isLongPressRef = useRef(false);
  const timerRef = useRef(null);

  const start = useCallback(
    (event) => {
      isLongPressRef.current = false;
      timerRef.current = setTimeout(() => {
        isLongPressRef.current = true;
        callback(event);
      }, threshold);
    },
    [callback, threshold]
  );

  const clear = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  // Devolver handlers separados del ref para evitar pasar isLongPress al DOM
  const handlers = {
    onMouseDown: start,
    onMouseUp: clear,
    onMouseLeave: clear,
    onTouchStart: start,
    onTouchEnd: clear,
  };

  return { handlers, isLongPressRef };
}

export function AppShell() {
  const { logout, user } = useAuth();
  const {
    profile,
    activeGroup,
    groups = [],
    calendars = [],
    switchGroup,
    createFirstGroup,
  } = useWorkspace();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showThemeMenu, setShowThemeMenu] = useState(false);
  const [showGroupMenu, setShowGroupMenu] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showMobileProfileMenu, setShowMobileProfileMenu] = useState(false);
  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [showGroupModal, setShowGroupModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showCreateCalendar, setShowCreateCalendar] = useState(false);
  const [calendarToEdit, setCalendarToEdit] = useState(null);
  const [showAvatarViewer, setShowAvatarViewer] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Estados para calendarios en móvil
  const [mobileVisibleCalendars, setMobileVisibleCalendars] = useState([]);
  const [mobileCalendarMenuId, setMobileCalendarMenuId] = useState(null);

  // Debounce para guardar tema - evita múltiples peticiones
  const themeTimeoutRef = useRef(null);
  const pendingThemeRef = useRef(null);

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

      // Cancelar cualquier timeout pendiente
      if (themeTimeoutRef.current) {
        clearTimeout(themeTimeoutRef.current);
      }

      // Animar el cambio
      if (event) {
        await toggleSwitchTheme();
      }

      // Guardar en ref para debounce
      pendingThemeRef.current = newTheme;
      setTheme(newTheme);

      // Debounce: solo guardar después de 1 segundo sin cambios
      themeTimeoutRef.current = setTimeout(() => {
        pendingThemeRef.current = null;
      }, 1000);
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
  const { handlers: longPressHandlers, isLongPressRef } = useLongPress(
    () => {
      setShowThemeMenu(true);
    },
    { threshold: 500 }
  );

  // Click en el botón de tema
  const handleThemeClick = useCallback(
    (event) => {
      if (!isLongPressRef.current) {
        handleQuickThemeToggle(event);
      }
    },
    [handleQuickThemeToggle, isLongPressRef]
  );

  // Inicializar calendarios visibles cuando cambian
  useEffect(() => {
    if (calendars.length > 0 && mobileVisibleCalendars.length === 0) {
      setMobileVisibleCalendars(calendars.map((c) => c.$id));
    }
  }, [calendars, mobileVisibleCalendars.length]);

  // Toggle visibilidad de calendario en móvil
  const toggleMobileCalendarVisibility = useCallback((calendarId) => {
    setMobileVisibleCalendars((prev) =>
      prev.includes(calendarId)
        ? prev.filter((id) => id !== calendarId)
        : [...prev, calendarId]
    );
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const handleClickOutside = () => {
      setShowThemeMenu(false);
      setShowGroupMenu(false);
      setShowProfileMenu(false);
      setShowMobileProfileMenu(false);
      setMobileCalendarMenuId(null);
      setShowNotifications(false);
    };
    if (
      showThemeMenu ||
      showGroupMenu ||
      showProfileMenu ||
      showMobileProfileMenu ||
      mobileCalendarMenuId ||
      showNotifications
    ) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [
    showThemeMenu,
    showGroupMenu,
    showProfileMenu,
    showMobileProfileMenu,
    mobileCalendarMenuId,
    showNotifications,
  ]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (themeTimeoutRef.current) {
        clearTimeout(themeTimeoutRef.current);
      }
    };
  }, []);

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setIsCreating(true);
    try {
      await createFirstGroup(newGroupName.trim());
      setNewGroupName("");
      setShowCreateGroup(false);
      setShowGroupMenu(false);
    } catch (error) {
      console.error("Error creating group:", error);
    } finally {
      setIsCreating(false);
    }
  };

  const displayName =
    profile?.firstName || user?.name?.split(" ")[0] || "Usuario";
  const fullName = profile
    ? `${profile.firstName || ""} ${profile.lastName || ""}`.trim()
    : user?.name || "Usuario";
  const email = profile?.email || user?.email || "";
  const initials = fullName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  // Avatar URL - se actualiza automáticamente cuando profile cambia
  const avatarUrl = profile?.avatarFileId
    ? getAvatarUrl(profile.avatarFileId, 80, 80)
    : null;

  return (
    <div className="flex h-screen bg-[rgb(var(--bg-base))] overflow-hidden">
      {/* Sidebar - Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 260 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden lg:flex flex-col h-full bg-[rgb(var(--bg-surface))] border-r border-[rgb(var(--border-base))] overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center h-[65px] px-4 border-b border-[rgb(var(--border-base))]">
          <div className="w-9 h-9 rounded-xl bg-[rgb(var(--brand-primary))] flex items-center justify-center shrink-0">
            <Calendar className="w-5 h-5 text-white" />
          </div>
          <div
            className={`flex items-center flex-1 ml-3 overflow-hidden transition-all duration-300 ${
              sidebarCollapsed ? "opacity-0 w-0 ml-0" : "opacity-100"
            }`}
          >
            <div className="whitespace-nowrap flex-1">
              <span className="font-bold text-[rgb(var(--text-primary))]">
                Agenda
              </span>
              <span className="font-bold text-[rgb(var(--brand-primary))]">
                {" "}
                Pro
              </span>
            </div>
          </div>
        </div>

        {/* Grupo Activo con Dropdown */}
        <div className="border-b border-[rgb(var(--border-base))] px-3 py-1.5">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowGroupMenu(!showGroupMenu);
              }}
              className="w-full flex items-center gap-2 rounded-lg transition-colors py-1.5 px-1 hover:bg-[rgb(var(--bg-hover))]"
              title={sidebarCollapsed ? activeGroup?.name : undefined}
            >
              <div className="w-7 h-7 rounded-md overflow-hidden flex items-center justify-center shrink-0">
                {activeGroup?.logoFileId ? (
                  <img
                    src={getGroupLogoUrl(activeGroup.logoFileId, 56, 56)}
                    alt={activeGroup.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center">
                    <Building2 className="w-4 h-4 text-[rgb(var(--brand-primary))]" />
                  </div>
                )}
              </div>
              <div
                className={`min-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 flex-1 text-left ${
                  sidebarCollapsed ? "opacity-0 w-0" : "opacity-100"
                }`}
              >
                <p className="text-xs font-medium text-[rgb(var(--text-primary))] truncate">
                  {activeGroup?.name || "Sin grupo"}
                </p>
                <p className="text-[10px] text-[rgb(var(--text-muted))]">
                  {activeGroup?.membershipRole === "OWNER" ||
                  activeGroup?.ownerProfileId === profile?.$id
                    ? "Propietario"
                    : "Miembro"}
                </p>
              </div>
              <ChevronDown
                className={`w-3.5 h-3.5 text-[rgb(var(--text-muted))] shrink-0 transition-all duration-300 ${
                  showGroupMenu ? "rotate-180" : ""
                } ${sidebarCollapsed ? "opacity-0 w-0" : "opacity-100"}`}
              />
            </button>

            {/* Group Dropdown - se muestra fuera del sidebar si está colapsado */}
            <AnimatePresence>
              {showGroupMenu && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className={`absolute bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border-base))] shadow-lg overflow-hidden z-[100] ${
                    sidebarCollapsed
                      ? "left-full ml-2 top-0 w-56"
                      : "left-0 right-0 top-full mt-1"
                  }`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="p-1 max-h-60 overflow-auto">
                    {groups.map((group) => {
                      const isOwner =
                        group.ownerProfileId === profile?.$id ||
                        group.membershipRole === "OWNER";
                      const logoUrl = group.logoFileId
                        ? getGroupLogoUrl(group.logoFileId, 48, 48)
                        : null;
                      return (
                        <button
                          key={group.$id}
                          onClick={() => {
                            switchGroup(group.$id);
                            setShowGroupMenu(false);
                          }}
                          className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                            activeGroup?.$id === group.$id
                              ? "bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))]"
                              : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))]"
                          }`}
                        >
                          <div className="w-6 h-6 rounded-md overflow-hidden flex items-center justify-center shrink-0">
                            {logoUrl ? (
                              <img
                                src={logoUrl}
                                alt={group.name}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center">
                                <Building2 className="w-3 h-3 text-[rgb(var(--brand-primary))]" />
                              </div>
                            )}
                          </div>
                          <span className="flex-1 text-left truncate">
                            {group.name}
                          </span>
                          {isOwner && (
                            <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                          )}
                          {activeGroup?.$id === group.$id && (
                            <Check className="w-4 h-4 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                  <div className="border-t border-[rgb(var(--border-base))] p-1">
                    <button
                      onClick={() => {
                        setShowGroupMenu(false);
                        setShowGroupModal(true);
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[rgb(var(--brand-primary))] hover:bg-[rgb(var(--brand-primary))]/10 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Crear nuevo espacio</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowGroupMenu(false);
                        navigate("/groups");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Gestionar espacios</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Navegación Principal */}
        <nav className="flex-1 px-4 py-2 overflow-y-auto overflow-x-hidden">
          <div className="space-y-1">
            {MODULES.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;

              if (item.disabled) {
                return (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 h-10 rounded-xl text-[rgb(var(--text-muted))]/50 cursor-not-allowed"
                    title={sidebarCollapsed ? item.label : undefined}
                  >
                    <div className="w-9 h-9 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" />
                    </div>
                    <span
                      className={`text-sm whitespace-nowrap overflow-hidden transition-all duration-300 ${
                        sidebarCollapsed ? "opacity-0 w-0" : "opacity-100"
                      }`}
                    >
                      {item.label}
                    </span>
                  </div>
                );
              }

              return (
                <NavLink
                  key={item.id}
                  to={item.path}
                  className={`flex items-center gap-3 h-10 rounded-xl transition-colors ${
                    isActive
                      ? "bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))]"
                      : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))]"
                  }`}
                  title={sidebarCollapsed ? item.label : undefined}
                >
                  <div className="w-9 h-9 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5" />
                  </div>
                  <span
                    className={`text-sm font-medium whitespace-nowrap overflow-hidden transition-all duration-300 flex-1 ${
                      sidebarCollapsed ? "opacity-0 w-0" : "opacity-100"
                    }`}
                  >
                    {item.label}
                  </span>
                  <div
                    className={`w-1.5 h-1.5 rounded-full bg-[rgb(var(--brand-primary))] transition-all duration-300 mr-2 ${
                      isActive && !sidebarCollapsed
                        ? "opacity-100"
                        : "opacity-0 w-0 mr-0"
                    }`}
                  />
                </NavLink>
              );
            })}

            <div className="my-3 border-t border-[rgb(var(--border-base))]" />
          </div>
        </nav>
      </motion.aside>

      {/* Contenido Principal */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        {/* Header móvil */}
        <header className="lg:hidden flex items-center justify-between px-4 h-14 bg-[rgb(var(--bg-surface))] border-b border-[rgb(var(--border-base))]">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-primary))]"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-[rgb(var(--brand-primary))] flex items-center justify-center">
              <Calendar className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-[rgb(var(--text-primary))]">
              Agenda
            </span>
            <span className="font-bold text-[rgb(var(--brand-primary))]">
              Pro
            </span>
          </div>

          {/* Notification & Theme toggle en móvil */}
          <div className="flex items-center gap-1">
            {/* Notification bell con dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotifications((prev) => !prev);
                }}
                className="p-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))] relative"
              >
                <Bell className="w-5 h-5" />
                {/* Badge para notificaciones no leídas */}
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[rgb(var(--error))] rounded-full border-2 border-[rgb(var(--bg-surface))]" />
              </button>

              {/* Notifications Dropdown */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-80 max-h-96 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border-base))] shadow-lg overflow-hidden z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--border-base))]">
                      <h3 className="font-semibold text-[rgb(var(--text-primary))]">
                        Notificaciones
                      </h3>
                      <button className="text-xs text-[rgb(var(--brand-primary))] hover:underline">
                        Marcar todas como leídas
                      </button>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      {/* Ejemplo de notificaciones - después se conectará a datos reales */}
                      <div className="p-2 space-y-1">
                        <div className="flex gap-3 p-3 rounded-lg hover:bg-[rgb(var(--bg-hover))] cursor-pointer">
                          <div className="w-9 h-9 rounded-full bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center shrink-0">
                            <CalendarCheck className="w-4 h-4 text-[rgb(var(--brand-primary))]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[rgb(var(--text-primary))]">
                              Nuevo evento:{" "}
                              <span className="font-medium">
                                Reunión de equipo
                              </span>
                            </p>
                            <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">
                              Hace 5 minutos
                            </p>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-[rgb(var(--brand-primary))] mt-2 shrink-0" />
                        </div>
                        <div className="flex gap-3 p-3 rounded-lg hover:bg-[rgb(var(--bg-hover))] cursor-pointer">
                          <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                            <UserPlus className="w-4 h-4 text-green-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[rgb(var(--text-primary))]">
                              <span className="font-medium">Juan Pérez</span>{" "}
                              aceptó tu invitación
                            </p>
                            <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">
                              Hace 1 hora
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3 p-3 rounded-lg hover:bg-[rgb(var(--bg-hover))] cursor-pointer opacity-60">
                          <div className="w-9 h-9 rounded-full bg-[rgb(var(--bg-muted))] flex items-center justify-center shrink-0">
                            <Clock className="w-4 h-4 text-[rgb(var(--text-muted))]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[rgb(var(--text-secondary))]">
                              Recordatorio:{" "}
                              <span className="font-medium">
                                Cita con el dentista
                              </span>
                            </p>
                            <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">
                              Ayer
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3 border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))]">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          navigate("/notifications");
                        }}
                        className="w-full text-center text-sm text-[rgb(var(--brand-primary))] hover:underline"
                      >
                        Ver todas las notificaciones
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme toggle con animación en móvil */}
            <button
              ref={themeButtonRef}
              onClick={handleQuickThemeToggle}
              {...longPressHandlers}
              className="p-2 -mr-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))]"
            >
              <motion.div
                key={resolvedTheme}
                initial={{ rotate: -30, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
              >
                {resolvedTheme === "dark" ? (
                  <Moon className="w-5 h-5" />
                ) : (
                  <Sun className="w-5 h-5" />
                )}
              </motion.div>
            </button>
          </div>

          <AnimatePresence>
            {showThemeMenu && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: -10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: -10 }}
                className="absolute right-0 top-full mt-2 w-44 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border-base))] shadow-lg overflow-hidden z-50"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="p-1">
                  <div className="px-3 py-1.5 text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wide">
                    Apariencia
                  </div>
                  {[
                    { id: "light", label: "Claro", icon: Sun },
                    { id: "dark", label: "Oscuro", icon: Moon },
                    { id: "system", label: "Sistema", icon: Monitor },
                  ].map((option) => {
                    const Icon = option.icon;
                    return (
                      <button
                        key={option.id}
                        onClick={(e) => handleThemeChange(option.id, e)}
                        className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                          theme === option.id
                            ? "bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))]"
                            : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))]"
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                        {option.label}
                        {theme === option.id && (
                          <Check className="w-4 h-4 ml-auto" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </header>

        {/* Desktop Header - misma altura que el logo del sidebar */}
        <header className="hidden lg:flex items-center h-[65px] px-4 bg-[rgb(var(--bg-surface))] border-b border-[rgb(var(--border-base))]">
          {/* Toggle sidebar */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="p-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))]"
            title={sidebarCollapsed ? "Expandir sidebar" : "Colapsar sidebar"}
          >
            <PanelLeft className="w-5 h-5" />
          </button>

          {/* Centered Search bar */}
          <div className="flex-1 flex justify-center px-4">
            <div className="w-full max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[rgb(var(--text-muted))]" />
                <input
                  type="text"
                  placeholder="Buscar eventos, tareas, notas..."
                  className="w-full h-9 pl-10 pr-4 rounded-lg bg-[rgb(var(--bg-base))] border border-[rgb(var(--border-base))] text-sm text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))] focus:outline-none focus:border-[rgb(var(--brand-primary))] transition-colors"
                />
              </div>
            </div>
          </div>

          {/* Right section: notifications, theme, profile */}
          <div className="flex items-center gap-1">
            {/* Notification bell con dropdown */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowNotifications((prev) => !prev);
                }}
                className="p-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))] relative"
              >
                <Bell className="w-5 h-5" />
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[rgb(var(--error))] rounded-full border-2 border-[rgb(var(--bg-surface))]" />
              </button>

              {/* Notifications Dropdown - Desktop */}
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-96 max-h-[480px] bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border-base))] shadow-lg overflow-hidden z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(var(--border-base))]">
                      <h3 className="font-semibold text-[rgb(var(--text-primary))]">
                        Notificaciones
                      </h3>
                      <button className="text-xs text-[rgb(var(--brand-primary))] hover:underline">
                        Marcar todas como leídas
                      </button>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        <div className="flex gap-3 p-3 rounded-lg hover:bg-[rgb(var(--bg-hover))] cursor-pointer">
                          <div className="w-10 h-10 rounded-full bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center shrink-0">
                            <CalendarCheck className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[rgb(var(--text-primary))]">
                              Nuevo evento:{" "}
                              <span className="font-medium">
                                Reunión de equipo
                              </span>
                            </p>
                            <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">
                              Hace 5 minutos
                            </p>
                          </div>
                          <div className="w-2 h-2 rounded-full bg-[rgb(var(--brand-primary))] mt-2 shrink-0" />
                        </div>
                        <div className="flex gap-3 p-3 rounded-lg hover:bg-[rgb(var(--bg-hover))] cursor-pointer">
                          <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                            <UserPlus className="w-5 h-5 text-green-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[rgb(var(--text-primary))]">
                              <span className="font-medium">Juan Pérez</span>{" "}
                              aceptó tu invitación
                            </p>
                            <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">
                              Hace 1 hora
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-3 p-3 rounded-lg hover:bg-[rgb(var(--bg-hover))] cursor-pointer opacity-60">
                          <div className="w-10 h-10 rounded-full bg-[rgb(var(--bg-muted))] flex items-center justify-center shrink-0">
                            <Clock className="w-5 h-5 text-[rgb(var(--text-muted))]" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-[rgb(var(--text-secondary))]">
                              Recordatorio:{" "}
                              <span className="font-medium">
                                Cita con el dentista
                              </span>
                            </p>
                            <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">
                              Ayer
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="px-4 py-3 border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))]">
                      <button
                        onClick={() => {
                          setShowNotifications(false);
                          navigate("/notifications");
                        }}
                        className="w-full text-center text-sm text-[rgb(var(--brand-primary))] hover:underline"
                      >
                        Ver todas las notificaciones
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Theme toggle */}
            <div className="relative">
              <button
                ref={themeButtonRef}
                onClick={handleThemeClick}
                {...longPressHandlers}
                className="p-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))]"
                title="Cambiar tema (mantén presionado para opciones)"
              >
                <motion.div
                  key={resolvedTheme}
                  initial={{ rotate: -30, opacity: 0 }}
                  animate={{ rotate: 0, opacity: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  {resolvedTheme === "dark" ? (
                    <Moon className="w-5 h-5" />
                  ) : (
                    <Sun className="w-5 h-5" />
                  )}
                </motion.div>
              </button>

              {/* Theme Menu */}
              <AnimatePresence>
                {showThemeMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-44 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border-base))] shadow-lg overflow-hidden z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="p-1">
                      <div className="px-3 py-1.5 text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wide">
                        Apariencia
                      </div>
                      {[
                        { id: "light", label: "Claro", icon: Sun },
                        { id: "dark", label: "Oscuro", icon: Moon },
                        { id: "system", label: "Sistema", icon: Monitor },
                      ].map((option) => {
                        const ThemeIcon = option.icon;
                        return (
                          <button
                            key={option.id}
                            onClick={(e) => handleThemeChange(option.id, e)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                              theme === option.id
                                ? "bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))]"
                                : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))]"
                            }`}
                          >
                            <ThemeIcon className="w-4 h-4" />
                            {option.label}
                            {theme === option.id && (
                              <Check className="w-4 h-4 ml-auto" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Profile button */}
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowProfileMenu(!showProfileMenu);
                }}
                className="flex items-center gap-2 p-1.5 rounded-lg hover:bg-[rgb(var(--bg-hover))] transition-colors"
              >
                <div className="w-8 h-8 rounded-full overflow-hidden ring-2 ring-[rgb(var(--border-base))] hover:ring-[rgb(var(--brand-primary))]/50 transition-all">
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary))]/70 flex items-center justify-center text-white text-xs font-semibold">
                      {initials}
                    </div>
                  )}
                </div>
                <ChevronDown
                  className={`w-4 h-4 text-[rgb(var(--text-muted))] transition-transform ${
                    showProfileMenu ? "rotate-180" : ""
                  }`}
                />
              </button>

              {/* Profile Menu */}
              <AnimatePresence>
                {showProfileMenu && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95, y: -10 }}
                    className="absolute right-0 top-full mt-2 w-64 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border-base))] shadow-lg overflow-hidden z-50"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {/* Profile header with clickable avatar */}
                    <div className="px-4 py-3 border-b border-[rgb(var(--border-base))]">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => {
                            if (profile?.avatarFileId) {
                              setShowProfileMenu(false);
                              setShowAvatarViewer(true);
                            }
                          }}
                          className={`w-12 h-12 rounded-full overflow-hidden ring-2 ring-[rgb(var(--brand-primary))]/20 shrink-0 transition-transform ${
                            profile?.avatarFileId
                              ? "hover:scale-105 cursor-pointer"
                              : ""
                          }`}
                        >
                          {avatarUrl ? (
                            <img
                              src={avatarUrl}
                              alt={fullName}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary))]/70 flex items-center justify-center text-white font-semibold">
                              {initials}
                            </div>
                          )}
                        </button>
                        <div className="flex-1 min-w-0 overflow-hidden">
                          <p
                            className="text-sm font-medium text-[rgb(var(--text-primary))] truncate"
                            title={fullName}
                          >
                            {fullName}
                          </p>
                          {email && (
                            <p
                              className="text-xs text-[rgb(var(--text-muted))] truncate max-w-[160px]"
                              title={email}
                            >
                              {email}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Menu items */}
                    <div className="p-1">
                      <button
                        onClick={() => {
                          navigate("/groups");
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] transition-colors"
                      >
                        <Building2 className="w-4 h-4" />
                        <span>Mis espacios</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate("/settings");
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Configuración</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate("/notifications");
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] transition-colors"
                      >
                        <Bell className="w-4 h-4" />
                        <span>Centro de notificaciones</span>
                      </button>
                    </div>

                    {/* Logout */}
                    <div className="border-t border-[rgb(var(--border-base))] p-1">
                      <button
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[rgb(var(--error))] hover:bg-[rgb(var(--error))]/10 transition-colors"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Cerrar sesión</span>
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>

        {/* Bottom Navigation - Mobile */}
        <nav className="lg:hidden flex items-center justify-around px-2 py-2 bg-[rgb(var(--bg-surface))] border-t border-[rgb(var(--border-base))]">
          {/* Module buttons */}
          {MODULES.filter((m) => !m.disabled).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                  isActive
                    ? "text-[rgb(var(--brand-primary))]"
                    : "text-[rgb(var(--text-muted))]"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium">{item.label}</span>
              </NavLink>
            );
          })}

          {/* Profile button con menú desplegable */}
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMobileProfileMenu((prev) => !prev);
              }}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${
                showMobileProfileMenu
                  ? "text-[rgb(var(--brand-primary))]"
                  : "text-[rgb(var(--text-muted))]"
              }`}
            >
              <div className="w-5 h-5 rounded-full overflow-hidden ring-1 ring-[rgb(var(--border-base))]">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt={fullName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary))]/70 flex items-center justify-center text-white text-[8px] font-semibold">
                    {initials}
                  </div>
                )}
              </div>
              <span className="text-xs font-medium">Perfil</span>
            </button>

            {/* Mobile Profile Menu */}
            <AnimatePresence>
              {showMobileProfileMenu && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 10 }}
                  className="absolute bottom-full right-0 mb-2 w-56 bg-[rgb(var(--bg-elevated))] rounded-xl border border-[rgb(var(--border-base))] shadow-lg overflow-hidden z-50"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Header con toggle de tema */}
                  <div className="flex items-center justify-between px-3 py-2 border-b border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))]">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleQuickThemeToggle(e);
                      }}
                      className="p-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))] transition-colors"
                      title="Cambiar tema"
                    >
                      <motion.div
                        key={resolvedTheme}
                        initial={{ rotate: -30, opacity: 0 }}
                        animate={{ rotate: 0, opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        {resolvedTheme === "dark" ? (
                          <Moon className="w-4 h-4" />
                        ) : (
                          <Sun className="w-4 h-4" />
                        )}
                      </motion.div>
                    </button>
                  </div>

                  {/* User info with clickable avatar */}
                  <div className="p-3 border-b border-[rgb(var(--border-base))]">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => {
                          if (profile?.avatarFileId) {
                            setShowMobileProfileMenu(false);
                            setShowAvatarViewer(true);
                          }
                        }}
                        className={`w-10 h-10 rounded-full overflow-hidden ring-2 ring-[rgb(var(--brand-primary))]/20 shrink-0 transition-transform ${
                          profile?.avatarFileId
                            ? "hover:scale-105 active:scale-95 cursor-pointer"
                            : ""
                        }`}
                      >
                        {avatarUrl ? (
                          <img
                            src={avatarUrl}
                            alt={fullName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary))]/70 flex items-center justify-center text-white font-semibold text-sm">
                            {initials}
                          </div>
                        )}
                      </button>
                      <div className="flex-1 min-w-0 overflow-hidden">
                        <p
                          className="text-sm font-medium text-[rgb(var(--text-primary))] truncate"
                          title={fullName}
                        >
                          {fullName}
                        </p>
                        {email && (
                          <p
                            className="text-xs text-[rgb(var(--text-muted))] truncate max-w-[160px]"
                            title={email}
                          >
                            {email}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="p-1">
                    {/* Mis espacios */}
                    <button
                      onClick={() => {
                        setShowMobileProfileMenu(false);
                        navigate("/groups");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] transition-colors"
                    >
                      <Building2 className="w-4 h-4" />
                      <span>Mis espacios</span>
                    </button>

                    {/* Configuración */}
                    <button
                      onClick={() => {
                        setShowMobileProfileMenu(false);
                        navigate("/settings");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Configuración</span>
                    </button>

                    {/* Centro de notificaciones */}
                    <button
                      onClick={() => {
                        setShowMobileProfileMenu(false);
                        navigate("/notifications");
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] transition-colors"
                    >
                      <Bell className="w-4 h-4" />
                      <span>Centro de notificaciones</span>
                    </button>
                  </div>

                  {/* Logout */}
                  <div className="border-t border-[rgb(var(--border-base))] p-1">
                    <button
                      onClick={() => {
                        setShowMobileProfileMenu(false);
                        logout();
                      }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[rgb(var(--error))] hover:bg-[rgb(var(--error))]/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Overlay - Calendarios y Grupos */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileMenuOpen(false)}
              className="lg:hidden fixed inset-0 bg-black/50 z-40"
            />
            <motion.aside
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-[rgb(var(--bg-surface))] z-50 flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border-base))]">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-[rgb(var(--brand-primary))] flex items-center justify-center">
                    <Calendar className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <span className="font-bold text-[rgb(var(--text-primary))]">
                      Agenda
                    </span>
                    <span className="font-bold text-[rgb(var(--brand-primary))]">
                      {" "}
                      Pro
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Grupo activo - compacto con opción de cambiar */}
              {activeGroup && (
                <div className="px-4 py-3 border-b border-[rgb(var(--border-base))]">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowGroupMenu((prev) => !prev);
                    }}
                    className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] transition-colors"
                  >
                    <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center">
                      {activeGroup?.logoFileId ? (
                        <img
                          src={getGroupLogoUrl(activeGroup.logoFileId, 64, 64)}
                          alt={activeGroup.name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center">
                          <Building2 className="w-4 h-4 text-[rgb(var(--brand-primary))]" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                        {activeGroup.name}
                      </p>
                      <p className="text-xs text-[rgb(var(--text-muted))]">
                        {groups.length}{" "}
                        {groups.length === 1 ? "espacio" : "espacios"}
                      </p>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-[rgb(var(--text-muted))] transition-transform ${
                        showGroupMenu ? "rotate-180" : ""
                      }`}
                    />
                  </button>

                  {/* Group switcher dropdown */}
                  <AnimatePresence>
                    {showGroupMenu && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-2 overflow-hidden"
                      >
                        <div className="space-y-1 max-h-40 overflow-y-auto">
                          {groups.map((group) => {
                            const isOwner =
                              group.ownerProfileId === profile?.$id ||
                              group.membershipRole === "OWNER";
                            const logoUrl = group.logoFileId
                              ? getGroupLogoUrl(group.logoFileId, 32, 32)
                              : null;
                            return (
                              <button
                                key={group.$id}
                                onClick={() => {
                                  switchGroup(group.$id);
                                  setShowGroupMenu(false);
                                }}
                                className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                                  group.$id === activeGroup.$id
                                    ? "bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))]"
                                    : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))]"
                                }`}
                              >
                                <div className="w-5 h-5 rounded overflow-hidden flex-shrink-0">
                                  {logoUrl ? (
                                    <img
                                      src={logoUrl}
                                      alt={group.name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center">
                                      <Building2 className="w-3 h-3 text-[rgb(var(--brand-primary))]" />
                                    </div>
                                  )}
                                </div>
                                <span className="truncate flex-1">
                                  {group.name}
                                </span>
                                {isOwner && (
                                  <Crown className="w-3 h-3 text-amber-500 shrink-0" />
                                )}
                                {group.$id === activeGroup.$id && (
                                  <Check className="w-4 h-4 shrink-0" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                        <button
                          onClick={() => {
                            setShowGroupMenu(false);
                            setShowGroupModal(true);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 mt-1 rounded-lg text-sm text-[rgb(var(--brand-primary))] hover:bg-[rgb(var(--brand-primary))]/10 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Crear nuevo espacio</span>
                        </button>
                        <button
                          onClick={() => {
                            setShowGroupMenu(false);
                            setMobileMenuOpen(false);
                            navigate("/groups");
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] transition-colors"
                        >
                          <Settings className="w-4 h-4" />
                          <span>Gestionar espacios</span>
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}

              {/* Sección de Calendarios */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider">
                    Mis Calendarios
                  </h3>
                  <button
                    onClick={() => {
                      setShowCreateCalendar(true);
                    }}
                    className="p-1.5 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))]"
                    title="Crear calendario"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                {calendars.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[rgb(var(--bg-muted))] flex items-center justify-center">
                      <Calendar className="w-6 h-6 text-[rgb(var(--text-muted))]" />
                    </div>
                    <p className="text-sm text-[rgb(var(--text-muted))]">
                      No tienes calendarios aún
                    </p>
                    <button
                      onClick={() => {
                        setShowCreateCalendar(true);
                      }}
                      className="mt-3 text-sm text-[rgb(var(--brand-primary))] hover:underline"
                    >
                      Crear tu primer calendario
                    </button>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {calendars
                      .filter((cal) => cal.ownerProfileId === profile?.$id)
                      .map((calendar) => {
                        const colorStyle = getCalendarColor(calendar.color);
                        const isVisible = mobileVisibleCalendars.includes(
                          calendar.$id
                        );

                        return (
                          <div
                            key={calendar.$id}
                            className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] group"
                          >
                            <button
                              onClick={() =>
                                toggleMobileCalendarVisibility(calendar.$id)
                              }
                              className="shrink-0"
                            >
                              {isVisible ? (
                                <div
                                  className={`w-4 h-4 rounded ${colorStyle.dot} flex items-center justify-center`}
                                >
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              ) : (
                                <div className="w-4 h-4 rounded border-2 border-[rgb(var(--border-muted))]" />
                              )}
                            </button>
                            <span
                              className={`flex-1 text-sm truncate ${
                                isVisible
                                  ? "text-[rgb(var(--text-primary))]"
                                  : "text-[rgb(var(--text-muted))]"
                              }`}
                            >
                              {calendar.name}
                            </span>
                            <div className="relative">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMobileCalendarMenuId(
                                    mobileCalendarMenuId === calendar.$id
                                      ? null
                                      : calendar.$id
                                  );
                                }}
                                className="p-1.5 rounded-lg hover:bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-muted))] active:bg-[rgb(var(--bg-active))]"
                              >
                                <MoreHorizontal className="w-4 h-4" />
                              </button>

                              {/* Calendar options menu */}
                              <AnimatePresence>
                                {mobileCalendarMenuId === calendar.$id && (
                                  <motion.div
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.95 }}
                                    className="absolute right-0 top-full mt-1 w-36 bg-[rgb(var(--bg-elevated))] rounded-lg border border-[rgb(var(--border-base))] shadow-lg overflow-hidden z-10"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => {
                                        setMobileCalendarMenuId(null);
                                        setCalendarToEdit(calendar);
                                        setShowCreateCalendar(true);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))]"
                                    >
                                      <Pencil className="w-3.5 h-3.5" />
                                      <span>Editar</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        // TODO: Share calendar
                                        setMobileCalendarMenuId(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))]"
                                    >
                                      <Share2 className="w-3.5 h-3.5" />
                                      <span>Compartir</span>
                                    </button>
                                    <button
                                      onClick={() => {
                                        // TODO: Delete calendar
                                        setMobileCalendarMenuId(null);
                                      }}
                                      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--error))] hover:bg-[rgb(var(--error))]/10"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                      <span>Eliminar</span>
                                    </button>
                                  </motion.div>
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        );
                      })}

                    {/* Calendarios compartidos */}
                    {calendars.filter(
                      (cal) => cal.ownerProfileId !== profile?.$id
                    ).length > 0 && (
                      <>
                        <div className="pt-4 pb-2">
                          <span className="text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider">
                            Compartidos conmigo
                          </span>
                        </div>
                        {calendars
                          .filter((cal) => cal.ownerProfileId !== profile?.$id)
                          .map((calendar) => {
                            const colorStyle = getCalendarColor(calendar.color);
                            const isVisible = mobileVisibleCalendars.includes(
                              calendar.$id
                            );

                            return (
                              <div
                                key={calendar.$id}
                                className="flex items-center gap-2 px-2 py-2 rounded-lg hover:bg-[rgb(var(--bg-hover))]"
                              >
                                <button
                                  onClick={() =>
                                    toggleMobileCalendarVisibility(calendar.$id)
                                  }
                                  className="shrink-0"
                                >
                                  {isVisible ? (
                                    <div
                                      className={`w-4 h-4 rounded ${colorStyle.dot} flex items-center justify-center`}
                                    >
                                      <Check className="w-3 h-3 text-white" />
                                    </div>
                                  ) : (
                                    <div className="w-4 h-4 rounded border-2 border-[rgb(var(--border-muted))]" />
                                  )}
                                </button>
                                <span
                                  className={`flex-1 text-sm truncate ${
                                    isVisible
                                      ? "text-[rgb(var(--text-primary))]"
                                      : "text-[rgb(var(--text-muted))]"
                                  }`}
                                >
                                  {calendar.name}
                                </span>
                                <Users className="w-3.5 h-3.5 text-[rgb(var(--text-muted))]" />
                              </div>
                            );
                          })}
                      </>
                    )}
                  </div>
                )}
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Create Calendar Modal */}
      <CreateCalendarModal
        isOpen={showCreateCalendar}
        onClose={() => {
          setShowCreateCalendar(false);
          setCalendarToEdit(null);
        }}
        calendar={calendarToEdit}
        isEditing={!!calendarToEdit}
        onSuccess={(newCalendar) => {
          // Auto-select the new calendar when created (not editing)
          if (!calendarToEdit && newCalendar?.$id) {
            setMobileVisibleCalendars((prev) => [...prev, newCalendar.$id]);
          }
        }}
      />

      {/* Group Modal */}
      <GroupModal
        isOpen={showGroupModal}
        onClose={() => setShowGroupModal(false)}
        onSuccess={() => setShowGroupModal(false)}
      />

      {/* Avatar Image Viewer */}
      {profile?.avatarFileId && (
        <ImageViewerModal
          isOpen={showAvatarViewer}
          onClose={() => setShowAvatarViewer(false)}
          currentImageId={profile.avatarFileId}
          images={[profile.avatarFileId]}
          bucketId={env.bucketAvatarsId}
        />
      )}
    </div>
  );
}
