import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Users, Loader2, Sparkles } from "lucide-react";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/ui/Input";
import { Textarea } from "../../shared/ui/Textarea";
import { useCreateGroupWithDefaults } from "../../lib/hooks";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";

export function CreateGroupModal({ isOpen, onClose, onSuccess }) {
  const { profile } = useWorkspace();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");

  const createGroup = useCreateGroupWithDefaults();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim() || !profile?.$id) return;

    try {
      const result = await createGroup.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        ownerProfileId: profile.$id,
      });
      onSuccess?.(result);
      onClose();
      setName("");
      setDescription("");
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  const handleClose = () => {
    if (!createGroup.isPending) {
      onClose();
      setName("");
      setDescription("");
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
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
            transition={{ duration: 0.2 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md z-50 p-4"
          >
            <div className="glass-elevated rounded-3xl overflow-hidden">
              {/* Header */}
              <div className="px-6 py-5 border-b border-[rgb(var(--border-base))] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
                      Crear espacio
                    </h2>
                    <p className="text-sm text-[rgb(var(--text-muted))]">
                      Tu espacio de trabajo
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  disabled={createGroup.isPending}
                  className="w-8 h-8 rounded-lg hover:bg-[rgb(var(--bg-muted))] flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  <X className="w-5 h-5 text-[rgb(var(--text-muted))]" />
                </button>
              </div>

              {/* Content */}
              <form onSubmit={handleSubmit} className="p-6 space-y-5">
                {/* Info card */}
                <div className="p-4 rounded-2xl bg-[rgb(var(--brand-primary))]/5 border border-[rgb(var(--brand-primary))]/20">
                  <div className="flex items-start gap-3">
                    <Sparkles className="w-5 h-5 text-[rgb(var(--brand-primary))] shrink-0 mt-0.5" />
                    <div className="text-sm text-[rgb(var(--text-secondary))]">
                      <p className="font-medium text-[rgb(var(--brand-primary))]">
                        Un espacio para organizarte
                      </p>
                      <p className="mt-1">
                        Se creará automáticamente un calendario personal y
                        podrás invitar a otras personas a colaborar.
                      </p>
                    </div>
                  </div>
                </div>

                <Input
                  label="Nombre del espacio"
                  placeholder="Ej: Mi agenda, Familia, Trabajo..."
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={createGroup.isPending}
                  autoFocus
                  required
                />

                <Textarea
                  label="Descripción (opcional)"
                  placeholder="Una breve descripción..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  disabled={createGroup.isPending}
                  rows={3}
                />

                {createGroup.isError && (
                  <div className="p-3 rounded-xl bg-[rgb(var(--error))]/10 border border-[rgb(var(--error))]/20">
                    <p className="text-sm text-[rgb(var(--error))]">
                      {createGroup.error?.message ||
                        "Error al crear el espacio. Intenta de nuevo."}
                    </p>
                  </div>
                )}

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={handleClose}
                    disabled={createGroup.isPending}
                    className="flex-1"
                  >
                    Cancelar
                  </Button>
                  <Button
                    type="submit"
                    disabled={!name.trim() || createGroup.isPending}
                    isLoading={createGroup.isPending}
                    className="flex-1"
                  >
                    Crear espacio
                  </Button>
                </div>
              </form>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
