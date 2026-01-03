import React from "react";
import { useRouteError, isRouteErrorResponse, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";
import { Button } from "./ui/Button";

export function ErrorBoundary() {
  const error = useRouteError();

  let title = "Algo salió mal";
  let message = "Ha ocurrido un error inesperado.";
  let details = null;

  if (isRouteErrorResponse(error)) {
    title = `Error ${error.status}`;
    message = error.statusText || "Página no encontrada";
  } else if (error instanceof Error) {
    message = error.message;
    details = error.stack;
  }

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <div className="min-h-dvh bg-[rgb(var(--bg))] flex items-center justify-center p-4">
      {/* Background mesh */}
      <div className="fixed inset-0 bg-mesh pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        className="relative w-full max-w-lg"
      >
        <div className="glass-card rounded-3xl p-8 text-center">
          {/* Icon */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[rgb(var(--bad))]/10 flex items-center justify-center"
          >
            <AlertTriangle className="w-10 h-10 text-[rgb(var(--bad))]" />
          </motion.div>

          {/* Title */}
          <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-2">
            {title}
          </h1>

          {/* Message */}
          <p className="text-[rgb(var(--text-secondary))] mb-6">{message}</p>

          {/* Details (dev only) */}
          {details && import.meta.env.DEV && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mb-6 p-4 rounded-xl bg-[rgb(var(--bg-subtle))] text-left overflow-auto max-h-48"
            >
              <div className="flex items-center gap-2 mb-2 text-[rgb(var(--muted))]">
                <Bug className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">
                  Stack trace (solo en dev)
                </span>
              </div>
              <pre className="text-xs text-[rgb(var(--bad))] whitespace-pre-wrap font-mono">
                {details}
              </pre>
            </motion.div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button variant="ghost" onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
            <Link to="/">
              <Button>
                <Home className="w-4 h-4 mr-2" />
                Ir al inicio
              </Button>
            </Link>
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute -top-20 -left-20 w-40 h-40 rounded-full bg-[rgb(var(--bad))]/5 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -right-20 w-40 h-40 rounded-full bg-[rgb(var(--brand-1))]/5 blur-3xl pointer-events-none" />
      </motion.div>
    </div>
  );
}

// Class-based Error Boundary for catching render errors
export class RenderErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Render error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-dvh bg-[rgb(var(--bg))] flex items-center justify-center p-4">
          <div className="w-full max-w-lg glass-card rounded-3xl p-8 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-[rgb(var(--bad))]/10 flex items-center justify-center">
              <AlertTriangle className="w-10 h-10 text-[rgb(var(--bad))]" />
            </div>

            <h1 className="text-2xl font-bold text-[rgb(var(--text-primary))] mb-2">
              Error de renderizado
            </h1>

            <p className="text-[rgb(var(--text-secondary))] mb-4">
              {this.state.error?.message || "Ha ocurrido un error inesperado."}
            </p>

            {import.meta.env.DEV && this.state.error?.stack && (
              <div className="mb-6 p-4 rounded-xl bg-[rgb(var(--bg-subtle))] text-left overflow-auto max-h-48">
                <pre className="text-xs text-[rgb(var(--bad))] whitespace-pre-wrap font-mono">
                  {this.state.error.stack}
                </pre>
              </div>
            )}

            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl gradient-brand text-white font-medium"
            >
              Recargar página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
