import React, { useState } from "react";
import { useAuth } from "../app/providers/AuthProvider";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { ToastViewport } from "./ui/Toast";

/**
 * Modal de verificación de email
 * Se muestra cuando el usuario intenta iniciar sesión sin verificar su email
 * o cuando se registra por primera vez
 */
export function EmailVerificationModal({ email, onClose }) {
  const { resendVerificationEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);

  const pushToast = (title, message, type = "info") => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, title, message, type }]);
    window.setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      3500
    );
  };

  const handleResend = async () => {
    if (!email) return;

    setLoading(true);
    try {
      await resendVerificationEmail(email);
      pushToast("Email enviado", "Revisa tu bandeja de entrada", "success");
    } catch (error) {
      pushToast("Error", error.message || "Error al enviar el email", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <ToastViewport
        toasts={toasts}
        onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))}
      />

      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full p-6 space-y-4">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto bg-blue-500/20 rounded-full flex items-center justify-center">
              <svg
                className="w-8 h-8 text-blue-500"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                />
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
              Verifica tu email
            </h2>

            <p className="text-[rgb(var(--text-secondary))]">
              Hemos enviado un link de verificación a:
            </p>

            <p className="font-medium text-[rgb(var(--text-primary))]">
              {email}
            </p>

            <p className="text-sm text-[rgb(var(--text-muted))]">
              El link expira en 2 horas. Revisa tu bandeja de entrada y carpeta
              de spam.
            </p>
          </div>

          <div className="space-y-3 pt-4">
            <Button
              onClick={handleResend}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              {loading ? "Enviando..." : "Reenviar email de verificación"}
            </Button>

            {onClose && (
              <Button onClick={onClose} variant="ghost" className="w-full">
                Cerrar
              </Button>
            )}
          </div>

          <div className="text-xs text-center text-[rgb(var(--text-muted))] pt-2">
            ¿No recibiste el email? Verifica tu carpeta de spam o reenvía el
            link.
          </div>
        </Card>
      </div>
    </>
  );
}
