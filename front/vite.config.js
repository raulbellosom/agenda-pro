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
      includeAssets: [
        "favicon.svg",
        "web/icon-192.png",
        "web/icon-192-maskable.png",
        "web/icon-512.png",
        "web/icon-512-maskable.png",
        "web/favicon.ico",
        "web/apple-touch-icon.png",
      ],
      manifest: {
        name: "Agenda Pro - Tu calendario inteligente",
        short_name: "Agenda Pro",
        description:
          "Organiza tu tiempo, eventos y actividades de manera eficiente con Agenda Pro",
        theme_color: "#8b5cf6",
        background_color: "#0f172a",
        display: "standalone",
        start_url: "/",
        scope: "/",
        orientation: "portrait-primary",
        icons: [
          {
            src: "/web/favicon.ico",
            sizes: "16x16 32x32 48x48",
            type: "image/x-icon",
            purpose: "any",
          },
          {
            src: "/web/icon-192.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/web/icon-192-maskable.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "maskable",
          },
          {
            src: "/web/icon-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any",
          },
          {
            src: "/web/icon-512-maskable.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
        categories: ["productivity", "utilities"],
        screenshots: [],
        shortcuts: [
          {
            name: "Nuevo evento",
            short_name: "Nuevo",
            description: "Crear un nuevo evento",
            url: "/?action=new-event",
            icons: [
              {
                src: "/web/icon-192.png",
                sizes: "192x192",
              },
            ],
          },
        ],
        share_target: {
          action: "/",
          method: "GET",
          enctype: "application/x-www-form-urlencoded",
          params: {
            title: "title",
            text: "text",
          },
        },
      },
    }),
  ],
  server: { port: 5173 },
});
