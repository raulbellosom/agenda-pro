import React, { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Lock, ShieldCheck, AlertCircle, ArrowRight } from "lucide-react";
import { account } from "../../lib/appwrite";
import { AuthLayout } from "./AuthLayout";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

// Página para completar el restablecimiento con userId y secret
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | success | error
  const [message, setMessage] = useState("");

  const passwordsMatch = password === confirm;
  const passwordStrong = password.length >= 8;

  const canSubmit = useMemo(
    () => Boolean(userId && secret) && passwordStrong && passwordsMatch,
    [userId, secret, passwordStrong, passwordsMatch]
  );

  const missingParams = !userId || !secret;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!canSubmit || loading) return;

    setLoading(true);
    setStatus("idle");
    setMessage("");

    try {
      await account.updateRecovery(userId, secret, password, confirm);
      setStatus("success");
      setMessage("Contraseña actualizada. Ya puedes iniciar sesión.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setStatus("error");
      setMessage(err?.message || "No pudimos restablecer tu contraseña.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Restablecer contraseña"
      subtitle="Crea una nueva contraseña para tu cuenta."
    >
      {missingParams ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 text-amber-800">
            <AlertCircle className="w-5 h-5" />
            <p>El enlace es inválido o ya fue usado. Solicita uno nuevo.</p>
          </div>
          <Button asChild className="w-full">
            <Link to="/forgot-password">Solicitar nuevo enlace</Link>
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-5">
          <Input
            label="Nueva contraseña"
            placeholder="Mínimo 8 caracteres"
            type="password"
            autoComplete="new-password"
            icon={Lock}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={
              password.length > 0 && !passwordStrong
                ? "Debe tener al menos 8 caracteres"
                : undefined
            }
            disabled={loading || status === "success"}
          />

          <Input
            label="Confirmar contraseña"
            placeholder="Repite tu nueva contraseña"
            type="password"
            autoComplete="new-password"
            icon={ShieldCheck}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            error={
              confirm.length > 0 && !passwordsMatch
                ? "Las contraseñas no coinciden"
                : undefined
            }
            disabled={loading || status === "success"}
          />

          {message && (
            <div
              className={`text-sm rounded-lg p-3 border ${
                status === "success"
                  ? "bg-green-50 text-green-700 border-green-200"
                  : "bg-red-50 text-red-700 border-red-200"
              }`}
            >
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{message}</span>
              </div>
            </div>
          )}

          <Button
            type="submit"
            size="lg"
            className="w-full"
            disabled={!canSubmit || loading || status === "success"}
            loading={loading}
            rightIcon={<ArrowRight className="w-5 h-5" />}
          >
            Restablecer contraseña
          </Button>

          <div className="text-sm text-center text-[rgb(var(--text-muted))]">
            <Link
              to="/login"
              className="text-[rgb(var(--brand-primary))] hover:underline"
            >
              Volver a login
            </Link>
          </div>
        </form>
      )}
    </AuthLayout>
  );
}
