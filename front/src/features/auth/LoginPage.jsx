import React, { useMemo, useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Mail, Lock, ArrowRight, Sparkles } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { AuthLayout } from "./AuthLayout";
import { useAuth } from "../../app/providers/AuthProvider";
import { ToastViewport } from "../../components/ui/Toast";
import { EmailVerificationModal } from "../../components/EmailVerificationModal";

const formItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.1,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

export function LoginPage() {
  const { login, state } = useAuth();
  const nav = useNavigate();
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState("");
  const isAuthenticated = state.status === "authed";

  // Token de invitación si viene desde /invite/:token
  const inviteToken = searchParams.get("invite");

  const [toasts, setToasts] = useState([]);
  const pushToast = (title, message) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, title, message }]);
    window.setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      3500
    );
  };

  // Detectar si el estado indica email no verificado
  useEffect(() => {
    if (state.emailNotVerified && state.email && !showVerificationModal) {
      setShowVerificationModal(true);
      setVerificationEmail(state.email);
    }
  }, [state, showVerificationModal]);

  // Redirigir a invitación pendiente después de login exitoso
  useEffect(() => {
    if (isAuthenticated) {
      // Verificar si hay un token de invitación pendiente guardado
      const pendingInvite = localStorage.getItem("pendingInviteToken");
      if (pendingInvite) {
        nav(`/invite/${pendingInvite}`, { replace: true });
      }
    }
  }, [isAuthenticated, nav]);

  const canSubmit = useMemo(
    () => email.trim().length > 3 && password.length >= 6,
    [email, password]
  );

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
      // Redirigir a invitación si existe token, sino a home
      const redirectTo = inviteToken ? `/invite/${inviteToken}` : "/";
      nav(redirectTo, { replace: true });
    } catch (err) {
      pushToast(
        "No se pudo iniciar sesión",
        err?.message ?? "Revisa tu correo y contraseña."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <ToastViewport
        toasts={toasts}
        onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))}
      />

      {showVerificationModal && (
        <EmailVerificationModal
          email={verificationEmail}
          onClose={() => setShowVerificationModal(false)}
        />
      )}

      <AuthLayout
        title={
          <>
            Bienvenido de <span className="text-gradient">nuevo</span>
          </>
        }
        subtitle="Inicia sesión para continuar organizando tu tiempo."
      >
        <form onSubmit={onSubmit} className="space-y-5">
          <motion.div
            custom={0}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
          >
            <Input
              label="Correo electrónico"
              placeholder="tucorreo@ejemplo.com"
              inputMode="email"
              autoComplete="email"
              icon={Mail}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </motion.div>

          <motion.div
            custom={1}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
          >
            <Input
              label="Contraseña"
              placeholder="Ingresa tu contraseña"
              type="password"
              autoComplete="current-password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </motion.div>

          <motion.div
            custom={2}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
            className="flex justify-end"
          >
            <Link
              to="/forgot-password"
              className="text-sm text-[rgb(var(--brand-primary))] hover:opacity-80 transition-opacity"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </motion.div>

          <motion.div
            custom={3}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
          >
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!canSubmit}
              loading={loading}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Iniciar sesión
            </Button>
          </motion.div>

          <motion.div
            custom={4}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
            className="relative"
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgb(var(--border-base))]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-muted))]">
                ¿Nuevo en Agenda Pro?
              </span>
            </div>
          </motion.div>

          <motion.div
            custom={5}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
          >
            <Link to="/register" className="block">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full"
                leftIcon={<Sparkles className="w-5 h-5" />}
              >
                Crear una cuenta
              </Button>
            </Link>
          </motion.div>
        </form>
      </AuthLayout>
    </>
  );
}
