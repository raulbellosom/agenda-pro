import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  User,
  Lock,
  Bell,
  Palette,
  Settings as SettingsIcon,
  ChevronRight,
} from "lucide-react";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import { ProfileSection } from "./components/ProfileSection";
import { SecuritySection } from "./components/SecuritySection";
import { PreferencesSection } from "./components/PreferencesSection";
import { NotificationsSection } from "./components/NotificationsSection";

const SECTIONS = [
  {
    id: "profile",
    label: "Perfil",
    description: "Tu información personal",
    icon: User,
    color: "from-violet-500 to-purple-600",
  },
  {
    id: "security",
    label: "Seguridad",
    description: "Contraseña y acceso",
    icon: Lock,
    color: "from-emerald-500 to-teal-600",
  },
  {
    id: "preferences",
    label: "Preferencias",
    description: "Formato y zona horaria",
    icon: Palette,
    color: "from-orange-500 to-amber-600",
  },
  {
    id: "notifications",
    label: "Notificaciones",
    description: "Alertas y recordatorios",
    icon: Bell,
    color: "from-pink-500 to-rose-600",
  },
];

// Navigation Item Component
function NavItem({ section, isActive, onClick, variant = "desktop" }) {
  const Icon = section.icon;

  if (variant === "mobile-grid") {
    return (
      <motion.button
        onClick={onClick}
        whileTap={{ scale: 0.97 }}
        className={clsx(
          "relative flex flex-col items-center gap-2 p-4 rounded-2xl",
          "transition-all duration-300 overflow-hidden",
          isActive
            ? "bg-[rgb(var(--brand-primary))] text-white shadow-lg shadow-[rgb(var(--brand-primary))]/25"
            : "bg-[rgb(var(--bg-muted))]/50 hover:bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-secondary))]"
        )}
      >
        <div
          className={clsx(
            "w-10 h-10 rounded-xl flex items-center justify-center",
            "transition-all duration-300",
            isActive ? "bg-white/20" : "bg-[rgb(var(--bg-surface))]"
          )}
        >
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-xs font-medium">{section.label}</span>
        {isActive && (
          <motion.div
            layoutId="activeMobileTab"
            className="absolute inset-0 rounded-2xl ring-2 ring-white/30"
          />
        )}
      </motion.button>
    );
  }

  return (
    <motion.button
      onClick={onClick}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        "group relative w-full flex items-center gap-3 px-3 py-3 rounded-xl",
        "transition-all duration-300",
        isActive
          ? "bg-gradient-to-r from-[rgb(var(--brand-primary))]/10 to-[rgb(var(--brand-primary))]/5"
          : "hover:bg-[rgb(var(--bg-hover))]"
      )}
    >
      {/* Active indicator */}
      {isActive && (
        <motion.div
          layoutId="activeSection"
          className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-r-full bg-[rgb(var(--brand-primary))]"
        />
      )}

      <div
        className={clsx(
          "w-10 h-10 rounded-xl flex items-center justify-center",
          "transition-all duration-300",
          isActive
            ? "bg-[rgb(var(--brand-primary))]/15 text-[rgb(var(--brand-primary))]"
            : "bg-[rgb(var(--bg-muted))] text-[rgb(var(--text-muted))] group-hover:bg-[rgb(var(--bg-hover))] group-hover:text-[rgb(var(--text-secondary))]"
        )}
      >
        <Icon className="w-5 h-5" />
      </div>

      <div className="flex-1 text-left">
        <div
          className={clsx(
            "text-sm font-medium transition-colors",
            isActive
              ? "text-[rgb(var(--brand-primary))]"
              : "text-[rgb(var(--text-primary))] group-hover:text-[rgb(var(--text-primary))]"
          )}
        >
          {section.label}
        </div>
        <div className="text-xs text-[rgb(var(--text-muted))] mt-0.5">
          {section.description}
        </div>
      </div>

      <ChevronRight
        className={clsx(
          "w-4 h-4 transition-all duration-300",
          isActive
            ? "text-[rgb(var(--brand-primary))] opacity-100"
            : "text-[rgb(var(--text-muted))] opacity-0 group-hover:opacity-100"
        )}
      />
    </motion.button>
  );
}

// Mobile Section Selector
function MobileSectionSelector({ activeItem, onClick }) {
  return (
    <motion.button
      onClick={onClick}
      whileTap={{ scale: 0.98 }}
      className={clsx(
        "w-full flex items-center justify-between gap-4 p-4 rounded-2xl",
        "bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border-base))]",
        "hover:border-[rgb(var(--border-hover))] transition-all duration-300"
      )}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center">
          <activeItem.icon className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
        </div>
        <div className="text-left">
          <div className="font-medium text-[rgb(var(--text-primary))]">
            {activeItem.label}
          </div>
          <div className="text-xs text-[rgb(var(--text-muted))]">
            {activeItem.description}
          </div>
        </div>
      </div>
      <div className="flex items-center gap-2 text-[rgb(var(--text-muted))]">
        <span className="text-xs">Cambiar</span>
        <ChevronRight className="w-4 h-4" />
      </div>
    </motion.button>
  );
}

export function SettingsPage() {
  const { profile } = useWorkspace();
  const [activeSection, setActiveSection] = useState("profile");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(true);

  const renderSection = () => {
    switch (activeSection) {
      case "profile":
        return <ProfileSection />;
      case "security":
        return <SecuritySection />;
      case "preferences":
        return <PreferencesSection />;
      case "notifications":
        return <NotificationsSection />;
      default:
        return <ProfileSection />;
    }
  };

  const activeItem = SECTIONS.find((s) => s.id === activeSection);

  return (
    <div className="min-h-full p-4 lg:p-6 xl:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Page Header - Clean & Integrated */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 lg:mb-8"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center">
              <SettingsIcon className="w-6 h-6 text-[rgb(var(--brand-primary))]" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
                Configuración
              </h1>
              <p className="text-sm text-[rgb(var(--text-muted))]">
                Administra tu cuenta y personaliza tu experiencia
              </p>
            </div>
          </div>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Sidebar - Desktop */}
          <aside className="hidden lg:block w-72 shrink-0">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="sticky top-6"
            >
              <div
                className={clsx(
                  "bg-[rgb(var(--bg-surface))] rounded-2xl",
                  "border border-[rgb(var(--border-base))]",
                  "p-3 space-y-1"
                )}
              >
                {SECTIONS.map((section, index) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                  >
                    <NavItem
                      section={section}
                      isActive={activeSection === section.id}
                      onClick={() => setActiveSection(section.id)}
                    />
                  </motion.div>
                ))}
              </div>

              {/* Profile mini-card */}
              {profile && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className={clsx(
                    "mt-4 p-4 rounded-2xl",
                    "bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border-base))]"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-dark))] flex items-center justify-center text-white font-medium">
                      {profile.firstName?.[0]?.toUpperCase() || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                        {profile.firstName} {profile.lastName}
                      </div>
                      <div className="text-xs text-[rgb(var(--text-muted))] truncate">
                        {profile.email}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </aside>

          {/* Mobile Navigation */}
          <div className="lg:hidden">
            <AnimatePresence mode="wait">
              {isMobileMenuOpen ? (
                <motion.div
                  key="grid"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className={clsx(
                    "bg-[rgb(var(--bg-surface))] rounded-2xl",
                    "border border-[rgb(var(--border-base))] p-3"
                  )}
                >
                  <nav className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {SECTIONS.map((section) => (
                      <NavItem
                        key={section.id}
                        section={section}
                        isActive={activeSection === section.id}
                        variant="mobile-grid"
                        onClick={() => {
                          setActiveSection(section.id);
                          setIsMobileMenuOpen(false);
                        }}
                      />
                    ))}
                  </nav>
                </motion.div>
              ) : (
                <motion.div
                  key="selector"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  {activeItem && (
                    <MobileSectionSelector
                      activeItem={activeItem}
                      onClick={() => setIsMobileMenuOpen(true)}
                    />
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeSection}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
              >
                {renderSection()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
