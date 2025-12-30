import React from "react";
import { createBrowserRouter } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "../../features/auth/LoginPage";
import { RegisterPage } from "../../features/auth/RegisterPage";
import { AppShell } from "../../features/shell/AppShell";
import { CalendarPage } from "../../features/calendar/CalendarPage";
import { NotFoundPage } from "../../features/shell/NotFoundPage";

export const router = createBrowserRouter([
  { path: "/login", element: <LoginPage /> },
  { path: "/register", element: <RegisterPage /> },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <AppShell />
      </ProtectedRoute>
    ),
    children: [{ index: true, element: <CalendarPage /> }]
  },
  { path: "*", element: <NotFoundPage /> }
]);
