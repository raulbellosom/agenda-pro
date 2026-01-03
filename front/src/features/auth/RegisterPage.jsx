import React, { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { User, Mail, Lock, ArrowRight, LogIn, Shield } from "lucide-react";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { AuthLayout } from "./AuthLayout";
import { useAuth } from "../../app/providers/AuthProvider";
import { ToastViewport } from "../../components/ui/Toast";

const formItemVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: (i) => ({
    opacity: 1,
    x: 0,
    transition: {
      delay: i * 0.08,
      duration: 0.4,
      ease: [0.25, 0.46, 0.45, 0.94],
    },
  }),
};

export function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const [toasts, setToasts] = useState([]);
  const pushToast = (title, message) => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, title, message }]);
    window.setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      3500
    );
  };

  // Validation
  const passwordsMatch = password === confirmPassword;
  const passwordStrong = password.length >= 8;

  const canSubmit = useMemo(
    () =>
      firstName.trim().length >= 2 &&
      lastName.trim().length >= 2 &&
      email.trim().length > 3 &&
      passwordStrong &&
      passwordsMatch,
    [
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      passwordStrong,
      passwordsMatch,
    ]
  );

  // Password validation errors
  const passwordError = useMemo(() => {
    if (password.length > 0 && !passwordStrong) {
      return "La contraseña debe tener al menos 8 caracteres";
    }
    return null;
  }, [password, passwordStrong]);

  const confirmPasswordError = useMemo(() => {
    if (confirmPassword.length > 0 && !passwordsMatch) {
      return "Las contraseñas no coinciden";
    }
    return null;
  }, [confirmPassword, passwordsMatch]);

  async function onSubmit(e) {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    try {
      // Combine firstName and lastName for the name field in auth
      const fullName = `${firstName.trim()} ${lastName.trim()}`;
      await register(
        email.trim(),
        password,
        fullName,
        firstName.trim(),
        lastName.trim()
      );
      nav("/", { replace: true });
    } catch (err) {
      pushToast(
        "No se pudo crear la cuenta",
        err?.message ?? "Intenta con otro correo."
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
      <AuthLayout
        title={
          <>
            Crea tu <span className="text-gradient">cuenta</span>
          </>
        }
        subtitle="Únete y toma el control de tu tiempo."
      >
        <form onSubmit={onSubmit} className="space-y-4">
          {/* Name fields row */}
          <div className="grid grid-cols-2 gap-3">
            <motion.div
              custom={0}
              variants={formItemVariants}
              initial="hidden"
              animate="visible"
            >
              <Input
                label="Nombre"
                placeholder="Juan"
                autoComplete="given-name"
                icon={User}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </motion.div>

            <motion.div
              custom={1}
              variants={formItemVariants}
              initial="hidden"
              animate="visible"
            >
              <Input
                label="Apellido"
                placeholder="Pérez"
                autoComplete="family-name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </motion.div>
          </div>

          <motion.div
            custom={2}
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
            custom={3}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
          >
            <Input
              label="Contraseña"
              placeholder="Mínimo 8 caracteres"
              type="password"
              autoComplete="new-password"
              icon={Lock}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              error={passwordError}
            />
          </motion.div>

          <motion.div
            custom={4}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
          >
            <Input
              label="Confirmar contraseña"
              placeholder="Repite tu contraseña"
              type="password"
              autoComplete="new-password"
              icon={Shield}
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={confirmPasswordError}
            />
          </motion.div>

          {/* Password strength indicator */}
          {password.length > 0 && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <div className="flex gap-1.5">
                {[1, 2, 3, 4].map((level) => (
                  <motion.div
                    key={level}
                    className="h-1.5 flex-1 rounded-full overflow-hidden bg-[rgb(var(--bg-muted))]"
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: level * 0.1, duration: 0.2 }}
                  >
                    <motion.div
                      className={`h-full rounded-full ${
                        password.length >= level * 3
                          ? password.length >= 12
                            ? "bg-[rgb(var(--success))]"
                            : password.length >= 8
                            ? "bg-[rgb(var(--brand-primary))]"
                            : "bg-[rgb(var(--warning))]"
                          : "bg-transparent"
                      }`}
                      initial={{ width: 0 }}
                      animate={{
                        width: password.length >= level * 3 ? "100%" : "0%",
                      }}
                      transition={{ duration: 0.3 }}
                    />
                  </motion.div>
                ))}
              </div>
              <p className="text-xs text-[rgb(var(--text-muted))]">
                {password.length >= 12
                  ? "Contraseña muy segura"
                  : password.length >= 8
                  ? "Contraseña segura"
                  : "Contraseña débil"}
              </p>
            </motion.div>
          )}

          <motion.div
            custom={5}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
            className="pt-2"
          >
            <Button
              type="submit"
              size="lg"
              className="w-full"
              disabled={!canSubmit}
              loading={loading}
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Crear cuenta
            </Button>
          </motion.div>

          <motion.p
            custom={6}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
            className="text-xs text-center text-[rgb(var(--text-muted))] leading-relaxed"
          >
            Al crear tu cuenta, aceptas nuestros{" "}
            <Link
              to="/terms"
              className="text-[rgb(var(--brand-primary))] hover:underline"
            >
              términos de servicio
            </Link>{" "}
            y{" "}
            <Link
              to="/privacy"
              className="text-[rgb(var(--brand-primary))] hover:underline"
            >
              política de privacidad
            </Link>
            .
          </motion.p>

          <motion.div
            custom={7}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
            className="relative pt-2"
          >
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-[rgb(var(--border-base))]" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-[rgb(var(--bg-surface))] text-[rgb(var(--text-muted))]">
                ¿Ya tienes cuenta?
              </span>
            </div>
          </motion.div>

          <motion.div
            custom={8}
            variants={formItemVariants}
            initial="hidden"
            animate="visible"
          >
            <Link to="/login" className="block">
              <Button
                type="button"
                variant="secondary"
                size="lg"
                className="w-full"
                leftIcon={<LogIn className="w-5 h-5" />}
              >
                Iniciar sesión
              </Button>
            </Link>
          </motion.div>
        </form>
      </AuthLayout>
    </>
  );
}
