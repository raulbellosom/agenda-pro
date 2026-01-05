import React, { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { env } from "../../shared/appwrite/env";
import { AuthLayout } from "./AuthLayout";
import { Button } from "../../components/ui/Button";

/**
 * Página para verificar el email usando el token del link
 */
export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("verifying"); // verifying | success | error | expired
  const [message, setMessage] = useState("");

  useEffect(() => {
    verifyToken();
  }, []);

  const verifyToken = async () => {
    const token = searchParams.get("token");

    if (!token) {
      setStatus("error");
      setMessage("Token de verificación no encontrado");
      return;
    }

    try {
      const fnId = env.fnEmailVerificationId;

      if (!fnId) {
        throw new Error("Función de verificación no configurada");
      }

      // Usar fetch directo para evitar requerir autenticación
      const endpoint = env.endpoint;
      const projectId = env.projectId;
      const functionUrl = `${endpoint}/functions/${fnId}/executions`;

      const response = await fetch(functionUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Appwrite-Project": projectId,
        },
        body: JSON.stringify({
          body: JSON.stringify({
            action: "verify",
            token,
          }),
        }),
      });

      if (!response.ok) {
        throw new Error("Error al verificar el email");
      }

      const execution = await response.json();

      let result;
      try {
        result = JSON.parse(execution.responseBody);
      } catch {
        throw new Error("Respuesta inválida del servidor");
      }

      if (result.ok) {
        setStatus("success");
        setMessage("¡Email verificado exitosamente! Ya puedes iniciar sesión.");
      } else if (result.expired) {
        setStatus("expired");
        setMessage("El link de verificación ha expirado. Solicita uno nuevo.");
      } else {
        setStatus("error");
        setMessage(result.error || "Error al verificar el email");
      }
    } catch (error) {
      setStatus("error");
      setMessage(error.message || "Error al verificar el email");
    }
  };

  const getStatusConfig = () => {
    switch (status) {
      case "verifying":
        return {
          icon: Loader2,
          title: "Verificando email...",
          iconClass: "text-[rgb(var(--brand-primary))] animate-spin",
          bgClass: "bg-[rgb(var(--brand-primary))]/10",
        };
      case "success":
        return {
          icon: CheckCircle2,
          title: "¡Email verificado!",
          iconClass: "text-[rgb(var(--success))]",
          bgClass: "bg-[rgb(var(--success))]/10",
        };
      case "expired":
        return {
          icon: Clock,
          title: "Link expirado",
          iconClass: "text-[rgb(var(--warning))]",
          bgClass: "bg-[rgb(var(--warning))]/10",
        };
      case "error":
      default:
        return {
          icon: XCircle,
          title: "Error de verificación",
          iconClass: "text-[rgb(var(--error))]",
          bgClass: "bg-[rgb(var(--error))]/10",
        };
    }
  };

  const config = getStatusConfig();
  const Icon = config.icon;

  return (
    <AuthLayout
      title={
        <>
          <span className="text-gradient">Verificación</span> de email
        </>
      }
      subtitle="Estamos confirmando tu dirección de correo electrónico."
    >
      <div className="space-y-6">
        {/* Status Icon */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="flex justify-center"
        >
          <div
            className={`w-20 h-20 rounded-full ${config.bgClass} flex items-center justify-center`}
          >
            <Icon className={`w-10 h-10 ${config.iconClass}`} />
          </div>
        </motion.div>

        {/* Title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-3"
        >
          <h2 className="text-xl font-semibold text-[rgb(var(--text-primary))]">
            {config.title}
          </h2>
          <p className="text-[rgb(var(--text-secondary))] text-sm leading-relaxed">
            {message}
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-3 pt-2"
        >
          {status === "success" && (
            <Button
              onClick={() => navigate("/login")}
              className="w-full"
              size="lg"
              rightIcon={<ArrowRight className="w-5 h-5" />}
            >
              Ir a iniciar sesión
            </Button>
          )}

          {status === "verifying" && (
            <div className="text-center text-sm text-[rgb(var(--text-muted))]">
              Por favor espera mientras verificamos tu email...
            </div>
          )}

          {(status === "error" || status === "expired") && (
            <>
              <Button
                onClick={() => navigate("/login")}
                className="w-full"
                size="lg"
              >
                Volver a login
              </Button>
              <Button
                onClick={() => navigate("/register")}
                variant="outline"
                className="w-full"
                size="lg"
              >
                Crear nueva cuenta
              </Button>
            </>
          )}
        </motion.div>

        {/* Helper text */}
        {(status === "error" || status === "expired") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="text-center text-xs text-[rgb(var(--text-muted))] pt-4 border-t border-[rgb(var(--border-base))]"
          >
            Si necesitas ayuda, contáctanos en{" "}
            <a
              href="mailto:soporte@agendapro.com"
              className="text-[rgb(var(--brand-primary))] hover:underline"
            >
              soporte@agendapro.com
            </a>
          </motion.div>
        )}
      </div>
    </AuthLayout>
  );
}
