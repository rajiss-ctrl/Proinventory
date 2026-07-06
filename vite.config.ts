import path from "path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // Ensure React is only bundled once (prevents version mismatch in monorepos)
  optimizeDeps: {
    include: ["react", "react-dom"],
  },
  build: {
    target: "esnext",
    sourcemap: false,
  },
  server: {
    port: 5173,
    strictPort: false,
  },
});
