import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { GuestRoute } from "./GuestRoute";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { LoginPage } from "../../features/auth/LoginPage";
import { RegisterPage } from "../../features/auth/RegisterPage";
import { VerifyEmailPage } from "../../features/auth/VerifyEmailPage";
import { ForgotPasswordPage } from "../../features/auth/ForgotPasswordPage";
import { ResetPasswordPage } from "../../features/auth/ResetPasswordPage";
import { AppShell } from "../../features/shell/AppShell";
import { CalendarPage } from "../../features/calendar/CalendarPage";
import { SettingsPage } from "../../features/settings/SettingsPage";
import { GroupsPage } from "../../features/groups/GroupsPage";
import { NotFoundPage } from "../../features/shell/NotFoundPage";
import { InvitePage } from "../../features/invite/InvitePage";
import { PermissionsAdminPage } from "../../features/admin/PermissionsAdminPage";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: (
      <GuestRoute>
        <LoginPage />
      </GuestRoute>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/register",
    element: (
      <GuestRoute>
        <RegisterPage />
      </GuestRoute>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/verify-email",
    element: <VerifyEmailPage />,
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/forgot-password",
    element: (
      <GuestRoute>
        <ForgotPasswordPage />
      </GuestRoute>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/reset-password",
    element: (
      <GuestRoute>
        <ResetPasswordPage />
      </GuestRoute>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/invite/:token",
    element: (
      <ProtectedRoute>
        <InvitePage />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    errorElement: <ErrorBoundary />,
    children: [
      { index: true, element: <CalendarPage /> },
      { path: "settings", element: <SettingsPage /> },
      { path: "groups", element: <GroupsPage /> },
      { path: "admin/permissions", element: <PermissionsAdminPage /> },
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
