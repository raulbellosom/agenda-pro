import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  },
  {
    id: "security",
    label: "Seguridad",
    description: "Contraseña y acceso",
    icon: Lock,
  },
  {
    id: "preferences",
    label: "Preferencias",
    description: "Formato y zona horaria",
    icon: Palette,
  },
  {
    id: "notifications",
    label: "Notificaciones",
    description: "Alertas y recordatorios",
    icon: Bell,
  },
];

export function SettingsPage() {
  const { profile, activeGroup } = useWorkspace();
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl gradient-brand flex items-center justify-center">
            <SettingsIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[rgb(var(--text-primary))]">
              Ajustes
            </h1>
            <p className="text-sm text-[rgb(var(--muted))]">
              Configura tu cuenta y preferencias
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Sidebar - Desktop */}
        <div className="hidden lg:block w-64 flex-shrink-0">
          <div className="glass-card rounded-3xl p-3 sticky top-20">
            <nav className="space-y-1">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                const isActive = activeSection === section.id;

                return (
                  <button
                    key={section.id}
                    onClick={() => setActiveSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                      isActive
                        ? "bg-[rgb(var(--brand-1))]/10 text-[rgb(var(--brand-1))]"
                        : "hover:bg-[rgb(var(--bg-subtle))] text-[rgb(var(--text-secondary))]"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <div className="text-left">
                      <div className="text-sm font-medium">{section.label}</div>
                      <div className="text-xs opacity-70">
                        {section.description}
                      </div>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </div>

        {/* Mobile Menu */}
        <div className="lg:hidden">
          {isMobileMenuOpen ? (
            <div className="glass-card rounded-3xl p-3">
              <nav className="grid grid-cols-2 gap-2">
                {SECTIONS.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;

                  return (
                    <button
                      key={section.id}
                      onClick={() => {
                        setActiveSection(section.id);
                        setIsMobileMenuOpen(false);
                      }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                        isActive
                          ? "bg-[rgb(var(--brand-1))]/10 text-[rgb(var(--brand-1))]"
                          : "bg-[rgb(var(--bg-subtle))] text-[rgb(var(--text-secondary))]"
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="text-sm font-medium">
                        {section.label}
                      </span>
                    </button>
                  );
                })}
              </nav>
            </div>
          ) : (
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="glass-card rounded-2xl px-4 py-3 flex items-center justify-between w-full"
            >
              <div className="flex items-center gap-3">
                {(() => {
                  const section = SECTIONS.find((s) => s.id === activeSection);
                  const Icon = section?.icon || User;
                  return (
                    <>
                      <Icon className="w-5 h-5 text-[rgb(var(--brand-1))]" />
                      <span className="font-medium">{section?.label}</span>
                    </>
                  );
                })()}
              </div>
              <ChevronRight className="w-5 h-5 text-[rgb(var(--muted))]" />
            </button>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {renderSection()}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
