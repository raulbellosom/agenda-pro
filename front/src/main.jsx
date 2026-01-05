import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";

import "./styles/app.css";
import { router } from "./app/router/router";
import { AuthProvider } from "./app/providers/AuthProvider";
import { WorkspaceProvider } from "./app/providers/WorkspaceProvider";
import { ThemeProvider } from "./shared/theme/ThemeProvider";
import { RenderErrorBoundary } from "./components/ErrorBoundary";
import { PWAInstallPrompt } from "./components/PWAInstallPrompt";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      gcTime: 1000 * 60 * 60 * 24,
      refetchOnWindowFocus: false,
    },
  },
});

const persister = createSyncStoragePersister({ storage: window.localStorage });

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <RenderErrorBoundary>
      <PersistQueryClientProvider
        client={queryClient}
        persistOptions={{ persister }}
      >
        <ThemeProvider defaultTheme="system" storageKey="agenda-pro-theme">
          <AuthProvider>
            <WorkspaceProvider>
              <RouterProvider router={router} />
              <PWAInstallPrompt />
            </WorkspaceProvider>
          </AuthProvider>
        </ThemeProvider>
      </PersistQueryClientProvider>
    </RenderErrorBoundary>
  </React.StrictMode>
);
