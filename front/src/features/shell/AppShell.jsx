import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from "react";
import { Outlet, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
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
  Volume2,
  VolumeX,
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
  CalendarDays,
  CalendarClock,
  CalendarHeart,
  CalendarRange,
  Star,
  Briefcase,
  GraduationCap,
  Heart,
  Home,
  Plane,
  Trophy,
  Music,
  Dumbbell,
  Coffee,
  Utensils,
  Car,
  BookOpen,
  Gamepad2,
  Loader2,
  Shield,
  User,
  Lock,
  Globe,
} from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import { useTheme } from "../../shared/theme/useTheme";
import { useDeleteCalendar } from "../../lib/hooks/useCalendars";
import { useNotifications } from "../../lib/hooks/useNotifications";
import { useUserInvitations } from "../../lib/hooks/useInvitations";
import { getAvatarUrl } from "../../lib/services/profileService";
import { getGroupLogoUrl } from "../../lib/hooks/useGroups";
import { notificationService } from "../../lib/services/notificationService";
import { CreateCalendarModal } from "../calendar/CreateCalendarModal";
import { GroupModal } from "../groups/GroupModal";
import { NotificationDetailsModal } from "../notifications/NotificationDetailsModal";
import { ImageViewerModal } from "../../shared/ui/ImageViewerModal";
import { env } from "../../shared/appwrite/env";
import { ENUMS } from "../../lib/constants";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

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
  violet: {
    bg: "bg-violet-500/20",
    border: "border-violet-500",
    text: "text-violet-500 dark:text-violet-400",
    dot: "bg-violet-500",
    light: "bg-violet-500/10",
  },
  blue: {
    bg: "bg-blue-500/20",
    border: "border-blue-500",
    text: "text-blue-500 dark:text-blue-400",
    dot: "bg-blue-500",
    light: "bg-blue-500/10",
  },
  cyan: {
    bg: "bg-cyan-500/20",
    border: "border-cyan-500",
    text: "text-cyan-500 dark:text-cyan-400",
    dot: "bg-cyan-500",
    light: "bg-cyan-500/10",
  },
  emerald: {
    bg: "bg-emerald-500/20",
    border: "border-emerald-500",
    text: "text-emerald-500 dark:text-emerald-400",
    dot: "bg-emerald-500",
    light: "bg-emerald-500/10",
  },
  teal: {
    bg: "bg-teal-500/20",
    border: "border-teal-500",
    text: "text-teal-500 dark:text-teal-400",
    dot: "bg-teal-500",
    light: "bg-teal-500/10",
  },
  amber: {
    bg: "bg-amber-500/20",
    border: "border-amber-500",
    text: "text-amber-500 dark:text-amber-400",
    dot: "bg-amber-500",
    light: "bg-amber-500/10",
  },
  orange: {
    bg: "bg-orange-500/20",
    border: "border-orange-500",
    text: "text-orange-500 dark:text-orange-400",
    dot: "bg-orange-500",
    light: "bg-orange-500/10",
  },
  pink: {
    bg: "bg-pink-500/20",
    border: "border-pink-500",
    text: "text-pink-500 dark:text-pink-400",
    dot: "bg-pink-500",
    light: "bg-pink-500/10",
  },
  rose: {
    bg: "bg-rose-500/20",
    border: "border-rose-500",
    text: "text-rose-500 dark:text-rose-400",
    dot: "bg-rose-500",
    light: "bg-rose-500/10",
  },
  red: {
    bg: "bg-red-500/20",
    border: "border-red-500",
    text: "text-red-500 dark:text-red-400",
    dot: "bg-red-500",
    light: "bg-red-500/10",
  },
  green: {
    bg: "bg-green-500/20",
    border: "border-green-500",
    text: "text-green-500 dark:text-green-400",
    dot: "bg-green-500",
    light: "bg-green-500/10",
  },
  yellow: {
    bg: "bg-yellow-500/20",
    border: "border-yellow-500",
    text: "text-yellow-500 dark:text-yellow-400",
    dot: "bg-yellow-500",
    light: "bg-yellow-500/10",
  },
  slate: {
    bg: "bg-slate-500/20",
    border: "border-slate-500",
    text: "text-slate-500 dark:text-slate-400",
    dot: "bg-slate-500",
    light: "bg-slate-500/10",
  },
};

const getCalendarColor = (color) =>
  CALENDAR_COLORS[color] || CALENDAR_COLORS.violet;

// Iconos de calendario
const CALENDAR_ICONS = {
  calendar: Calendar,
  "calendar-days": CalendarDays,
  "calendar-check": CalendarCheck,
  "calendar-clock": CalendarClock,
  "calendar-heart": CalendarHeart,
  "calendar-range": CalendarRange,
  star: Star,
  briefcase: Briefcase,
  "graduation-cap": GraduationCap,
  heart: Heart,
  home: Home,
  plane: Plane,
  trophy: Trophy,
  music: Music,
  dumbbell: Dumbbell,
  coffee: Coffee,
  utensils: Utensils,
  car: Car,
  "book-open": BookOpen,
  gamepad2: Gamepad2,
};

const getCalendarIcon = (iconId) => CALENDAR_ICONS[iconId] || Calendar;

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
    needsFirstGroup,
  } = useWorkspace();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const deleteCalendar = useDeleteCalendar();
  const location = useLocation();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Notificaciones con Realtime
  const {
    data: notifications = [],
    unreadCount: serverUnreadCount,
    isLoading: notificationsLoading,
    soundEnabled,
    toggleSound,
  } = useNotifications(null, profile?.$id);

  // Invitaciones pendientes
  const { data: invitations } = useUserInvitations(profile?.email);

  // Combinar notificaciones e invitaciones (evitando duplicados)
  const { recentNotifications, unreadCount } = useMemo(() => {
    // IDs de invitaciones que ya tienen una notificación real
    const notifiedInvitationIds = new Set(
      notifications
        .filter((n) => n.entityType === "group_invitations")
        .map((n) => n.entityId)
    );

    const inviteNotifs = (invitations || [])
      .filter(
        (inv) => inv.status === "PENDING" && !notifiedInvitationIds.has(inv.$id)
      )
      .map((inv) => ({
        $id: `inv-${inv.$id}`, // ID único para evitar colisiones
        kind: "INVITE",
        title: "Invitación a espacio",
        body: `Te han invitado a unirte a ${inv.group?.name}`,
        createdAt: inv.$createdAt,
        readAt: null,
        isInvitation: true,
        // Datos necesarios para la navegación
        entityType: "group_invitations",
        entityId: inv.$id,
      }));

    const combined = [...notifications, ...inviteNotifs].sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    return {
      recentNotifications: combined.slice(0, 5),
      unreadCount: (serverUnreadCount || 0) + inviteNotifs.length,
    };
  }, [notifications, invitations, serverUnreadCount]);

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
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [newGroupName, setNewGroupName] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Estados para calendarios en móvil con persistencia
  const [visibleCalendars, setVisibleCalendars] = useState(() => {
    // Cargar calendarios visibles desde localStorage
    try {
      const saved = localStorage.getItem('agenda_pro_visible_calendars');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [mobileCalendarMenuId, setMobileCalendarMenuId] = useState(null);
  const [sharingCalendar, setSharingCalendar] = useState(null);
  const [deletingCalendar, setDeletingCalendar] = useState(null);

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

  // Inicializar calendarios visibles cuando cambian - solo una vez
  const hasInitializedMobileCalendars = useRef(false);
  useEffect(() => {
    if (calendars.length > 0 && !hasInitializedMobileCalendars.current) {
      // Solo inicializar si no hay calendarios guardados
      setVisibleCalendars((prev) => {
        if (prev.length === 0) {
          const allIds = calendars.map((c) => c.$id);
          localStorage.setItem('agenda_pro_visible_calendars', JSON.stringify(allIds));
          return allIds;
        }
        // Filtrar calendarios que ya no existen
        const validIds = prev.filter(id => calendars.some(c => c.$id === id));
        if (validIds.length !== prev.length) {
          localStorage.setItem('agenda_pro_visible_calendars', JSON.stringify(validIds));
          return validIds;
        }
        return prev;
      });
      hasInitializedMobileCalendars.current = true;
    }
  }, [calendars]);

  // Guardar calendarios visibles en localStorage cuando cambien
  useEffect(() => {
    if (visibleCalendars.length > 0) {
      localStorage.setItem('agenda_pro_visible_calendars', JSON.stringify(visibleCalendars));
    }
  }, [visibleCalendars]);

  // Toggle visibilidad de calendario en móvil
  const toggleCalendarVisibility = useCallback((calendarId) => {
    setVisibleCalendars((prev) =>
      prev.includes(calendarId)
        ? prev.filter((id) => id !== calendarId)
        : [...prev, calendarId]
    );
  }, []);

  const calendarVisibility = useMemo(
    () => ({
      visibleCalendars,
      setVisibleCalendars,
      toggleCalendarVisibility,
    }),
    [visibleCalendars, setVisibleCalendars, toggleCalendarVisibility]
  );

  // Agrupar calendarios por tipo (Personal, Grupo propios por visibilidad, Compartidos)
  const groupedCalendars = useMemo(() => {
    if (!calendars || !profile?.$id) {
      return {
        personal: [],
        ownGroupPrivate: [],
        ownGroupGroup: [],
        shared: [],
      };
    }

    const ownGroupCalendars = calendars.filter(
      (cal) =>
        cal.scope === ENUMS.CALENDAR_SCOPE.GROUP &&
        cal.ownerProfileId === profile.$id
    );

    return {
      personal: calendars.filter(
        (cal) =>
          cal.scope === ENUMS.CALENDAR_SCOPE.PERSONAL &&
          cal.ownerProfileId === profile.$id
      ),
      ownGroupPrivate: ownGroupCalendars.filter(
        (cal) => cal.visibility === ENUMS.CALENDAR_VISIBILITY.PRIVATE
      ),
      ownGroupGroup: ownGroupCalendars.filter(
        (cal) => cal.visibility === ENUMS.CALENDAR_VISIBILITY.GROUP
      ),
      shared: calendars.filter(
        (cal) =>
          cal.scope === ENUMS.CALENDAR_SCOPE.GROUP &&
          cal.ownerProfileId !== profile.$id
      ),
    };
  }, [calendars, profile?.$id]);

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
    <div className="flex h-dvh bg-[rgb(var(--bg-base))] overflow-hidden">
      {/* Sidebar - Desktop */}
      <motion.aside
        initial={false}
        animate={{ width: sidebarCollapsed ? 72 : 260 }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className="hidden lg:flex flex-col h-full bg-[rgb(var(--bg-surface))] border-r border-[rgb(var(--border-base))] overflow-hidden"
      >
        {/* Logo */}
        <div className="flex items-center h-[65px] px-4 border-b border-[rgb(var(--border-base))]">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0">
            <img
              src="/logo.png"
              alt="Agenda Pro"
              className="w-full h-full object-contain"
            />
          </div>
          <div
            className={`flex items-center flex-1 ml-3 overflow-hidden transition-all duration-300 ${
              sidebarCollapsed ? "opacity-0 w-0 ml-0" : "opacity-100"
            }`}
          >
            <div className="whitespace-nowrap flex-1">
              <span className="font-bold text-[rgb(var(--brand-primary))]">
                Agenda
              </span>
              <span className="font-bold text-orange-500"> Pro</span>
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
                    {activeGroup ? (
                      <Building2 className="w-4 h-4 text-[rgb(var(--brand-primary))]" />
                    ) : (
                      <Calendar className="w-4 h-4 text-[rgb(var(--brand-primary))]" />
                    )}
                  </div>
                )}
              </div>
              <div
                className={`min-w-0 overflow-hidden whitespace-nowrap transition-all duration-300 flex-1 text-left ${
                  sidebarCollapsed ? "opacity-0 w-0" : "opacity-100"
                }`}
              >
                <p className="text-xs font-medium text-[rgb(var(--text-primary))] truncate">
                  {activeGroup?.name || "Calendarios Personales"}
                </p>
                <p className="text-[10px] text-[rgb(var(--text-muted))]">
                  {activeGroup
                    ? activeGroup?.membershipRole === "OWNER" ||
                      activeGroup?.ownerProfileId === profile?.$id
                      ? "Propietario"
                      : "Miembro"
                    : "Solo personales"}
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
                    {/* Opción: Calendarios Personales (sin grupo) */}
                    <button
                      onClick={() => {
                        switchGroup(null);
                        setShowGroupMenu(false);
                      }}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeGroup === null
                          ? "bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))]"
                          : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))]"
                      }`}
                    >
                      <div className="w-6 h-6 rounded-md overflow-hidden flex items-center justify-center shrink-0">
                        <div className="w-full h-full bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center">
                          <Calendar className="w-3 h-3 text-[rgb(var(--brand-primary))]" />
                        </div>
                      </div>
                      <span className="flex-1 text-left truncate">
                        Calendarios Personales
                      </span>
                      {activeGroup === null && (
                        <Check className="w-4 h-4 shrink-0" />
                      )}
                    </button>

                    {/* Separador si hay grupos */}
                    {groups.length > 0 && (
                      <div className="my-1 border-t border-[rgb(var(--border-base))]" />
                    )}

                    {/* Lista de grupos existentes */}
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
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
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
        {/* Header móvil - Fijo en la parte superior */}
        <header className="lg:hidden flex items-center justify-between px-4 h-12 bg-[rgb(var(--bg-surface))] border-b border-[rgb(var(--border-base))] shrink-0">
          <button
            onClick={() => setMobileMenuOpen(true)}
            className="p-2 -ml-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-primary))]"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center">
              <img
                src="/logo.png"
                alt="Agenda Pro"
                className="w-full h-full object-contain"
              />
            </div>
            <span className="font-bold text-[rgb(var(--brand-primary))]">
              Agenda
            </span>
            <span className="font-bold text-orange-500">Pro</span>
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
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[rgb(var(--error))] rounded-full border-2 border-[rgb(var(--bg-surface))]" />
                )}
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSound();
                          }}
                          className="p-1 rounded-md text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
                          title={
                            soundEnabled
                              ? "Silenciar notificaciones"
                              : "Activar sonido"
                          }
                        >
                          {soundEnabled ? (
                            <Volume2 className="w-4 h-4" />
                          ) : (
                            <VolumeX className="w-4 h-4" />
                          )}
                        </button>
                        {unreadCount > 0 && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAllAsRead(
                                activeGroup?.$id,
                                profile?.$id
                              );
                            }}
                            className="text-xs text-[rgb(var(--brand-primary))] hover:underline"
                          >
                            Marcar leídas
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="max-h-72 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {notificationsLoading ? (
                          <div className="flex items-center justify-center py-8">
                            <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--text-muted))]" />
                          </div>
                        ) : recentNotifications.length === 0 ? (
                          <div className="text-center py-8">
                            <Bell className="w-8 h-8 mx-auto text-[rgb(var(--text-muted))] mb-2 opacity-50" />
                            <p className="text-sm text-[rgb(var(--text-muted))]">
                              No hay notificaciones
                            </p>
                          </div>
                        ) : (
                          recentNotifications.map((notification) => (
                            <NotificationItem
                              key={notification.$id}
                              notification={notification}
                              onClick={() => {
                                handleNotificationClick(
                                  notification,
                                  navigate,
                                  setSelectedNotification,
                                  queryClient,
                                  profile?.$id
                                );
                                setShowNotifications(false);
                              }}
                            />
                          ))
                        )}
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
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[rgb(var(--error))] rounded-full border-2 border-[rgb(var(--bg-surface))]" />
                )}
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
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleSound();
                          }}
                          className="p-1 rounded-md text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
                          title={
                            soundEnabled
                              ? "Silenciar notificaciones"
                              : "Activar sonido"
                          }
                        >
                          {soundEnabled ? (
                            <Volume2 className="w-4 h-4" />
                          ) : (
                            <VolumeX className="w-4 h-4" />
                          )}
                        </button>
                        <button
                          onClick={() =>
                            handleMarkAllAsRead(activeGroup?.$id, profile?.$id)
                          }
                          disabled={unreadCount === 0}
                          className="text-xs text-[rgb(var(--brand-primary))] hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          Marcar leídas
                        </button>
                      </div>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      <div className="p-2 space-y-1">
                        {notificationsLoading ? (
                          <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--text-muted))]" />
                          </div>
                        ) : recentNotifications.length === 0 ? (
                          <div className="text-center py-12">
                            <Bell className="w-10 h-10 mx-auto text-[rgb(var(--text-muted))] mb-2 opacity-50" />
                            <p className="text-sm text-[rgb(var(--text-muted))]">
                              No hay notificaciones
                            </p>
                          </div>
                        ) : (
                          recentNotifications.map((notification) => (
                            <NotificationItem
                              key={notification.$id}
                              notification={notification}
                              onClick={() => {
                                handleNotificationClick(
                                  notification,
                                  navigate,
                                  setSelectedNotification,
                                  queryClient,
                                  profile?.$id
                                );
                                setShowNotifications(false);
                              }}
                            />
                          ))
                        )}
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
                    <div className="w-full h-full bg-linear-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary))]/70 flex items-center justify-center text-white text-xs font-semibold">
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
                            <div className="w-full h-full bg-linear-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary))]/70 flex items-center justify-center text-white font-semibold">
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
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
                      >
                        <Building2 className="w-4 h-4" />
                        <span>Mis espacios</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate("/settings");
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Configuración</span>
                      </button>
                      <button
                        onClick={() => {
                          navigate("/notifications");
                          setShowProfileMenu(false);
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
                      >
                        <Bell className="w-4 h-4" />
                        <span>Centro de notificaciones</span>
                      </button>
                    </div>

                    {/* Admin - solo para platform admins */}
                    {(profile?.isPlatformAdmin || profile?.adminplatform) && (
                      <div className="border-t border-[rgb(var(--border-base))] p-1">
                        <button
                          onClick={() => {
                            navigate("/admin");
                            setShowProfileMenu(false);
                          }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 transition-colors"
                        >
                          <Shield className="w-4 h-4" />
                          <span>Panel de administración</span>
                        </button>
                      </div>
                    )}

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
        <main className="flex-1 overflow-y-auto overflow-x-hidden min-h-0">
          <Outlet context={{ calendarVisibility }} />
        </main>

        {/* Bottom Navigation - Mobile - Fijo en la parte inferior */}
        <nav className="lg:hidden flex items-center justify-around px-2 py-1 bg-[rgb(var(--bg-surface))] border-t border-[rgb(var(--border-base))] shrink-0">
          {/* Module buttons */}
          {MODULES.filter((m) => !m.disabled).map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <NavLink
                key={item.id}
                to={item.path}
                className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
                  isActive
                    ? "text-[rgb(var(--brand-primary))]"
                    : "text-[rgb(var(--text-muted))]"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{item.label}</span>
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
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-colors ${
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
                  <div className="w-full h-full bg-linear-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary))]/70 flex items-center justify-center text-white text-[8px] font-semibold">
                    {initials}
                  </div>
                )}
              </div>
              <span className="text-[10px] font-medium">Perfil</span>
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
                          <div className="w-full h-full bg-linear-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-primary))]/70 flex items-center justify-center text-white font-semibold text-sm">
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
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
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
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
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
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
                    >
                      <Bell className="w-4 h-4" />
                      <span>Centro de notificaciones</span>
                    </button>
                  </div>

                  {/* Admin - solo para platform admins */}
                  {(profile?.isPlatformAdmin || profile?.adminplatform) && (
                    <div className="border-t border-[rgb(var(--border-base))] p-1">
                      <button
                        onClick={() => {
                          setShowMobileProfileMenu(false);
                          navigate("/admin");
                        }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-violet-600 dark:text-violet-400 hover:bg-violet-500/10 transition-colors"
                      >
                        <Shield className="w-4 h-4" />
                        <span>Panel de administración</span>
                      </button>
                    </div>
                  )}

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
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center">
                    <img
                      src="/logo.png"
                      alt="Agenda Pro"
                      className="w-full h-full object-contain"
                    />
                  </div>
                  <div>
                    <span className="font-bold text-[rgb(var(--brand-primary))]">
                      Agenda
                    </span>
                    <span className="font-bold text-orange-500"> Pro</span>
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
                        {activeGroup ? (
                          <Building2 className="w-4 h-4 text-[rgb(var(--brand-primary))]" />
                        ) : (
                          <Calendar className="w-4 h-4 text-[rgb(var(--brand-primary))]" />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                      {activeGroup?.name || "Calendarios Personales"}
                    </p>
                    <p className="text-xs text-[rgb(var(--text-muted))]">
                      {activeGroup
                        ? `${groups.length} ${
                            groups.length === 1 ? "espacio" : "espacios"
                          }`
                        : "Solo personales"}
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
                        {/* Opción: Calendarios Personales (sin grupo) */}
                        <button
                          onClick={() => {
                            switchGroup(null);
                            setShowGroupMenu(false);
                          }}
                          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                            activeGroup === null
                              ? "bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))]"
                              : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))]"
                          }`}
                        >
                          <div className="w-5 h-5 rounded overflow-hidden shrink-0">
                            <div className="w-full h-full bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center">
                              <Calendar className="w-3 h-3 text-[rgb(var(--brand-primary))]" />
                            </div>
                          </div>
                          <span className="truncate flex-1">
                            Calendarios Personales
                          </span>
                          {activeGroup === null && (
                            <Check className="w-4 h-4 shrink-0" />
                          )}
                        </button>

                        {/* Separador si hay grupos */}
                        {groups.length > 0 && (
                          <div className="my-1 border-t border-[rgb(var(--border-base))]" />
                        )}

                        {/* Lista de grupos existentes */}
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
                                group.$id === activeGroup?.$id
                                  ? "bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))]"
                                  : "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))]"
                              }`}
                            >
                              <div className="w-5 h-5 rounded overflow-hidden shrink-0">
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
                              {group.$id === activeGroup?.$id && (
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
                        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
                      >
                        <Settings className="w-4 h-4" />
                        <span>Gestionar espacios</span>
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Sección de Calendarios */}
              <div className="flex-1 overflow-y-auto p-3">
                <div className="mb-3 flex items-center justify-between">
                  <h3 className="text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider">
                    Mis Calendarios
                  </h3>
                  <button
                    onClick={() => {
                      if (!needsFirstGroup) {
                        setShowCreateCalendar(true);
                      }
                    }}
                    disabled={needsFirstGroup}
                    className="p-1.5 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))] disabled:opacity-50 disabled:cursor-not-allowed"
                    title={
                      needsFirstGroup
                        ? "Crea un grupo primero"
                        : "Crear calendario"
                    }
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
                      {needsFirstGroup
                        ? "Crea un grupo primero"
                        : "No tienes calendarios aún"}
                    </p>
                    {!needsFirstGroup && (
                      <button
                        onClick={() => {
                          setShowCreateCalendar(true);
                        }}
                        className="mt-3 text-sm text-[rgb(var(--brand-primary))] hover:underline"
                      >
                        Crear tu primer calendario
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-0.5">
                    {/* Calendarios PERSONALES */}
                    {groupedCalendars.personal.length > 0 && (
                      <>
                        <div className="pt-2 pb-2">
                          <span className="text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider flex items-center gap-1.5">
                            <User className="w-3 h-3" />
                            Personal
                          </span>
                        </div>
                        {groupedCalendars.personal.map((calendar) => {
                          const colorStyle = getCalendarColor(calendar.color);
                          const CalendarItemIcon = getCalendarIcon(
                            calendar.icon
                          );
                          const isVisible = visibleCalendars.includes(
                            calendar.$id
                          );

                          return (
                            <div
                              key={calendar.$id}
                              className={`flex items-center gap-2 px-2 py-2.5 rounded-lg active:bg-[rgb(var(--bg-hover))] transition-colors ${
                                isVisible ? "" : "opacity-60"
                              }`}
                            >
                              <button
                                onClick={() =>
                                  toggleCalendarVisibility(calendar.$id)
                                }
                                className="shrink-0 p-1.5 -m-1.5 touch-manipulation"
                                aria-label={
                                  isVisible
                                    ? `Ocultar ${calendar.name}`
                                    : `Mostrar ${calendar.name}`
                                }
                              >
                                {isVisible ? (
                                  <div
                                    className={`w-5 h-5 rounded ${colorStyle.dot} flex items-center justify-center`}
                                  >
                                    <Check
                                      className="w-3.5 h-3.5 text-white"
                                      strokeWidth={3}
                                    />
                                  </div>
                                ) : (
                                  <div
                                    className={`w-5 h-5 rounded border-2 ${colorStyle.border}`}
                                  />
                                )}
                              </button>

                              <div
                                className={`w-5 h-5 rounded ${colorStyle.light} flex items-center justify-center shrink-0`}
                              >
                                <CalendarItemIcon
                                  className={`w-3 h-3 ${colorStyle.text}`}
                                />
                              </div>

                              <span
                                className={`flex-1 text-sm truncate ${
                                  isVisible
                                    ? "text-[rgb(var(--text-primary))]"
                                    : "text-[rgb(var(--text-muted))]"
                                }`}
                              >
                                {calendar.name}
                              </span>
                              <User
                                className="w-3 h-3 text-[rgb(var(--text-muted))]"
                                title="Personal"
                              />
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
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                        <span>Editar</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setMobileCalendarMenuId(null);
                                          setDeletingCalendar(calendar);
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
                      </>
                    )}

                    {/* Calendarios de GRUPO propios - PRIVADOS */}
                    {groupedCalendars.ownGroupPrivate.length > 0 && (
                      <>
                        <div className="pt-4 pb-2">
                          <span className="text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider flex items-center gap-1.5">
                            <Lock className="w-3 h-3" />
                            Privado ({activeGroup?.name || "Grupo"})
                          </span>
                        </div>
                        {groupedCalendars.ownGroupPrivate.map((calendar) => {
                          const colorStyle = getCalendarColor(calendar.color);
                          const CalendarItemIcon = getCalendarIcon(
                            calendar.icon
                          );
                          const isVisible = visibleCalendars.includes(
                            calendar.$id
                          );
                          // Icono de visibilidad
                          const VisibilityIcon =
                            calendar.visibility ===
                            ENUMS.CALENDAR_VISIBILITY.PRIVATE
                              ? Lock
                              : calendar.visibility ===
                                ENUMS.CALENDAR_VISIBILITY.PUBLIC
                              ? Globe
                              : Users;

                          return (
                            <div
                              key={calendar.$id}
                              className={`flex items-center gap-2 px-2 py-2.5 rounded-lg active:bg-[rgb(var(--bg-hover))] transition-colors ${
                                isVisible ? "" : "opacity-60"
                              }`}
                            >
                              <button
                                onClick={() =>
                                  toggleCalendarVisibility(calendar.$id)
                                }
                                className="shrink-0 p-1.5 -m-1.5 touch-manipulation"
                                aria-label={
                                  isVisible
                                    ? `Ocultar ${calendar.name}`
                                    : `Mostrar ${calendar.name}`
                                }
                              >
                                {isVisible ? (
                                  <div
                                    className={`w-5 h-5 rounded ${colorStyle.dot} flex items-center justify-center`}
                                  >
                                    <Check
                                      className="w-3.5 h-3.5 text-white"
                                      strokeWidth={3}
                                    />
                                  </div>
                                ) : (
                                  <div
                                    className={`w-5 h-5 rounded border-2 ${colorStyle.border}`}
                                  />
                                )}
                              </button>

                              <div
                                className={`w-5 h-5 rounded ${colorStyle.light} flex items-center justify-center shrink-0`}
                              >
                                <CalendarItemIcon
                                  className={`w-3 h-3 ${colorStyle.text}`}
                                />
                              </div>

                              <span
                                className={`flex-1 text-sm truncate ${
                                  isVisible
                                    ? "text-[rgb(var(--text-primary))]"
                                    : "text-[rgb(var(--text-muted))]"
                                }`}
                              >
                                {calendar.name}
                              </span>
                              <VisibilityIcon
                                className="w-3 h-3 text-[rgb(var(--text-muted))]"
                                title={
                                  calendar.visibility ===
                                  ENUMS.CALENDAR_VISIBILITY.PRIVATE
                                    ? "Privado"
                                    : calendar.visibility ===
                                      ENUMS.CALENDAR_VISIBILITY.PUBLIC
                                    ? "Público"
                                    : "Grupo"
                                }
                              />
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
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                        <span>Editar</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setMobileCalendarMenuId(null);
                                          setSharingCalendar(calendar);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
                                      >
                                        <Share2 className="w-3.5 h-3.5" />
                                        <span>Compartir</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setMobileCalendarMenuId(null);
                                          setDeletingCalendar(calendar);
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
                      </>
                    )}

                    {/* Calendarios de GRUPO propios - DE GRUPO */}
                    {groupedCalendars.ownGroupGroup.length > 0 && (
                      <>
                        <div className="pt-4 pb-2">
                          <span className="text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider flex items-center gap-1.5">
                            <Users className="w-3 h-3" />
                            Grupo ({activeGroup?.name || "Grupo"})
                          </span>
                        </div>
                        {groupedCalendars.ownGroupGroup.map((calendar) => {
                          const colorStyle = getCalendarColor(calendar.color);
                          const CalendarItemIcon = getCalendarIcon(
                            calendar.icon
                          );
                          const isVisible = visibleCalendars.includes(
                            calendar.$id
                          );
                          // Icono de visibilidad
                          const VisibilityIcon =
                            calendar.visibility ===
                            ENUMS.CALENDAR_VISIBILITY.PRIVATE
                              ? Lock
                              : calendar.visibility ===
                                ENUMS.CALENDAR_VISIBILITY.PUBLIC
                              ? Globe
                              : Users;

                          return (
                            <div
                              key={calendar.$id}
                              className={`flex items-center gap-2 px-2 py-2.5 rounded-lg active:bg-[rgb(var(--bg-hover))] transition-colors ${
                                isVisible ? "" : "opacity-60"
                              }`}
                            >
                              <button
                                onClick={() =>
                                  toggleCalendarVisibility(calendar.$id)
                                }
                                className="shrink-0 p-1.5 -m-1.5 touch-manipulation"
                                aria-label={
                                  isVisible
                                    ? `Ocultar ${calendar.name}`
                                    : `Mostrar ${calendar.name}`
                                }
                              >
                                {isVisible ? (
                                  <div
                                    className={`w-5 h-5 rounded ${colorStyle.dot} flex items-center justify-center`}
                                  >
                                    <Check
                                      className="w-3.5 h-3.5 text-white"
                                      strokeWidth={3}
                                    />
                                  </div>
                                ) : (
                                  <div
                                    className={`w-5 h-5 rounded border-2 ${colorStyle.border}`}
                                  />
                                )}
                              </button>

                              <div
                                className={`w-5 h-5 rounded ${colorStyle.light} flex items-center justify-center shrink-0`}
                              >
                                <CalendarItemIcon
                                  className={`w-3 h-3 ${colorStyle.text}`}
                                />
                              </div>

                              <span
                                className={`flex-1 text-sm truncate ${
                                  isVisible
                                    ? "text-[rgb(var(--text-primary))]"
                                    : "text-[rgb(var(--text-muted))]"
                                }`}
                              >
                                {calendar.name}
                              </span>
                              <VisibilityIcon
                                className="w-3 h-3 text-[rgb(var(--text-muted))]"
                                title={
                                  calendar.visibility ===
                                  ENUMS.CALENDAR_VISIBILITY.PRIVATE
                                    ? "Privado"
                                    : calendar.visibility ===
                                      ENUMS.CALENDAR_VISIBILITY.PUBLIC
                                    ? "Público"
                                    : "Grupo"
                                }
                              />
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
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                        <span>Editar</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setMobileCalendarMenuId(null);
                                          setSharingCalendar(calendar);
                                        }}
                                        className="w-full flex items-center gap-2 px-3 py-2 text-sm text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] hover:text-[rgb(var(--text-primary))] transition-colors"
                                      >
                                        <Share2 className="w-3.5 h-3.5" />
                                        <span>Compartir</span>
                                      </button>
                                      <button
                                        onClick={() => {
                                          setMobileCalendarMenuId(null);
                                          setDeletingCalendar(calendar);
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
                      </>
                    )}

                    {/* Calendarios compartidos */}
                    {groupedCalendars.shared.length > 0 && (
                      <>
                        <div className="pt-4 pb-2">
                          <span className="text-xs font-semibold text-[rgb(var(--text-muted))] uppercase tracking-wider">
                            Compartidos conmigo
                          </span>
                        </div>
                        {groupedCalendars.shared.map((calendar) => {
                          const colorStyle = getCalendarColor(calendar.color);
                          const isVisible = visibleCalendars.includes(
                            calendar.$id
                          );

                          return (
                            <div
                              key={calendar.$id}
                              className={`flex items-center gap-2 px-2 py-2.5 rounded-lg active:bg-[rgb(var(--bg-hover))] transition-colors ${
                                isVisible ? "" : "opacity-60"
                              }`}
                            >
                              <button
                                onClick={() =>
                                  toggleCalendarVisibility(calendar.$id)
                                }
                                className="shrink-0 p-1.5 -m-1.5 touch-manipulation"
                                aria-label={
                                  isVisible
                                    ? `Ocultar ${calendar.name}`
                                    : `Mostrar ${calendar.name}`
                                }
                              >
                                {isVisible ? (
                                  <div
                                    className={`w-5 h-5 rounded ${colorStyle.dot} flex items-center justify-center`}
                                  >
                                    <Check
                                      className="w-3.5 h-3.5 text-white"
                                      strokeWidth={3}
                                    />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded border-2 border-[rgb(var(--border-muted))]" />
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
            setVisibleCalendars((prev) => [...prev, newCalendar.$id]);
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

      {/* Notification Details */}
      <NotificationDetailsModal
        isOpen={!!selectedNotification}
        onClose={() => setSelectedNotification(null)}
        notification={selectedNotification}
      />

      {/* Delete Calendar Confirmation */}
      <AnimatePresence>
        {deletingCalendar && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
          >
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50"
              onClick={() =>
                !deleteCalendar.isPending && setDeletingCalendar(null)
              }
            />

            {/* Modal */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative bg-[rgb(var(--bg-elevated))] rounded-2xl shadow-xl border border-[rgb(var(--border-base))] p-6 max-w-sm w-full"
            >
              <div className="text-center">
                <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-[rgb(var(--error))]/10 flex items-center justify-center">
                  <Trash2 className="w-6 h-6 text-[rgb(var(--error))]" />
                </div>
                <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">
                  Eliminar calendario
                </h3>
                <p className="text-sm text-[rgb(var(--text-muted))] mb-6">
                  ¿Estás seguro de que deseas eliminar{" "}
                  <span className="font-medium text-[rgb(var(--text-secondary))]">
                    "{deletingCalendar.name}"
                  </span>
                  ? Esta acción eliminará también todos los eventos asociados.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setDeletingCalendar(null)}
                    disabled={deleteCalendar.isPending}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-[rgb(var(--text-secondary))] bg-[rgb(var(--bg-muted))] hover:bg-[rgb(var(--bg-hover))] transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={() => {
                      deleteCalendar.mutate(deletingCalendar.$id, {
                        onSuccess: () => {
                          // Remover de calendarios visibles
                          setVisibleCalendars((prev) =>
                            prev.filter((id) => id !== deletingCalendar.$id)
                          );
                          setDeletingCalendar(null);
                        },
                      });
                    }}
                    disabled={deleteCalendar.isPending}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[rgb(var(--error))] hover:opacity-90 transition-opacity disabled:opacity-70 flex items-center justify-center gap-2"
                  >
                    {deleteCalendar.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      "Eliminar"
                    )}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ============================================================================
// Helper Functions para Notificaciones
// ============================================================================

/**
 * Manejar click en notificación
 */
async function handleNotificationClick(
  notification,
  navigate,
  onOpenDetails = null,
  queryClient = null,
  profileId = null
) {
  // Las notificaciones virtuales de invitación no necesitan marcarse como leídas
  // porque no existen en la base de datos. Solo navegamos.
  if (notification.isInvitation) {
    navigate("/groups");
    return;
  }

  // Marcar como leída PRIMERO y esperar a que se complete
  // antes de navegar (para que se actualice el contador)
  if (!notification.readAt) {
    try {
      await notificationService.markAsRead(notification.$id);

      // Invalidar cache manualmente para actualización inmediata
      if (queryClient && profileId) {
        queryClient.invalidateQueries(["notifications", null, profileId]);
        queryClient.invalidateQueries([
          "notifications",
          notification.groupId,
          profileId,
        ]);
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  }

  // Si es una notificación de sistema (ej: invitación rechazada/aceptada), mostrar modal
  if (notification.kind === "SYSTEM" && onOpenDetails) {
    onOpenDetails(notification);
    return;
  }

  // Navegar a la entidad si existe
  if (notification.entityType && notification.entityId) {
    // Si es una invitación, extraer el token del metadata y navegar directamente
    if (
      notification.entityType === "group_invitations" &&
      notification.metadata
    ) {
      try {
        const metadata =
          typeof notification.metadata === "string"
            ? JSON.parse(notification.metadata)
            : notification.metadata;

        if (metadata.token) {
          navigate(`/invite/${metadata.token}`);
          return;
        }
      } catch (err) {
        console.error("Error parsing notification metadata:", err);
      }
    }

    const entityTypeToPath = {
      events: "/calendar",
      group_invitations: "/groups",
      calendars: "/calendar",
      groups: "/groups",
    };

    const path = entityTypeToPath[notification.entityType];
    if (path) {
      navigate(path);
      return;
    }
  }

  // Si no hay acción específica, abrir detalles
  if (onOpenDetails) {
    onOpenDetails(notification);
  }
}

/**
 * Marcar todas las notificaciones como leídas
 */
async function handleMarkAllAsRead(groupId, profileId) {
  try {
    await notificationService.markAllAsRead(groupId, profileId);
  } catch (error) {
    console.error("Error marking all as read:", error);
  }
}

// ============================================================================
// Componente NotificationItem
// ============================================================================

function NotificationItem({ notification, onClick }) {
  const isUnread = !notification.readAt;

  // Mapeo de iconos por kind
  const iconMap = {
    EVENT_REMINDER: CalendarCheck,
    INVITE: UserPlus,
    SYSTEM: Bell,
  };

  const Icon = iconMap[notification.kind] || Bell;

  // Colores por tipo
  const colorMap = {
    EVENT_REMINDER: "rgb(var(--brand-primary))",
    INVITE: "rgb(34, 197, 94)", // green-500
    SYSTEM: "rgb(var(--text-muted))",
  };

  const color = colorMap[notification.kind] || "rgb(var(--text-muted))";

  return (
    <div
      onClick={onClick}
      className={`
        flex gap-3 p-3 rounded-lg hover:bg-[rgb(var(--bg-hover))] cursor-pointer
        transition-all duration-200
        ${isUnread ? "bg-[rgb(var(--brand-primary))]/5" : "opacity-75"}
      `}
    >
      <div
        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
        style={{ backgroundColor: `${color}15` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-[rgb(var(--text-primary))] line-clamp-1">
          {notification.title}
        </p>
        {notification.body && (
          <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5 line-clamp-1">
            {notification.body}
          </p>
        )}
        <p className="text-xs text-[rgb(var(--text-muted))] mt-0.5">
          {formatDistanceToNow(new Date(notification.createdAt), {
            addSuffix: true,
            locale: es,
          })}
        </p>
      </div>
      {isUnread && (
        <div className="w-2 h-2 rounded-full bg-[rgb(var(--brand-primary))] mt-2 shrink-0" />
      )}
    </div>
  );
}
