import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "node:path";

// FitSense AI - web companion build config.
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 5173,
    strictPort: false,
    open: false,
    proxy: {
      "/v1": { target: "http://127.0.0.1:8787", changeOrigin: true },
      "/health": { target: "http://127.0.0.1:8787", changeOrigin: true },
    },
  },
  build: {
    target: "es2020",
    sourcemap: true,
  },
});
