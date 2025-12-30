import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";

export function ProtectedRoute({ children }) {
  const { state } = useAuth();
  if (state.status === "loading") return <div className="p-6">Cargando…</div>;
  if (state.status === "guest") return <Navigate to="/login" replace />;
  return <>{children}</>;
}
