import React from "react";
import ReactDOM from "react-dom/client";
import { RouterProvider } from "react-router-dom";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { QueryClient } from "@tanstack/react-query";

import "./styles/app.css";
import { router } from "./app/router/router";
import { AppProviders } from "./app/providers/AppProviders";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
      gcTime: 1000 * 60 * 60 * 24,
      refetchOnWindowFocus: false
    }
  }
});

const persister = createSyncStoragePersister({ storage: window.localStorage });

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <PersistQueryClientProvider client={queryClient} persistOptions={{ persister }}>
      <AppProviders>
        <RouterProvider router={router} />
      </AppProviders>
    </PersistQueryClientProvider>
  </React.StrictMode>
);
