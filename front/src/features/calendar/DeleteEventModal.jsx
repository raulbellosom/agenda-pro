import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Trash2,
  Loader2,
  AlertTriangle,
  Calendar,
  Clock,
  MapPin,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { useDeleteEvent } from "../../lib/hooks/useEvents";

/**
 * Modal de confirmación para eliminar un evento
 */
export function DeleteEventModal({ isOpen, onClose, event, onSuccess }) {
  const deleteEvent = useDeleteEvent();

  const handleDelete = async () => {
    if (!event?.$id) return;

    try {
      await deleteEvent.mutateAsync(event.$id);
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error deleting event:", error);
    }
  };

  const handleClose = () => {
    if (!deleteEvent.isPending) {
      onClose();
    }
  };

  // Format event date and time for display
  const formatEventDateTime = () => {
    if (!event?.startAt) return null;

    try {
      const startDate = parseISO(event.startAt);
      const endDate = event.endAt ? parseISO(event.endAt) : null;

      const dateStr = format(startDate, "EEEE, d 'de' MMMM", { locale: es });

      if (event.allDay) {
        return { date: dateStr, time: "Todo el día" };
      }

      const timeStr = endDate
        ? `${format(startDate, "HH:mm")} - ${format(endDate, "HH:mm")}`
        : format(startDate, "HH:mm");

      return { date: dateStr, time: timeStr };
    } catch {
      return null;
    }
  };

  const eventDateTime = formatEventDateTime();

  return (
    <AnimatePresence>
      {isOpen && event && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
            className="fixed inset-4 z-50 flex items-center justify-center sm:inset-auto sm:left-1/2 sm:top-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-md sm:p-4"
            style={{ maxHeight: "calc(100dvh - 2rem)" }}
          >
            <div
              className="bg-[rgb(var(--bg-surface))] rounded-3xl shadow-2xl border border-[rgb(var(--border-base))] overflow-hidden flex flex-col w-full"
              style={{ maxHeight: "calc(100dvh - 2rem)" }}
            >
              {/* Header - Always visible */}
              <div className="px-6 py-5 border-b border-[rgb(var(--border-base))] shrink-0">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[rgb(var(--error))]/10 flex items-center justify-center shrink-0">
                    <Trash2 className="w-6 h-6 text-[rgb(var(--error))]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                      Eliminar evento
                    </h2>
                    <p className="text-sm text-[rgb(var(--text-muted))]">
                      Esta acción no se puede deshacer
                    </p>
                  </div>
                </div>
              </div>

              {/* Content - Scrollable */}
              <div className="flex-1 overflow-y-auto overscroll-contain p-6 space-y-4">
                {/* Event Info Card */}
                <div className="p-4 rounded-xl bg-[rgb(var(--bg-muted))] border border-[rgb(var(--border-base))]">
                  <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-3 line-clamp-2">
                    {event.title}
                  </h3>

                  {eventDateTime && (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]">
                        <Calendar className="w-4 h-4 text-[rgb(var(--text-muted))]" />
                        <span className="capitalize">{eventDateTime.date}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))]">
                        <Clock className="w-4 h-4 text-[rgb(var(--text-muted))]" />
                        <span>{eventDateTime.time}</span>
                      </div>
                    </div>
                  )}

                  {event.locationText && (
                    <div className="flex items-center gap-2 text-sm text-[rgb(var(--text-secondary))] mt-2">
                      <MapPin className="w-4 h-4 text-[rgb(var(--text-muted))]" />
                      <span className="truncate">{event.locationText}</span>
                    </div>
                  )}
                </div>

                {/* Warning */}
                <div className="flex items-start gap-3 p-3 rounded-xl bg-[rgb(var(--error))]/5 border border-[rgb(var(--error))]/10">
                  <AlertTriangle className="w-5 h-5 text-[rgb(var(--error))] shrink-0 mt-0.5" />
                  <div className="text-sm text-[rgb(var(--text-secondary))]">
                    <p>
                      ¿Estás seguro de que deseas eliminar este evento? Todos
                      los recordatorios y asistentes asociados también serán
                      eliminados.
                    </p>
                  </div>
                </div>

                {deleteEvent.isError && (
                  <div className="p-3 rounded-xl bg-[rgb(var(--error))]/10 border border-[rgb(var(--error))]/20">
                    <p className="text-sm text-[rgb(var(--error))]">
                      {deleteEvent.error?.message ||
                        "Error al eliminar el evento. Intenta de nuevo."}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer - Always visible */}
              <div className="px-6 py-4 border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] shrink-0 rounded-b-3xl">
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={deleteEvent.isPending}
                    className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-[rgb(var(--text-secondary))] bg-[rgb(var(--bg-muted))] hover:bg-[rgb(var(--bg-hover))] transition-colors disabled:opacity-50"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={deleteEvent.isPending}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[rgb(var(--error))] hover:opacity-90 transition-opacity disabled:opacity-50"
                  >
                    {deleteEvent.isPending ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Eliminando...
                      </>
                    ) : (
                      <>
                        <Trash2 className="w-4 h-4" />
                        Eliminar evento
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
