import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwind from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    tailwind(),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: false, // Don't auto-inject registration script
      devOptions: {
        enabled: false, // Disable PWA in development to avoid workbox logs
        type: "module",
      },
      includeAssets: ["favicon.svg", "pwa-192.png", "pwa-512.png"],
      manifest: {
        name: "Agenda Pro",
        short_name: "AgendaPro",
        description: "Agenda hermosa, rápida y fácil para todos.",
        theme_color: "#7c3aed",
        background_color: "#09090b",
        display: "standalone",
        start_url: "/",
        icons: [
          { src: "/pwa-192.png", sizes: "192x192", type: "image/png" },
          { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
        ],
      },
    }),
  ],
  server: { port: 5173 },
});
