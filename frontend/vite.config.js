import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig(({ mode }) => ({
  plugins: [react()],

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
