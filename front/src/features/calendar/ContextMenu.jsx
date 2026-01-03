import React, { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Pencil, Trash2, Copy, Eye, FolderInput } from "lucide-react";

export function ContextMenu({ isOpen, position, onClose, items }) {
  const [adjustedPosition, setAdjustedPosition] = React.useState(position);

  useEffect(() => {
    if (!isOpen) return;

    const handleClick = () => onClose();
    const handleScroll = () => onClose();

    document.addEventListener("click", handleClick);
    document.addEventListener("scroll", handleScroll, true);

    return () => {
      document.removeEventListener("click", handleClick);
      document.removeEventListener("scroll", handleScroll, true);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) return;

    // Adjust position to fit within viewport
    const menuWidth = 200; // Approximate menu width
    const menuHeight = items.length * 45; // Approximate height per item
    const padding = 10; // Padding from edges

    let { x, y } = position;

    // Adjust horizontal position
    if (x + menuWidth > window.innerWidth - padding) {
      x = window.innerWidth - menuWidth - padding;
    }
    if (x < padding) {
      x = padding;
    }

    // Adjust vertical position
    if (y + menuHeight > window.innerHeight - padding) {
      y = window.innerHeight - menuHeight - padding;
    }
    if (y < padding) {
      y = padding;
    }

    setAdjustedPosition({ x, y });
  }, [isOpen, position, items]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.1 }}
        className="fixed z-[200] bg-[rgb(var(--bg-elevated))] rounded-xl border-2 border-[rgb(var(--border-base))] shadow-2xl overflow-hidden min-w-[180px]"
        style={{
          top: adjustedPosition.y,
          left: adjustedPosition.x,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="py-1">
          {items.map((item, index) => (
            <button
              key={index}
              onClick={(e) => {
                e.stopPropagation();
                item.onClick();
                onClose();
              }}
              disabled={item.disabled}
              className={`w-full px-4 py-2.5 flex items-center gap-3 text-left transition-colors ${
                item.danger
                  ? "text-[rgb(var(--error))] hover:bg-[rgb(var(--error))]/10"
                  : "text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-hover))]"
              } ${item.disabled ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              {item.icon && <item.icon className="w-4 h-4" />}
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          ))}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export const MENU_ITEMS = {
  viewEvent: (onClick) => ({
    icon: Eye,
    label: "Ver detalles",
    onClick,
  }),
  createEvent: (onClick) => ({
    icon: Plus,
    label: "Crear evento",
    onClick,
  }),
  editEvent: (onClick) => ({
    icon: Pencil,
    label: "Editar",
    onClick,
  }),
  duplicateEvent: (onClick) => ({
    icon: Copy,
    label: "Duplicar",
    onClick,
  }),
  moveEvent: (onClick) => ({
    icon: FolderInput,
    label: "Mover a calendario",
    onClick,
  }),
  deleteEvent: (onClick) => ({
    icon: Trash2,
    label: "Eliminar",
    onClick,
    danger: true,
  }),
};
