import process from "node:process";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss()],

  esbuild: {
    jsx: 'automatic',
  },

  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov", "html"],
      include: ["src/**/*.{js,jsx,ts,tsx}"],
      exclude: ["src/main.jsx", "src/App.css", "src/index.css"],
      thresholds: {
        lines: 60,
        functions: 60,
        branches: 60,
        statements: 60,
      },
    },
  },

  envDir: '..',

  // En producción los assets se referencian como /build/assets/...
  // (Apache sirve /var/www/public como raíz → /build/ apunta a public/build/)
  // En dev Vite sirve desde / para que http://localhost:5173/ funcione normal.
  base: mode === "production" ? "/build/" : "/",

  build: {
    outDir: "../backend/public/build",
    emptyOutDir: true,
  },

  server: {
    host: true, // NUEVO
    watch: { usePolling: true }, // NUEVO: recarga en caliente dentro de Docker
    proxy: {
      "/api": {
        // NUEVO: usa la variable en Docker; fuera de Docker sigue en localhost
        target: process.env.VITE_PROXY_TARGET || "http://localhost",
        changeOrigin: true,
      },
    },
  },
}));
