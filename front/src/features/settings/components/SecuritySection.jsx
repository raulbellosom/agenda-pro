import React, { useState } from "react";
import { motion } from "framer-motion";
import {
  Lock,
  Eye,
  EyeOff,
  Shield,
  Key,
  Loader2,
  Check,
  AlertTriangle,
} from "lucide-react";
import { useUpdatePassword } from "../../../lib/hooks";
import { Button } from "../../../components/ui/Button";
import { Input } from "../../../components/ui/Input";

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
      { score: 1, label: "Muy débil", color: "rgb(var(--bad))" },
      { score: 2, label: "Débil", color: "rgb(var(--warn))" },
      { score: 3, label: "Aceptable", color: "rgb(var(--warn))" },
      { score: 4, label: "Fuerte", color: "rgb(var(--ok))" },
      { score: 5, label: "Muy fuerte", color: "rgb(var(--ok))" },
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

  return (
    <div className="space-y-6">
      {/* Success Message */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card rounded-3xl p-6 border-[rgb(var(--ok))]/30 bg-[rgb(var(--ok))]/5"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[rgb(var(--ok))]/10 flex items-center justify-center">
              <Check className="w-5 h-5 text-[rgb(var(--ok))]" />
            </div>
            <div>
              <h3 className="font-medium text-[rgb(var(--ok))]">
                Contraseña actualizada
              </h3>
              <p className="text-sm text-[rgb(var(--text-secondary))]">
                Tu contraseña ha sido cambiada exitosamente.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Password Section */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[rgb(var(--brand-1))]/10 flex items-center justify-center">
            <Key className="w-5 h-5 text-[rgb(var(--brand-1))]" />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-[rgb(var(--text-primary))]">
              Contraseña
            </h2>
            <p className="text-sm text-[rgb(var(--muted))]">
              Cambia tu contraseña de acceso
            </p>
          </div>
        </div>

        {!showForm ? (
          <div className="flex items-center justify-between p-4 rounded-2xl bg-[rgb(var(--bg-subtle))]">
            <div className="flex items-center gap-3">
              <Lock className="w-5 h-5 text-[rgb(var(--muted))]" />
              <div>
                <div className="font-medium text-[rgb(var(--text-primary))]">
                  Contraseña actual
                </div>
                <div className="text-sm text-[rgb(var(--muted))]">
                  ••••••••••••
                </div>
              </div>
            </div>
            <Button variant="soft" size="sm" onClick={() => setShowForm(true)}>
              Cambiar
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Contraseña actual"
              type="password"
              placeholder="Tu contraseña actual"
              value={form.currentPassword}
              onChange={handleChange("currentPassword")}
              icon={<Lock className="w-4 h-4" />}
              required
              autoFocus
            />

            <div className="pt-4 border-t border-[rgb(var(--glass-border))]">
              <Input
                label="Nueva contraseña"
                type="password"
                placeholder="Mínimo 8 caracteres"
                value={form.newPassword}
                onChange={handleChange("newPassword")}
                icon={<Key className="w-4 h-4" />}
                required
              />

              {/* Strength indicator */}
              {form.newPassword && (
                <div className="mt-2">
                  <div className="flex gap-1 mb-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className="h-1 flex-1 rounded-full transition-colors"
                        style={{
                          backgroundColor:
                            level <= strength.score
                              ? strength.color
                              : "rgb(var(--bg-subtle))",
                        }}
                      />
                    ))}
                  </div>
                  <p className="text-xs" style={{ color: strength.color }}>
                    {strength.label}
                  </p>
                </div>
              )}
            </div>

            <div>
              <Input
                label="Confirmar nueva contraseña"
                type="password"
                placeholder="Repite la nueva contraseña"
                value={form.confirmPassword}
                onChange={handleChange("confirmPassword")}
                icon={<Key className="w-4 h-4" />}
                required
                error={
                  passwordsMismatch ? "Las contraseñas no coinciden" : undefined
                }
              />

              {passwordsMatch && (
                <p className="mt-1 text-xs text-[rgb(var(--ok))] flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Las contraseñas coinciden
                </p>
              )}
            </div>

            {updatePassword.isError && (
              <div className="p-3 rounded-xl bg-[rgb(var(--bad))]/10 border border-[rgb(var(--bad))]/20">
                <p className="text-sm text-[rgb(var(--bad))]">
                  {updatePassword.error?.message ||
                    "Error al cambiar la contraseña. Verifica que la contraseña actual sea correcta."}
                </p>
              </div>
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
                isLoading={updatePassword.isPending}
                className="flex-1"
              >
                Cambiar contraseña
              </Button>
            </div>
          </form>
        )}
      </div>

      {/* Security Tips */}
      <div className="glass-card rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <Shield className="w-5 h-5 text-[rgb(var(--brand-1))]" />
          <h3 className="font-medium text-[rgb(var(--text-primary))]">
            Consejos de seguridad
          </h3>
        </div>

        <ul className="space-y-3 text-sm text-[rgb(var(--text-secondary))]">
          <li className="flex items-start gap-2">
            <span className="text-[rgb(var(--brand-1))]">•</span>
            Usa al menos 12 caracteres para mayor seguridad
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[rgb(var(--brand-1))]">•</span>
            Combina mayúsculas, minúsculas, números y símbolos
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[rgb(var(--brand-1))]">•</span>
            No uses información personal fácil de adivinar
          </li>
          <li className="flex items-start gap-2">
            <span className="text-[rgb(var(--brand-1))]">•</span>
            No reutilices contraseñas de otros sitios
          </li>
        </ul>
      </div>

      {/* Sessions Info (placeholder for future) */}
      <div className="glass-card rounded-3xl p-6 opacity-60">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-[rgb(var(--warn))]" />
          <h3 className="font-medium text-[rgb(var(--text-primary))]">
            Sesiones activas
          </h3>
        </div>
        <p className="text-sm text-[rgb(var(--muted))]">
          Próximamente podrás ver y cerrar tus sesiones activas en otros
          dispositivos.
        </p>
      </div>
    </div>
  );
}
