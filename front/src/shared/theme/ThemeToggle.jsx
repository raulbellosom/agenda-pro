import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Moon, Sun, Monitor, Check } from "lucide-react";
import { useTheme } from "../theme/ThemeProvider";

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

export function ThemeToggle({ onThemeChange }) {
  const { theme, resolvedTheme, setTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleThemeChange = (newTheme) => {
    setTheme(newTheme);
    setIsOpen(false);
    onThemeChange?.(newTheme.toUpperCase());
  };

  // Show the resolved icon (Sun or Moon) based on actual theme
  const DisplayIcon = resolvedTheme === "dark" ? Moon : Sun;

  return (
    <div className="relative" ref={menuRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className="flex items-center justify-center w-10 h-10 rounded-xl bg-surface border border-[rgb(var(--border-base))] hover:bg-[rgb(var(--bg-hover))] transition-colors"
        aria-label="Cambiar tema"
      >
        <motion.div
          key={resolvedTheme}
          initial={{ rotate: -30, opacity: 0 }}
          animate={{ rotate: 0, opacity: 1 }}
          transition={{ duration: 0.2 }}
        >
          <DisplayIcon className="w-5 h-5 text-[rgb(var(--text-secondary))]" />
        </motion.div>
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15, ease: "easeOut" }}
              className="absolute top-full right-0 mt-2 w-52 bg-surface border border-[rgb(var(--border-base))] rounded-xl shadow-lg z-50 overflow-hidden"
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
                      onClick={() => handleThemeChange(option.value)}
                      whileHover={{ x: 2 }}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                        isActive
                          ? "bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))]"
                          : "hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-primary))]"
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          isActive
                            ? "bg-[rgb(var(--brand-primary))]/10"
                            : "bg-[rgb(var(--bg-muted))]"
                        }`}
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
  );
}
