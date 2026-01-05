import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  Users,
  UserPlus,
  Mail,
  Clock,
  MoreVertical,
  X,
  Send,
  RefreshCw,
  Trash2,
  Shield,
  Crown,
  Check,
  Loader2,
  ChevronDown,
  Copy,
  ExternalLink,
} from "lucide-react";
import { useWorkspace } from "../../../app/providers/WorkspaceProvider";
import { useGroupMembers } from "../../../lib/hooks/useGroups";
import {
  useGroupRoles,
  useUserPermissions,
  SYSTEM_PERMISSIONS,
} from "../../../lib/hooks/useRbac";
import {
  useGroupInvitations,
  useSendInvitation,
  useCancelInvitation,
  useResendInvitation,
  getInvitationTimeRemaining,
} from "../../../lib/hooks/useInvitations";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import {
  SettingsCard,
  SettingsCardHeader,
  SettingsCardDivider,
} from "./SettingsCard";
import { SettingsAlert } from "./SettingsWidgets";
import { getAvatarUrl } from "../../../lib/hooks/useProfile";
import { ENUMS } from "../../../lib/constants";

// =============================================================================
// INVITE MODAL
// =============================================================================

function InviteModal({ isOpen, onClose, groupId, profileId, roles }) {
  const sendInvitation = useSendInvitation();
  const [email, setEmail] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState(
    roles?.[1]?.$id || roles?.[0]?.$id || ""
  );
  const [message, setMessage] = useState("");
  const [showCopyLink, setShowCopyLink] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !selectedRoleId) return;

    try {
      const result = await sendInvitation.mutateAsync({
        groupId,
        invitedByProfileId: profileId,
        invitedEmail: email,
        invitedRoleId: selectedRoleId,
        message: message.trim() || undefined,
      });
      setInviteResult(result);
      setShowCopyLink(true);
    } catch (error) {
      console.error("Error sending invitation:", error);
    }
  };

  const handleCopyLink = () => {
    if (inviteResult?.inviteLink) {
      navigator.clipboard.writeText(inviteResult.inviteLink);
    }
  };

  const handleClose = () => {
    setEmail("");
    setMessage("");
    setShowCopyLink(false);
    setInviteResult(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.95 }}
        animate={{ scale: 1 }}
        exit={{ scale: 0.95 }}
        onClick={(e) => e.stopPropagation()}
        className={clsx(
          "w-full max-w-md",
          "bg-[rgb(var(--bg-surface))] rounded-2xl",
          "border border-[rgb(var(--border-base))]",
          "shadow-xl overflow-hidden"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[rgb(var(--border-base))]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgb(var(--brand-primary))]/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-[rgb(var(--brand-primary))]" />
            </div>
            <div>
              <h3 className="font-semibold text-[rgb(var(--text-primary))]">
                Invitar miembro
              </h3>
              <p className="text-xs text-[rgb(var(--text-muted))]">
                Envía una invitación por correo
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="p-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] transition-colors"
          >
            <X className="w-5 h-5 text-[rgb(var(--text-muted))]" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4">
          {showCopyLink && inviteResult ? (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgb(var(--success))]/10">
                <Check className="w-6 h-6 text-[rgb(var(--success))]" />
                <div>
                  <p className="font-medium text-[rgb(var(--text-primary))]">
                    ¡Invitación enviada!
                  </p>
                  <p className="text-sm text-[rgb(var(--text-muted))]">
                    {inviteResult.emailSent
                      ? "Se envió un correo electrónico"
                      : inviteResult.inviteeExists
                      ? "Se notificó al usuario en la app"
                      : "Comparte el enlace de invitación"}
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                  Enlace de invitación
                </label>
                <div className="flex gap-2">
                  <Input
                    value={inviteResult.inviteLink}
                    readOnly
                    className="text-sm"
                  />
                  <Button variant="outline" onClick={handleCopyLink}>
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={handleClose}>
                  Cerrar
                </Button>
                <Button
                  onClick={() => {
                    setShowCopyLink(false);
                    setInviteResult(null);
                    setEmail("");
                    setMessage("");
                  }}
                >
                  Invitar a otro
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                  Correo electrónico
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="correo@ejemplo.com"
                  required
                  disabled={sendInvitation.isPending}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                  Rol
                </label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  disabled={sendInvitation.isPending}
                  className={clsx(
                    "w-full px-4 py-3 rounded-xl",
                    "bg-[rgb(var(--bg-muted))] border border-[rgb(var(--border-base))]",
                    "text-[rgb(var(--text-primary))]",
                    "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))]/50",
                    "transition-all appearance-none cursor-pointer"
                  )}
                >
                  {roles?.map((role) => (
                    <option key={role.$id} value={role.$id}>
                      {role.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                  Mensaje (opcional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Añade un mensaje personal..."
                  rows={2}
                  disabled={sendInvitation.isPending}
                  className={clsx(
                    "w-full px-4 py-3 rounded-xl",
                    "bg-[rgb(var(--bg-muted))] border border-[rgb(var(--border-base))]",
                    "text-[rgb(var(--text-primary))] placeholder-[rgb(var(--text-muted))]",
                    "focus:outline-none focus:ring-2 focus:ring-[rgb(var(--brand-primary))]/50",
                    "resize-none transition-all"
                  )}
                />
              </div>

              {sendInvitation.isError && (
                <div className="p-3 rounded-xl bg-[rgb(var(--error))]/10 text-[rgb(var(--error))] text-sm">
                  {sendInvitation.error?.message ||
                    "Error al enviar invitación"}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={handleClose}
                  disabled={sendInvitation.isPending}
                >
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    sendInvitation.isPending || !email.trim() || !selectedRoleId
                  }
                >
                  {sendInvitation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Enviando...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Enviar invitación
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// =============================================================================
// MEMBER CARD
// =============================================================================

function MemberCard({ member, isCurrentUser, isOwnerView }) {
  const avatarUrl = member.profile?.avatarFileId
    ? getAvatarUrl(member.profile.avatarFileId, 80, 80)
    : null;

  const isOwner = member.membershipRole === ENUMS.GROUP_MEMBER_ROLE.OWNER;

  return (
    <div
      className={clsx(
        "flex items-center gap-3 p-3 rounded-xl",
        "bg-[rgb(var(--bg-muted))]/50",
        "border border-transparent hover:border-[rgb(var(--border-hover))]",
        "transition-all duration-200"
      )}
    >
      {/* Avatar */}
      <div
        className={clsx(
          "w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden shrink-0",
          "bg-gradient-to-br from-[rgb(var(--brand-primary))] to-[rgb(var(--brand-dark))]"
        )}
      >
        {avatarUrl ? (
          <img
            src={avatarUrl}
            alt={member.profile?.firstName}
            className="w-full h-full object-cover"
          />
        ) : (
          <span className="text-sm font-medium text-white">
            {member.profile?.firstName?.charAt(0)?.toUpperCase() || "?"}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-medium text-[rgb(var(--text-primary))] truncate">
            {member.profile?.firstName} {member.profile?.lastName}
          </span>
          {isCurrentUser && (
            <span className="text-xs text-[rgb(var(--text-muted))]">(Tú)</span>
          )}
          {isOwner && <Crown className="w-4 h-4 text-amber-500 shrink-0" />}
        </div>
        <p className="text-sm text-[rgb(var(--text-muted))] truncate">
          {member.profile?.email}
        </p>
      </div>

      {/* Role badge */}
      <div
        className={clsx(
          "px-2 py-1 rounded-lg text-xs font-medium shrink-0",
          isOwner
            ? "bg-amber-500/10 text-amber-600"
            : "bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))]"
        )}
      >
        {isOwner ? "Propietario" : "Miembro"}
      </div>
    </div>
  );
}

// =============================================================================
// INVITATION CARD
// =============================================================================

function InvitationCard({ invitation, onCancel, onResend, canManage }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const cancelInvitation = useCancelInvitation();
  const resendInvitation = useResendInvitation();

  const timeRemaining = getInvitationTimeRemaining(invitation);
  const isExpired = timeRemaining?.expired;

  const handleCancel = async () => {
    try {
      await cancelInvitation.mutateAsync(invitation.$id);
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Error cancelling invitation:", error);
    }
  };

  const handleResend = async () => {
    try {
      await resendInvitation.mutateAsync({
        invitationId: invitation.$id,
        invitedByProfileId: invitation.invitedByProfileId,
      });
      setIsMenuOpen(false);
    } catch (error) {
      console.error("Error resending invitation:", error);
    }
  };

  return (
    <div
      className={clsx(
        "flex items-center gap-3 p-3 rounded-xl",
        "bg-[rgb(var(--bg-muted))]/50",
        "border border-dashed border-[rgb(var(--border-base))]",
        isExpired && "opacity-60"
      )}
    >
      {/* Icon */}
      <div className="w-10 h-10 rounded-xl bg-[rgb(var(--warning))]/10 flex items-center justify-center shrink-0">
        <Mail className="w-5 h-5 text-[rgb(var(--warning))]" />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-[rgb(var(--text-primary))] truncate">
          {invitation.invitedEmail}
        </p>
        <div className="flex items-center gap-2 text-xs text-[rgb(var(--text-muted))]">
          <Clock className="w-3 h-3" />
          {isExpired ? (
            <span className="text-[rgb(var(--error))]">Expirada</span>
          ) : (
            <span>Expira en {timeRemaining?.text}</span>
          )}
        </div>
      </div>

      {/* Status */}
      <span
        className={clsx(
          "px-2 py-1 rounded-lg text-xs font-medium shrink-0",
          invitation.status === "PENDING"
            ? "bg-[rgb(var(--warning))]/10 text-[rgb(var(--warning))]"
            : invitation.status === "ACCEPTED"
            ? "bg-[rgb(var(--success))]/10 text-[rgb(var(--success))]"
            : "bg-[rgb(var(--error))]/10 text-[rgb(var(--error))]"
        )}
      >
        {invitation.status === "PENDING"
          ? "Pendiente"
          : invitation.status === "ACCEPTED"
          ? "Aceptada"
          : invitation.status === "REJECTED"
          ? "Rechazada"
          : invitation.status === "EXPIRED"
          ? "Expirada"
          : "Cancelada"}
      </span>

      {/* Actions */}
      {canManage && invitation.status === "PENDING" && (
        <div className="relative">
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 rounded-lg hover:bg-[rgb(var(--bg-hover))] transition-colors"
          >
            <MoreVertical className="w-4 h-4 text-[rgb(var(--text-muted))]" />
          </button>

          <AnimatePresence>
            {isMenuOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setIsMenuOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={clsx(
                    "absolute right-0 top-full mt-1 z-20",
                    "w-40 py-1 rounded-xl",
                    "bg-[rgb(var(--bg-surface))] border border-[rgb(var(--border-base))]",
                    "shadow-lg"
                  )}
                >
                  <button
                    onClick={handleResend}
                    disabled={resendInvitation.isPending}
                    className={clsx(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm",
                      "text-[rgb(var(--text-secondary))] hover:bg-[rgb(var(--bg-hover))]",
                      "transition-colors"
                    )}
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reenviar
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={cancelInvitation.isPending}
                    className={clsx(
                      "w-full flex items-center gap-2 px-3 py-2 text-sm",
                      "text-[rgb(var(--error))] hover:bg-[rgb(var(--error))]/5",
                      "transition-colors"
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                    Cancelar
                  </button>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// MAIN SECTION
// =============================================================================

export function MembersSection() {
  const { activeGroup, profile, isOwner } = useWorkspace();
  const [showInviteModal, setShowInviteModal] = useState(false);

  const { data: members, isLoading: membersLoading } = useGroupMembers(
    activeGroup?.$id
  );
  const { data: invitations, isLoading: invitationsLoading } =
    useGroupInvitations(activeGroup?.$id, "PENDING");
  const { data: roles } = useGroupRoles(activeGroup?.$id);
  const { data: permissions } = useUserPermissions(
    activeGroup?.$id,
    profile?.$id
  );

  const canInvite =
    isOwner || permissions?.some((p) => p.key === "members.invite");
  const canManageInvitations =
    isOwner || permissions?.some((p) => p.key === "members.invite");

  if (!activeGroup) {
    return (
      <SettingsCard>
        <div className="text-center py-8">
          <Users className="w-12 h-12 mx-auto text-[rgb(var(--text-muted))] mb-3" />
          <p className="text-[rgb(var(--text-muted))]">
            No hay un espacio activo
          </p>
        </div>
      </SettingsCard>
    );
  }

  const pendingInvitations = invitations?.filter(
    (inv) => inv.status === "PENDING"
  );

  return (
    <div className="space-y-6">
      {/* Members Card */}
      <SettingsCard>
        <SettingsCardHeader
          icon={Users}
          title="Miembros del equipo"
          description={`${members?.length || 0} miembro${
            (members?.length || 0) !== 1 ? "s" : ""
          }`}
          action={
            canInvite ? (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowInviteModal(true)}
                className="gap-2"
              >
                <UserPlus className="w-4 h-4" />
                Invitar
              </Button>
            ) : null
          }
        />

        {membersLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--text-muted))]" />
          </div>
        ) : members?.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-[rgb(var(--text-muted))]">
              No hay miembros en este espacio
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {members?.map((member) => (
              <MemberCard
                key={member.$id}
                member={member}
                isCurrentUser={member.profileId === profile?.$id}
                isOwnerView={isOwner}
              />
            ))}
          </div>
        )}
      </SettingsCard>

      {/* Pending Invitations Card */}
      {(canManageInvitations || pendingInvitations?.length > 0) && (
        <SettingsCard>
          <SettingsCardHeader
            icon={Mail}
            title="Invitaciones pendientes"
            description={
              pendingInvitations?.length
                ? `${pendingInvitations.length} invitación${
                    pendingInvitations.length !== 1 ? "es" : ""
                  } pendiente${pendingInvitations.length !== 1 ? "s" : ""}`
                : "No hay invitaciones pendientes"
            }
          />

          {invitationsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[rgb(var(--text-muted))]" />
            </div>
          ) : pendingInvitations?.length === 0 ? (
            <div className="text-center py-6">
              <Mail className="w-10 h-10 mx-auto text-[rgb(var(--text-muted))] mb-2 opacity-50" />
              <p className="text-sm text-[rgb(var(--text-muted))]">
                No hay invitaciones pendientes
              </p>
              {canInvite && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowInviteModal(true)}
                  className="mt-3"
                >
                  <UserPlus className="w-4 h-4 mr-2" />
                  Invitar a alguien
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-2">
              {pendingInvitations?.map((invitation) => (
                <InvitationCard
                  key={invitation.$id}
                  invitation={invitation}
                  canManage={canManageInvitations}
                />
              ))}
            </div>
          )}
        </SettingsCard>
      )}

      {/* Permission Info */}
      {!isOwner && !canInvite && (
        <SettingsAlert
          type="info"
          icon={Shield}
          title="Permisos"
          description="Solo el propietario o usuarios con permisos pueden invitar miembros."
        />
      )}

      {/* Invite Modal */}
      <AnimatePresence>
        {showInviteModal && (
          <InviteModal
            isOpen={showInviteModal}
            onClose={() => setShowInviteModal(false)}
            groupId={activeGroup.$id}
            profileId={profile?.$id}
            roles={roles}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
