import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";
import {
  Lock,
  Eye,
  EyeOff,
  Shield,
  Key,
  Loader2,
  Check,
  AlertTriangle,
  Smartphone,
  Monitor,
  CheckCircle,
  Info,
  KeyRound,
  Hash,
  UserX,
  Ban,
} from "lucide-react";
import { useUpdatePassword } from "../../../lib/hooks";
import { Button } from "../../../components/ui/Button";
import { SettingsCard, SettingsCardHeader } from "./SettingsCard";
import { SettingsAlert, SettingsStrength } from "./SettingsWidgets";

export function SecuritySection() {
  const updatePassword = useUpdatePassword();

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [success, setSuccess] = useState(false);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.newPassword !== form.confirmPassword) {
      return;
    }

    if (form.newPassword.length < 8) {
      return;
    }

    try {
      await updatePassword.mutateAsync({
        newPassword: form.newPassword,
        oldPassword: form.currentPassword,
      });

      setSuccess(true);
      setForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setShowForm(false);
    } catch (error) {
      console.error("Error updating password:", error);
    }
  };

  const handleCancel = () => {
    setForm({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setShowForm(false);
    updatePassword.reset();
  };

  // Password strength calculation
  const getPasswordStrength = (password) => {
    if (!password) return { score: 0, label: "", color: "" };

    let score = 0;
    if (password.length >= 8) score++;
    if (password.length >= 12) score++;
    if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[^a-zA-Z0-9]/.test(password)) score++;

    const levels = [
      { score: 0, label: "", color: "" },
      { score: 1, label: "Muy débil", color: "rgb(var(--error))" },
      { score: 2, label: "Débil", color: "rgb(var(--warning))" },
      { score: 3, label: "Aceptable", color: "rgb(var(--warning))" },
      { score: 4, label: "Fuerte", color: "rgb(var(--success))" },
      { score: 5, label: "Muy fuerte", color: "rgb(var(--success))" },
    ];

    return levels[Math.min(score, 5)];
  };

  const strength = getPasswordStrength(form.newPassword);
  const passwordsMatch =
    form.newPassword &&
    form.confirmPassword &&
    form.newPassword === form.confirmPassword;
  const passwordsMismatch =
    form.confirmPassword && form.newPassword !== form.confirmPassword;

  // Password Input Component
  const PasswordInput = ({
    value,
    onChange,
    placeholder,
    label,
    error,
    autoFocus,
  }) => {
    const [show, setShow] = useState(false);
    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-[rgb(var(--text-secondary))]">
            {label}
          </label>
        )}
        <div className="relative">
          <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[rgb(var(--text-muted))]" />
          <input
            type={show ? "text" : "password"}
            value={value}
            onChange={onChange}
            placeholder={placeholder}
            autoFocus={autoFocus}
            className={clsx(
              "w-full pl-12 pr-12 py-3 rounded-xl text-sm",
              "bg-[rgb(var(--bg-muted))] border",
              error
                ? "border-[rgb(var(--error))] focus:ring-[rgb(var(--error))]"
                : "border-[rgb(var(--border-base))] focus:ring-[rgb(var(--brand-primary))]",
              "text-[rgb(var(--text-primary))] placeholder:text-[rgb(var(--text-muted))]",
              "focus:outline-none focus:ring-2 focus:border-transparent focus:bg-[rgb(var(--bg-surface))]",
              "transition-all duration-200"
            )}
          />
          <button
            type="button"
            onClick={() => setShow(!show)}
            className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-lg text-[rgb(var(--text-muted))] hover:text-[rgb(var(--text-primary))] hover:bg-[rgb(var(--bg-hover))] transition-all"
          >
            {show ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>
        {error && (
          <p className="text-xs text-[rgb(var(--error))] pl-1">{error}</p>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Success Message */}
      <AnimatePresence>
        {success && (
          <SettingsAlert
            type="success"
            title="Contraseña actualizada"
            description="Tu contraseña ha sido cambiada exitosamente."
            icon={CheckCircle}
          />
        )}
      </AnimatePresence>

      {/* Password Section */}
      <SettingsCard>
        <SettingsCardHeader
          icon={Key}
          title="Contraseña"
          description="Cambia tu contraseña de acceso"
        />

        {!showForm ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-between gap-4 p-4 rounded-xl bg-[rgb(var(--bg-muted))]/50"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[rgb(var(--bg-surface))] flex items-center justify-center">
                <Lock className="w-5 h-5 text-[rgb(var(--text-muted))]" />
              </div>
              <div>
                <div className="font-medium text-[rgb(var(--text-primary))]">
                  Contraseña actual
                </div>
                <div className="text-sm text-[rgb(var(--text-muted))]">
                  ••••••••••••
                </div>
              </div>
            </div>
            <Button variant="soft" size="sm" onClick={() => setShowForm(true)}>
              Cambiar
            </Button>
          </motion.div>
        ) : (
          <motion.form
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="space-y-5"
          >
            <PasswordInput
              label="Contraseña actual"
              value={form.currentPassword}
              onChange={handleChange("currentPassword")}
              placeholder="Tu contraseña actual"
              autoFocus
            />

            <div className="h-px bg-gradient-to-r from-transparent via-[rgb(var(--border-base))] to-transparent" />

            <div className="space-y-4">
              <PasswordInput
                label="Nueva contraseña"
                value={form.newPassword}
                onChange={handleChange("newPassword")}
                placeholder="Mínimo 8 caracteres"
              />

              {/* Strength indicator */}
              {form.newPassword && (
                <SettingsStrength
                  score={strength.score}
                  label={strength.label}
                />
              )}

              <PasswordInput
                label="Confirmar nueva contraseña"
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
                placeholder="Repite la nueva contraseña"
                error={
                  passwordsMismatch ? "Las contraseñas no coinciden" : undefined
                }
              />

              {passwordsMatch && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-xs text-[rgb(var(--success))] flex items-center gap-1.5"
                >
                  <Check className="w-3.5 h-3.5" />
                  Las contraseñas coinciden
                </motion.p>
              )}
            </div>

            {updatePassword.isError && (
              <SettingsAlert
                type="error"
                title="Error"
                description={
                  updatePassword.error?.message ||
                  "Error al cambiar la contraseña. Verifica que la contraseña actual sea correcta."
                }
              />
            )}

            <div className="flex gap-3 pt-2">
              <Button
                type="button"
                variant="ghost"
                onClick={handleCancel}
                disabled={updatePassword.isPending}
                className="flex-1"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  updatePassword.isPending ||
                  !form.currentPassword ||
                  !form.newPassword ||
                  form.newPassword.length < 8 ||
                  form.newPassword !== form.confirmPassword
                }
                loading={updatePassword.isPending}
                className="flex-1"
              >
                Cambiar contraseña
              </Button>
            </div>
          </motion.form>
        )}
      </SettingsCard>

      {/* Security Tips */}
      <SettingsCard>
        <SettingsCardHeader
          icon={Shield}
          title="Consejos de seguridad"
          description="Mantén tu cuenta segura"
          iconColor="success"
        />

        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              text: "Usa al menos 12 caracteres para mayor seguridad",
              Icon: KeyRound,
              color: "text-emerald-500",
            },
            {
              text: "Combina mayúsculas, minúsculas, números y símbolos",
              Icon: Hash,
              color: "text-violet-500",
            },
            {
              text: "No uses información personal fácil de adivinar",
              Icon: UserX,
              color: "text-rose-500",
            },
            {
              text: "No reutilices contraseñas de otros sitios",
              Icon: Ban,
              color: "text-amber-500",
            },
          ].map((tip, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="flex items-start gap-3 p-3 rounded-xl bg-[rgb(var(--bg-muted))]/50"
            >
              <div className="mt-0.5 shrink-0">
                <tip.Icon className={`w-4 h-4 ${tip.color}`} />
              </div>
              <span className="text-sm text-[rgb(var(--text-secondary))]">
                {tip.text}
              </span>
            </motion.div>
          ))}
        </div>
      </SettingsCard>

      {/* Sessions Info (placeholder for future) */}
      <SettingsCard className="opacity-60">
        <SettingsCardHeader
          icon={Monitor}
          title="Sesiones activas"
          description="Gestiona tus dispositivos conectados"
          iconColor="warning"
        />

        <div className="flex items-center gap-3 p-4 rounded-xl bg-[rgb(var(--warning))]/5 border border-[rgb(var(--warning))]/20">
          <Info className="w-5 h-5 text-[rgb(var(--warning))] shrink-0" />
          <p className="text-sm text-[rgb(var(--text-secondary))]">
            Próximamente podrás ver y cerrar tus sesiones activas en otros
            dispositivos.
          </p>
        </div>
      </SettingsCard>
    </div>
  );
}
