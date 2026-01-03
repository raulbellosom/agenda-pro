import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, ChevronRight, AlertCircle } from "lucide-react";
import { useMoveEvent } from "../../lib/hooks/useEvents";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";

const CALENDAR_ICONS = {
  work: "💼",
  personal: "👤",
  family: "👨‍👩‍👧‍👦",
  health: "❤️",
  education: "🎓",
  social: "🎉",
  finance: "💰",
  travel: "✈️",
  projects: "📋",
  other: "📅",
};

const CALENDAR_COLORS = {
  blue: "rgb(59, 130, 246)",
  purple: "rgb(168, 85, 247)",
  pink: "rgb(236, 72, 153)",
  red: "rgb(239, 68, 68)",
  orange: "rgb(249, 115, 22)",
  yellow: "rgb(234, 179, 8)",
  green: "rgb(34, 197, 94)",
  teal: "rgb(20, 184, 166)",
  cyan: "rgb(6, 182, 212)",
  indigo: "rgb(99, 102, 241)",
};

export function MoveEventModal({
  isOpen,
  onClose,
  event,
  currentCalendar,
  onSuccess,
}) {
  const [selectedCalendarId, setSelectedCalendarId] = useState(null);
  const [error, setError] = useState(null);

  const { calendars = [], profile } = useWorkspace();
  const moveEvent = useMoveEvent();

  // Filter calendars where user has write permissions
  const availableCalendars = calendars.filter((cal) => {
    // Exclude current calendar
    if (cal.$id === currentCalendar?.$id) return false;

    // Check if user is owner (ownerProfileId is the correct field from DB)
    const isOwner = cal.ownerProfileId === profile?.$id;

    // TODO: Check calendar_shares when implemented
    // For now, only owner can move events to this calendar
    return isOwner;
  });

  const handleMove = async () => {
    if (!selectedCalendarId) {
      setError("Por favor selecciona un calendario");
      return;
    }

    try {
      setError(null);
      await moveEvent.mutateAsync({
        eventId: event.$id,
        newCalendarId: selectedCalendarId,
      });
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Error moving event:", err);
      setError(err.message || "Error al mover el evento");
    }
  };

  if (!isOpen || !event) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/50" />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative bg-[rgb(var(--bg-elevated))] rounded-2xl shadow-xl border border-[rgb(var(--border-base))] w-full max-w-md overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-[rgb(var(--border-base))]">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                  Mover evento
                </h2>
                <p className="text-sm text-[rgb(var(--text-muted))]">
                  {event.title}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] text-[rgb(var(--text-muted))] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {/* Current Calendar */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                Calendario actual
              </label>
              <div className="flex items-center gap-3 p-3 rounded-xl bg-[rgb(var(--bg-muted))] border border-[rgb(var(--border-base))]">
                <span className="text-2xl">
                  {CALENDAR_ICONS[currentCalendar?.icon] || "📅"}
                </span>
                <div className="flex-1">
                  <div className="font-medium text-[rgb(var(--text-primary))]">
                    {currentCalendar?.name}
                  </div>
                </div>
                <div
                  className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                  style={{
                    backgroundColor:
                      CALENDAR_COLORS[currentCalendar?.color] || "#6366f1",
                  }}
                />
              </div>
            </div>

            {/* Available Calendars */}
            <div>
              <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                Mover a
              </label>

              {availableCalendars.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                  <div className="w-12 h-12 rounded-full bg-[rgb(var(--bg-muted))] flex items-center justify-center mb-3">
                    <AlertCircle className="w-6 h-6 text-[rgb(var(--text-muted))]" />
                  </div>
                  <p className="text-sm text-[rgb(var(--text-muted))]">
                    No tienes otros calendarios con permisos de escritura
                  </p>
                </div>
              ) : (
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {availableCalendars.map((calendar) => {
                    const isSelected = selectedCalendarId === calendar.$id;
                    const isOwner = calendar.ownerProfileId === profile?.$id;

                    return (
                      <button
                        key={calendar.$id}
                        onClick={() => setSelectedCalendarId(calendar.$id)}
                        className={`
                          w-full flex items-center gap-3 p-3 rounded-xl border transition-all
                          ${
                            isSelected
                              ? "bg-[rgb(var(--brand-primary))]/10 border-[rgb(var(--brand-primary))] ring-2 ring-[rgb(var(--brand-primary))]/20"
                              : "bg-[rgb(var(--bg-surface))] border-[rgb(var(--border-base))] hover:bg-[rgb(var(--bg-hover))]"
                          }
                        `}
                      >
                        <span className="text-2xl">
                          {CALENDAR_ICONS[calendar.icon] || "📅"}
                        </span>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-[rgb(var(--text-primary))]">
                            {calendar.name}
                          </div>
                          <div className="text-xs text-[rgb(var(--text-muted))]">
                            {isOwner ? "Propietario" : "Compartido (Escritura)"}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div
                            className="w-4 h-4 rounded-full border-2 border-white shadow-sm"
                            style={{
                              backgroundColor:
                                CALENDAR_COLORS[calendar.color] || "#6366f1",
                            }}
                          />
                          {isSelected && (
                            <ChevronRight className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 p-3 rounded-lg bg-[rgb(var(--error))]/10 border border-[rgb(var(--error))]/20"
              >
                <p className="text-sm text-[rgb(var(--error))] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  {error}
                </p>
              </motion.div>
            )}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 p-6 border-t border-[rgb(var(--border-base))]">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-sm font-medium text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))] transition-colors"
              disabled={moveEvent.isPending}
            >
              Cancelar
            </button>
            <button
              onClick={handleMove}
              disabled={
                !selectedCalendarId ||
                moveEvent.isPending ||
                availableCalendars.length === 0
              }
              className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-[rgb(var(--brand-primary))] hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {moveEvent.isPending ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Moviendo...
                </>
              ) : (
                "Mover evento"
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
