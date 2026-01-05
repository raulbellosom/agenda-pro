import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import clsx from "clsx";
import {
  Users,
  Check,
  X,
  Loader2,
  AlertCircle,
  Mail,
  Clock,
  Shield,
  ArrowRight,
  UserPlus,
  Building2,
} from "lucide-react";
import { useAuth } from "../../app/providers/AuthProvider";
import { useWorkspace } from "../../app/providers/WorkspaceProvider";
import {
  useInvitationByToken,
  useAcceptInvitation,
  useRejectInvitation,
  formatExpirationDate,
  isInvitationExpired,
} from "../../lib/hooks/useInvitations";
import { Button } from "../../components/ui/Button";

export function InvitePage() {
  const { token } = useParams();
  const navigate = useNavigate();
  const { state: authState } = useAuth();
  const { profile, refetchGroups } = useWorkspace();

  const { data: invitation, isLoading, error } = useInvitationByToken(token);
  const acceptInvitation = useAcceptInvitation();
  const rejectInvitation = useRejectInvitation();

  const [actionError, setActionError] = useState(null);

  const isAuthenticated = authState.status === "authed";
  const isExpired = invitation && isInvitationExpired(invitation);
  const isPending = invitation?.status === "PENDING";

  // Si no está autenticado, redirigir a login con token como parámetro
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate(`/login?invite=${token}`, { replace: true });
    }
  }, [isLoading, isAuthenticated, token, navigate]);

  // Si el email no coincide
  const emailMismatch =
    invitation &&
    profile &&
    invitation.invitedEmail.toLowerCase() !== profile.email.toLowerCase();

  const handleAccept = async () => {
    if (!profile || !invitation) return;
    setActionError(null);

    try {
      await acceptInvitation.mutateAsync({
        token: invitation.token,
        profileId: profile.$id,
      });
      // Refrescar grupos y redirigir
      await refetchGroups?.();
      navigate("/", { replace: true });
    } catch (err) {
      setActionError(err.message || "Error al aceptar la invitación");
    }
  };

  const handleReject = async () => {
    if (!profile || !invitation) return;
    setActionError(null);

    try {
      await rejectInvitation.mutateAsync({
        token: invitation.token,
        profileId: profile.$id,
      });
      navigate("/", { replace: true });
    } catch (err) {
      setActionError(err.message || "Error al rechazar la invitación");
    }
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[rgb(var(--bg-base))]">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-[rgb(var(--brand-primary))] mx-auto mb-4" />
          <p className="text-[rgb(var(--text-muted))]">
            Cargando invitación...
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[rgb(var(--bg-base))]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx(
            "w-full max-w-md p-8 rounded-2xl text-center",
            "bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border-base))]",
            "shadow-xl"
          )}
        >
          <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--error))]/10 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-8 h-8 text-[rgb(var(--error))]" />
          </div>
          <h1 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-2">
            Invitación no encontrada
          </h1>
          <p className="text-[rgb(var(--text-muted))] mb-6">
            Esta invitación no existe o ha sido eliminada.
          </p>
          <Button onClick={() => navigate("/")}>Ir al inicio</Button>
        </motion.div>
      </div>
    );
  }

  // Invitation already processed
  if (!isPending) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[rgb(var(--bg-base))]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx(
            "w-full max-w-md p-8 rounded-2xl text-center",
            "bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border-base))]",
            "shadow-xl"
          )}
        >
          <div
            className={clsx(
              "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4",
              invitation.status === "ACCEPTED"
                ? "bg-[rgb(var(--success))]/10"
                : "bg-[rgb(var(--warning))]/10"
            )}
          >
            {invitation.status === "ACCEPTED" ? (
              <Check className="w-8 h-8 text-[rgb(var(--success))]" />
            ) : (
              <X className="w-8 h-8 text-[rgb(var(--warning))]" />
            )}
          </div>
          <h1 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-2">
            {invitation.status === "ACCEPTED"
              ? "Invitación aceptada"
              : invitation.status === "REJECTED"
              ? "Invitación rechazada"
              : invitation.status === "EXPIRED"
              ? "Invitación expirada"
              : "Invitación cancelada"}
          </h1>
          <p className="text-[rgb(var(--text-muted))] mb-6">
            {invitation.status === "ACCEPTED"
              ? "Ya eres miembro de este grupo."
              : "Esta invitación ya no es válida."}
          </p>
          <Button onClick={() => navigate("/")}>Ir al inicio</Button>
        </motion.div>
      </div>
    );
  }

  // Expired invitation
  if (isExpired) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[rgb(var(--bg-base))]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx(
            "w-full max-w-md p-8 rounded-2xl text-center",
            "bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border-base))]",
            "shadow-xl"
          )}
        >
          <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--warning))]/10 flex items-center justify-center mx-auto mb-4">
            <Clock className="w-8 h-8 text-[rgb(var(--warning))]" />
          </div>
          <h1 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-2">
            Invitación expirada
          </h1>
          <p className="text-[rgb(var(--text-muted))] mb-6">
            Esta invitación ha expirado. Pide al remitente que te envíe una
            nueva.
          </p>
          <Button onClick={() => navigate("/")}>Ir al inicio</Button>
        </motion.div>
      </div>
    );
  }

  // Email mismatch
  if (emailMismatch) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-[rgb(var(--bg-base))]">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={clsx(
            "w-full max-w-md p-8 rounded-2xl text-center",
            "bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border-base))]",
            "shadow-xl"
          )}
        >
          <div className="w-16 h-16 rounded-2xl bg-[rgb(var(--warning))]/10 flex items-center justify-center mx-auto mb-4">
            <Shield className="w-8 h-8 text-[rgb(var(--warning))]" />
          </div>
          <h1 className="text-xl font-bold text-[rgb(var(--text-primary))] mb-2">
            Correo diferente
          </h1>
          <p className="text-[rgb(var(--text-muted))] mb-4">
            Esta invitación fue enviada a{" "}
            <strong>{invitation.invitedEmail}</strong>.
          </p>
          <p className="text-[rgb(var(--text-muted))] mb-6">
            Actualmente estás conectado como <strong>{profile?.email}</strong>.
            Debes iniciar sesión con el correo de la invitación.
          </p>
          <Button onClick={() => navigate("/")}>Ir al inicio</Button>
        </motion.div>
      </div>
    );
  }

  // Main invitation view
  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[rgb(var(--bg-base))]">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={clsx(
          "w-full max-w-md rounded-2xl overflow-hidden",
          "bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border-base))]",
          "shadow-xl"
        )}
      >
        {/* Header */}
        <div className="relative p-6 pb-8 bg-gradient-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-dark))]">
          <div className="absolute top-4 right-4">
            <span className="px-3 py-1 rounded-full bg-white/20 text-white text-xs font-medium">
              Invitación
            </span>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
            <UserPlus className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-1">
            ¡Te han invitado!
          </h1>
          <p className="text-white/80">Únete a un nuevo espacio de trabajo</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Group info */}
          <div className="flex items-center gap-4 p-4 rounded-xl bg-[rgb(var(--bg-muted))]">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-dark))] flex items-center justify-center">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-[rgb(var(--text-primary))] truncate">
                Espacio de trabajo
              </p>
              <p className="text-sm text-[rgb(var(--text-muted))]">
                ID: {invitation.groupId?.slice(0, 8)}...
              </p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-3">
            <div className="flex items-center gap-3 text-sm">
              <Mail className="w-4 h-4 text-[rgb(var(--text-muted))]" />
              <span className="text-[rgb(var(--text-muted))]">Enviada a:</span>
              <span className="text-[rgb(var(--text-primary))] font-medium">
                {invitation.invitedEmail}
              </span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <Clock className="w-4 h-4 text-[rgb(var(--text-muted))]" />
              <span className="text-[rgb(var(--text-muted))]">Expira:</span>
              <span className="text-[rgb(var(--text-primary))]">
                {formatExpirationDate(invitation.expiresAt)}
              </span>
            </div>
          </div>

          {/* Message */}
          {invitation.message && (
            <div className="p-4 rounded-xl bg-[rgb(var(--bg-muted))] border-l-4 border-[rgb(var(--brand-primary))]">
              <p className="text-sm text-[rgb(var(--text-secondary))] italic">
                "{invitation.message}"
              </p>
            </div>
          )}

          {/* Error */}
          {actionError && (
            <div className="p-3 rounded-xl bg-[rgb(var(--error))]/10 text-[rgb(var(--error))] text-sm">
              {actionError}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="ghost"
              className="flex-1"
              onClick={handleReject}
              disabled={
                acceptInvitation.isPending || rejectInvitation.isPending
              }
            >
              {rejectInvitation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <X className="w-4 h-4 mr-2" />
                  Rechazar
                </>
              )}
            </Button>
            <Button
              className="flex-1"
              onClick={handleAccept}
              disabled={
                acceptInvitation.isPending || rejectInvitation.isPending
              }
            >
              {acceptInvitation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4 mr-2" />
                  Aceptar
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
