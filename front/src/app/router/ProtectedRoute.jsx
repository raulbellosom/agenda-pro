import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { LoadingScreen } from "../../shared/ui/LoadingScreen";

export function ProtectedRoute({ children }) {
  const { state } = useAuth();
  if (state.status === "loading") {
    return (
      <LoadingScreen
        variant="fullscreen"
        showLogo
        label="Iniciando sesión..."
      />
    );
  }
  if (state.status === "guest") return <Navigate to="/login" replace />;
  return <>{children}</>;
}
