import React from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../providers/AuthProvider";
import { LoadingScreen } from "../../shared/ui/LoadingScreen";

/**
 * Route wrapper that only allows guest (unauthenticated) users.
 * Redirects authenticated users to the home page.
 */
export function GuestRoute({ children }) {
  const { state } = useAuth();

  if (state.status === "loading") {
    return <LoadingScreen variant="fullscreen" showLogo label="Cargando..." />;
  }

  // If user is authenticated, redirect to home
  if (state.status === "authenticated") {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
