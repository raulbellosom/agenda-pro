import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { GuestRoute } from "./GuestRoute";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { LoginPage } from "../../features/auth/LoginPage";
import { RegisterPage } from "../../features/auth/RegisterPage";
import { AppShell } from "../../features/shell/AppShell";
import { CalendarPage } from "../../features/calendar/CalendarPage";
import { SettingsPage } from "../../features/settings/SettingsPage";
import { GroupsPage } from "../../features/groups/GroupsPage";
import { NotFoundPage } from "../../features/shell/NotFoundPage";

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
    ],
  },
  { path: "*", element: <NotFoundPage /> },
]);
