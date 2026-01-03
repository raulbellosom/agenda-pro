import React, { useState, useCallback, useEffect } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar,
  Bell,
  Settings,
  LogOut,
  ChevronDown,
  Users,
  Plus,
  Loader2,
  User,
} from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import { Button } from "../../components/ui/Button";
import { ThemeToggle } from "../../shared/theme/ThemeToggle";
import { useTheme } from "../../shared/theme/ThemeProvider";
import {
  useUserSettings,
  useUpdateUserSettings,
} from "../../lib/hooks/useUserSettings";

// Logo Component
function AppLogo({ size = "md" }) {
  const sizes = {
    sm: "w-8 h-8",
    md: "w-10 h-10",
    lg: "w-12 h-12",
  };

  return (
    <div
      className={`${sizes[size]} rounded-xl gradient-brand flex items-center justify-center shadow-lg`}
    >
      <Calendar className="w-1/2 h-1/2 text-white" strokeWidth={2.5} />
    </div>
  );
}

// Group Selector Component
function GroupSelector() {
  const { groups, activeGroup, switchGroup, isLoading } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2">
        <Loader2 className="w-4 h-4 animate-spin text-[rgb(var(--muted))]" />
        <span className="text-sm text-[rgb(var(--muted))]">Cargando...</span>
      </div>
    );
  }

  if (!activeGroup) return null;

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-[rgb(var(--bg-subtle))] transition-colors"
      >
        <div className="w-8 h-8 rounded-lg bg-[rgb(var(--brand-1))]/20 flex items-center justify-center">
          <Users className="w-4 h-4 text-[rgb(var(--brand-1))]" />
        </div>
        <div className="text-left min-w-0">
          <div className="text-sm font-medium truncate max-w-[120px]">
            {activeGroup.name}
          </div>
          <div className="text-xs text-[rgb(var(--muted))]">
            {activeGroup.membershipRole === "OWNER" ? "Propietario" : "Miembro"}
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-[rgb(var(--muted))] transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full left-0 mt-2 w-64 glass-elevated rounded-2xl p-2 z-50"
            >
              <div className="text-xs font-medium text-[rgb(var(--muted))] px-3 py-2">
                Tus espacios
              </div>
              {groups.map((group) => (
                <button
                  key={group.$id}
                  onClick={() => {
                    switchGroup(group.$id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                    group.$id === activeGroup.$id
                      ? "bg-[rgb(var(--brand-1))]/10 text-[rgb(var(--brand-1))]"
                      : "hover:bg-[rgb(var(--bg-subtle))]"
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      group.$id === activeGroup.$id
                        ? "bg-[rgb(var(--brand-1))]/20"
                        : "bg-[rgb(var(--bg-subtle))]"
                    }`}
                  >
                    <Users className="w-4 h-4" />
                  </div>
                  <div className="text-left flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">
                      {group.name}
                    </div>
                    <div className="text-xs text-[rgb(var(--muted))]">
                      {group.membershipRole === "OWNER"
                        ? "Propietario"
                        : "Miembro"}
                    </div>
                  </div>
                </button>
              ))}
              <div className="border-t border-[rgb(var(--card-hover))] mt-2 pt-2">
                <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[rgb(var(--bg-subtle))] text-[rgb(var(--brand-1))] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-[rgb(var(--brand-1))]/10 flex items-center justify-center">
                    <Plus className="w-4 h-4" />
                  </div>
                  <span className="text-sm font-medium">
                    Crear nuevo espacio
                  </span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Navigation Items
const NAV_ITEMS = [
  { key: "calendar", path: "/", label: "Agenda", icon: Calendar },
  { key: "notifications", path: "/notifications", label: "Avisos", icon: Bell },
  { key: "settings", path: "/settings", label: "Ajustes", icon: Settings },
];

// Bottom Navigation Component
function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 glass-card border-t-0 border-x-0 rounded-none">
      <div className="mx-auto max-w-lg px-4 py-2">
        <div className="flex items-center justify-around">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;

            return (
              <motion.button
                key={item.key}
                onClick={() => navigate(item.path)}
                className="relative flex flex-col items-center gap-1 px-4 py-2 min-w-[72px]"
                whileTap={{ scale: 0.95 }}
              >
                {isActive && (
                  <motion.div
                    layoutId="bottomNavIndicator"
                    className="absolute inset-0 bg-[rgb(var(--brand-1))]/10 rounded-2xl"
                    transition={{ type: "spring", stiffness: 500, damping: 35 }}
                  />
                )}
                <Icon
                  className={`w-5 h-5 relative z-10 transition-colors ${
                    isActive
                      ? "text-[rgb(var(--brand-1))]"
                      : "text-[rgb(var(--muted))]"
                  }`}
                />
                <span
                  className={`text-xs font-medium relative z-10 transition-colors ${
                    isActive
                      ? "text-[rgb(var(--brand-1))]"
                      : "text-[rgb(var(--muted))]"
                  }`}
                >
                  {item.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}

// User Menu
function UserMenu() {
  const navigate = useNavigate();
  const { state, logout } = useAuth();
  const { profile } = useWorkspace();
  const [isOpen, setIsOpen] = useState(false);

  const displayName = profile
    ? `${profile.firstName} ${profile.lastName}`
    : state.user?.name || "Usuario";

  const initials = profile
    ? `${profile.firstName?.[0] || ""}${profile.lastName?.[0] || ""}`
    : displayName.charAt(0);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 px-2 py-1.5 rounded-xl hover:bg-[rgb(var(--bg-subtle))] transition-colors"
      >
        <div className="w-9 h-9 rounded-full gradient-brand flex items-center justify-center text-white text-sm font-semibold">
          {initials.toUpperCase()}
        </div>
        <div className="hidden sm:block text-left">
          <div className="text-sm font-medium">{displayName}</div>
          <div className="text-xs text-[rgb(var(--muted))]">
            {state.user?.email}
          </div>
        </div>
      </button>

      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-full right-0 mt-2 w-56 glass-elevated rounded-2xl p-2 z-50"
            >
              <div className="px-3 py-2 border-b border-[rgb(var(--glass-border))] mb-2">
                <div className="text-sm font-medium text-[rgb(var(--text-primary))]">
                  {displayName}
                </div>
                <div className="text-xs text-[rgb(var(--muted))] truncate">
                  {state.user?.email}
                </div>
              </div>
              <button
                onClick={() => {
                  navigate("/settings");
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[rgb(var(--bg-subtle))] text-[rgb(var(--text-primary))] transition-colors"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Mi perfil</span>
              </button>
              <button
                onClick={() => {
                  logout();
                  setIsOpen(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[rgb(var(--bad))]/10 text-[rgb(var(--bad))] transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Cerrar sesión</span>
              </button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// Main AppShell Component
export function AppShell() {
  const { activeGroup, profile } = useWorkspace();
  const { setTheme } = useTheme();
  const updateSettings = useUpdateUserSettings();

  // Get user settings to sync theme
  const { data: userSettings } = useUserSettings(
    activeGroup?.$id,
    profile?.$id
  );

  // Sync theme from user settings when loaded
  useEffect(() => {
    if (userSettings?.theme) {
      // Convert DB format (SYSTEM, LIGHT, DARK) to local format (system, light, dark)
      setTheme(userSettings.theme.toLowerCase());
    }
  }, [userSettings?.theme, setTheme]);

  // Callback to sync theme with database
  const handleThemeChange = useCallback(
    (theme) => {
      if (activeGroup?.$id && profile?.$id) {
        updateSettings.mutate({
          groupId: activeGroup.$id,
          profileId: profile.$id,
          data: { theme },
        });
      }
    },
    [activeGroup?.$id, profile?.$id, updateSettings]
  );

  return (
    <div className="min-h-dvh bg-app">
      {/* Background mesh */}
      <div className="fixed inset-0 bg-mesh pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-30 glass border-b border-[rgb(var(--glass-border))]/5">
        <div className="mx-auto max-w-6xl px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Left: Logo + Group Selector */}
            <div className="flex items-center gap-3">
              <AppLogo size="md" />
              <div className="hidden sm:block">
                <span className="text-lg font-bold">
                  Agenda <span className="text-gradient-brand">Pro</span>
                </span>
              </div>
              <div className="hidden md:block h-6 w-px bg-[rgb(var(--card-hover))]" />
              <div className="hidden md:block">
                <GroupSelector />
              </div>
            </div>

            {/* Right: Theme Toggle + User Menu */}
            <div className="flex items-center gap-2">
              <ThemeToggle onThemeChange={handleThemeChange} />
              <UserMenu />
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Group Selector */}
      <div className="md:hidden px-4 py-2 border-b border-[rgb(var(--card-hover))]">
        <GroupSelector />
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 py-6 pb-28">
        <Outlet />
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}
