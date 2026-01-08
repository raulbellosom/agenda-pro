import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  Mail,
  Check,
  X,
  Loader2,
  Clock,
  Building2,
  ArrowRight,
} from "lucide-react";
import { useWorkspace } from "../../../app/providers/WorkspaceProvider";
import {
  useUserInvitations,
  useAcceptInvitation,
  useRejectInvitation,
} from "../../../lib/hooks/useInvitations";
import { Button } from "../../../components/ui/Button";
import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";

export function PendingInvitationsPanel() {
  const { profile } = useWorkspace();
  const { data: invitations, isLoading } = useUserInvitations(profile?.email);
  const acceptInvitation = useAcceptInvitation();
  const rejectInvitation = useRejectInvitation();
  const [expandedId, setExpandedId] = useState(null);

  if (isLoading) {
    return (
      <div className="p-8 text-center">
        <Loader2 className="w-8 h-8 animate-spin mx-auto text-[rgb(var(--brand-primary))]" />
      </div>
    );
  }

  const pending = invitations?.filter((inv) => inv.status === "PENDING") || [];

  if (pending.length === 0) {
    return (
      <div className="p-8 text-center">
        <Mail className="w-12 h-12 mx-auto text-[rgb(var(--text-muted))] mb-3 opacity-50" />
        <p className="text-[rgb(var(--text-muted))]">
          No tienes invitaciones pendientes
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {pending.map((invitation, index) => (
          <motion.div
            key={invitation.$id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ delay: index * 0.05 }}
            className={clsx(
              "overflow-hidden rounded-xl border transition-all",
              expandedId === invitation.$id
                ? "border-[rgb(var(--brand-primary))]/50 bg-[rgb(var(--brand-primary))]/5"
                : "border-[rgb(var(--border-base))] bg-[rgb(var(--bg-muted))]/20"
            )}
          >
            <button
              onClick={() =>
                setExpandedId(
                  expandedId === invitation.$id ? null : invitation.$id
                )
              }
              className="w-full p-4 flex items-center justify-between hover:bg-[rgb(var(--bg-hover))]/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0 text-left">
                <div className="w-10 h-10 rounded-lg bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center shrink-0">
                  <Mail className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-[rgb(var(--text-primary))] truncate">
                    Invitado a: {invitation.group?.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <Clock className="w-3 h-3 text-[rgb(var(--text-muted))]" />
                    <span className="text-xs text-[rgb(var(--text-muted))] truncate">
                      {formatDistanceToNow(new Date(invitation.$createdAt), {
                        addSuffix: true,
                        locale: es,
                      })}
                    </span>
                  </div>
                </div>
              </div>
              <ArrowRight
                className={clsx(
                  "w-4 h-4 text-[rgb(var(--text-muted))] transition-transform shrink-0",
                  expandedId === invitation.$id ? "rotate-90" : ""
                )}
              />
            </button>

            <AnimatePresence>
              {expandedId === invitation.$id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))]"
                >
                  <div className="p-4 space-y-4">
                    {/* Group Info */}
                    <div className="p-3 rounded-lg bg-[rgb(var(--bg-muted))]/50">
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-linear-to-br from-[rgb(var(--brand-primary))]/10 to-[rgb(var(--brand-secondary))]/10 flex items-center justify-center shrink-0">
                          <Building2 className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
                        </div>
                        <div>
                          <p className="font-semibold text-[rgb(var(--text-primary))]">
                            {invitation.group?.name}
                          </p>
                          {invitation.group?.description && (
                            <p className="text-sm text-[rgb(var(--text-muted))] mt-1">
                              {invitation.group.description}
                            </p>
                          )}
                          <p className="text-xs text-[rgb(var(--text-muted))] mt-2">
                            Rol asignado:{" "}
                            <span className="font-medium text-[rgb(var(--brand-primary))]">
                              {invitation.role?.name}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Invitation Message */}
                    {invitation.message && (
                      <div className="p-3 rounded-lg bg-[rgb(var(--info))]/5 border border-[rgb(var(--info))]/20">
                        <p className="text-xs font-semibold text-[rgb(var(--text-secondary))] mb-1">
                          Mensaje del propietario
                        </p>
                        <p className="text-sm text-[rgb(var(--text-muted))]">
                          {invitation.message}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 pt-2">
                      <Button
                        variant="outline"
                        onClick={() =>
                          rejectInvitation.mutateAsync({
                            token: invitation.token,
                            profileId: profile?.$id,
                          })
                        }
                        disabled={rejectInvitation.isPending}
                        className="flex-1"
                        leftIcon={
                          rejectInvitation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <X className="w-4 h-4" />
                          )
                        }
                      >
                        {rejectInvitation.isPending
                          ? "Rechazando..."
                          : "Rechazar"}
                      </Button>
                      <Button
                        onClick={() =>
                          acceptInvitation.mutateAsync({
                            token: invitation.token,
                            profileId: profile?.$id,
                          })
                        }
                        disabled={acceptInvitation.isPending}
                        className="flex-1"
                        leftIcon={
                          acceptInvitation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Check className="w-4 h-4" />
                          )
                        }
                      >
                        {acceptInvitation.isPending
                          ? "Aceptando..."
                          : "Aceptar"}
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
