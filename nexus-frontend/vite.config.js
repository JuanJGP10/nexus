import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate", // actualiza el SW solo sin pedir confirmación
      manifest: {
        name: "Nexus",
        short_name: "Nexus",
        description: "Gestor de archivos y tareas personal",
        theme_color: "#000000", // color de la barra superior de la ventana
        background_color: "#000000", // color de splash al abrir
        display: "standalone", // esto es lo que quita la barra de navegador
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
    }),
  ],
  server: {
    port: 5173,
  },
});
