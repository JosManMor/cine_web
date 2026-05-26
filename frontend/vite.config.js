import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["logo.png", "favicon.ico"],
      manifest: {
        name: "Cine Sendera",
        short_name: "Cine Sendera",
        description: "Compra tus boletos y consulta la cartelera de Cine Sendera",
        theme_color: "#DC2626",
        background_color: "#0A0A0A",
        display: "standalone",
        orientation: "portrait",
        start_url: "/",
        scope: "/",
        icons: [
          {
            src: "/logo.png",
            sizes: "192x192",
            type: "image/png",
            purpose: "any maskable",
          },
          {
            src: "/logo.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        // Caché de assets estáticos (JS, CSS, fuentes, imágenes)
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        runtimeCaching: [
          {
            // API → siempre red primero, caché como respaldo
            urlPattern: /^https?:\/\/.*\/api\/.*/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "api-cache",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
              networkTimeoutSeconds: 10,
            },
          },
          {
            // Imágenes de posters desde cualquier origen
            urlPattern: /\.(?:png|jpg|jpeg|webp|gif|svg)$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "image-cache",
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 7 },
            },
          },
        ],
      },
      // Activa el service worker también en modo desarrollo
      devOptions: {
        enabled: true,
        type: "module",
      },
    }),
  ],

  // En producción los assets se referencian como /build/assets/...
  // (Apache sirve /var/www/public como raíz → /build/ apunta a public/build/)
  // En dev Vite sirve desde / para que http://localhost:5173/ funcione normal.
  base: mode === "production" ? "/build/" : "/",

  build: {
    outDir: "../backend/public/build",
    emptyOutDir: true,
  },

  server: {
    proxy: {
      "/api": {
        target: "http://localhost",
        changeOrigin: true,
      },
    },
  },
}));

