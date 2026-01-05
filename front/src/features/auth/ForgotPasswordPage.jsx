import React, { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, ArrowRight, CheckCircle2 } from "lucide-react";
import { account } from "../../lib/appwrite";
import { AuthLayout } from "./AuthLayout";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

// Flujo de solicitud de recuperación de contraseña
export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | sent | error
  const [message, setMessage] = useState("");

  const canSubmit = useMemo(() => email.trim().length > 3, [email]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      const redirectUrl = `${window.location.origin}/reset-password`;
      await account.createRecovery(email.trim(), redirectUrl);
      setStatus("sent");
      setMessage(
        "Te enviamos un link para restablecer tu contraseña. Revisa tu bandeja de entrada y la carpeta de spam."
      );
    } catch (err) {
      setStatus("error");
      setMessage(
        err?.message || "No pudimos enviar el correo de recuperación."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="¿Olvidaste tu contraseña?"
      subtitle="Ingresa tu correo para enviarte un enlace de recuperación."
    >
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          label="Correo electrónico"
          placeholder="tucorreo@ejemplo.com"
          inputMode="email"
          autoComplete="email"
          icon={Mail}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading || status === "sent"}
        />

        {message && (
          <div
            className={`text-sm rounded-lg p-3 border ${
              status === "sent"
                ? "bg-green-50 text-green-700 border-green-200"
                : "bg-red-50 text-red-700 border-red-200"
            }`}
          >
            <div className="flex items-center gap-2">
              {status === "sent" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <ArrowLeft className="w-4 h-4" />
              )}
              <span>{message}</span>
            </div>
          </div>
        )}

        <Button
          type="submit"
          size="lg"
          className="w-full"
          disabled={!canSubmit || loading || status === "sent"}
          loading={loading}
          rightIcon={<ArrowRight className="w-5 h-5" />}
        >
          Enviar enlace
        </Button>

        <div className="flex flex-col gap-3 text-sm text-center text-[rgb(var(--text-muted))]">
          <Link
            to="/login"
            className="text-[rgb(var(--brand-primary))] hover:underline"
          >
            Volver a iniciar sesión
          </Link>
          <span>
            ¿No tienes cuenta?{" "}
            <Link
              to="/register"
              className="text-[rgb(var(--brand-primary))] hover:underline"
            >
              Crear una cuenta
            </Link>
          </span>
        </div>
      </form>
    </AuthLayout>
  );
}
