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
} from "lucide-react";
import { useGroupMembers, useRemoveMember } from "../../../lib/hooks/useGroups";
import { useGroupRoles, useUserPermissions } from "../../../lib/hooks/useRbac";
import {
  useGroupInvitations,
  useSendInvitation,
  useCancelInvitation,
  useResendInvitation,
} from "../../../lib/hooks/useInvitations";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";
import { Avatar } from "../../../components/ui/Avatar";
import { getAvatarUrl } from "../../../lib/hooks/useProfile";
import { ImageViewerModal } from "../../../shared/ui/ImageViewerModal";
import { BUCKETS } from "../../../lib/constants";

// Invite Modal Component
function InviteModal({
  isOpen,
  onClose,
  groupId,
  profileId,
  roles,
  members,
  invitations,
  ownerEmail,
}) {
  const sendInvitation = useSendInvitation();
  const [email, setEmail] = useState("");
  const [selectedRoleId, setSelectedRoleId] = useState(
    roles?.[1]?.$id || roles?.[0]?.$id || ""
  );
  const [message, setMessage] = useState("");
  const [showCopyLink, setShowCopyLink] = useState(false);
  const [inviteResult, setInviteResult] = useState(null);
  const [validationError, setValidationError] = useState("");

  // Validar email
  const validateEmail = (emailToCheck) => {
    setValidationError("");

    // Validar formato
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailToCheck)) {
      return "Email inválido";
    }

    // No puede ser el dueño
    if (emailToCheck.toLowerCase() === ownerEmail?.toLowerCase()) {
      return "No puedes invitar al propietario del espacio";
    }

    // No puede ser miembro existente
    const isMember = members?.some(
      (m) => m.profile?.email?.toLowerCase() === emailToCheck.toLowerCase()
    );
    if (isMember) {
      return "Este usuario ya es miembro del espacio";
    }

    // No puede tener invitación activa
    const hasActiveInvitation = invitations?.some(
      (inv) =>
        inv.invitedEmail?.toLowerCase() === emailToCheck.toLowerCase() &&
        inv.enabled === true &&
        inv.status === "PENDING"
    );
    if (hasActiveInvitation) {
      return "Este usuario ya tiene una invitación pendiente";
    }

    return "";
  };

  const handleEmailChange = (e) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (newEmail.trim()) {
      setValidationError(validateEmail(newEmail));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const error = validateEmail(email);
    if (error || !email.trim() || !selectedRoleId) {
      setValidationError(error || "Completa todos los campos");
      return;
    }

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
      setValidationError("Error al enviar la invitación. Intenta de nuevo.");
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
    setValidationError("");
    onClose();
  };

  // Manejo correcto del click fuera del modal para evitar cerrar al arrastrar texto
  const handleOverlayMouseDown = (e) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      const mouseDownTarget = e.target;

      const handleMouseUp = (upEvent) => {
        if (upEvent.target === mouseDownTarget) {
          handleClose();
        }
        document.removeEventListener("mouseup", handleMouseUp);
      };

      document.addEventListener("mouseup", handleMouseUp);
    }
  };

  if (!isOpen) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      onMouseDown={handleOverlayMouseDown}
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
                  <Button
                    variant="outline"
                    onClick={handleCopyLink}
                    leftIcon={<Copy className="w-4 h-4" />}
                  />
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
                  leftIcon={<UserPlus className="w-4 h-4" />}
                >
                  Invitar a otro
                </Button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {validationError && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-3 rounded-lg bg-[rgb(var(--error))]/10 border border-[rgb(var(--error))]/20 flex items-start gap-3"
                >
                  <div className="w-5 h-5 rounded-full bg-[rgb(var(--error))]/20 flex items-center justify-center shrink-0 mt-0.5">
                    <div className="w-2 h-2 rounded-full bg-[rgb(var(--error))]" />
                  </div>
                  <p className="text-sm text-[rgb(var(--error))]">
                    {validationError}
                  </p>
                </motion.div>
              )}

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                  Correo electrónico
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="correo@ejemplo.com"
                  className={
                    validationError && email ? "border-[rgb(var(--error))]" : ""
                  }
                  required
                />
                {email && !validationError && (
                  <p className="text-xs text-[rgb(var(--success))] mt-1">
                    ✓ Email válido
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[rgb(var(--text-secondary))] mb-2">
                  Rol
                </label>
                <select
                  value={selectedRoleId}
                  onChange={(e) => setSelectedRoleId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] text-sm"
                >
                  {roles
                    ?.filter((role) => role && role.$id)
                    .map((role) => (
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
                  className="w-full px-3 py-2 rounded-lg border border-[rgb(var(--border-base))] bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-primary))] text-sm resize-none h-24"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <Button variant="ghost" onClick={handleClose}>
                  Cancelar
                </Button>
                <Button
                  type="submit"
                  disabled={
                    sendInvitation.isPending ||
                    !email.trim() ||
                    !!validationError
                  }
                  loading={sendInvitation.isPending}
                  leftIcon={
                    !sendInvitation.isPending && <Send className="w-4 h-4" />
                  }
                >
                  {sendInvitation.isPending
                    ? "Enviando..."
                    : "Enviar invitación"}
                </Button>
              </div>
            </form>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// Members List Component
function MembersList({ groupId, members, roles, isOwner }) {
  const { data: permissions } = useUserPermissions(groupId, null);
  const [selectedAvatarId, setSelectedAvatarId] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const removeMember = useRemoveMember();
  const canManageMembers =
    isOwner || permissions?.some((p) => p.key === "members.manage");

  return (
    <>
      <div className="space-y-3">
        {members?.map((member) => (
          <div
            key={member.$id}
            className="flex items-center justify-between p-4 rounded-xl bg-[rgb(var(--bg-muted))]/30 border border-[rgb(var(--border-base))]"
          >
            <div className="flex items-center gap-3">
              <Avatar
                src={getAvatarUrl(member.profile?.avatarFileId, 40)}
                name={`${member.profile?.firstName || ""} ${
                  member.profile?.lastName || ""
                }`}
                size={40}
                onClick={
                  member.profile?.avatarFileId
                    ? () => setSelectedAvatarId(member.profile.avatarFileId)
                    : undefined
                }
              />
              <div>
                <p className="font-medium text-[rgb(var(--text-primary))]">
                  {member.profile?.firstName} {member.profile?.lastName}
                </p>
                <p className="text-xs text-[rgb(var(--text-muted))]">
                  {member.profile?.email}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-[rgb(var(--brand-primary))]/10 text-[rgb(var(--brand-primary))] text-xs font-semibold">
                {member.membershipRole === "OWNER" ? "Propietario" : "Miembro"}
              </span>
              {member.membershipRole === "OWNER" && (
                <Crown className="w-4 h-4 text-amber-500" />
              )}
              {/* Botón eliminar - solo si puedes gestionar y no es owner */}
              {canManageMembers && member.membershipRole !== "OWNER" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmRemove(member)}
                  title="Eliminar miembro"
                  className="text-[rgb(var(--error))] hover:text-[rgb(var(--error))] hover:bg-[rgb(var(--error))]/10"
                  leftIcon={<Trash2 className="w-4 h-4" />}
                />
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Image Viewer Modal for avatars */}
      <ImageViewerModal
        isOpen={!!selectedAvatarId}
        onClose={() => setSelectedAvatarId(null)}
        currentImageId={selectedAvatarId}
        images={selectedAvatarId ? [selectedAvatarId] : []}
        bucketId={BUCKETS.AVATARS}
      />

      {/* Remove Member Confirmation Modal */}
      <AnimatePresence>
        {confirmRemove && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
            onClick={() => setConfirmRemove(null)}
          >
            <motion.div
              initial={{ scale: 0.95 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.95 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-md bg-[rgb(var(--bg-surface))] rounded-2xl border border-[rgb(var(--border-base))] shadow-xl overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[rgb(var(--error))]/10 flex items-center justify-center shrink-0">
                    <Trash2 className="w-6 h-6 text-[rgb(var(--error))]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[rgb(var(--text-primary))] mb-2">
                      ¿Eliminar miembro?
                    </h3>
                    <p className="text-sm text-[rgb(var(--text-secondary))] mb-4">
                      ¿Estás seguro de que quieres eliminar a{" "}
                      <span className="font-medium text-[rgb(var(--text-primary))]">
                        {confirmRemove.profile?.firstName}{" "}
                        {confirmRemove.profile?.lastName}
                      </span>{" "}
                      del espacio? Esta acción no se puede deshacer.
                    </p>
                    <div className="flex items-center gap-3 p-3 rounded-lg bg-[rgb(var(--bg-muted))]/50 border border-[rgb(var(--border-base))]">
                      <Avatar
                        src={getAvatarUrl(
                          confirmRemove.profile?.avatarFileId,
                          32
                        )}
                        name={`${confirmRemove.profile?.firstName || ""} ${
                          confirmRemove.profile?.lastName || ""
                        }`}
                        size={32}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-[rgb(var(--text-primary))] truncate">
                          {confirmRemove.profile?.firstName}{" "}
                          {confirmRemove.profile?.lastName}
                        </p>
                        <p className="text-xs text-[rgb(var(--text-muted))] truncate">
                          {confirmRemove.profile?.email}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button
                    variant="ghost"
                    onClick={() => setConfirmRemove(null)}
                    disabled={removeMember.isPending}
                  >
                    Cancelar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={async () => {
                      try {
                        await removeMember.mutateAsync({
                          groupId,
                          memberProfileId: confirmRemove.profileId,
                        });
                        setConfirmRemove(null);
                      } catch (error) {
                        console.error("Error removing member:", error);
                      }
                    }}
                    disabled={removeMember.isPending}
                    loading={removeMember.isPending}
                    leftIcon={
                      !removeMember.isPending && <Trash2 className="w-4 h-4" />
                    }
                  >
                    {removeMember.isPending ? "Eliminando..." : "Eliminar"}
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

// Pending Invitations Component
function PendingInvitations({ groupId, invitations, isOwner, profile }) {
  const resendInvitation = useResendInvitation();
  const cancelInvitation = useCancelInvitation();

  // Filtrar invitaciones únicas y válidas
  const uniqueInvitations =
    invitations?.filter(
      (inv, index, self) =>
        inv && inv.$id && index === self.findIndex((i) => i.$id === inv.$id)
    ) || [];

  if (uniqueInvitations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-3">
      {uniqueInvitations.map((invitation) => (
        <div
          key={invitation.$id}
          className="flex items-center justify-between p-4 rounded-xl bg-[rgb(var(--bg-muted))]/20 border border-[rgb(var(--border-base))] border-dashed"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-10 h-10 rounded-full bg-[rgb(var(--bg-muted))] flex items-center justify-center">
              <Mail className="w-5 h-5 text-[rgb(var(--text-muted))]" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-[rgb(var(--text-primary))]">
                {invitation.invitedEmail}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Clock className="w-3 h-3 text-[rgb(var(--text-muted))]" />
                <span className="text-xs text-[rgb(var(--text-muted))]">
                  Pendiente desde{" "}
                  {new Date(invitation.$createdAt).toLocaleDateString("es-ES")}
                </span>
              </div>
            </div>
          </div>
          {isOwner && (
            <div className="flex items-center gap-2 ml-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() =>
                  resendInvitation.mutateAsync({
                    invitationId: invitation.$id,
                    invitedByProfileId: profile?.$id,
                  })
                }
                disabled={!isOwner}
                title="Reenviar invitación"
                leftIcon={<RefreshCw className="w-4 h-4" />}
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={() => cancelInvitation.mutateAsync(invitation.$id)}
                disabled={!isOwner}
                title="Cancelar invitación"
                className="text-[rgb(var(--error))]"
                leftIcon={<X className="w-4 h-4" />}
              />
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

export function SpaceMembersTab({ groupId, isOwner, profile }) {
  const [showInviteModal, setShowInviteModal] = useState(false);

  const { data: members } = useGroupMembers(groupId);
  const { data: roles } = useGroupRoles(groupId);
  const { data: invitations } = useGroupInvitations(groupId, "PENDING");

  return (
    <div className="space-y-6">
      {/* Invite Members Section */}
      {isOwner && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-xl bg-linear-to-r from-[rgb(var(--brand-primary))]/5 to-[rgb(var(--brand-secondary))]/5 border border-[rgb(var(--brand-primary))]/20"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-[rgb(var(--text-primary))]">
                Invitar miembros
              </p>
              <p className="text-sm text-[rgb(var(--text-muted))] mt-1">
                Añade nuevos miembros al espacio
              </p>
            </div>
            <Button
              onClick={() => setShowInviteModal(true)}
              leftIcon={<UserPlus className="w-4 h-4" />}
            >
              Invitar
            </Button>
          </div>
        </motion.div>
      )}

      {/* Active Members */}
      <div>
        <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-4 flex items-center gap-2">
          <Users className="w-5 h-5" />
          Miembros activos ({members?.length || 0})
        </h3>
        {members?.length > 0 ? (
          <MembersList
            groupId={groupId}
            members={members}
            roles={roles}
            isOwner={isOwner}
          />
        ) : (
          <p className="text-center py-8 text-[rgb(var(--text-muted))]">
            No hay miembros aún
          </p>
        )}
      </div>

      {/* Pending Invitations */}
      {invitations?.length > 0 && (
        <div>
          <h3 className="font-semibold text-[rgb(var(--text-primary))] mb-4 flex items-center gap-2">
            <Mail className="w-5 h-5" />
            Invitaciones pendientes ({invitations.length})
          </h3>
          <PendingInvitations
            groupId={groupId}
            invitations={invitations}
            isOwner={isOwner}
            profile={profile}
          />
        </div>
      )}

      {/* Invite Modal */}
      <InviteModal
        isOpen={showInviteModal}
        onClose={() => setShowInviteModal(false)}
        groupId={groupId}
        profileId={profile?.$id}
        roles={roles}
        members={members}
        invitations={invitations}
        ownerEmail={profile?.email}
      />
    </div>
  );
}
