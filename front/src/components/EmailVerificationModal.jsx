import React, { useState, useEffect } from "react";
import { useAuth } from "../app/providers/AuthProvider";
import { Button } from "./ui/Button";
import { Card } from "./ui/Card";
import { ToastViewport } from "./ui/Toast";
import { databases } from "../lib/appwrite";
import { env } from "../shared/appwrite/env";
import { Query } from "appwrite";

/**
 * Modal de verificación de email
 * Se muestra cuando el usuario intenta iniciar sesión sin verificar su email
 * o cuando se registra por primera vez
 */
export function EmailVerificationModal({ email, onClose }) {
  const { resendVerificationEmail } = useAuth();
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [isVerified, setIsVerified] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(false);

  const pushToast = (title, message, type = "info") => {
    const id = crypto.randomUUID();
    setToasts((t) => [...t, { id, title, message, type }]);
    window.setTimeout(
      () => setToasts((t) => t.filter((x) => x.id !== id)),
      3500
    );
  };

  // Verificar estado del email cada 5 segundos
  useEffect(() => {
    const checkVerificationStatus = async () => {
      if (!email || checkingStatus) return;

      try {
        setCheckingStatus(true);
        // Buscar el perfil por email
        const profileDocs = await databases.listDocuments(
          env.databaseId,
          env.collectionUsersProfileId,
          [Query.equal("email", email.toLowerCase()), Query.limit(1)]
        );

        if (profileDocs.documents.length > 0) {
          const profile = profileDocs.documents[0];
          if (profile.emailVerified) {
            setIsVerified(true);
            pushToast(
              "¡Email verificado!",
              "Ya puedes iniciar sesión",
              "success"
            );
          }
        }
      } catch (error) {
        // Ignorar errores silenciosamente
      } finally {
        setCheckingStatus(false);
      }
    };

    // Verificar inmediatamente
    checkVerificationStatus();

    // Luego verificar cada 5 segundos
    const interval = setInterval(checkVerificationStatus, 5000);

    return () => clearInterval(interval);
  }, [email]);

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

  const handleClose = () => {
    if (onClose) {
      onClose();
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
            <div
              className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center transition-colors ${
                isVerified ? "bg-green-500/20" : "bg-blue-500/20"
              }`}
            >
              <svg
                className={`w-8 h-8 transition-colors ${
                  isVerified ? "text-green-500" : "text-blue-500"
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {isVerified ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                )}
              </svg>
            </div>

            <h2 className="text-2xl font-bold text-[rgb(var(--text-primary))]">
              {isVerified ? "¡Email verificado!" : "Verifica tu email"}
            </h2>

            {!isVerified && (
              <>
                <p className="text-[rgb(var(--text-secondary))]">
                  Hemos enviado un link de verificación a:
                </p>

                <p className="font-medium text-[rgb(var(--text-primary))]">
                  {email}
                </p>

                <p className="text-sm text-[rgb(var(--text-muted))]">
                  El link expira en 2 horas. Revisa tu bandeja de entrada y
                  carpeta de spam.
                </p>
              </>
            )}

            {isVerified && (
              <p className="text-[rgb(var(--text-secondary))]">
                Tu email ha sido verificado exitosamente. Ya puedes iniciar
                sesión.
              </p>
            )}
          </div>

          <div className="space-y-3 pt-4">
            {!isVerified && (
              <Button
                onClick={handleResend}
                disabled={loading}
                variant="outline"
                className="w-full"
              >
                {loading ? "Enviando..." : "Reenviar email de verificación"}
              </Button>
            )}

            <Button
              onClick={handleClose}
              variant={isVerified ? "primary" : "ghost"}
              className="w-full"
            >
              {isVerified ? "Iniciar sesión" : "Cerrar"}
            </Button>
          </div>

          {!isVerified && (
            <div className="text-xs text-center text-[rgb(var(--text-muted))] pt-2">
              ¿No recibiste el email? Verifica tu carpeta de spam o reenvía el
              link.
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
